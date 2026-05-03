const AiAutorouterModel = require("../model/AiAutorouter");

const getAiAutorouter = (req, res) => {
    let limit = req.query.limit || 50;
    let offset = req.query.offset || 0;
    let modality = req.query.modality;
    let series_description = req.query.series_description;
    let query = {};
    if (modality) {
        query["modality"] = modality;
    }
    if (series_description) {
        query["series_description"] = series_description;
    }
    AiAutorouterModel.getAll(query, offset, limit).then((data) => res.send(data));
}

const createAiAutorouter = async (req, res) => {
    const { modality, series_description, link } = req.body;
    await AiAutorouterModel.create(modality, series_description, link);
    return res.sendStatus(201);
}

const updateAiAutorouter = async (req, res) => {
    const { modality, series_description, link } = req.body;
    await AiAutorouterModel.update(req.params.id, modality, series_description, link);
    return res.sendStatus(200);
}

const deleteAiAutorouter = async (req, res) => {
    await AiAutorouterModel.delete(req.params.id);
    return res.sendStatus(200);
}

module.exports = { 
    getAiAutorouter, 
    createAiAutorouter, 
    updateAiAutorouter, 
    deleteAiAutorouter 
};