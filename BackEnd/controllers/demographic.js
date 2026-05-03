const DemographicModal=require('../model/Demographic');

const register=async(req,res)=>{
let patient=await DemographicModal.CreateorUpdatePatients(req.body)
req.body.patient_id=patient.id;
let appointment=await DemographicModal.CreateAppointment(req.body);
return res.status(201).json({
    patient,
    appointment,
})
}

const getPatient=async(req,res)=>{
    let {id}=req.params;
    let patient=await DemographicModal.GetPatientById(id);
    return res.status(200).json({patient})
}
const getPatientByName=async(req,res)=>{
    let {name}=req.params;
    let patient=await DemographicModal.GetPatientByName(name);
    return res.status(200).json({patient})
}

const getAppointment=async(req,res)=>{
    let appointment=await DemographicModal.GetAppointment(req.query);
    return res.status(200).json({appointment})
}

const updataAppointment=async(req,res)=>{
    let appointment=await DemographicModal.UpdateAppointment(req.body);
    return res.status(200).json({appointment})
}
module.exports={register,getPatient,getPatientByName,getAppointment,updataAppointment}