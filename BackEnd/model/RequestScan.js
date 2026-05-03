const RequestScanRepo = require("../repository/RequestScan");

class RequestScan {
  static async getAll() {
    return await RequestScanRepo.getAll();
  }

  static async delete(id){
    return await RequestScanRepo.delete(id)
  }

  static async create(
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
    return await RequestScanRepo.create(
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
    );
  }
}

module.exports = RequestScan;
