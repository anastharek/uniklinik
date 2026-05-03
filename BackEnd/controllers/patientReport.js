const { OTJSBadRequestException } = require("../Exceptions/OTJSErrors");
const PatientReports = require("../model/PatientReport");
const emailManager=require('../utils/mailer');
const SyncReport=require('../model/sync');
const { reverseProxyGetStudy } = require("./reverseProxy");
const GenerateSeries = require("../utils/generateAISeries");
const Queue = require("../adapter/bullAdapter");
const { sendNotification, emitEvent } = require("../socket/socketServer");
const seriesCreatationTask={};
const getAdminReport = async function (req, res) {
  const { studyid } = req.body;
  let data = await PatientReports.getAdminReport(studyid);
  if (data == null) {
    return res.status(404).json({ msg: "study not availabel" });
  }
  return res.send(data);
};

const getDoctorsReport = async function (req, res) {
  let data = await PatientReports.getDoctorReport(req, req.roles.username);
  res.send(data);
};

const getAllDoctorsReport = async function (req, res) {
  let data = await PatientReports.getAllDoctorsReport(req);
  res.send(data);
};

const getPreviosReport=async function(req,res){
  let {patient_id}=req.params;
  let data=await PatientReports.getPreviousReport(patient_id)
  return res.send(data)
}

const deleteDoctorReport = async function (req, res) {
  const { id } = req.body;
  await PatientReports.removeDoctor(req, id, req.roles.username);
  res.send(204);
};

const deleteDoctorbyName = async function (req, res) {
  const { name, id } = req.body;
  await PatientReports.removeDoctor(req, id, name);
  res.send(204);
};

const searchData = async function (req, res) {
  const { data } = req.body;
  let result = await PatientReports.searchData(data);
  return res.send(result);
};

const searchDataDoctor = async function (req, res) {
  const { data } = req.body;
  let result = await PatientReports.searchDataDoctor(
    req,
    data,
    req.roles.username
  );
  return res.send(result);
};

const searchPatientReport = async function (req, res) {
  const { data } = req.body;
  let result = await PatientReports.searchPatientReport(
    data,
    req.username
  );
  return res.send(result);
};

const getPatientReport = async function (req, res) {
  const { studyid, preview } = req.body;
  let data = await PatientReports.getPatientReport(req, studyid, preview);
  if (data == null) {
    return res.status(404).json({ msg: "study not availabel" });
  }
  return res.send(data);
};

const isreportFinalize = async function (req, res) {
  const { studyid } = req.params;
  let data = await PatientReports.isreportFinalize(studyid);
  return res.send(data);
};

const updateDoctor = async function (req, res) {
  const { id, name, status } = req.body;
  await PatientReports.updateDoctor(req, req.roles.username, id, name, status);
  res.send(200);
};
const updateLabels = async function (req, res) {
  const { id,labels} = req.body;
  await PatientReports.updateLabels(id, labels);
  res.send(200);
};

const createDraftReport = async function (req, res) {
  const {
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
    logo,
  } = req.body;
  let keys = [
    "patient_name",
    "patient_id",
    "study_type",
    "studyid",
    "tag",
    "text",
    "study_date",
  ];
  for (let i = 0; i < keys.length; i++) {
    if (req.body[keys[i]] == undefined) {
      throw new OTJSBadRequestException(`${keys[i]} is required !!`);
    }
  }
  await PatientReports.createDraft(
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
    logo,
  );
  emailManager.finalize_addendum_report_email(req.roles.username,patient_name,study_type,study_date,'draft')
  return res.send(201);
};

const createFinalReport = async function (req, res) {
  const {
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
    labels,
  } = req.body;
  let keys = [
    "patient_name",
    "patient_id",
    "study_type",
    "studyid",
    "tag",
    "text",
    "study_date",
  ];
  for (let i = 0; i < keys.length; i++) {
    if (req.body[keys[i]] == undefined) {
      throw new OTJSBadRequestException(`${keys[i]} is required !!`);
    }
  }
  await PatientReports.createFinal(
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
    labels,
  );
  emailManager.finalize_addendum_report_email(req.roles.username,patient_name,study_type,study_date,'finalize')
  return res.send(201);
};

const DeleteReport = async function (req, res) {
  const { studyid } = req.body;
  await PatientReports.deleteAll(studyid, req);
  return res.send(204);
};

const assignDoctor = async function (req, res) {
  const {
    study_id,
    patient_name,
    patient_id,
    accesor,
    study_type,
    study_date,
    doctors,
    StudyInstanceUID,
  } = req.body;
  await PatientReports.assignDoctor(
    req,
    req.roles.username,
    study_id,
    patient_name,
    patient_id,
    accesor,
    study_type,
    study_date,
    doctors,
    StudyInstanceUID
  );
  res.send(200);
};
const assigByRoles = async function (req, res) {
  const {
    study_id,
    patient_name,
    patient_id,
    accesor,
    study_type,
    study_date,
    roles,
    StudyInstanceUID,
  } = req.body;
  await PatientReports.assigByRoles(
    study_id,
    patient_name,
    patient_id,
    accesor,
    study_type,
    study_date,
    roles,
    StudyInstanceUID
  );
  res.send(200);
};

