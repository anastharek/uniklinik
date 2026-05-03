const db = require("../database/models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const moment = require("moment");
const cron = require("node-cron");
class ActivityLog {
  static async create(type, description, username, ip) {
    return await db.ActivityLog.create({
      type,
      description,
      username,
      ip,
    });
  }

  static async getAll(query, offset, limit) {
    let querySQL = {};
    Object.keys(query).map((key) => {
      if (key == "createdAt") {
        const startOfDay = moment(query[key]).startOf("day").toDate();
        const endOfDay = moment(query[key]).endOf("day").toDate();
        querySQL[key] = { [Op.between]: [startOfDay, endOfDay] };
      } else if (key == "hide_admin") {
        querySQL["username"] = { [Op.ne]: "admin" };
      } else {
        querySQL[key] = { [Op.iLike]: `%${query[key]}%` };
      }
    });
    return await db.ActivityLog.findAll({
      limit,
      offset,
      where: querySQL,
      order: [["createdAt", "DESC"]],
    });
  }

  static async getByUsername(username, limit, offset) {
    return await db.ActivityLog.findAll({
      limit,
      offset,
      where: { username: username },
      order: [["createdAt", "DESC"]],
    });
  }
}

//cron job to delete 90days old data at 1am
cron.schedule("0 1 * * *", async function () {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  await db.ActivityLog.destroy({
    where: {
      createdAt: {
        [Sequelize.Op.lt]: ninetyDaysAgo,
      },
    },
  });
});

module.exports = ActivityLog;
