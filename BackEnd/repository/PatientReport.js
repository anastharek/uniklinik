const db = require("../database/models");
const mailer = require("../utils/mailer");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const { log_activity } = require("../midelwares/activity_logger");
const ActivityType = require("../utils/ActivityType");
const { reverseProxyGetStudy } = require("../controllers/reverseProxy");
class PatientReport {
  //first it will check for any record in draft
  //if nothing in draft then return final report or
  //return draft report
  static async getAdminReport(studyid) {
    let data = await db.ReportDraft.findOne({
      where: { study_id: studyid },
    });

    if (data == null) {
      let addendun_data = await db.Addendum.findOne({
        limit: 1,
        where: { study_id: studyid },
        order: [["createdAt", "DESC"]],
      });
      let reportdata = await db.ReportFinal.findOne({
        where: { study_id: studyid },
      });
      if (addendun_data) {
        addendun_data.dataValues.doctors = reportdata?.doctors || [];
        addendun_data.dataValues.roles = reportdata?.roles || [];
        addendun_data.dataValues.label = reportdata?.label || [];
        addendun_data.dataValues.type = reportdata?.type || [];
        return addendun_data;
      }
      return reportdata;
    } else {
      return data;
    }
  }

  static async getPreviousReport(patient_id) {
    let already = [];
    let all_data = [];
    let addendum = await db.Addendum.findAll({
      where: { patient_id },
      order: [["createdAt", "DESC"]],
    });
    let final = await db.ReportFinal.findAll({ where: { patient_id } });
    let addendum_filter = addendum.map((obj) => {
      if (!already.includes(obj.study_id)) {
        all_data.push(obj);
        already.push(obj.study_id);
      }
    });
    let final_filter = final.map((obj) => {
      if (!already.includes(obj.study_id)) {
        all_data.push(obj);
        already.push(obj.study_id);
      }
    });

    await Promise.all([addendum_filter]);
    await Promise.all([final_filter]);
    return all_data;
  }

  static updateLabels = async (id, labels) => {
    let draft = await db.ReportDraft.findOne({ where: { study_id: id } });
    if (draft) {
      draft.label = labels;
      draft.save();
    } else {
      let final = await db.ReportFinal.findOne({ where: { study_id: id } });
      if (final) {
        final.label = labels;
        final.save();
      }
    }
    return;
  };

  static async updateDoctor(req, req_username, id, names, status) {
    names = names.filter((str) => str !== "");
    if (status) {
      let draft = await db.ReportDraft.findOne({
        where: { study_id: id },
      });
      if (draft) {
        if (draft.doctors.length < names.length) {
          log_activity(req, null, () => {}, ActivityType.ASSIGN_DOCTOR);
          let newdoctor = names.filter((name) => !draft.doctors.includes(name));
          newdoctor.map(async (doc) => {
            if (doc) {
              let username = doc.split("(")[1].split(")");
              let user = await db.User.findOne({
                where: { username },
              });
              if (user.email) {
                mailer.assign_doctor(
                  req_username,
                  draft.patient_name,
                  draft.study_type,
                  draft.study_date,
                  user.email
                );
                //console.log("sending email to ", user.email);
              }
            }
          });
        }
        draft.doctors = names;
        draft.save();
      }
      return;
    } else {
      let final = await db.ReportFinal.findOne({
        where: { study_id: id },
      });
      if (final) {
        if (final.doctors.length < names.length) {
          let newdoctor = names.filter((name) => !final.doctors.includes(name));
          newdoctor.map(async (doc) => {
            if (doc) {
              let username = doc.split("(")[1].split(")");
              let user = await db.User.findOne({
                where: { username },
              });
              if (user.email) {
                mailer.assign_doctor(
                  req_username,
                  final.patient_name,
                  final.study_type,
                  final.study_date,
                  user.email
                );
              }
            }
          });
        }
        final.doctors = names;
        final.save();
      }
      return;
    }
  }

