const db = require("../database/models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const sync=async(old_orthancId,new_orthancId,StudyInstanceUID,InstitutionName)=>{
    let draft= await db.ReportDraft.findOne({
        where: { study_id: old_orthancId },
      });
    if(draft){
        draft.study_id=new_orthancId;
        draft.StudyInstanceUID=StudyInstanceUID;
        draft.InstitutionName=InstitutionName;
        draft.save();
    }
    
    let finalize= await db.ReportFinal.findOne({
        where: { study_id: old_orthancId },
      });
    if(finalize){
        finalize.study_id=new_orthancId;
        finalize.StudyInstanceUID=StudyInstanceUID;
        finalize.InstitutionName=InstitutionName;
        finalize.save();
    }

    let addendum=await db.Addendum.findOne({
        where: { study_id: old_orthancId },
      });
    if(addendum){
        addendum.study_id=new_orthancId;
        addendum.save();
    }

    let advImagin= await db.AdvImagin.findOne({
        where: { study_id: old_orthancId },
      });
    if(advImagin){
        advImagin.study_id=new_orthancId;
        advImagin.save();
    }

    let request_report= await db.RequestReport.findOne({
        where: { study_id: old_orthancId },
      });
    if(advImagin){
        request_report.study_id=new_orthancId;
        request_report.StudyInstanceUID=StudyInstanceUID;
        request_report.save();
    }
}


module.exports={sync}