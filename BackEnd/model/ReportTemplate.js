const ReportTemplate  = require("../repository/ReportTemplate");

class ReportTemplateModel {
    static async getAll(query, offset=0, limit=100) {
        return await ReportTemplate.getAll(query, offset, limit);
    }

    static async getID(id) {
        return await ReportTemplate.getID(id);
    }

    static async create(name, text) {
        return await ReportTemplate.create(name, text);
    }
    
    static async update(id, name, text) {
        return await ReportTemplate.update(id, name, text);
    }

    static async delete(id) {
        return await ReportTemplate.delete(id);
    }
}

module.exports = ReportTemplateModel;
