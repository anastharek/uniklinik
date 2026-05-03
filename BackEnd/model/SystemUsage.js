const SystemUsage = require("../repository/SystemUsage");

class SystemUsageModel {
  static async create(user_count, system_usage) {
    return SystemUsage.create(user_count, system_usage);
  }

  static async get() {
    return SystemUsage.get();
  }
}

module.exports = SystemUsageModel;
