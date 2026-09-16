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
 *  DEEP WARM (2026-08-11 v2): scrolling a series was still slow because only
 *  1 image/series was warmed. Now:
 *   - Small series (<= SMALL_SERIES_FRAMES total frames, e.g. cine loops):
 *     EVERY frame warmed at every supported quality -> instant scroll.
 *   - Large series (rotational angio etc.): EVERY frame warmed at the fastest
 *     preview quality (low when available — instant blurry preview, then the
 *     viewer sharpens with its progressive lossless load), plus the middle
 *     frame at full quality. Capped per series by MAX_FRAMES_PER_SERIES.
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
const CACHE_FRESH_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks (manual ⚡ preloads)
const AUTO_FRESH_MS = 72 * 60 * 60 * 1000; // 72h (auto-prewarmed studies — matches TTL sweep)
const MAX_SERIES_THUMBNAILS = 1; // images warmed per series

// Viewer quality suffix map + series thresholds (shared by study and
// per-series preload).
const QUALITY_URL = {
  pixeldata: "pixeldata-quality",
  lossless: "high-quality",
  low: "low-quality",
  medium: "medium-quality",
  high: "high-quality",
};
const SMALL_SERIES_FRAMES = 16;
const MAX_FRAMES_PER_SERIES = 1000;
const WARM_CONCURRENCY = 12; // parallel warm requests (Orthanc has 12 cores; raised from 8 on 2026-08-23 per Anas)

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
  // Auto-prewarmed (daemon) = 72h window; manual ⚡ = 14 days.
  const ttl = rec.trigger === "auto" ? AUTO_FRESH_MS : CACHE_FRESH_MS;
  if (Date.now() - cachedAt >= ttl) return false;
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
  if (!isRecordFresh(rec, current)) return false;
  // 2026-08-12: new series added since preload (AI output series, scanner
  // sequences) → the record is stale for THIS study → allow re-preload.
  if (await hasSeriesChanged(rec)) return false;
  return true;
}

/**
 * Current series count of a study (core Orthanc endpoint — cheap: returns
 * the list of series IDs, no pixel data). Returns -1 if unreachable.
 */
async function getCurrentSeriesCount(studyId) {
  try {
    const series = await orthancGet(`/studies/${studyId}/series`, 15000);
    return Array.isArray(series) ? series.length : -1;
  } catch (e) {
    return -1;
  }
}

/**
 * Did the study gain (or lose) series since it was preloaded?
 * The AI autorouter appends "sb1000 (AI …)", "mra (AI …)", "thumble (AI …)"
 * series and the scanner may add sequences to an already-preloaded study.
 * The warmed data for old series is still valid, but the NEW series are
 * cold — a series-count mismatch means the "Cached" record is stale for
 * THIS study and a re-preload must be allowed. Returns false when the count
 * can't be read (a transient failure must not flip the badge).
 */
