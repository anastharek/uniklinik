const db = require("../database/models");

class PacAdmin {
  static async get_pacadmin() {
    let data = await db.PAC_ADMIN.findAll();
    return data;
  }

  static async create_pacadmin(name, email, phone, profile) {
    let pac_admin = await db.PAC_ADMIN.findAll({ limit: 1 })[0];
    if (pac_admin) {
      pac_admin.name = name;
      pac_admin.email = email;
      pac_admin.phone_no = phone;
      pac_admin.profile = profile;
      pac_admin.save();
    } else {
      pac_admin = await db.PAC_ADMIN.create({
        name: name,
        email: email,
        phone_no: phone,
        profile: profile,
      });
    }
    return pac_admin;
  }
}

module.exports = PacAdmin;
