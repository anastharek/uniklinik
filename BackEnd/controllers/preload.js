const preloadService = require("../services/preloadService");

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
    error: job.error,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
  });
};

module.exports = { startPreload, getPreloadStatus };
