const RequestFeatureModal = require("../model/RequestFeature");
const UserModal = require("../model/Users");
const mailer=require('../utils/mailer')
const ReportRepo=require('../repository/PatientReport')

const getRequestFeature = async (req, res) => {
  try {
    const { id } = req.params;
    let data = await RequestFeatureModal.getRequestFeature(id);
    return res.send(data);
  } catch (e) {
    return res.status(500).send(err.toString());
  }
};

const getRequestFeatureList = async (req, res) => {
  try {
    let data = await RequestFeatureModal.getRequestFeatureList(req.username);
    return res.send(data);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
};

const CreateRequestFeature = async (req, res) => {
  try {
    let {
      patient_id,
      patient_name,
      study_type,
      study_date,
      study_id,
      hospital,
      radiologist,
      request_type,
      indication,
      metadata,
    } = req.body;

    study_date=study_date.replaceAll('/','')
    await RequestFeatureModal.CreateRequestFeature(
      req.username,
      patient_id,
      patient_name,
      study_type,
      study_date,
      study_id,
      hospital,
      radiologist,
      request_type,
      indication,
      metadata,
    );
    //let recipient=[]
    // let newData=radiologist?.split(',').filter(text=>!prevRadioLogist.includes(text))||[];
    // if(newData.length){
    //   let usernames=newData.map((text)=>text.split('(')[1].split(')')[0]);
    //   let emails=await new Promise(async(resolve,reject)=>{
    //     let temp=[]
    //     for(let i=0;i<usernames.length;i++){
    //       let username=usernames[i];
    //       let user=await UserModal.getUserbyUsername(username);
    //       temp.push(user.email);
    //     }
    //     resolve(temp);
    //   }); 
    //   recipient=emails;
    // }
    let parseData={}
    try{
      parseData=JSON.parse(metadata)
    }catch{

    }
    ReportRepo.assignDoctor(null,req.roles.username,study_id,patient_name,patient_id,parseData?.MainDicomTags?.AccessionNumber,study_type,study_date,radiologist.split(','),parseData?.MainDicomTags?.StudyInstanceUID)
    // mailer.request_feature_mail(
    //     patient_name,
    //     patient_id,
    //     study_type,
    //     study_date,
    //     hospital,
    //     radiologist,
    //     request_type,
    //     indication,recipient)
    return res.sendStatus(200);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
};

const deleteRequestFeature=async(req,res)=>{
  try {
    const { id } = req.params;
    let data = await RequestFeatureModal.deleteRequestFeature(id);
    return res.send(data);
  } catch (e) {
    return res.status(500).send(e.toString());
  } 
}

module.exports = {
  getRequestFeature,
  getRequestFeatureList,
  CreateRequestFeature,
  deleteRequestFeature,
};
