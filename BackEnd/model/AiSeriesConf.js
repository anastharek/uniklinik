const AiSeriesConfRepository=require('../repository/AiSeriesConf');

class AiSeriesConfModal{
    static save(name,url){
        return AiSeriesConfRepository.save(name,url);
    }
    static get(){
        return AiSeriesConfRepository.get();
    }
    static update(id,name,url){
        return AiSeriesConfRepository.update(id,name,url);
    }
    static delete(id){
        return AiSeriesConfRepository.delete(id);
    }
}

module.exports=AiSeriesConfModal;