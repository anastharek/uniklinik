const db = require("../database/models");

class AiSeriesConfRepository {
    static async save(name, url) {
        return db.AiSeriesConf.create({
            name: name,
            url: url,
        });
    }
    static async get() {
        return db.AiSeriesConf.findAll({});
    }
    static async update(id, name, url) {
        return db.AiSeriesConf.update({
            name: name,
            url: url,
        }, {
            where: {
                id: id
            }
        });
    }
    static async delete(id) {
        return db.AiSeriesConf.destroy({
            where: {
                id: id
            }
        });
    }
}

module.exports = AiSeriesConfRepository;