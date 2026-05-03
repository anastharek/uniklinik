const ReportTemplateModel = require("../model/ReportTemplate");

const getAll = async (req, res) => {
    try{
    const query = req.query;
    const offset = req.query.offset || 0;
    const limit = req.query.limit || 100;
    const reportTemplates = await ReportTemplateModel.getAll(query, offset, limit);
    res.json(reportTemplates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getID = async (req, res) => {
    try{
    const { id } = req.params;
    const reportTemplate = await ReportTemplateModel.getID(id);
    res.json(reportTemplate);
    }catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const create = async (req, res) => {
    try{
    const { name, text } = req.body;
    const reportTemplate = await ReportTemplateModel.create(name, text);
    res.json(reportTemplate);
    }catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const update = async (req, res) => {
    try{
    const { id } = req.params;
    const { name, text } = req.body;
    const reportTemplate = await ReportTemplateModel.update(id, name, text);
    res.json(reportTemplate);
    }catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const remove = async (req, res) => {
    try{
    const { id } = req.params;
    const reportTemplate = await ReportTemplateModel.delete(id);
    res.json(reportTemplate);
    }catch(error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getAll,
    getID,
    create,
    update,
    remove
}