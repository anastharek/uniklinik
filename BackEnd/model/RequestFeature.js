const RequestFeatureRepo=require('../repository/RequestFeature');

class RequestFeature{
    
    static async getRequestFeature(id){
        return RequestFeatureRepo.getRequestFeature(id);
    }
    static async deleteRequestFeature(id){
        return RequestFeatureRepo.deleteRequestFeature(id);
    }
    
    static async getRequestFeatureList(username){
        return RequestFeatureRepo.getRequestFeatureList(username);
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
        return RequestFeatureRepo.CreateRequestFeature(
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
        )
    }
}
module.exports=RequestFeature;