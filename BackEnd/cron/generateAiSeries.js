const db=require('../database/models');
const moment=require('moment-timezone');
const axios=require('axios');
const Users=require("../model/Users");
const jwt=require('jsonwebtoken');
const GenerateSeries=require('../utils/generateAISeries');

const getAuth=async()=>{
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
    return {
        headers:{
            "Content-Type":"application/json",
            "systemtoken":TOKEN
        },
        TOKEN
    }
}

/**
 * Orthanc /tools/find paginates at 100 results.
 * Fetch ALL matching instances by walking "Since" pages.
 */
const findAllInstances=async(query,headers)=>{
    const PAGE=100;
    let all=[];
    let since=0;
    while(true){
        let payload={
            Level:"Instance",
            CaseSensitive:false,
            Expand:true,
            Since:since,
            Limit:PAGE,
            Query:query
        };
        let res=await axios.post('http://localhost:4000/api/tools/find',payload,{headers});
        let batch=res.data||[];
        all=all.concat(batch);
        if(batch.length<PAGE) break;
        since+=PAGE;
    }
    return all;
}

/**
 * Find all matching series regardless of StudyDate.
 * Used by the daily full scan.
 */
const findAllSeries=async(query,headers)=>{
    const PAGE=100;
    let all=[];
    let since=0;
    while(true){
        let payload={
            Level:"Series",
            CaseSensitive:false,
            Expand:true,
            Since:since,
            Limit:PAGE,
            Query:query
        };
        let res=await axios.post('http://localhost:4000/api/tools/find',payload,{headers});
        let batch=res.data||[];
        all=all.concat(batch);
        if(batch.length<PAGE) break;
        since+=PAGE;
    }
    // pick one instance per series for record-keeping
    return all.map(s=>{
        let inst=(s.Instances||[])[0];
        return {
            seriesID:s.ID,
            instanceID:inst,
            parentStudy:s.ParentStudy,
            series:s
        };
    });
};

/** All-time dedup set of series_id with a COMPLETED record */
const getCompletedSeriesIds=async()=>{
    let records=await db.AiSeriesRecord.findAll({raw:true,attributes:['series_id'],where:{status:"completed"}});
    return new Set(records.map(r=>r.series_id));
};

/** Today (MYT) dedup set - any record (completed or failed) */
const getTodayRecordedSeriesIds=async()=>{
    let records=await db.AiSeriesRecord.findAll({
        where:{
            createdAt:{
                [db.Sequelize.Op.gte]:moment.tz('Asia/Kuala_Lumpur').startOf('day').toDate()
            }
        },
        raw:true,
        attributes:['series_id']
    });
    return new Set(records.map(r=>r.series_id));
};

const processSeries=async(conf,entry,auth)=>{
    let seriesID=entry.seriesID;
    let series;
    try{
        series=await axios.get(`http://localhost:4000/api/series/${seriesID}`,{headers:auth.headers});
        series=series.data;
    }catch(e){
        console.log(`[generateAISeries] cannot fetch series ${seriesID}: ${e.message}`);
        return;
    }
    // The AiSeriesRecord.instance_id column is NOT NULL. The incremental
    // scan used to pass null here, which made BOTH the completed AND the
    // failed record fail to insert -> the series was never marked done ->
    // it was reprocessed every 2 minutes -> a flood of duplicate AI series.
    // Derive a real instance ID from the series payload whenever the caller
    // didn't provide one (a series always has at least one instance).
    const instanceID = entry.instanceID || (series.Instances && series.Instances[0]) || null;
    if (!instanceID) {
        console.log(`[generateAISeries] WARN series ${seriesID} has no instances, skipping record`);
    }

    // RULE: only ONE AI series per study. Check whether an AI output series
    // (description contains "(AI ") already exists for this parent study.
    // If yes, skip generation entirely and just mark the input series done,
    // so a reprocessed input can never create a second AI output again.
    try {
        // Orthanc /tools/find does NOT accept the internal ParentStudy key in
        // this build ("Unknown DICOM tag") -> resolve StudyInstanceUID first.
        const studyRes = await axios.get(`http://localhost:4000/api/studies/${series.ParentStudy}`, { headers: auth.headers });
        const studyUID = (studyRes.data && studyRes.data.MainDicomTags && studyRes.data.MainDicomTags.StudyInstanceUID) || null;
        if (studyUID) {
            const existing = await axios.post(`http://localhost:4000/api/tools/find`, {
                Level: "Series",
                Query: { StudyInstanceUID: studyUID, SeriesDescription: "* (AI *" },
                Short: true,
                Limit: 1
            }, { headers: auth.headers });
            if (existing.data && existing.data.length > 0) {
                if (instanceID) {
                    await db.AiSeriesRecord.create({
                        series_id: seriesID,
                        instance_id: instanceID,
                        status: "completed"
                    });
                }
                console.log(`[generateAISeries] AI series already exists for study ${series.ParentStudy}, skipped ${seriesID}`);
                return;
            }
        }
    } catch (dedupErr) {
        console.log(`[generateAISeries] WARN dedup check failed for ${seriesID}: ${dedupErr.message}`);
    }

    try{
        await GenerateSeries({tokenOrthancJs:auth.TOKEN},conf.link,[series.ID],series.ParentStudy,conf.name,conf.series_description,conf.modality);
        if (instanceID) {
            await db.AiSeriesRecord.create({
                series_id:seriesID,
                instance_id:instanceID,
                status:"completed"
            });
        }
        console.log(`[generateAISeries] processed series ${seriesID} (${conf.series_description}/${conf.modality})`);
    }catch(e){
        // record failures too, so the daily full scan retries them but the
        // 2-min incremental scan doesn't hammer failing series forever
        if (instanceID) {
            await db.AiSeriesRecord.create({
                series_id:seriesID,
                instance_id:instanceID,
                status:"failed"
            }).catch(err=>console.log(`[generateAISeries] WARN failed to record failure for ${seriesID}: ${err.message}`));
        }
        console.log(`[generateAISeries] FAILED series ${seriesID}: ${e.message}`);
    }
};

