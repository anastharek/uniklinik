const { OTJSBadRequestException } = require("../Exceptions/OTJSErrors");
const RequestReports = require("../model/RequestReport");
const { log_activity } = require("../midelwares/activity_logger");
const ActivityType = require("../utils/ActivityType");
const {
  request_report_mail_admin,
  request_report_done,
} = require("../utils/mailer");

const getAllRequestReport = async function (req, res) {
  let data = await RequestReports.getAllRequestReport();
  return res.send(data);
};

const getRequestReport = async function (req, res) {
  const { studyid } = req.params;
  let data = await RequestReports.getRequestReport(studyid);
  if (data == null) {
    return res.status(404).json({ msg: "study not availabel" });
  }
  return res.send(data);
};

const createRequestReport = async function (req, res) {
  const {
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
    radiologist_email,
    practicing_no,
  } = req.body;

  let keys = [
    "patient_name",
    "patient_id",
    "study_type",
    "studyid",
    "text",
    "request_type",
    "study_date",
  ];
  for (let i = 0; i < keys.length; i++) {
    if (req.body[keys[i]] == undefined) {
      throw new OTJSBadRequestException(`${keys[i]} is required !!`);
    }
  }
  data = RequestReports.createRequestReport(
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
  );
  log_activity(req, res, () => {}, ActivityType.REQUEST_REPORT, {
    patient_id,
    patient_name,
    study_type,
    studyid,
  });
  let newFormat =
    study_date.slice(6, 8) +
    "/" +
    study_date.slice(4, 6) +
    "/" +
    study_date.slice(0, 4);
  request_report_mail_admin(
    patient_name,
    patient_id,
    study_type,
    request_type,
    text,
    newFormat,
    radiologist_email,
    practicing_no,
    req_by,
    department
  );
  return res.send(201);
};

const updateStatus = async function (req, res) {
  const { studyid, status, reporter } = req.body;
  let data = await RequestReports.updateStatus(studyid, status, reporter);
  if (data.status == "done") {
    const {
      patient_name,
      patient_id,
      study_type,
      request_type,
      text,
      study_date,
    } = data;
    let newFormat =
      study_date.slice(6, 8) +
      "/" +
      study_date.slice(4, 6) +
      "/" +
      study_date.slice(0, 4);
    request_report_done(
      patient_name,
      patient_id,
      study_type,
      request_type,
      text,
      newFormat
    );
  }
  return res.send(data);
};

const deleteRequestReport = async function (req, res) {
  const { studyid } = req.body;
  await RequestReports.deleteRequestReport(studyid);
  return res.send(204);
};

module.exports = {
  getAllRequestReport,
  getRequestReport,
  createRequestReport,
  updateStatus,
  deleteRequestReport,
};
