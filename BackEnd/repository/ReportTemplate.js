const db = require("../database/models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

class ReportTemplate {
    static async getAll(query, offset=0, limit=100) {
        let querySQL = {};
        Object.keys(query).map((key) => {
        querySQL[key] = { [Op.iLike]: `%${query[key]}%` };
        });
        return await db.ReportTemplate.findAll({
        limit,
        offset,
        where: querySQL,
        order: [["createdAt", "DESC"]],
        });
       
    }

    static async getID(id) {
        return await db.ReportTemplate.findByPk(id);
    }
    static async create(name,text) {
        return await db.ReportTemplate.create({
            name:name,
            text:text
        });
    }
    
    static async update(id,name,text) {
      return await db.ReportTemplate.update({
            name:name,
            text:text
        },{where: { id }});
       
    }

    static async delete(id) {
       return await db.ReportTemplate.destroy({
            where: { id },
        });
    }
    
}

module.exports = ReportTemplate;