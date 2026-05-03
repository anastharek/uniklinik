const {
  generateAiSeries,
  deleteAiSeriesRecord,
} = require("./generateAiSeries");
const cron = require("node-cron");

//generate series cron  every 15min
cron.schedule("*/2 * * * *", async () => {
  generateAiSeries();
});
//delete generated series  record of last 2 month every 30days
cron.schedule("0 0 1 * *", async () => {
  deleteAiSeriesRecord();
});
