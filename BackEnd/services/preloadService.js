const Options = require("../model/Options");

/**
 * Preload job manager.
 * Warms the EXACT endpoints the Osimis web viewer uses, so opening a study
 * in the viewer is fast.
 *
 * Viewer endpoints (verified from /osimis-viewer/app/js/app.js):
 *  - /osimis-viewer/studies/{id}            study load (series list) — SLOW (0.3-1.5s)
 *  - /osimis-viewer/series/{id}             series metadata + instances
 *  - /osimis-viewer/images/{inst}/{frame}/pixeldata-quality   raw pixels (first render)
 *  - /osimis-viewer/images/{inst}/{frame}/low|medium|high-quality (display variants)
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
const MAX_CONCURRENT = 2; // studies warmed in parallel
const CACHE_FRESH_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks
const MAX_SERIES_THUMBNAILS = 1; // images warmed per series

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
 */
function isRecordFresh(rec) {
  if (!rec || !rec.cached_at) return false;
  const cachedAt = new Date(rec.cached_at).getTime();
  if (isNaN(cachedAt)) return false;
  const hostBoot = getHostBootTime();
  if (hostBoot > 0 && cachedAt < hostBoot) return false; // wiped by reboot
  return Date.now() - cachedAt < CACHE_FRESH_MS;
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

/** All jobs that are queued or running (for the global progress widget) */
function getActiveJobs() {
  const list = [];
  for (const job of jobs.values()) {
    if (job.status === "queued" || job.status === "running") {
      list.push(job);
    }
  }
  return list;
}

/** Whether a study was cached within the freshness window (2 weeks) */
async function isFresh(studyId) {
  const db = require("../database/models");
  const rec = await db.PreloadRecord.findOne({
    where: { study_id: studyId },
    raw: true,
  });
  if (!rec) return false;
  return isRecordFresh(rec);
}

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
      // viewer's own image endpoints so the plugin cache is populated
      const middle = Math.floor(instances.length / 2);
      const target = instances[middle];
      const instanceId = Array.isArray(target) ? target[0] : target;
      if (instanceId) {
        const frameIndex = 0;
        try {
          await orthancWarm(
            `/osimis-viewer/images/${instanceId}/${frameIndex}/pixeldata-quality`
          );
          await orthancWarm(
            `/osimis-viewer/images/${instanceId}/${frameIndex}/medium-quality`
          );
          await orthancWarm(
            `/osimis-viewer/images/${instanceId}/${frameIndex}/high-quality`
          );
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

  // Persist so "Cached" survives logout/login for 2 weeks
  try {
    const db = require("../database/models");
    await db.PreloadRecord.upsert({
      study_id: studyId,
      cached_at: new Date(),
      total_series: job.totalSeries,
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
  for (const sid of studyIds) {
    const r = byId[sid];
    const fresh = isRecordFresh(r);
    out[sid] = {
      cached: !!fresh,
      cachedAt: r ? r.cached_at : null,
      totalSeries: r ? r.total_series : 0,
    };
  }
  return out;
}

module.exports = {
  startPreload,
  startPreloadMany,
  getJob,
  getActiveJobs,
  getCachedStatus,
  isFresh,
};
