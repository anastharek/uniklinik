const db = require("../database/models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const cron = require("node-cron");

class SystemUsage {
  static async create(user_count, system_usage) {
    return await db.SystemUsage.create({
      user_count,
      system_usage,
    });
  }

  static async get(days) {
    // return await db.SystemUsage.findAll({});
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);
    return await db.SystemUsage.findAll({
      where: {
        createdAt: {
          [Sequelize.Op.gte]: twoDaysAgo,
        },
      },
      order: [
        ['createdAt', 'DESC'],
      ],
    });
  }
}
//cron job to delete 7days old data at 1:30am
cron.schedule("30 1 * * *", async function () {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 7);
  await db.SystemUsage.destroy({
    where: {
      createdAt: {
        [Sequelize.Op.lt]: ninetyDaysAgo,
      },
    },
  });
});

module.exports = SystemUsage;
