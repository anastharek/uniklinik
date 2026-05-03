const Sync=require('../repository/sync');

const sync=(old_orthancId,new_orthancId,StudyInstanceUID,InstitutionName)=>{
    Sync.sync(old_orthancId,new_orthancId,StudyInstanceUID,InstitutionName)
}

module.exports={sync}