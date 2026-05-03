const ActivityLog = require("../repository/ActivityLog");

class ActivityLogModel {
  static async create(type, description, username, ip) {
    let data = await ActivityLog.create(type, description, username, ip);
    return data;
  }

  static async getAll(query, offset, limit) {
    return await ActivityLog.getAll(query, offset, limit);
  }

  static async getByUsername(username) {
    return await ActivityLog.getByUsername(username);
  }
}

module.exports = ActivityLogModel;
