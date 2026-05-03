
const Cryptr = require('cryptr');
const cryptr = new Cryptr('0oYl<)VxKF"nez@F"d\DGRyIp]^t.w4w>y~4o;f2%bj4E(4#,W',{saltLength:1});
const moment=require('moment');

const encryptId=(id,type='hr',duration=1)=>{
    let exp=moment();
    if(type=='hr')exp.add(duration,'hour')
    else if(type=='day')exp.add(duration,'day')
    else if(type=='month')exp.add(duration,'month')
    else if(type=='year')exp.add(duration,'year')   

    let str=JSON.stringify({i:id,e:exp.unix()})
    let en=cryptr.encrypt(str);
    return en;
}

const decryptData=(encryptedString)=>{
    const str = cryptr.decrypt(encryptedString);
    try{
        let data=JSON.parse(str)
        return data;
    }catch{
        return  {};
    }
}

module.exports={
    encryptId,
    decryptData,
}