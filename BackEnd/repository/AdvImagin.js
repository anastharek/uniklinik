const db = require("../database/models");

class AdvImagin {
  static async create(
    hospital_email,
    patient_email,
    patient_name,
    patient_id,
    study_type,
    request_date,
    study_id,
    text,
    requested_by,
    patient_phone,
    is_consern
  ) {
    let instance = await db.AdvImagin.findOne({
      where: { study_id: study_id },
    });

    if (instance) {
      instance.hospital_email = hospital_email;
      instance.patient_email = patient_email;
      instance.patient_name = patient_name;
      instance.patient_id = patient_id;
      instance.study_type = study_type;
      instance.request_date = request_date;
      instance.study_id = study_id;
      instance.text = text;
      instance.requested_by = requested_by;
      instance.patient_phone = patient_phone;
      instance.is_consern = is_consern;
      return instance.save();
    } else {
      return db.AdvImagin.create({
        hospital_email: hospital_email,
        patient_email: patient_email,
        patient_name: patient_name,
        patient_id: patient_id,
        study_type: study_type,
        request_date: request_date,
        study_id: study_id,
        text: text,
        requested_by: requested_by,
        patient_phone: patient_phone,
        is_consern: is_consern,
      });
    }
  }

  static async get(study_id) {
    return db.AdvImagin.findOne({ where: { study_id: study_id } });
  }

  static async getAll() {
    return db.AdvImagin.findAll({
      order: [["createdAt", "ASC"]],
    });
  }

  static async deleteImagin(study_id) {
    return db.AdvImagin.destroy({
      where: { study_id: study_id },
    });
  }
}

module.exports = AdvImagin;
