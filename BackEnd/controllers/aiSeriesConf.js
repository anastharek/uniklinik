const AiSeriesConfModal=require('../model/AiSeriesConf');

const saveConf = async (req, res) => {
    try {
        const { name, url } = req.body;
        const data = await AiSeriesConfModal.save(name, url);
        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getConf = async (req, res) => {
    try {
        const data = await AiSeriesConfModal.get();
        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const updateConf = async (req, res) => {
    try {
        const { id, name, url } = req.body;
        const data = await AiSeriesConfModal.update(id, name, url);
        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const deleteConf = async (req, res) => {
    try {
        const { id } = req.body;
        const data = await AiSeriesConfModal.delete(id);
        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
module.exports={
    saveConf,
    getConf,
    updateConf,
    deleteConf
}