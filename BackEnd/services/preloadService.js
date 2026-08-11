const Options = require("../model/Options");

/**
 * Preload job manager.
 * Warms the EXACT endpoints the Osimis web viewer uses, so opening a study
 * in the viewer is fast.
 *
 * Viewer endpoints (verified from /osimis-viewer/app/js/app.js):
 *  - /osimis-viewer/studies/{id}            study load (series list) — SLOW (0.3-1.5s)
 *  - /osimis-viewer/series/{id}             series metadata + instances
 *  - /osimis-viewer/images/{inst}/{frame}/{quality}-quality  image display
 *
 *  QUALITY-AWARE WARMING (2026-08-11): the viewer reads each series'
 *  `availableQualities` and maps: LOSSLESS->high-quality, LOW->low-quality,
 *  MEDIUM->medium-quality, PIXELDATA->pixeldata-quality. XA/angio series only
 *  support ["low","lossless"] — warming pixeldata/medium there 404s/hangs and
 *  warms nothing. So we warm ONLY the qualities the series actually supports
 *  (fallback to the old pixeldata+medium+high triple when the list is absent).
 *
 * Strategy per study:
 *  Phase 1: warm /osimis-viewer/studies/{id} (study metadata the viewer fetches first)
 *  Phase 2: per series: /osimis-viewer/series/{id} metadata
 *  Phase 3: warm representative images: middle instance of each series
 *           via the viewer's own image endpoints (pixeldata + medium + high quality)
 *           — limited to 1 image/series by default so preload stays light.
 *
 * Concurrency: a queue limits how many studies are warmed at once.
 * Persistence: on success a PreloadRecord row is written ("Cached" for 14 days).
 */

const jobs = new Map(); // studyId -> job
const queue = []; // studyIds waiting to run
let activeCount = 0;
let pumpBusy = false; // re-entrancy guard for pump()
const MAX_CONCURRENT = 2; // studies warmed in parallel
const CACHE_FRESH_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks
const MAX_SERIES_THUMBNAILS = 1; // images warmed per series

// Flood protection:
// - CHURN_INSTANCES: how many NEW instances must land in Orthanc (since a
//   preload finished) before we consider the warmed 4GB RAM cache evicted.
//   ~4GB cache / ~0.9MB per frame ≈ 4,000-5,000 instances. Beyond this the
//   badge honestly drops (data is gone even though the DB row is fresh).
const CHURN_INSTANCES = 4000;
// - BUSY_RATE_PER_SEC: ingest rate (changes Last delta per second) above
//   which Orthanc is considered flooded — preload jobs wait, and the
//   auto-repreload cron skips, so we never add load during a flood.
//   Normal quiet = 0/s; JAAFAR flood was 8-26/s.
const BUSY_RATE_PER_SEC = 10;

/**
 * Read the current Orthanc /changes "Last" sequence number.
 * Monotonic: advances by 1 per change event (mostly per NewInstance).
 * Returns 0 if unavailable.
 */
