const preloadService = require("../services/preloadService");

/** Never let browsers/ETags serve stale preload state */
function noStore(res) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.set("Pragma", "no-cache");
}

const startPreload = async function (req, res) {
  const { studyId } = req.params;
  if (!studyId) {
    return res.status(400).json({ message: "studyId is required" });
  }
  const job = await preloadService.startPreload(studyId);
  res.json({
    status: job.status,
    studyId: job.studyId,
    totalSeries: job.totalSeries,
    doneSeries: job.doneSeries,
    totalInstances: job.totalInstances,
    doneInstances: job.doneInstances,
    phase: job.phase,
    queuePosition: job.queuePosition,
    fromCache: job.fromCache || false,
  });
};

const startPreloadMany = async function (req, res) {
  const { studyIds } = req.body || {};
  if (!Array.isArray(studyIds) || !studyIds.length) {
    return res.status(400).json({ message: "studyIds array is required" });
  }
  const jobs = await preloadService.startPreloadMany(studyIds);
  res.json({
    started: jobs.length,
    jobs: jobs.map((job) => ({
      status: job.status,
      studyId: job.studyId,
      phase: job.phase,
      queuePosition: job.queuePosition,
      fromCache: job.fromCache || false,
    })),
  });
};

const getPreloadStatus = async function (req, res) {
  const { studyId } = req.params;
  const job = preloadService.getJob(studyId);
  if (!job) {
    return res.json({ status: "none", studyId });
  }
  res.json({
    status: job.status,
    studyId: job.studyId,
    totalSeries: job.totalSeries,
    doneSeries: job.doneSeries,
    totalInstances: job.totalInstances,
    doneInstances: job.doneInstances,
    phase: job.phase,
    queuePosition: job.queuePosition,
    error: job.error,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    fromCache: job.fromCache || false,
  });
};

/** GET /api/preload/active - all queued/running jobs (global progress widget) */
const getActivePreloads = async function (req, res) {
  const list = preloadService.getActiveJobs();
  res.json(
    list.map((job) => ({
      status: job.status,
      studyId: job.studyId,
      totalSeries: job.totalSeries,
      doneSeries: job.doneSeries,
      totalInstances: job.totalInstances,
      doneInstances: job.doneInstances,
      phase: job.phase,
      queuePosition: job.queuePosition,
      error: job.error,
      startedAt: job.startedAt,
    }))
  );
};

/** GET /api/preload/cached?studyIds=a,b,c - which studies are fresh-cached (2 weeks) */
const getCachedStatus = async function (req, res) {
  const raw = req.query.studyIds || "";
  const studyIds = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!studyIds.length) {
    return res.status(400).json({ message: "studyIds query param is required" });
  }
  const status = await preloadService.getCachedStatus(studyIds);
  noStore(res);
  res.json(status);
};

/**
 * GET /api/orthanc/health - is Orthanc currently flooding (heavy ingest)?
 * Used by the frontend to warn "slow now = flood, not your preload".
 */
const getOrthancHealth = async function (req, res) {
  const rate = await preloadService.getIngestRate(3);
  const busy = rate > 10; // same threshold as preloadService
  res.json({
    busy,
    ingestRatePerSec: Math.round(rate * 10) / 10,
    checkedAt: new Date().toISOString(),
  });
};

module.exports = {
  startPreload,
  startPreloadMany,
  getPreloadStatus,
  getActivePreloads,
  getCachedStatus,
  getOrthancHealth,
};
