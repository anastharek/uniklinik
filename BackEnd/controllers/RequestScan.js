const RequestScan = require("../model/RequestScan");
const Users = require("../model/Users");

const mailer = require("../utils/mailer");

const create_request_scan = async (req, res) => {
  let required = [
    "clinic_name",
    "modality",
    "indication",
    "patient_name",
    "patient_id",
    "date",
  ];

  let error = [];
  required.map((text) => {
    if (!req.body[text]) {
      error.push(req.body[text] + "is required ");
    }
  });

  if (error.length > 0) {
    return res.status(400).json({
      error: error,
    });
  }

  const {
    clinic_name,
    modality,
    indication,
    patient_name,
    patient_id,
    study_description,
    image,
    doctors,
    date,
    phone
  } = req.body;
  await RequestScan.create(
    clinic_name,
    modality,
    indication,
    patient_name,
    patient_id,
    study_description,
    image,
    doctors,
    date,
    req.roles.username,
    phone
  );
  let allEmail = [];
  for (let i = 0; i < doctors.length; i++) {
    let username = doctors[i].split("(")[1].split(")")[0];
    let userObj = await Users.getUserbyUsername(username);
    allEmail.push(userObj.email);
  }
  if (allEmail.length > 0) {
    mailer.request_scan_mail_to_doctor(
      patient_name,
      patient_id,
      allEmail,
      req.roles.username,
      clinic_name,
      indication,
      study_description,
      new Date(date),
      modality
    );
  }

  mailer.request_scan_mail_to_admin(
    patient_name,
    patient_id,
    doctors.toString(),
    req.roles.username,
    clinic_name,
    indication,
    study_description,
    new Date(date),
    modality
  );
  return res.status(201).send("request created");
};

const get_reports = async (req, res) => {
  let data = await RequestScan.getAll();
  return res.send(data);
};

const delete_report=async(req,res)=>{
  if(!req.body.id){
    return res.send('request scan id required')
  }
  await RequestScan.delete(req.body.id);
  return res.status(204).send('deleted')
}
module.exports = {
  create_request_scan,
  get_reports,
  delete_report
};
