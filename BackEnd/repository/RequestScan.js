const db = require("../database/models");

class RequestScan {
  static create(
    clinic_name,
    modality,
    indication,
    patient_name,
    patient_id,
    study_description,
    image,
    doctors,
    date,
    user,
    phone
  ) {
    return db.RequestScan.create({
      clinic_name: clinic_name,
      modality: modality,
      indication: indication,
      patient_name: patient_name,
      patient_id,
      study_description,
      image,
      doctors: doctors?.toString(),
      date,
      req_by: user,
      phone,
    });
  }

  static getAll() {
    return db.RequestScan.findAll();
  }

  static async  delete(id){
    let obj=await db.RequestScan.findOne({where:{id:id}})
    if(obj){
      obj.destroy();
    }
  }
}

module.exports = RequestScan;