async function getChangesLast() {
  try {
    const d = await orthancGet("/changes?limit=1", 15000);
    return d && d.Last ? d.Last : 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Sample ingest rate (instances/sec) by reading /changes Last twice.
 * seconds: sampling window. Returns 0 if either read fails.
 */
async function getIngestRate(seconds = 3) {
  const a = await getChangesLast();
  await new Promise((r) => setTimeout(r, seconds * 1000));
  const b = await getChangesLast();
  if (!a || !b) return 0;
  return (b - a) / seconds;
}

/** Is Orthanc currently flooded with incoming instances? */
async function isOrthancBusy() {
  const rate = await getIngestRate(2);
  return rate > BUSY_RATE_PER_SEC;
}

/**
 * Host boot time (ms since epoch), read from /proc/uptime.
 * /proc/uptime is HOST-wide even inside containers, so this reflects
 * when the server last rebooted — not when the container started.
 * Returns 0 if it can't be read (then no reboot invalidation happens).
 */
function getHostBootTime() {
  try {
    const fs = require("fs");
    const uptimeStr = fs.readFileSync("/proc/uptime", "utf8");
    const uptimeSec = parseFloat(uptimeStr.split(" ")[0]);
    if (!isNaN(uptimeSec) && uptimeSec > 0) {
      return Date.now() - uptimeSec * 1000;
    }
  } catch (e) {
    // ignore — no reboot detection available
  }
  return 0;
}

/**
 * Is a PreloadRecord still valid?
 * - must be within the 14-day freshness window AND
 * - must have been warmed AFTER the last host reboot: a reboot wipes the
 *   OS page cache + Orthanc RAM cache, so anything preloaded before it is
 *   cold again even though the DB row still says "Cached".
 * - must NOT have been churned away: if >CHURN_INSTANCES new instances
 *   landed in Orthanc after the preload finished, the 4GB LRU cache almost
 *   certainly evicted the warmed data (flood). Requires a current changes
 *   seq passed in (fetched once per batch by the caller).
 */
function isRecordFresh(rec, currentChangesLast) {
  if (!rec || !rec.cached_at) return false;
  const cachedAt = new Date(rec.cached_at).getTime();
  if (isNaN(cachedAt)) return false;
  const hostBoot = getHostBootTime();
  if (hostBoot > 0 && cachedAt < hostBoot) return false; // wiped by reboot
  if (Date.now() - cachedAt >= CACHE_FRESH_MS) return false;
  // churn check: only if we have both a recorded seq and a live read
  if (rec.change_seq && currentChangesLast > rec.change_seq) {
    if (currentChangesLast - rec.change_seq > CHURN_INSTANCES) {
      return false; // flooded since preload -> cache evicted -> not fresh
    }
  }
  return true;
}

/** Freshness for a single study (fetches current changes seq itself) */
async function isFresh(studyId) {
  const db = require("../database/models");
  const rec = await db.PreloadRecord.findOne({
    where: { study_id: studyId },
    raw: true,
  });
  if (!rec) return false;
  const current = await getChangesLast();
  return isRecordFresh(rec, current);
}

function getOrthancBaseUrl() {
  const s = Options.getOrthancConnexionSettings();
  const baseUrl = s.orthancAddress.startsWith("http")
    ? `${s.orthancAddress}:${s.orthancPort}`
    : `http://${s.orthancAddress}:${s.orthancPort}`;
  return baseUrl;
}

function getAuthHeader() {
  const s = Options.getOrthancConnexionSettings();
  return "Basic " + Buffer.from(`${s.orthancUsername}:${s.orthancPassword}`).toString("base64");
}

async function orthancGet(path, timeoutMs = 900000) {
  const url = getOrthancBaseUrl() + path;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Authorization: getAuthHeader() },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Orthanc ${res.status} on ${path}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch a binary resource (viewer image) to warm the viewer plugin cache */
async function orthancWarm(path, timeoutMs = 900000) {
  const url = getOrthancBaseUrl() + path;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Authorization: getAuthHeader() },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Orthanc ${res.status} on ${path}`);
    }
    await res.arrayBuffer();
  } finally {
    clearTimeout(timer);
  }
}

function getJob(studyId) {
  return jobs.get(studyId) || null;
}

/**
 * All jobs the UI should see: queued/running PLUS recently finished ones.
 * Finished jobs stay visible for a short grace period so the frontend's
 * completion watcher can observe the "done"/"error" status and flip the
 * button — without this, a job vanishes from /active the instant it ends
 * and the UI stays stuck on "Preloading…" until a page refresh.
 */
function getActiveJobs() {
  const list = [];
  const now = Date.now();
  const GRACE_MS = 60 * 1000; // keep finished jobs visible for 60s
  for (const job of jobs.values()) {
    if (job.status === "queued" || job.status === "running") {
      list.push(job);
    } else if (
      job.finishedAt &&
      now - new Date(job.finishedAt).getTime() < GRACE_MS
    ) {
      list.push(job);
    }
  }
  return list;
}

/** Whether a study was cached within the freshness window (2 weeks) */

async function startPreload(studyId) {
  // Already fresh in cache -> return a synthetic done job without re-running
  if (await isFresh(studyId)) {
    const db = require("../database/models");
    const rec = await db.PreloadRecord.findOne({
      where: { study_id: studyId },
      raw: true,
    });
    const done = {
      status: "done",
      studyId,
      totalSeries: rec.total_series,
      doneSeries: rec.total_series,
      totalInstances: 0,
      doneInstances: 0,
      phase: "done",
      startedAt: rec.cached_at,
      finishedAt: rec.cached_at,
      error: null,
      fromCache: true,
    };
    jobs.set(studyId, done);
    return done;
  }

  // Already queued/running/done in memory -> return existing
  const existing = jobs.get(studyId);
  if (
    existing &&
    (existing.status === "queued" ||
      existing.status === "running" ||
      existing.status === "done")
  ) {
    return existing;
  }

  const job = {
    status: "queued",
    studyId,
    totalSeries: 0,
    doneSeries: 0,
    totalInstances: 0,
    doneInstances: 0,
    phase: "queued",
    startedAt: null,
    finishedAt: null,
    error: null,
    queuePosition: 0,
  };
  jobs.set(studyId, job);
  queue.push(studyId);
  updateQueuePositions();
  pump();
  return job;
}

function updateQueuePositions() {
  queue.forEach((id, idx) => {
    const j = jobs.get(id);
    if (j) j.queuePosition = idx + 1;
  });
}

function pump() {
  if (pumpBusy) return; // re-entrancy guard
  pumpBusy = true;
  // Flood protection: if Orthanc is currently ingesting a heavy wave
  // (e.g. a 9,000-instance study arriving), hold queued jobs instead of
  // starting them — preloading during a flood both adds CPU load AND the
  // warmed data gets evicted immediately anyway. Retry shortly.
  isOrthancBusy()
    .then((busy) => {
      if (busy && queue.length && activeCount < MAX_CONCURRENT) {
        for (const id of queue) {
          const j = jobs.get(id);
          if (j && j.status === "queued") {
            j.phase = "waiting-orthanc";
          }
        }
        pumpBusy = false;
        setTimeout(pump, 15000); // re-check after Orthanc calms
        return;
      }
      pumpBusy = false;
      pumpInner();
    })
    .catch(() => {
      pumpBusy = false;
      pumpInner();
    });
}

function pumpInner() {
  while (activeCount < MAX_CONCURRENT && queue.length) {
    const studyId = queue.shift();
    const job = jobs.get(studyId);
    if (!job) continue;
    activeCount += 1;
    job.status = "running";
    job.startedAt = new Date().toISOString();
    // Fire and forget; pump() is called again when it settles
    runJob(job)
      .catch((err) => {
        job.status = "error";
        job.phase = "error";
        job.error = err.message;
        job.finishedAt = new Date().toISOString();
      })
      .finally(() => {
        activeCount -= 1;
        updateQueuePositions();
        pump();
      });
  }
}

async function runJob(job) {
  const studyId = job.studyId;

  // Phase 1: warm the viewer's study endpoint (this is what the viewer calls first)
  job.phase = "study";
  const study = await orthancGet(`/osimis-viewer/studies/${studyId}`);
  let seriesIds = study.Series || [];
  // The viewer returns series as plain ID strings
  seriesIds = seriesIds.map((s) => (typeof s === "string" ? s : s.ID));
  job.totalSeries = seriesIds.length;

  // Phase 2 + 3: per-series metadata + representative images via viewer endpoints
  job.phase = "series";
  for (const seriesId of seriesIds) {
    try {
      const series = await orthancGet(`/osimis-viewer/series/${seriesId}`);
      const instances = (series && series.instances) || [];
      job.totalInstances += instances.length;

      // Warm one representative image per series (middle instance) via the
      // viewer's own image endpoints so the plugin cache is populated.
      // Only warm the qualities the series actually supports — the viewer's
      // quality->URL mapping (verified in app.js):
      //   lossless -> high-quality, low -> low-quality,
      //   medium -> medium-quality, pixeldata -> pixeldata-quality
      const middle = Math.floor(instances.length / 2);
      const target = instances[middle];
      const instanceId = Array.isArray(target) ? target[0] : target;
      if (instanceId) {
        const frameIndex = 0;
        const QUALITY_URL = {
          pixeldata: "pixeldata-quality",
          lossless: "high-quality",
          low: "low-quality",
          medium: "medium-quality",
          high: "high-quality",
        };
        const avail = Array.isArray(series.availableQualities)
          ? series.availableQualities
          : [];
        // Warm each supported quality once; fall back to the legacy triple
        // when the plugin didn't report an availability list.
        const toWarm =
          avail.length > 0
            ? [...new Set(avail.map((q) => QUALITY_URL[q]).filter(Boolean))]
            : ["pixeldata-quality", "medium-quality", "high-quality"];
        try {
          console.log(
            `[PRELOAD] ${seriesId.slice(0, 8)} qualities=${avail.join("/")} -> ${toWarm.join(",")}`
          );
          for (const suffix of toWarm) {
            await orthancWarm(
              `/osimis-viewer/images/${instanceId}/${frameIndex}/${suffix}`
            );
          }
          job.doneInstances += 1;
        } catch (e) {
          job.error = job.error || e.message;
        }
      }
      job.doneSeries += 1;
    } catch (e) {
      job.doneSeries += 1; // count failures too so progress advances
      job.error = job.error || e.message;
    }
  }

  job.status = "done";
  job.phase = "done";
  job.finishedAt = new Date().toISOString();

  // Persist so "Cached" survives logout/login for 2 weeks.
  // Also record the current /changes seq so future floods can be detected.
  try {
    const db = require("../database/models");
    const changeSeq = await getChangesLast();
    await db.PreloadRecord.upsert({
      study_id: studyId,
      cached_at: new Date(),
      total_series: job.totalSeries,
      change_seq: changeSeq || null,
    });
  } catch (e) {
    job.error = job.error || `cache persist failed: ${e.message}`;
  }
}

/** Batch: start preload for many studies at once (queued) */
async function startPreloadMany(studyIds) {
  const results = [];
  for (const studyId of studyIds) {
    results.push(await startPreload(studyId));
  }
  return results;
}

/** For a list of studyIds, return which are fresh-cached (within 2 weeks) */
async function getCachedStatus(studyIds) {
  const db = require("../database/models");
  const out = {};
  const recs = await db.PreloadRecord.findAll({
    where: { study_id: studyIds },
    raw: true,
  });
  const byId = {};
  recs.forEach((r) => (byId[r.study_id] = r));
  // fetch the current changes seq ONCE for the whole batch (churn detection)
  const current = await getChangesLast();
  for (const sid of studyIds) {
    const r = byId[sid];
    const fresh = isRecordFresh(r, current);
    out[sid] = {
      cached: !!fresh,
      cachedAt: r ? r.cached_at : null,
      totalSeries: r ? r.total_series : 0,
      changeSeq: r ? r.change_seq : null,
      currentChangeSeq: current,
    };
  }
  return out;
}

/**
 * Auto re-preload: find studies whose preload is <14 days old and post-reboot
 * but was CHURNED AWAY by a flood (changes seq advanced >CHURN_INSTANCES since
 * their preload). Only runs when Orthanc is calm (not currently flooding) so
 * we never add load during an ingest wave. Re-warms at most a few per call;
 * the 5-min cron keeps calling until the backlog is cleared.
 */
async function repreloadChurned(max = 3) {
  // never re-preload while Orthanc is actively flooding
  if (await isOrthancBusy()) return { skipped: "busy", count: 0 };

  const db = require("../database/models");
  const current = await getChangesLast();
  if (!current) return { skipped: "no-seq", count: 0 };

  const hostBoot = getHostBootTime();
  const recs = await db.PreloadRecord.findAll({ raw: true });
  const churned = [];
  for (const r of recs) {
    if (!r.change_seq || !r.cached_at) continue;
    const cachedAt = new Date(r.cached_at).getTime();
    if (isNaN(cachedAt)) continue;
    if (hostBoot > 0 && cachedAt < hostBoot) continue; // reboot-wiped, not our job
    if (Date.now() - cachedAt >= CACHE_FRESH_MS) continue; // expired anyway
    if (current - r.change_seq > CHURN_INSTANCES) {
      churned.push(r.study_id); // fresh window but evicted by flood
    }
  }

  const started = [];
  for (const studyId of churned.slice(0, max)) {
    const job = await startPreload(studyId);
    started.push({ studyId, status: job.status });
  }
  return { churned: churned.length, started };
}

module.exports = {
  startPreload,
  startPreloadMany,
  getJob,
  getActiveJobs,
  getCachedStatus,
  isFresh,
  getChangesLast,
  getIngestRate,
  isOrthancBusy,
  repreloadChurned,
};
