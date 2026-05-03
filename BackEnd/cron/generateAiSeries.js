const db=require('../database/models');
const moment=require('moment-timezone');
const axios=require('axios');
const Users=require("../model/Users");
const jwt=require('jsonwebtoken');
const GenerateSeries=require('../utils/generateAISeries');


const generateAiSeries=async()=>{
    let allConf=await db.AiAutorouter.findAll({
        raw:true
    });
    const userObject = new Users("admin");
    let infosUser = await userObject.getUserRight();
    let user = await userObject._getUserEntity();
    let TOKEN = jwt.sign( {
            id: user.id,
            username: "admin",
            name: infosUser.name,
            firstname:(user.firstname ? user.firstname : "") +" " +(user.lastname ? user.lastname : ""),
            practicing_no: user?.practicing_no,
            department: user.department,
          },
           process.env.TOKEN_SECRET, {
            expiresIn: "5h",
        });
    let headers={
        "Content-Type":"application/json",
        "systemtoken":TOKEN
    }
    let dateStr=moment.utc().format('YYYYMMDD');
    for(let conf of allConf){
        let payload={
            Level:"Instance",
            CaseSensitive: false,
            Expand: true,
            Query:{
            "0008103e":conf.series_description,
            "00080060":conf.modality,
            "00080020":dateStr //StudyDate
            }
        };
        let res=await axios.post('http://localhost:4000/api/tools/find',payload,{headers}) //(await fetch('http://host.docker.internal/api/tools/find',getContentOption )).json()
        let filteredInstance=[];
        let parentIDs=[];
        let todaysRecord=await db.AiSeriesRecord.findAll({
            where:{
                createdAt:{
                    [db.Sequelize.Op.gte]:moment.utc().startOf('day').toDate()
                }
            },
            raw:true
        });
        let todaysIDs=todaysRecord.map((record)=>record.series_id);
        for(let instance of res.data){
            if(!todaysIDs.includes(instance.ParentSeries)){
                if(!parentIDs.includes(instance.ParentSeries)){
                    parentIDs.push(instance.ParentSeries);
                    filteredInstance.push(instance);
                }
            }
        }
        for(let instance of filteredInstance){
            let seriesID=instance.ParentSeries;
            let series=await axios.get(`http://localhost:4000/api/series/${seriesID}`,{headers});
            series=series.data;
            try{
            await GenerateSeries({tokenOrthancJs:TOKEN},conf.link,[series.ID],series.ParentStudy,conf.name,conf.series_description,conf.modality);
            await db.AiSeriesRecord.create({
                series_id:seriesID,
                instance_id:instance.ID,
                status:"completed"
            });
            }catch(e){
                console.log(e);
            }
        }
    }
}

const deleteAiSeriesRecord=async()=>{
    let date=moment.utc().subtract(2,'months').toDate();
    await db.AiSeriesRecord.destroy({
        where:{
            createdAt:{
                [db.Sequelize.Op.lte]:date
            }
        }
    });
}


module.exports={generateAiSeries,deleteAiSeriesRecord}