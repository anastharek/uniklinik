const db = require("../database/models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
class RequestFeatureRepo{
    static async getRequestFeature(id){
        let data = await db.RequestFeature.findOne({
            where: { study_id: id },
            order: [ [ 'createdAt', 'DESC' ]],
          });
        return data;
    }
    static async deleteRequestFeature(id){
        let data = await db.RequestFeature.findOne({
            where: { id: id },
          });
        if(data){
            return await data.destroy();
        }
        return;
    }
    
    static async getRequestFeatureList(username){

        let data = [];
        try{
        if(username!=='admin'){
            data=await db.RequestFeature.findAll({
                where: {
                    radiologist : { [Op.iLike]: `%(${username})%` }, 
                }
            });
        }else{
          data=await db.RequestFeature.findAll({});
        }
        }catch(err){
            console.log(err)
        }
        return data;
    }
    
    static async CreateRequestFeature(
        username,
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
    ){
    
        // let data=await db.RequestFeature.findOne({
        //     where: { study_id: study_id },
        //   });
        // if(data){
        //     if(patient_id)data.patient_id=patient_id;
        //     if(patient_name)data.patient_name=patient_name;
        //     if(study_type)data.study_type=study_type;
        //     if(study_date)data.study_date=study_date;
        //     if(hospital)data.hospital=hospital;
        //     if(radiologist)data.radiologist=radiologist;
        //     if(request_type)data.request_type=request_type;
        //     if(indication)data.indication=indication;
        //     if(metadata)data.metadata=metadata
        //     if(username)data.requested_by=username;
        //     await data.save()
        //     return;
        // }else{
        await  db.RequestFeature.create({
            requested_by:username,
            patient_id:patient_id,
            patient_name:patient_name,
            study_type:study_type,
            study_date:study_date,
            study_id:study_id,
            hospital:hospital,
            radiologist:radiologist,
            request_type:request_type,
            indication:indication,
            metadata:metadata,
        });
        return;
        //}

    }
}

module.exports=RequestFeatureRepo;