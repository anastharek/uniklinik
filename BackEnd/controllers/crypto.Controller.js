const EncryptionService=require('../utils/Encryption')
const moment=require('moment')

const generateKey=(req,res)=>{
    const {id,type,duration}=req.body;
    try{
        let str=EncryptionService.encryptId(id,type,duration);
        return res.json({data:str})
    }catch(e){
        return res.status(400).json({msg:"failed to generate key",error:e})
    }
}

const decryptKey=(req,res)=>{
    const {key}=req.body;
    try{
        let obj=EncryptionService.decryptData(key);
        if(obj.e){
            if(moment()>moment.unix(obj.e)){
                return  res.status(400).json({msg:"link is expired"})
            }
            return res.send(obj.i)
        }
        return res.status(400).json({msg:"invalid link",})   
    }catch(e){
        return res.status(400).json({msg:"failed to generate key",error:e})   
    }

}

module.exports={
    generateKey,
    decryptKey,
}