  static async removeDoctor(req, studyid, username) {
    log_activity(req, null, () => {}, ActivityType.UNASSIGN_DOCTOR);
    let draft = await db.ReportDraft.findOne({
      where: { study_id: studyid },
    });
    if (draft == null) {
      let final = await db.ReportFinal.findOne({
        where: { study_id: studyid },
      });
      if (final) {
        final.doctors = final.doctors.filter(
          (name) => !name.includes(username)
        );
        final.save();
      }
      return;
    } else {
      draft.doctors = draft.doctors.filter((name) => !name.includes(username));
      draft.save();
      return;
    }
  }

  static async getDoctorReport(req, username) {
    let data = await db.ReportFinal.findAll({
      where: {
      [Op.or]: [
        { doctors: { [Op.iLike]: `%(${username})%` } },
        { roles: { [Op.iLike]: `%${req.roles.name}%` } },
      ],
      },
      attributes: { exclude: ["signature", "image", "Logo", "text"] },
    });

    let data2 = await db.ReportDraft.findAll({
      where: {
      [Op.or]: [
        { doctors: { [Op.iLike]: `%(${username})%` } },
        { roles: { [Op.iLike]: `%${req.roles.name}%` } },
      ],
      },
      attributes: { exclude: ["signature", "image", "Logo", "text"] },
    });
    log_activity(req, null, () => {}, ActivityType.VIEW_MY_CASELIST);
    return data2.concat(data);
  }

  static async searchData(user_data) {
    let query = {};
    Object.keys(user_data).map((key) => {
      if (key == "type") {
        query["type"] = user_data["type"];
      } else if (key !== "keyword") {
        query[key] = { [Op.iLike]: `%${user_data[key]}%` };
      }
    });
    if (user_data["keyword"]) {
      query["text"] = { [Op.iLike]: `%${user_data["keyword"]}%` };
    }

    let data = await db.ReportFinal.findAll({
      where: query,
      attributes: { exclude: ["signature", "image", "Logo", "text"] },
    });

    let data2 = await db.ReportDraft.findAll({
      where: query,
      attributes: { exclude: ["signature", "image", "Logo", "text"] },
    });
    return data2.concat(data);
  }

  static async searchDataDoctor(req, req_data, username) {
    let query = {};
    Object.keys(req_data).map((key) => {
      if (key == "type") {
        query["type"] = req_data["type"];
      } else if (key !== "keyword") {
        query[key] = { [Op.iLike]: `%${req_data[key]}%` };
      }
    });
    if (req_data.keyword) {
      query["text"] = { [Op.iLike]: `%${req_data["keyword"]}%` };
    }

    query[Op.or] = [
      { doctors: { [Op.iLike]: `%(${username})%` } },
      { roles: { [Op.iLike]: `%${req.roles.name}%` } },
    ];

    if (req_data.type) {
      query[Op.or].push({ type: req_data.type });
    }

    let data = await db.ReportFinal.findAll({
      where: query,
      attributes: { exclude: ["signature", "image", "Logo", "text"] },
    });

    let data2 = await db.ReportDraft.findAll({
      where: query,
      attributes: { exclude: ["signature", "image", "Logo", "text"] },
    });

    return data2.concat(data);
  }

  static async searchPatientReport(req_data, username) {
    let query = {};
    Object.keys(req_data).map((key) => {
      if (key == "type") {
        query["type"] = req_data["type"];
      } else if (key !== "keyword") {
        query[key] = { [Op.iLike]: `%${req_data[key]}%` };
      }
    });
    if (req_data.keyword) {
      query["text"] = { [Op.iLike]: `%${req_data["keyword"]}%` };
    }
    query["patient_id"] = username;
    let data = await db.ReportFinal.findAll({
      where: query,
      attributes: { exclude: ["signature", "image", "Logo", "text"] },
    });

    let data2 = await db.ReportDraft.findAll({
      where: query,
      attributes: { exclude: ["signature", "image", "Logo", "text"] },
    });

    return data2.concat(data);
  }

