const AiAutorouter  = require("../repository/AiAutorouter");

class AiAutorouterModel {
    static async getAll(query, offset=0, limit=100) {
        return await AiAutorouter.getAll(query, offset, limit);
    }

    static async create(modality, series_description, link) {
        return await AiAutorouter.create(modality, series_description, link);
    }
    
    static async update(id, modality, series_description, link) {
        return await AiAutorouter.update(id, modality, series_description, link);
    }

    static async delete(id) {
        return await AiAutorouter.delete(id);
    }
}

module.exports = AiAutorouterModel;
