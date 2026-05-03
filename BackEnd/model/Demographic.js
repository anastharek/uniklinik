const DemographicRepo=require('../repository/Demographic');

const GetPatientById=(id)=>{
    return DemographicRepo.GetPatientById(id);
}
const GetPatientByName=(name)=>{
    return DemographicRepo.GetPatientByName(name);
}

const CreateorUpdatePatients=(data)=>{
    return DemographicRepo.CreateorUpdatePatients(data);
}

const GetAppointment=(query)=>{
    return DemographicRepo.GetAppointment(query)
}

const CreateAppointment=(data)=>{
    return DemographicRepo.CreateAppointment(data)
}

const UpdateAppointment=(data)=>{
    return DemographicRepo.UpdateAppointment(data)
}

module.exports={
    GetPatientById,
    GetPatientByName,
    CreateorUpdatePatients,
    GetAppointment,
    CreateAppointment,
    UpdateAppointment,
}