/**
 * Incremental scan (every 2 min): only today's studies (StudyDate = today MYT).
 */
const generateAiSeries=async()=>{
    let allConf=await db.AiAutorouter.findAll({raw:true});
    if(!allConf.length) return;
    const auth=await getAuth();
    let dateStr=moment.tz('Asia/Kuala_Lumpur').format('YYYYMMDD');
    let todaysIDs=await getTodayRecordedSeriesIds();
    for(let conf of allConf){
        let query={
            "0008103e":conf.series_description,
            "00080060":conf.modality,
            "00080020":dateStr //StudyDate = today
        };
        let instances=await findAllInstances(query,auth.headers);
        let parentIDs=[];
        // map seriesID -> first instance ID so processSeries can record
        // a valid instance_id (NOT NULL column; null previously caused
        // every record insert to fail -> infinite reprocessing flood)
        let instanceBySeries={};
        for(let instance of instances){
            if(todaysIDs.has(instance.ParentSeries)) continue;
            if(!parentIDs.includes(instance.ParentSeries)){
                parentIDs.push(instance.ParentSeries);
                instanceBySeries[instance.ParentSeries]=instance.ID;
            }
        }
        for(let seriesID of parentIDs){
            if(todaysIDs.has(seriesID)) continue;
            await processSeries(conf,{seriesID,instanceID:instanceBySeries[seriesID]||null,parentStudy:null},auth);
            todaysIDs.add(seriesID);
        }
    }
}

/**
 * Full scan (daily at 02:00 MYT): scan the WHOLE archive for matching
 * series regardless of StudyDate. Skips anything with a COMPLETED record
 * (no duplication); retries new or previously-failed series.
 */
const generateAiSeriesFull=async()=>{
    let allConf=await db.AiAutorouter.findAll({raw:true});
    if(!allConf.length) return;
    const auth=await getAuth();
    let completed=await getCompletedSeriesIds();
    for(let conf of allConf){
        let query={
            "0008103e":conf.series_description,
            "00080060":conf.modality
        };
        let entries=await findAllSeries(query,auth.headers);
        let pending=entries.filter(e=>!completed.has(e.seriesID));
        console.log(`[generateAISeries:full] ${conf.series_description}/${conf.modality}: found ${entries.length} series, ${pending.length} pending (new or previously failed)`);
        for(let entry of pending){
            await processSeries(conf,entry,auth);
            completed.add(entry.seriesID);
        }
    }
}

const deleteAiSeriesRecord=async()=>{
    let date=moment.tz('Asia/Kuala_Lumpur').subtract(2,'months').toDate();
    await db.AiSeriesRecord.destroy({
        where:{
            createdAt:{
                [db.Sequelize.Op.lte]:date
            }
        }
    });
}


module.exports={generateAiSeries,generateAiSeriesFull,deleteAiSeriesRecord}