  static async getAllDoctorsReport(req) {
    let data = await db.ReportFinal.findAll({
      attributes: { exclude: ["signature", "image", "Logo", "text"] },
    });
    let data2 = await db.ReportDraft.findAll({
      attributes: { exclude: ["signature", "image", "Logo", "text"] },
    });
    log_activity(req, null, () => {}, ActivityType.VIEW_ALL_CASELIST);
    return data2.concat(data);
  }

  static async isreportFinalize(studyid) {
    let data = await db.ReportFinal.findOne({
      where: { study_id: studyid },
    });
    if (data) {
      return true;
    }
    return false;
  }

  static async getPatientReport(req, studyid, preview) {
    let report_data = await db.ReportFinal.findOne({
      where: { study_id: studyid },
    });
    let all_addendum = await db.Addendum.findAll({
      where: { study_id: studyid },
      order: [["createdAt", "DESC"]],
    });
    if (preview) {
      let report_data_draft = await db.ReportDraft.findOne({
        where: { study_id: studyid },
      });
      if (report_data_draft) {
        report_data = report_data_draft;
      }
    }
    let description = {
      "Patient Name": report_data.patient_name,
      "Patient ID": report_data.patient_id,
      "Study Type": report_data.study_type,
      "Study ID": report_data.study_id,
    };
    log_activity(req, null, () => {}, ActivityType.VIEW_REPORT, description);
    return { report_data, all_addendum };
  }

  static async assignDoctor(
    req,
    req_username,
    study_id,
    patient_name,
    patient_id,
    accesor,
    study_type,
    study_date,
    doctors,
    StudyInstanceUID
  ) {
    doctors = doctors.filter((str) => str !== "");
    let report_data = await db.ReportFinal.findOne({
      where: { study_id: study_id },
    });
    if (report_data) {
      if (report_data.doctors.length < doctors.length) {
        if (req) log_activity(req, null, () => {}, ActivityType.ASSIGN_DOCTOR);
        let newdoctor = doctors.filter(
          (name) => !report_data.doctors.includes(name)
        );
        newdoctor.map(async (doc) => {
          if (doc) {
            let username = doc.split("(")[1].split(")");
            let user = await db.User.findOne({
              where: { username },
            });
            if (user.email) {
              mailer.assign_doctor(
                req_username,
                patient_name,
                study_type,
                study_date,
                user.email
              );
            }
          }
        });
      }
      report_data.doctors = doctors;
      report_data.save();
      return;
    }
    const draft = await db.ReportDraft.findOne({
      where: { study_id: study_id },
    });
    if (draft) {
      if (draft.doctors.length < doctors.length) {
        let newdoctor = doctors.filter((name) => !draft.doctors.includes(name));
        newdoctor.map(async (doc) => {
          if (doc) {
            let username = doc.split("(")[1].split(")");
            let user = await db.User.findOne({
              where: { username },
            });
            if (user.email) {
              mailer.assign_doctor(
                req_username,
                patient_name,
                study_type,
                study_date,
                user.email
              );
              //console.log("sending email to ", user.email);
            }
          }
        });
      }
      draft.doctors = doctors;
      draft.save();
      return;
    }

    doctors.map(async (doc) => {
      if (doc) {
        let username = doc.split("(")[1].split(")");
        let user = await db.User.findOne({
          where: { username },
        });
        if (user.email) {
          mailer.assign_doctor(
            req_username,
            patient_name,
            study_type,
            study_date,
            user.email
          );
          // console.log("sending email to ", user.email);
        }
      }
    });
    return db.ReportDraft.create({
      patient_name: patient_name,
      patient_id: patient_id,
      study_type: study_type,
      study_id: study_id,
      tag: "",
      text: "",
      study_date: study_date,
      doctors: doctors,
      StudyInstanceUID: StudyInstanceUID,
      accesor: accesor,
      roles: [],
    });
  }
  static async assigByRoles(
    study_id,
    patient_name,
    patient_id,
    accesor,
    study_type,
    study_date,
    roles,
    StudyInstanceUID
  ) {
    let report_data = await db.ReportFinal.findOne({
      where: { study_id: study_id },
    });
    if (report_data) {
      report_data.roles = roles;
      report_data.save();
      return;
    }
    const draft = await db.ReportDraft.findOne({
      where: { study_id: study_id },
    });
    if (draft) {
      draft.roles = roles;
      draft.save();
      return;
    }
    return db.ReportDraft.create({
      patient_name: patient_name,
      patient_id: patient_id,
      study_type: study_type,
      study_id: study_id,
      tag: "",
      text: "",
      study_date: study_date,
      doctors: [],
      StudyInstanceUID: StudyInstanceUID,
      accesor: accesor,
      roles: roles,
    });
  }

