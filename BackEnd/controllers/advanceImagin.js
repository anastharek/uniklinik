const { OTJSBadRequestException } = require("../Exceptions/OTJSErrors");
const AdvImagins = require("../model/AdvImagin");
const { request_advance_imagin_mail } = require("../utils/mailer");

const createImagin = async (req, res) => {
  const {
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
    is_consern,
  } = req.body;
  let keys = [
    "hospital_email",
    "patient_email",
    "patient_name",
    "patient_id",
    "study_type",
    "request_date",
    "study_id",
    "requested_by",
  ];
  for (let i = 0; i < keys.length; i++) {
    if (!req.body[keys[i]]) {
      throw new OTJSBadRequestException(`${keys[i]} is required !!`);
    }
  }
  request_advance_imagin_mail(
    hospital_email,
    patient_name,
    patient_email,
    patient_id,
    patient_phone,
    study_type,
    request_date,
    text,
    is_consern
  );
  await AdvImagins.create(
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
  );
  return res.send(201);
};

const get = async (req, res) => {
  const { id } = req.params;
  let data = await AdvImagins.get(id);
  if (data) return res.send(data);
  else return res.status(404).json({ msg: "not found" });
};

const getAll = async (req, res) => {
  let allData = await AdvImagins.getAll();
  return res.send(allData);
};

const deleteImagin = async (req, res) => {
  const { id } = req.params;
  await AdvImagins.deleteImagin(id);
  res.send(204);
};

module.exports = { createImagin, get, getAll, deleteImagin };
