const db = require("../database/models");
const { log_activity } = require("../midelwares/activity_logger");
const ActivityType = require("../utils/ActivityType");

class RequestReport {
  //first it will check for any record in draft
  //if nothing in draft then return final report or
  //return draft report
  static async getAllRequestReport() {
    let data = await db.RequestReport.findAll({
      order: [["createdAt", "ASC"]],
    });
    return data;
  }

  static getRequestReport(studyid) {
    return db.RequestReport.findOne({
      where: { study_id: studyid },
    });
  }

  static async delete(studyid) {
    let req_report = db.RequestReport.destroy({
      where: { study_id: studyid },
    });
    let description = {
      "Patient Name": req_report.patient_name,
      "Study Type": req_report.study_type,
      Status: req_report.status,
      "Request Type": req_report.request_type,
      "Req By": req_report.req_by,
      "Radiologist Email": req_report.radiologist_email,
      Reporter: req_report.reporter,
    };
    log_activity(
      null,
      null,
      () => {},
      ActivityType.DELETE_REQUEST_REPORT,
      description
    );
  }

  static async updateStatus(studyid, status, reporter) {
    const request_report = await db.RequestReport.findOne({
      where: { study_id: studyid },
    });
    if (request_report !== null) {
      request_report.status = status;
      request_report.reporter = reporter;
      request_report.save();
      return request_report;
    } else {
      return null;
    }
  }

  static async create_request_report(
    patient_name,
    patient_id,
    study_type,
    studyid,
    text,
    request_type,
    study_date,
    accessor,
    StudyInstanceUID,
    req_by,
    department,
    radiologist_email
  ) {
    const request_report = await db.RequestReport.findOne({
      where: { study_id: studyid },
    });
    if (request_report !== null) {
      request_report.patient_name = patient_name;
      request_report.patient_id = patient_id;
      request_report.study_type = study_type;
      request_report.study_id = studyid;
      request_report.text = text;
      request_report.request_type = request_type;
      request_report.accessor = accessor;
      request_report.StudyInstanceUID = StudyInstanceUID;
      request_report.req_by = req_by;
      request_report.department = department;
      request_report.radiologist_email = radiologist_email;
      request_report.save();
      return request_report;
    }

    return db.RequestReport.create({
      patient_name: patient_name,
      patient_id: patient_id,
      study_type: study_type,
      study_id: studyid,
      text: text,
      request_type: request_type,
      study_date: study_date,
      accessor: accessor,
      StudyInstanceUID: StudyInstanceUID,
      status: "requested",
      req_by,
      department,
      radiologist_email,
    });
  }
}

module.exports = RequestReport;
