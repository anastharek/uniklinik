const Options = require("../model/Options");

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
 */
const jobs = new Map(); // studyId -> job

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

async function startPreload(studyId) {
  // If a job is already running or finished for this study, return it
  const existing = jobs.get(studyId);
  if (existing && (existing.status === "running" || existing.status === "done")) {
    return existing;
  }

  const job = {
    status: "running",
    studyId,
    totalSeries: 0,
    doneSeries: 0,
    totalInstances: 0,
    doneInstances: 0,
    phase: "study",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    error: null,
  };
  jobs.set(studyId, job);

  // Run in background (not awaited)
  runJob(job).catch((err) => {
    job.status = "error";
    job.error = err.message;
    job.finishedAt = new Date().toISOString();
  });

  return job;
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
}

module.exports = {
  startPreload,
  getJob,
};
