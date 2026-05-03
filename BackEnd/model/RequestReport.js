const {
  OTJSNotFoundException,
  OTJSBadRequestException,
} = require("../Exceptions/OTJSErrors");
const RequestReportRepo = require("../repository/RequestReport");

class RequestReport {
  static async getAllRequestReport() {
    try {
      return await RequestReportRepo.getAllRequestReport();
    } catch (e) {
      throw new OTJSBadRequestException(e.toString());
    }
  }

  static async getRequestReport(studyid) {
    let data = await RequestReportRepo.getRequestReport(studyid);
    if (data == null) {
      throw new OTJSNotFoundException();
    }
    return data;
  }

  static async createRequestReport(
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
    try {
      return await RequestReportRepo.create_request_report(
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
    } catch (e) {
      throw new OTJSBadRequestException(e.toString());
    }
  }

  static async updateStatus(studyid, status, reporter) {
    try {
      let data = await RequestReportRepo.updateStatus(
        studyid,
        status,
        reporter
      );
      if (data != null) {
        return data;
      } else {
        throw new OTJSNotFoundException();
      }
    } catch (e) {
      throw new OTJSBadRequestException(e.toString());
    }
  }

  static async deleteRequestReport(study_id) {
    try {
      return await RequestReportRepo.delete(study_id);
    } catch (e) {
      throw new OTJSBadRequestException(e.toString());
    }
  }
}

module.exports = RequestReport;