  static async getAssignCount(username) {
    let draftCount = await db.ReportDraft.count({
      where: {
        doctors: {
          [Op.like]: `%(${username})%`,
        },
      },
    });
    let finalCount = await db.ReportFinal.count({
      where: {
        doctors: {
          [Op.like]: `%(${username})%`,
        },
      },
    });

    return { non_finalize: draftCount, finalize: finalCount };
  }

  static async delete(studyid, req) {
    let report_data;
    let draft = await db.ReportDraft.findOne({
      where: { study_id: studyid },
    });
    if (draft) {
      report_data = draft;
    }
    let final = await db.ReportFinal.findOne({
      where: { study_id: studyid },
    });
    if (final) {
      report_data = final;
    }
    let addendum = await db.Addendum.findOne({
      where: { study_id: studyid },
    });
    if (addendum) {
      report_data = addendum;
    }
    let description = {
      "Patient Name": report_data.patient_name,
      Doctors: report_data.doctors?.join(" , "),
      "Study Type": report_data.study_type,
      "Study Id": report_data.study_id,
    };
    log_activity(
      req,
      null,
      () => {},
      ActivityType.DELETE_STUDY_REPORT,
      description
    );

    draft?.destroy();
    final?.destroy();
    addendum?.destroy();
    return;
  }

  static async create_draf(
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
    logo
  ) {
    let description = {};
    let reportData = await reverseProxyGetStudy(studyid);
    reportData = JSON.parse(reportData);
    let InstitutionName = reportData.MainDicomTags.InstitutionName;
    const draftreport = await db.ReportDraft.findOne({
      where: { study_id: studyid },
    });
    if (draftreport !== null) {
      draftreport.patient_name = patient_name;
      draftreport.patient_id = patient_id;
      draftreport.study_type = study_type;
      draftreport.study_id = studyid;
      draftreport.tag = tag;
      draftreport.text = text;
      draftreport.study_date = study_date;
      if (signature) draftreport.signature = signature;
      if (image) draftreport.image = image;
      if (table) draftreport.table = table;
      if (logo) draftreport.Logo = logo;
      if (ReferringPhysicianName)
        draftreport.RefPhysicianName = ReferringPhysicianName;
      if (InstitutionName) draftreport.InstitutionName = InstitutionName;
      if (nric) draftreport.nric = nric;
      draftreport.doctors = doctors;
      draftreport.StudyInstanceUID = StudyInstanceUID;
      if (accesor && !draftreport.accesor) draftreport.accesor = accesor;
      draftreport.usg_no = usg_no;
      draftreport.roles = roles;
      draftreport.save();
      description = {
        "Patient Name": patient_name,
        "Patient ID": patient_id,
        "Study Type": study_type,
        "Study ID": studyid,
        Note: "Updated Draft Report",
      };
      log_activity(
        req,
        null,
        () => {},
        ActivityType.UPDATED_DRAFT_REPORT,
        description
      );
      return draftreport;
    }

    description = {
      "Patient Name": patient_name,
      "Patient ID": patient_id,
      "Study Type": study_type,
      "Study ID": studyid,
      Note: "Saved Draft Report",
    };
    log_activity(
      req,
      null,
      () => {},
      ActivityType.CREATED_DRAFT_REPORT,
      description
    );
    return db.ReportDraft.create({
      patient_name: patient_name,
      patient_id: patient_id,
      study_type: study_type,
      study_id: studyid,
      tag: tag,
      text: text,
      study_date: study_date,
      signature: signature,
      image: image,
      doctors: doctors,
      StudyInstanceUID: StudyInstanceUID,
      accesor: accesor,
      table: table,
      usg_no: usg_no,
      roles: roles,
      RefPhysicianName: ReferringPhysicianName,
      nric: nric,
      Logo: logo,
      InstitutionName: InstitutionName,
    });
  }

