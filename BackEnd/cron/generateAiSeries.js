const db=require('../database/models');
const moment=require('moment-timezone');
const axios=require('axios');
const Users=require("../model/Users");
const jwt=require('jsonwebtoken');
const GenerateSeries=require('../utils/generateAISeries');

// Overlap guard (2026-08-12): the 2-min incremental cron is NOT awaited by
// node-cron, so a run that takes longer than 2 minutes overlaps the next
// tick — two runs then pass the dedup check at the same time and BOTH
// generate an AI series for the same source -> duplicates. A module-level
// flag makes overlapping ticks no-ops.
let aiRunInProgress = false;
let aiFullRunInProgress = false;

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

/**
 * Count images in the AI output series for this study+type, or null if none.
 * (2026-08-11: AI output validation — the AI app returns 2 images per source
 * frame; a suspiciously small count means the run failed.)
 */
const getAiOutputCount=async(auth,studyUID,desc)=>{
    if(!studyUID) return null;
    try{
        const res=await axios.post('http://localhost:4000/api/tools/find',{
            Level:"Series",
            Query:{StudyInstanceUID:studyUID,SeriesDescription:`${desc} (AI *`},
            Expand:true
        },{headers:auth.headers});
        const arr=res.data||[];
        if(!arr.length) return null;
        return arr.reduce((n,s)=>n+(Array.isArray(s.Instances)?s.Instances.length:0),0);
    }catch(e){
        return null;
    }
};

/** Delete the AI output series for this study+type (bad-output cleanup). */
const deleteAiOutput=async(auth,studyUID,desc)=>{
    if(!studyUID) return;
    try{
        const res=await axios.post('http://localhost:4000/api/tools/find',{
            Level:"Series",
            Query:{StudyInstanceUID:studyUID,SeriesDescription:`${desc} (AI *`},
            Short:true
        },{headers:auth.headers});
        for(const id of (res.data||[])){
            await axios.delete(`http://localhost:4000/api/series/${id}`,{headers:auth.headers});
            console.log(`[generateAISeries] deleted bad AI output series ${id} (${desc})`);
        }
    }catch(e){
        console.log(`[generateAISeries] WARN failed to delete bad AI output for ${desc}: ${e.message}`);
    }
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

    // RULE: only ONE AI series per TYPE per study (e.g. one "sb1000 (AI ...)",
    // one "swi mip (AI ...)"). Check whether an AI output series with the SAME
    // series_description already exists for this parent study. If yes, skip
    // generation entirely and just mark the input series done, so a reprocessed
    // input can never create a second AI output again. Matching is scoped to
    // conf.series_description so adding a NEW rule (e.g. "swi mip") is NOT
    // blocked by an existing different AI series (e.g. "sb1000").
    // studyUID is hoisted so the output-validation step below can reuse it.
    let studyUID = null;
    try {
        // Orthanc /tools/find does NOT accept the internal ParentStudy key in
        // this build ("Unknown DICOM tag") -> resolve StudyInstanceUID first.
        const studyRes = await axios.get(`http://localhost:4000/api/studies/${series.ParentStudy}`, { headers: auth.headers });
        studyUID = (studyRes.data && studyRes.data.MainDicomTags && studyRes.data.MainDicomTags.StudyInstanceUID) || null;
        if (studyUID) {
            let existing = null;
            try {
                // Match ANY AI-output suffix — "(AI …" AND "(PUTRA LVO
                // DETECTION …" — so the two naming styles can't both be
                // generated for the same (study, type).
                existing = await axios.post(`http://localhost:4000/api/tools/find`, {
                    Level: "Series",
                    Query: { StudyInstanceUID: studyUID, SeriesDescription: `${conf.series_description} (*` },
                    Short: true,
                    Limit: 1
                }, { headers: auth.headers });
            } catch (findErr) {
                // FAIL-SAFE (2026-08-12): if the dedup lookup itself errors,
                // do NOT generate. Falling through here is what created the
                // duplicate AI series (8x thumble in one study) — the 02:00
                // full scan retries anything skipped.
                console.log(`[generateAISeries] WARN dedup find failed for ${seriesID}: ${findErr.message} — skipping to avoid duplicate`);
                return;
            }
            if (existing.data && existing.data.length > 0) {
                // AI series already exists -> mark the source done and skip.
                // findOrCreate (not create): series_id is UNIQUE in the DB
                // (unique_series_id) even though the model doesn't declare it;
                // a bare create on the second call throws "Validation error",
                // which the old catch swallowed as "dedup check failed" and
                // then fell through to generate a duplicate.
                if (instanceID) {
                    await db.AiSeriesRecord.findOrCreate({
                        where: { series_id: seriesID },
                        defaults: { instance_id: instanceID, status: "completed" }
                    });
                }
                console.log(`[generateAISeries] AI series already exists for study ${series.ParentStudy}, skipped ${seriesID}`);
                return;
            }
        }
    } catch (dedupErr) {
        // FAIL-SAFE: never fall through to generation when dedup is uncertain
        console.log(`[generateAISeries] WARN dedup check failed for ${seriesID}: ${dedupErr.message} — skipping to avoid duplicate`);
        return;
    }

    try{
        await GenerateSeries({tokenOrthancJs:auth.TOKEN},conf.link,[series.ID],series.ParentStudy,conf.name,conf.series_description,conf.modality);

        // ================================================================
        // AI OUTPUT VALIDATION (2026-08-11)
        // The AI app returns 2 images per source frame (_processed +
        // _summary). Intermittently it returns only ONE frame's output
        // (e.g. 2 images from a 58-frame source — seen 11-Aug 20:12 and
        // 10-Aug 23:12). A suspiciously small output is a failed run:
        // delete the bad AI series (so the dedup rule above can't block a
        // retry forever) and record "failed" (02:00 full scan retries it).
        // SKIPPED for the LVO detection app (2026-08-12): it legitimately
        // returns few detection images per series, not 2 per source frame,
        // so the "too small" rule would delete valid outputs. The
        // "no output at all" check below still applies to everything.
        // ================================================================
        const strictOutputCheck = !conf.link.includes('lvo-detection');
        const srcCount = Array.isArray(series.Instances) ? series.Instances.length : 0;
        const outCount = await getAiOutputCount(auth, studyUID, conf.series_description);
        if (studyUID && outCount === null) {
            throw new Error(`AI output series not found after generation (${conf.series_description})`);
        }
        if (strictOutputCheck && studyUID && srcCount > 0 && outCount < srcCount) {
            console.log(`[generateAISeries] ALERT ${conf.series_description} AI output suspicious: ${outCount} images from ${srcCount} source frames (expected ~${srcCount * 2}) — deleting bad AI series, will retry`);
            await deleteAiOutput(auth, studyUID, conf.series_description);
            throw new Error(`AI output too small (${outCount} < ${srcCount} source frames)`);
        }

        if (instanceID) {
            await db.AiSeriesRecord.findOrCreate({
                where: { series_id: seriesID },
                defaults: { instance_id: instanceID, status: "completed" }
            });
        }
        console.log(`[generateAISeries] processed series ${seriesID} (${conf.series_description}/${conf.modality}) — AI output ${outCount} images from ${srcCount} source frames`);
    }catch(e){
        // record failures too, so the daily full scan retries them but the
        // 2-min incremental scan doesn't hammer failing series forever
        if (instanceID) {
            await db.AiSeriesRecord.findOrCreate({
                where: { series_id: seriesID },
                defaults: { instance_id: instanceID, status: "failed" }
            }).catch(err=>console.log(`[generateAISeries] WARN failed to record failure for ${seriesID}: ${err.message}`));
        }
        console.log(`[generateAISeries] FAILED series ${seriesID}: ${e.message}`);
    }
};