const checkFinalizeByIDs = async function (req, res) {
  const { ids } = req.body;
  let data = await PatientReports.checkFinalizeByIDs(ids);
  res.send(data);
};

const syncSingleStudy=async function(req,res){
  const {old_id,new_id}=req.body;
  reverseProxyGetStudy(new_id)
  .then(res=>{
    res=JSON.parse(res)
    let StudyInstanceUID=res.MainDicomTags.StudyInstanceUID;
    let InstitutionName=res.MainDicomTags.InstitutionName;
    SyncReport.sync(old_id,new_id,StudyInstanceUID,InstitutionName)
  })
  res.send(200)
}

const syncBulkStudy=async function(req,res){
  const {old_data,new_ids}=req.body;
  let prevMapper={};
  let newMapper={};
  let StudyInstanceUIDMapper={};
  let InstitutionNameMapper={}
  old_data.map((obj)=>{
    prevMapper[obj.MainDicomTags.StudyTime]=obj.ID;
  })
  let newData=await Promise.all(new_ids.map((id)=>reverseProxyGetStudy(id)));
  newData.map((obj)=>{
    obj=JSON.parse(obj);
    newMapper[obj.MainDicomTags.StudyTime]=obj.ID
    StudyInstanceUIDMapper[obj.MainDicomTags.StudyTime]=obj.MainDicomTags.StudyInstanceUID;
    InstitutionNameMapper[obj.MainDicomTags.StudyTime]=obj.MainDicomTags.InstitutionName;
  });

  Object.keys(prevMapper).map((key)=>{
    SyncReport.sync(
      prevMapper[key],
      newMapper[key],
      StudyInstanceUIDMapper[key],
      InstitutionNameMapper[key]
      )
  })
  
 
  res.send(200)
}

const generateAiSeries = (req, res) => {
  try{
  const { url, series, studyID,name,SeriesDescription,modality } = req.body;
  if(seriesCreatationTask[`${series}-${studyID}`]){
    return res.status(400).send('Job already running');
  }
  sendNotification(req.username, `Job started`, 'success');
  const queue = new Queue(`generate-series-${series}-${studyID}`, async (job, done) => {
    try {
      await GenerateSeries(req.cookies, url, series, studyID,name,SeriesDescription,modality);
      done();
    } catch (err) {
      done(new Error(err.message || 'Unknown error occurred'));
    }
  });
  queue.addJob();
  seriesCreatationTask[`${series}-${studyID}`] = queue;
  queue.on('completed', () => {
    delete seriesCreatationTask[`${series}-${studyID}`];
    if(sendNotification){
      sendNotification(req.username, `AI Series for study ID ${studyID} has been created successfully`, 'success',`${series}-${studyID}`);
    }
    if(emitEvent){
      setTimeout(()=>emitEvent(req.username,`${series}-${studyID}`),1000)
    }
  });

  // Handle job failure
  queue.on('failed', (error) => {
    console.log({error});
    delete seriesCreatationTask[`${series}-${studyID}`];
    if(sendNotification){
      sendNotification(req.username, `AI Series for study ID ${studyID} failed: ${error.message}`, 'error',`${series}-${studyID}`);
    }
    if(emitEvent){
      setTimeout(()=>emitEvent(req.username,`${series}-${studyID}`),1000)
    }
    //sendNotification(req.username, `AI Series for study ID ${studyID} failed: ${error.message}`, 'error');
  });
  return res.send('Job added');
  }catch(err){
    console.log(err)
    return res.status(500).send(err.message)
  }
};

const aiseriesCreated = (req, res) => {
  const { seriesid, studyid } = req.params;
  if(seriesCreatationTask[`${studyid}-${seriesid}`]){
    return res.send(false);
  } else {
    return res.send(true);
  }
};



module.exports = {
  getAdminReport,
  getPatientReport,
  createDraftReport,
  createFinalReport,
  DeleteReport,
  isreportFinalize,
  getDoctorsReport,
  deleteDoctorReport,
  getAllDoctorsReport,
  deleteDoctorbyName,
  searchData,
  searchDataDoctor,
  updateDoctor,
  assignDoctor,
  assigByRoles,
  checkFinalizeByIDs,
  getPreviosReport,
  syncSingleStudy,
  syncBulkStudy,
  updateLabels,
  generateAiSeries,
  aiseriesCreated,
  searchPatientReport
};
