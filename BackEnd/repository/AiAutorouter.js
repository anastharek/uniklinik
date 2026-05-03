const db = require("../database/models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

class AiAutorouter {
    static async getAll(query, offset=0, limit=100) {
        let querySQL = {};
        Object.keys(query).map((key) => {
        querySQL[key] = { [Op.iLike]: `%${query[key]}%` };
        });
        return await db.AiAutorouter.findAll({
        limit,
        offset,
        where: querySQL,
        order: [["createdAt", "DESC"]],
        });
    }

    static async create(modality, series_description, link) {
        return await db.AiAutorouter.create({
        modality,
        series_description,
        link,
        });
    }
    
   static async update(id, modality, series_description, link) {
        return await db.AiAutorouter.update(
        {
            modality,
            series_description,
            link,
        },
        {
            where: { id },
        }
        );
    }

    static async delete(id) {
        return await db.AiAutorouter.destroy({
        where: { id },
        });
    }
    
}

module.exports = AiAutorouter;