/**
 * Incremental scan (every 2 min): only today's studies (StudyDate = today MYT).
 */
const generateAiSeries=async()=>{
    if (aiRunInProgress) {
        console.log('[generateAISeries] previous run still active — skipping this tick (overlap guard)');
        return;
    }
    aiRunInProgress = true;
    try {
    let allConf=await db.AiAutorouter.findAll({raw:true});
    if(!allConf.length) return;
    const auth=await getAuth();
    let dateStr=moment.tz('Asia/Kuala_Lumpur').format('YYYYMMDD');
    let todaysIDs=await getTodayRecordedSeriesIds();
    for(let conf of allConf){
        // One bad lookup (5xx under load) must not abort every other config
        // — catch per config and keep going (2026-08-11).
        try{
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
        }catch(confErr){
            console.log(`[generateAISeries] ERROR config ${conf.series_description}/${conf.modality}: ${confErr.message}`);
        }
    }
    } finally {
        aiRunInProgress = false;
    }
}

/**
 * Full scan (daily at 02:00 MYT): scan the WHOLE archive for matching
 * series regardless of StudyDate. Skips anything with a COMPLETED record
 * (no duplication); retries new or previously-failed series.
 */
const generateAiSeriesFull=async()=>{
    if (aiFullRunInProgress) {
        console.log('[generateAISeries:full] previous run still active — skipping this tick (overlap guard)');
        return;
    }
    aiFullRunInProgress = true;
    try {
    let allConf=await db.AiAutorouter.findAll({raw:true});
    if(!allConf.length) return;
    const auth=await getAuth();
    let completed=await getCompletedSeriesIds();
    for(let conf of allConf){
        try{
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
        }catch(confErr){
            console.log(`[generateAISeries:full] ERROR config ${conf.series_description}/${conf.modality}: ${confErr.message}`);
        }
    }
    } finally {
        aiFullRunInProgress = false;
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
