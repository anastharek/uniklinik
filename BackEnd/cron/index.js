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
