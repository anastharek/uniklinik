const PatientReport = require("../repository/PatientReport");

class PatientReports {
  static async getAdminReport(studyid) {
    let data = await PatientReport.getAdminReport(studyid);
    return data;
  }

  static async updateDoctor(req, username, id, name, status) {
    return await PatientReport.updateDoctor(
      req,
      username,
      id,
      name,
      status
    );
  }
  static async updateLabels(id, labels) {
    return await PatientReport.updateLabels(id, labels);
  }
  
  static async getPreviousReport(patient_id){
    let data=await PatientReport.getPreviousReport(patient_id)
    return data;
  }

  static async getDoctorReport(req, username) {
    let data = await PatientReport.getDoctorReport(req, username);
    return data;
  }

  static async getAllDoctorsReport(req) {
    let data = await PatientReport.getAllDoctorsReport(req);
    return data;
  }

  static async removeDoctor(req, id, username) {
    let data = await PatientReport.removeDoctor(req, id, username);
    return data;
  }

  static async checkFinalizeByIDs(ids) {
    let data = await PatientReport.checkFinalizeByIDs(ids);
    return data;
  }
  static async searchData(data) {
    let result = await PatientReport.searchData(data);
    return result;
  }

  static async searchDataDoctor(req, data, username) {
    let result = await PatientReport.searchDataDoctor(req, data, username);
    return result;
  }

  static async searchPatientReport(data, username) {
    let result = await PatientReport.searchPatientReport(data, username);
    return result;
  }

  static isreportFinalize(studyid) {
    return PatientReport.isreportFinalize(studyid);
  }

  static getPatientReport(req, studyid, preview) {
    return PatientReport.getPatientReport(req, studyid, preview);
  }

  static async createDraft(
    req,
    patient_name,
    patient_id,
    study_type,
    studyid,
    tag,
    text,
    study_date,
    signature,
    image,
    doctors,
    StudyInstanceUID,
    accesor,
    table,
    usg_no,
    roles,
    ReferringPhysicianName,
    nric,
  ) {
    await PatientReport.create_draf(
      req,
      patient_name,
      patient_id,
      study_type,
      studyid,
      tag,
      text,
      study_date,
      signature,
      image,
      doctors,
      StudyInstanceUID,
      accesor,
      table,
      usg_no,
      roles,
      ReferringPhysicianName,
      nric,
    );
    return true;
  }

  static async createFinal(
    req,
    patient_name,
    patient_id,
    study_type,
    studyid,
    tag,
    text,
    study_date,
    created_by,
    signature,
    image,
    addendunby,
    addendum_at,
    practicing_no,
    doctors,
    StudyInstanceUID,
    accesor,
    table,
    usg_no,
    roles,
    ReferringPhysicianName,
    nric,
    logo,
    type,
    labels,
  ) {
    await PatientReport.create_final(
      req,
      patient_name,
      patient_id,
      study_type,
      studyid,
      tag,
      text,
      study_date,
      created_by,
      signature,
      image,
      addendunby,
      addendum_at,
      practicing_no,
      doctors,
      StudyInstanceUID,
      accesor,
      table,
      usg_no,
      roles,
      ReferringPhysicianName,
      nric, 
      logo,
      type,
      labels,
    );
    return true;
  }

  static assignDoctor(
    req,
    username,
    study_id,
    patient_name,
    patient_id,
    accesor,
    study_type,
    study_date,
    doctors,
    StudyInstanceUID
  ) {
    return PatientReport.assignDoctor(
      req,
      username,
      study_id,
      patient_name,
      patient_id,
      accesor,
      study_type,
      study_date,
      doctors,
      StudyInstanceUID
    );
  }
  static assigByRoles(
    study_id,
    patient_name,
    patient_id,
    accesor,
    study_type,
    study_date,
    roles,
    StudyInstanceUID
  ) {
    return PatientReport.assigByRoles(
      study_id,
      patient_name,
      patient_id,
      accesor,
      study_type,
      study_date,
      roles,
      StudyInstanceUID
    );
  }

  static getAssignCount(username) {
    return PatientReport.getAssignCount(username);
  }
  static deleteAll(studyid, req) {
    return PatientReport.delete(studyid, req);
  }
}

module.exports = PatientReports;
