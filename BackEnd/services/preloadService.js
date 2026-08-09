const Options = require("../model/Options");
const db = require("../database/models");

/**
 * Preload job manager.
 * Fetches study data from Orthanc (same endpoints the Osimis viewer uses),
 * warming Orthanc's internal caches, and reports progress.
 *
 * Strategy:
 *  - Phase 1: study metadata -> series list
 *  - Phase 2: per-series metadata (osimis-viewer endpoint, gives instance ids)
 *  - Phase 3: per-instance thumbnail pixel data (frames/0/raw, ~900KB each)
 *             limited to one representative image per series by default so a
 *             preload stays light (full pixel warm would be GBs per study).
 *
 * Concurrency: a queue limits how many studies are warmed at once so clicking
 * "Preload" on many rows (or Preload All) doesn't hammer Orthanc.
 *
 * Persistence: on successful completion a PreloadRecord row is written so the
 * "Cached" state survives logout/login and page reloads (14-day freshness).
 */

const jobs = new Map(); // studyId -> job
const queue = []; // studyIds waiting to run
let activeCount = 0;
const MAX_CONCURRENT = 2; // studies warmed in parallel
const CACHE_FRESH_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks
const MAX_SERIES_THUMBNAILS = 1; // images warmed per series

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

/** Stream a binary resource (thumbnail) to warm caches without buffering it all */
async function orthancWarm(path, timeoutMs = 120000) {
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
    // consume the body so the transfer actually happens (warms Orthanc caches)
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
  const rec = await db.PreloadRecord.findOne({
    where: { study_id: studyId },
    raw: true,
  });
  if (!rec) return false;
  return Date.now() - new Date(rec.cached_at).getTime() < CACHE_FRESH_MS;
}

async function startPreload(studyId) {
  // Already fresh in cache -> return a synthetic done job without re-running
  if (await isFresh(studyId)) {
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

  // Phase 1: study metadata -> series list
  job.phase = "study";
  const study = await orthancGet(`/studies/${studyId}`);
  const seriesIds = study.Series || [];
  job.totalSeries = seriesIds.length;

  // Phase 2 + 3: per-series metadata + representative image
  job.phase = "series";
  for (const seriesId of seriesIds) {
    try {
      const series = await orthancGet(`/osimis-viewer/series/${seriesId}`);
      const instances = (series && series.instances) || [];
      job.totalInstances += instances.length;

      // Warm one representative image per series (middle instance, like the viewer does)
      const middle = Math.floor(instances.length / 2);
      const target = instances[middle];
      const instanceId = Array.isArray(target) ? target[0] : target;
      if (instanceId) {
        try {
          await orthancWarm(`/instances/${instanceId}/frames/0/raw`);
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
  const out = {};
  const recs = await db.PreloadRecord.findAll({
    where: { study_id: studyIds },
    raw: true,
  });
  const byId = {};
  recs.forEach((r) => (byId[r.study_id] = r));
  for (const sid of studyIds) {
    const r = byId[sid];
    const fresh = r && Date.now() - new Date(r.cached_at).getTime() < CACHE_FRESH_MS;
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