async function hasSeriesChanged(rec) {
  if (!rec || typeof rec.total_series !== "number") return false;
  const current = await getCurrentSeriesCount(rec.study_id);
  if (current < 0) return false;
  return current !== rec.total_series;
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

async function orthancGet(path, timeoutMs = 60000) {
  // Default 60s (was 15 min!): a hanging /osimis-viewer/series request
  // previously stalled the whole preload job for a quarter of an hour.
  // Viewer endpoints either answer in seconds or they're dead — a 60s
  // abort plus the per-series catch lets runJob skip-and-continue.
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

/**
 * POST /tools/find against Orthanc (returns Orthanc UUIDs).
 * Used to resolve DICOM UIDs (e.g. SeriesInstanceUID) to Orthanc IDs.
 */
async function orthancFind(level, query, limit = 50) {
  const url = getOrthancBaseUrl() + "/tools/find";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify({ Level: level, Query: query, Limit: limit }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Orthanc ${res.status} on /tools/find`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve a study identifier to the Orthanc internal study ID.
 * Accepts EITHER an Orthanc ID (UUID-ish, already internal) OR a DICOM
 * StudyInstanceUID (dotted numeric) — the OHIF study browser only knows the
 * DICOM UID, so we map it via /tools/find. Returns null when unresolvable.
 */
async function resolveStudyId(studyIdOrUid) {
  if (!studyIdOrUid) return null;
  const v = String(studyIdOrUid).trim();
  // DICOM UIDs are dotted numerics (e.g. 1.2.840.113619...); Orthanc internal
  // IDs are UUID-ish (hex + hyphens). Only resolve the dotted form.
  if (!/^[0-9.]+$/.test(v)) return v;
  try {
    const found = await orthancFind("Study", { StudyInstanceUID: v }, 1);
    return (found && found[0]) || null;
  } catch (e) {
    console.log(`[PRELOAD] study UID resolution failed (${v}): ${e.message}`);
    return null;
  }
}

/** Fetch a binary resource (viewer image) to warm the viewer plugin cache */
async function orthancWarm(path, timeoutMs = 120000) {
  // Default 2 min (was 15 min) — same reasoning as orthancGet: a single
  // hanging warm request must not freeze the whole series for 15 minutes.
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

// =====================================================================
// OHIF (DICOMweb JPEG-LS) warming
// =====================================================================
// The Osimis viewer and OHIF fetch pixels through DIFFERENT endpoints:
//   - Osimis: /osimis-viewer/images/{inst}/{frame}/{quality}-quality
//   - OHIF:   /dicomweb/studies/{s}/series/{se}/instances/{i}/frames/{n}
//            with Accept: multipart/related; type=image/jls;
//            transfer-syntax=1.2.840.10008.1.2.4.80  (JPEG-LS lossless)
// Warming only the Osimis endpoints made the Preload button useless for
// OHIF (the ⚡ badge said Cached but OHIF still transcoded cold). These
// helpers warm the EXACT DICOMweb path OHIF requests, so the JPEG-LS
// transcodes land in Orthanc's caches and OHIF scrolls fast too.
const OHIF_JLS_ACCEPT =
  "multipart/related; type=image/jls; transfer-syntax=1.2.840.10008.1.2.4.80";
// XA/XRF/XAR runs are huge uncompressed multi-frame objects. The viewer
// now requests JPEG-LS for them too (see ohif initWADOImageLoader.js), so
// the preload warms the JPEG-LS path. Orthanc transcodes the whole object
// once and caches it — the first warm of a big run pays the transcode, all
// subsequent views (any frame) hit the cache.
const OHIF_RAW_ACCEPT =
  "multipart/related; type=application/octet-stream; transfer-syntax=*";
const RAW_FRAME_MODALITIES = []; // XA now uses JPEG-LS (warm + serve)

/** Fetch a DICOMweb frame with OHIF's JPEG-LS Accept header. */
async function orthancWarmOhif(path, timeoutMs = 120000, acceptHeader = OHIF_JLS_ACCEPT) {
  const url = getOrthancBaseUrl() + path;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: getAuthHeader(),
        Accept: acceptHeader,
      },
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

/**
 * Warm one series' frames through the DICOMweb JPEG-LS path OHIF uses.
 * seriesId = Orthanc series UUID; studyUid/seriesUid = DICOM UIDs.
 * Returns {requests, errors}.
 */
async function warmOhifSeries(seriesId, studyUid, seriesUid) {
  const raw = await orthancGet(`/series/${seriesId}/instances`, 30000);
  const insts = Array.isArray(raw)
    ? raw.map((x) => (typeof x === "string" ? { ID: x } : x))
    : [];
  if (!insts.length) return { requests: 0, errors: 0 };

  // Modality-aware accept: XA uses JPEG-LS now (cache-friendly), so warm the
  // JPEG-LS path for everything. For XA specifically, Orthanc transcodes the
  // WHOLE multi-frame object on the first JPEG-LS frame request and caches it;
  // warming frame 1 of every instance therefore covers every object in the
  // series with one request each — no need to warm every frame.
  let acceptHeader = OHIF_JLS_ACCEPT;
  let frameCap = MAX_FRAMES_PER_SERIES;
  let xaMode = false;
  try {
    const seriesInfo = await orthancGet(`/series/${seriesId}`, 15000);
    const modality = (seriesInfo.MainDicomTags || {}).Modality;
    if (RAW_FRAME_MODALITIES.includes(modality)) {
      xaMode = true;
      // One request per instance (frame 1) = one full-object transcode into
      // Orthanc's JPEG-LS cache. Capped so a 1000-instance angio run doesn't
      // hammer Orthanc for hours in a single job — the ⚡ button or a second
      // run covers the rest on demand.
      frameCap = 250;
    }
  } catch (e) {
    // keep JPEG-LS default
  }

  const requests = [];
  for (const inst of insts) {
    const mt = inst.MainDicomTags || {};
    const sop = mt.SOPInstanceUID;
    if (!sop) continue;
    if (xaMode) {
      requests.push(
        `/dicom-web/studies/${studyUid}/series/${seriesUid}/instances/${sop}/frames/1`
      );
      if (requests.length >= frameCap) break;
      continue;
    }
    const n =
      parseInt(mt.NumberOfFrames || "1", 10) ||
      (Array.isArray(inst.Instances) ? inst.Instances.length : 1) ||
      1;
    for (let f = 1; f <= Math.min(n, frameCap); f++) {
      requests.push(
        `/dicom-web/studies/${studyUid}/series/${seriesUid}/instances/${sop}/frames/${f}`
      );
      if (requests.length >= frameCap) break;
    }
    if (requests.length >= frameCap) break;
  }

  let next = 0;
  let errors = 0;
  const worker = async () => {
    while (next < requests.length) {
      const url = requests[next++];
      try {
        await orthancWarmOhif(url, 120000, acceptHeader);
      } catch (e) {
        errors += 1;
      }
    }
  };
  await Promise.all(
    Array.from(
      { length: Math.min(WARM_CONCURRENCY, requests.length) },
      worker
    )
  );

  // Warm the series thumbnail into the backend in-memory cache so the first
  // study-browser render after preload is instant (Orthanc regenerates XA
  // previews per request otherwise — 1.5-5s each). The viewer fetches the
  // INSTANCE-level thumbnail, so warm that path (first instance).
  try {
    const { warmSeriesThumbnail } = require("../controllers/reverseProxy");
    const firstSop = (insts[0].MainDicomTags || {}).SOPInstanceUID;
    if (firstSop) {
      await warmSeriesThumbnail(
        `/dicom-web/studies/${studyUid}/series/${seriesUid}/instances/${firstSop}/thumbnail`
      );
    }
    await warmSeriesThumbnail(
      `/dicom-web/studies/${studyUid}/series/${seriesUid}/thumbnail`
    );
  } catch (e) {
    // best-effort
  }

  return { requests: requests.length, errors };
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

async function startPreload(studyId, trigger = "manual") {
  // Already fresh in cache -> return a synthetic done job without re-running
  if (await isFresh(studyId)) {
    const db = require("../database/models");
    const rec = await db.PreloadRecord.findOne({
      where: { study_id: studyId },
      raw: true,
    });
    // Manual ⚡ click on an auto-warmed study: UPGRADE it to manual so the
    // TTL sweep protects it for 14 days (never downgrade manual -> auto).
    if (rec && rec.trigger !== "manual" && trigger !== "auto") {
      await db.PreloadRecord.update(
        { trigger: "manual" },
        { where: { study_id: studyId } }
      );
      rec.trigger = "manual";
    }
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
    trigger: trigger === "auto" ? "auto" : "manual",
    totalSeries: 0,
    doneSeries: 0,
    totalInstances: 0,
    doneInstances: 0,
    failedSeries: 0,
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
    const key = queue.shift();
    const job = jobs.get(key);
    if (!job) continue;
    activeCount += 1;
    job.status = "running";
    job.startedAt = new Date().toISOString();
    // Fire and forget; pump() is called again when it settles.
    // Series jobs (OHIF per-series preload) share the same queue.
    const runner = job.type === "series" ? runSeriesJob(job) : runJob(job);
    runner
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

  // Resolve DICOM UIDs once (cheap metadata) for the OHIF warming path.
  let studyUid = null;
  const seriesUidByOrthancId = new Map();
  try {
    const st = await orthancGet(`/studies/${studyId}`, 30000);
    studyUid = (st.MainDicomTags || {}).StudyInstanceUID || null;
    const metas = await orthancGet(`/studies/${studyId}/series`, 30000);
    for (const m of Array.isArray(metas) ? metas : []) {
      if (m && m.ID && m.MainDicomTags && m.MainDicomTags.SeriesInstanceUID) {
        seriesUidByOrthancId.set(m.ID, m.MainDicomTags.SeriesInstanceUID);
      }
    }
  } catch (e) {
    console.log(`[PRELOAD] ${studyId.slice(0, 8)} UID resolution failed: ${e.message}`);
  }

  for (const seriesId of seriesIds) {
    try {
      const series = await orthancGet(`/osimis-viewer/series/${seriesId}`);
      const instances = (series && series.instances) || [];
      job.totalInstances += instances.length;

      // ===================================================================
      // Warm frames of this series.
      // instances tuples are [instanceId, frameIndex, frameCount].
      // Small series (cine loops): warm EVERY frame at every supported
      // quality -> scrolling is instant. Large series: warm every frame at
      // the fastest preview quality (low when available) so the pane always
      // pops instantly, plus the middle frame at full quality.
      // ===================================================================
      const tuples = instances; // [ [id, frameIndex, frameCount], ... ]
      const totalFrames = tuples.reduce(
        (sum, t) => sum + (Array.isArray(t) ? t[2] || 1 : 1),
        0
      );
      const isSmallSeries = totalFrames <= SMALL_SERIES_FRAMES;

      const avail = Array.isArray(series.availableQualities)
        ? series.availableQualities
        : [];
      // Supported quality suffixes for this series (viewer's mapping above).
      let suffixes = avail.length
        ? [...new Set(avail.map((q) => QUALITY_URL[q]).filter(Boolean))]
        : ["pixeldata-quality", "medium-quality", "high-quality"];
      // Put the fastest preview quality first (low when available).
      const lowIdx = suffixes.indexOf("low-quality");
      if (lowIdx > 0) suffixes = [suffixes.splice(lowIdx, 1)[0], ...suffixes];

      const frameTuples = []; // flattened [instanceId, frame] list
      for (const t of tuples) {
        const instId = Array.isArray(t) ? t[0] : t;
        const n = Array.isArray(t) ? t[2] || 1 : 1;
        for (let f = 0; f < n; f++) frameTuples.push([instId, f]);
      }
      const capped = Math.min(frameTuples.length, MAX_FRAMES_PER_SERIES);
      const toWarm = isSmallSeries ? suffixes : [suffixes[0]];
      // v3 (2026-08-11): warm frames in parallel — Orthanc has 12 cores and
      // sequential warming of big rotational series (1,244 frames) took ~40-60
      // min for a whole study. 4 concurrent requests cut that to ~10-15 min.
      // Real ingest floods are still handled by the ingest-rate pause in the
      // pump (isOrthancBusy); the CPU-only flood alert was fixed to require
      // an actual ingest rate so preload warming doesn't trip false alarms.
      try {
        console.log(
          `[PRELOAD] ${studyId.slice(0, 8)} ${seriesId.slice(0, 8)} frames=${frameTuples.length} small=${isSmallSeries} q=${suffixes.join(",")} -> ${toWarm.join(",")} c=${WARM_CONCURRENCY}`
        );
        // Build the flat warm list (frame x quality), then drain it through a
        // small worker pool. Per-request errors are counted, not fatal.
        const requests = [];
        for (const [instId, frame] of frameTuples) {
          if (requests.length >= capped * toWarm.length) break;
          for (const suffix of toWarm) {
            requests.push(`/osimis-viewer/images/${instId}/${frame}/${suffix}`);
          }
        }
        let next = 0;
        let warmErrors = 0;
        const worker = async () => {
          while (next < requests.length) {
            const url = requests[next++];
            try {
              await orthancWarm(url);
            } catch (e) {
              warmErrors += 1;
              job.error = job.error || e.message;
            }
          }
        };
        await Promise.all(
          Array.from(
            { length: Math.min(WARM_CONCURRENCY, requests.length) },
            worker
          )
        );
        if (warmErrors > 0) {
          console.log(
            `[PRELOAD] ${studyId.slice(0, 8)} ${seriesId.slice(0, 8)} ${warmErrors}/${requests.length} warm requests failed`
          );
        }
        // Large series: also warm the FIRST and MIDDLE instances at FULL
        // quality — the viewer opens a series on frame 0 (first instance),
        // and the middle is the classic representative. Parallel + 2-min
        // timeouts so a hanging tail request can't stall the job.
        if (!isSmallSeries && tuples.length) {
          const tail = [];
          for (const pick of [tuples[0], tuples[Math.floor(tuples.length / 2)]]) {
            const pickId = Array.isArray(pick) ? pick[0] : pick;
            if (pickId) {
              for (const suffix of suffixes) {
                tail.push(`/osimis-viewer/images/${pickId}/0/${suffix}`);
              }
            }
          }
          await Promise.all(
            tail.map((u) =>
              orthancWarm(u).catch((e) => {
                job.error = job.error || e.message;
              })
            )
          );
        }
        // OHIF path: warm the same frames via DICOMweb JPEG-LS (the exact
        // requests OHIF will make) so OHIF scrolls as fast as Osimis.
        if (studyUid && seriesUidByOrthancId.has(seriesId)) {
          try {
            const ohif = await warmOhifSeries(
              seriesId,
              studyUid,
              seriesUidByOrthancId.get(seriesId)
            );
            console.log(
              `[PRELOAD:OHIF] ${studyId.slice(0, 8)} ${seriesId.slice(0, 8)} warmed ${ohif.requests} frames (${ohif.errors} fails)`
            );
            if (ohif.errors) {
              job.error = job.error || `${ohif.errors} OHIF warm fails`;
            }
          } catch (e) {
            job.error = job.error || `OHIF warm: ${e.message}`;
          }
        }
        job.doneInstances += 1;
      } catch (e) {
        job.error = job.error || e.message;
      }
      job.doneSeries += 1;
    } catch (e) {
      job.doneSeries += 1; // count failures too so progress advances
      job.failedSeries += 1;
      job.error = job.error || e.message;
    }
  }

  job.status = "done";
  job.phase = "done";
  job.finishedAt = new Date().toISOString();

  // Don't mark this study as Cached if most series failed (e.g. Orthanc was
  // restarting mid-job): a Cached badge on un-warmed data is a lie. The
  // record is skipped so the UI shows Preload again and the user can retry.
  const failRatio = job.totalSeries ? job.failedSeries / job.totalSeries : 0;
  if (failRatio > 0.25) {
    console.log(
      `[PRELOAD] ${studyId.slice(0, 8)} ${job.failedSeries}/${job.totalSeries} series failed — NOT marking Cached, retry needed`
    );
    return;
  }

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
      trigger: job.trigger === "auto" ? "auto" : "manual",
    });
  } catch (e) {
    job.error = job.error || `cache persist failed: ${e.message}`;
  }
}

/**
 * Per-series preload (OHIF study browser button).
 * Warms ONE series via the viewer's image endpoints so the series opens
 * instantly in OHIF (instance files land in Orthanc/OS page cache).
 * Progress is per-instance: percent = doneInstances/totalInstances.
 */
async function runSeriesJob(job) {
  job.phase = "series";
  try {
    const series = await orthancGet(`/osimis-viewer/series/${job.seriesId}`);
    const instances = (series && series.instances) || [];
    job.totalInstances += instances.length;
    const tuples = instances;
    const totalFrames = tuples.reduce(
      (sum, t) => sum + (Array.isArray(t) ? t[2] || 1 : 1),
      0
    );
    const isSmallSeries = totalFrames <= SMALL_SERIES_FRAMES;

    const avail = Array.isArray(series.availableQualities)
      ? series.availableQualities
      : [];
    let suffixes = avail.length
      ? [...new Set(avail.map((q) => QUALITY_URL[q]).filter(Boolean))]
      : ["pixeldata-quality", "medium-quality", "high-quality"];
    const lowIdx = suffixes.indexOf("low-quality");
    if (lowIdx > 0) suffixes = [suffixes.splice(lowIdx, 1)[0], ...suffixes];
    const toWarm = isSmallSeries ? suffixes : [suffixes[0]];

    let warmErrors = 0;
    for (const t of tuples) {
      const instId = Array.isArray(t) ? t[0] : t;
      const n = Array.isArray(t) ? t[2] || 1 : 1;
      const frameTuples = [];
      for (let f = 0; f < n; f++) frameTuples.push([instId, f]);
      if (!frameTuples.length) {
        job.doneInstances += 1;
        continue;
      }
      const capped = Math.min(frameTuples.length, MAX_FRAMES_PER_SERIES);
      const requests = [];
      for (let k = 0; k < capped; k++) {
        for (const suffix of toWarm) {
          requests.push(
            `/osimis-viewer/images/${frameTuples[k][0]}/${frameTuples[k][1]}/${suffix}`
          );
        }
      }
      let next = 0;
      const worker = async () => {
        while (next < requests.length) {
          const url = requests[next++];
          try {
            await orthancWarm(url);
          } catch (e) {
            warmErrors += 1;
            job.error = job.error || e.message;
          }
        }
      };
      await Promise.all(
        Array.from(
          { length: Math.min(WARM_CONCURRENCY, requests.length) },
          worker
        )
      );
      job.doneInstances += 1;
    }

    // Large series: also warm first + middle instance frame 0 at every
    // supported quality (matches study-preload behavior).
    if (!isSmallSeries && tuples.length) {
      const tail = [];
      for (const pick of [tuples[0], tuples[Math.floor(tuples.length / 2)]]) {
        const pickId = Array.isArray(pick) ? pick[0] : pick;
        if (pickId) {
          for (const suffix of suffixes) {
            tail.push(`/osimis-viewer/images/${pickId}/0/${suffix}`);
          }
        }
      }
      await Promise.all(
        tail.map((u) =>
          orthancWarm(u).catch((e) => {
            job.error = job.error || e.message;
          })
        )
      );
    }

    // OHIF path: also warm this series through DICOMweb JPEG-LS so the
    // series opens instantly in OHIF (not just in the Osimis viewer).
    try {
      const s = await orthancGet(`/series/${job.seriesId}`, 30000);
      let studyUid = null;
      if (s && s.ParentStudy) {
        const st = await orthancGet(`/studies/${s.ParentStudy}`, 30000);
        studyUid = (st.MainDicomTags || {}).StudyInstanceUID || null;
      }
      if (studyUid && job.seriesUid) {
        const ohif = await warmOhifSeries(job.seriesId, studyUid, job.seriesUid);
        console.log(
          `[PRELOAD:SERIES:OHIF] ${job.seriesUid.slice(0, 12)} warmed ${ohif.requests} frames (${ohif.errors} fails)`
        );
      }
    } catch (e) {
      job.error = job.error || `OHIF warm: ${e.message}`;
    }

    job.status = "done";
    job.phase = "done";
    console.log(
      `[PRELOAD:SERIES] ${job.seriesUid.slice(0, 12)} ${job.doneInstances}/${job.totalInstances} instances warmed (${warmErrors} req fails)`
    );
  } catch (e) {
    job.status = "error";
    job.phase = "error";
    job.error = e.message;
    console.error(`[PRELOAD:SERIES] ${job.seriesUid.slice(0, 12)} failed: ${e.message}`);
  }
  job.finishedAt = new Date().toISOString();
}

/**
 * Queue a per-series preload job. Accepts the DICOM SeriesInstanceUID
 * (what OHIF knows); resolves it to the Orthanc series UUID server-side.
 */
async function startSeriesPreload(seriesUid) {
  let seriesId = null;
  try {
    const found = await orthancFind("Series", { SeriesInstanceUID: seriesUid }, 1);
    seriesId = found && found[0];
    if (!seriesId) throw new Error(`series not found: ${seriesUid}`);
  } catch (e) {
    const job = {
      type: "series",
      status: "error",
      seriesUid,
      seriesId: null,
      totalInstances: 0,
      doneInstances: 0,
      phase: "error",
      startedAt: null,
      finishedAt: new Date().toISOString(),
      error: e.message,
      queuePosition: 0,
    };
    jobs.set(seriesUid, job);
    return job;
  }

  const existing = jobs.get(seriesUid);
  if (
    existing &&
    (existing.status === "queued" ||
      existing.status === "running" ||
      existing.status === "done")
  ) {
    return existing;
  }

  const job = {
    type: "series",
    status: "queued",
    seriesUid,
    seriesId,
    totalInstances: 0,
    doneInstances: 0,
    failedInstances: 0,
    phase: "queued",
    startedAt: null,
    finishedAt: null,
    error: null,
    queuePosition: 0,
  };
  jobs.set(seriesUid, job);
  queue.push(seriesUid);
  updateQueuePositions();
  pump();
  return job;
}

/** Snapshot of a per-series job (or null) */
function getSeriesJob(seriesUid) {
  return jobs.get(seriesUid) || null;
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
    let fresh = isRecordFresh(r, current);
    let seriesChanged = false;
    if (fresh && r) {
      // 2026-08-12: new series (AI output / extra sequences) → stale badge
      seriesChanged = await hasSeriesChanged(r);
      if (seriesChanged) fresh = false;
    }
    out[sid] = {
      cached: !!fresh,
      cachedAt: r ? r.cached_at : null,
      totalSeries: r ? r.total_series : 0,
      changeSeq: r ? r.change_seq : null,
      currentChangeSeq: current,
      seriesChanged,
      trigger: r ? r.trigger : null, // 'manual' ⚡ (14d) vs 'auto' daemon-warmed (72h)
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
    const ttl = r.trigger === "auto" ? AUTO_FRESH_MS : CACHE_FRESH_MS;
    if (Date.now() - cachedAt >= ttl) continue; // expired anyway
    if (current - r.change_seq > CHURN_INSTANCES) {
      churned.push(r.study_id); // fresh window but evicted by flood
    }
  }

  const started = [];
  for (const studyId of churned.slice(0, max)) {
    // Preserve the original trigger: a manually-preloaded study that got
    // churned away by a flood is repaired as 'manual' so its 14-day
    // protection from the TTL sweep is never downgraded to 72h.
    const orig = recs.find((r) => r.study_id === studyId);
    const job = await startPreload(studyId, orig && orig.trigger === "auto" ? "auto" : "manual");
    started.push({ studyId, status: job.status });
  }
  return { churned: churned.length, started };
}

module.exports = {
  startPreload,
  startPreloadMany,
  startSeriesPreload,
  getSeriesJob,
  getJob,
  getActiveJobs,
  getCachedStatus,
  resolveStudyId,
  isFresh,
  getChangesLast,
  getIngestRate,
  isOrthancBusy,
  repreloadChurned,
};
