const db = require("../database/models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const { OTJSBadRequestException } = require("../Exceptions/OTJSErrors");
const moment=require('moment');

const GetPatientById=async(id)=>{
    return await db.Patient.findOne({
        where: {patient_id:id},
    });
}

const GetPatientByName=async(name)=>{
    return await db.Patient.findAll({
        where: {name:{[Op.iLike]:`%${name}%`}},
    });
}

const CreateorUpdatePatients=async(data)=>{
    const {name,gender,dob,age,patient_id,nric,phone,allergic,asthma}=data;
    
    let patient = await db.Patient.findOne({
        where: { patient_id:patient_id },
    });

    if(!patient){
        return db.Patient.create({
            name,gender,
            dob,
            age,
            patient_id,
            nric,
            phone,
            allergic,
            asthma
           })
    }

    return patient.update({name,
        gender,
        dob,
        age,
        patient_id,
        nric,
        phone,
        allergic,
        asthma,
    })
    
    
    

}

const GetAppointment=async(query)=>{
    let queryData={}
    let includeData={where:{}}
    let d=['modality_type','status']
    
    d.map(key=>{if(query?.[key])queryData[key]=query[key]})
    if(query.name)includeData['where']['name']= {[Op.iLike]: `%${query.name}%`};
    if(query.patient_id)includeData['where']['patient_id']= query.patient_id;
    if(query.appointment_datetime){
        let start=moment(query.appointment_datetime)
        let end=moment(query.appointment_datetime).add('hours',24)
        queryData['appointment_datetime']={[Op.between]:[start,end]}
    }
    return await db.Appointment.findAll({
        where:queryData,
        order: [["appointment_datetime", "ASC"]],
        include: [
            {
                model:db.Patient,
                ...includeData,
            },
        ]
    })
}

const CreateAppointment=async(data)=>{
    const {
        appointment_datetime,
        patient_id,
        request_department,
        ref_physician,
        modality_type,
        scan_region,
        creatinine,
        patient_type,
        clinical_summary,
        institution_name,
    }=data;
    let appointment=await db.Appointment.findOne({where:{appointment_datetime}})
    if(appointment){
        throw new OTJSBadRequestException(
            "This slot not available currently !!"
          );
    }
    return db.Appointment.create({
        appointment_datetime,
        patient_id,
        request_department,
        ref_physician,
        modality_type,
        scan_region,
        creatinine,
        patient_type,
        clinical_summary,
        accesion_number:moment().format('YYYYMMDDHHmmssSS'),
        institution_name,
    })
}

// const UpdatePatient=async(patient_data)=>{
//     const {name,gender,dob,age,patient_id,nric,phone,allergic,asthma}=patient_data;
//     let patient = await db.Patient.findOne({
//         where: { patient_id:patient_id },
//     });
//     if(!patient){
//         throw new OTJSBadRequestException(
//             "User not found !"
//           );
//     }

// }

const UpdateAppointment=async(data)=>{
    let {
        id,
        appointment_datetime,
        patient_id,
        request_department,
        ref_physician,
        modality_type,
        status,
        Patient,
        creatinine,
        patient_type,
        clinical_summary,
        institution_name,
    }=data;
    
    let appointment=await db.Appointment.findOne({where:{id}})
    if(!appointment){
        throw new OTJSBadRequestException(
            "Appointment not found !!"
          );
    }
    if(Patient){
        await CreateorUpdatePatients(Patient)
    }
    return appointment.update({
        appointment_datetime,
        patient_id,
        request_department,
        ref_physician,
        modality_type,
        status,
        creatinine,
        patient_type,
        clinical_summary,
        institution_name,
    })
}

module.exports={
    GetPatientById,
    GetPatientByName,
    CreateorUpdatePatients,
    GetAppointment,
    CreateAppointment,
    UpdateAppointment,
}