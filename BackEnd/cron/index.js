const {
  generateAiSeries,
  generateAiSeriesFull,
  deleteAiSeriesRecord,
} = require("./generateAiSeries");
const cron = require("node-cron");

//generate series cron  every 15min -> every 2 min for new cases (StudyDate = today)
cron.schedule("*/2 * * * *", async () => {
  generateAiSeries();
});
//full scan: every day at 02:00 (container TZ = Asia/Kuala_Lumpur => 2 AM MYT)
//scans the whole archive for any matching series not yet completed (no duplication)
cron.schedule("0 2 * * *", async () => {
  generateAiSeriesFull();
});
//delete generated series  record of last 2 month every 30days
cron.schedule("0 0 1 * *", async () => {
  deleteAiSeriesRecord();
});

// Flood protection: auto re-preload studies whose cache was churned away by a
// big ingest wave (e.g. a 9,000-instance study arriving). Runs every 5 min;
// only acts when Orthanc is calm, re-warming a few per tick until caught up.
const { repreloadChurned } = require("../services/preloadService");
cron.schedule("*/5 * * * *", async () => {
  try {
    const res = await repreloadChurned(3);
    if (res.started && res.started.length) {
      console.log(
        `[preload-flood] churned=${res.churned} started=${res.started.length} (${res.started
          .map((s) => s.studyId.slice(0, 8))
          .join(",")})`
      );
    }
  } catch (e) {
    console.error("[preload-flood] error:", e.message);
  }
});