  static async create_final(
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
    addendumby,
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
    labels
  ) {
    let reportData = await reverseProxyGetStudy(studyid);
    reportData = JSON.parse(reportData);
    let InstitutionName = reportData.MainDicomTags.InstitutionName;
    accesor = reportData.MainDicomTags.AccessionNumber;
    let description = {
      "Patient Name": patient_name,
      "Patient ID": patient_id,
      "Study Type": study_type,
      "Study ID": studyid,
    };
    const finalreport = await db.ReportFinal.findOne({
      where: { study_id: studyid },
    });
    if (finalreport !== null) {
      await db.Addendum.create({
        patient_name: patient_name,
        patient_id: patient_id,
        study_type: study_type,
        study_id: studyid,
        tag: tag,
        text: text,
        study_date: study_date,
        signature: signature,
        image,
        addendumby,
        addendum_at,
        practicing_no: practicing_no || "",
        StudyInstanceUID,
        table: table,
        usg_no: usg_no,
        Logo: logo,
      });
      finalreport.doctors = doctors;
      finalreport.roles = roles;
      if (type && !Array.isArray(type)) finalreport.type = type;
      if (labels) finalreport.labels = labels;
      if (accesor && !finalreport.accesor) finalreport.accesor = accesor;
      if (table) finalreport.table = table;
      if (ReferringPhysicianName)
        finalreport.RefPhysicianName = ReferringPhysicianName;
      if (nric) finalreport.nric = nric;
      if (logo) finalreport.Logo = logo;
      if (InstitutionName) finalreport.InstitutionName = InstitutionName;
      finalreport.save();
      await db.ReportDraft.destroy({
        where: { study_id: studyid },
      });
      log_activity(
        req,
        null,
        () => {},
        ActivityType.CREATED_ADDENDUM_REPORT,
        description
      );
      return true;
    }
    log_activity(
      req,
      null,
      () => {},
      ActivityType.CREATE_FINALIZE_REPORT,
      description
    );
    await db.ReportFinal.create({
      patient_name: patient_name,
      patient_id: patient_id,
      study_type: study_type,
      study_id: studyid,
      tag: tag,
      text: text,
      study_date: study_date,
      created_by: created_by,
      signature: signature,
      image,
      addendumby,
      practicing_no: practicing_no || "",
      doctors,
      StudyInstanceUID,
      accesor: accesor,
      table: table,
      usg_no: usg_no,
      roles: roles,
      RefPhysicianName: ReferringPhysicianName,
      nric: nric,
      Logo: logo,
      type: Array.isArray(type) ? undefined : type,
      labels: labels,
      InstitutionName: InstitutionName,
    });

    return await db.ReportDraft.destroy({
      where: { study_id: studyid },
    });
  }

  static async checkFinalizeByIDs(ids) {
    // Batched: 2 queries total (was N+1 — 2 sequential queries per study).
    // For 282 studies that was 564 round-trips; now it's 2.
    if (!ids || !ids.length) return [];
    const [finals, drafts] = await Promise.all([
      db.ReportFinal.findAll({ where: { study_id: ids } }),
      db.ReportDraft.findAll({ where: { study_id: ids } }),
    ]);
    const finalSet = new Set(finals.map((r) => r.study_id));
    const draftSet = new Set(drafts.map((r) => r.study_id));
    // Preserve input order so the frontend's index-based mapping stays correct.
    return ids.map((id) => (finalSet.has(id) ? true : draftSet.has(id) ? false : null));
  }
}

module.exports = PatientReport;
