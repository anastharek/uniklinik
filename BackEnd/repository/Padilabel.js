const db = require("../database/models");

const createPadilabel = async (payload) => {
  return await db.Padilabel.create(payload);
};

const getAllPadilabels = async () => {
  return await db.Padilabel.findAll();
};

const getPadilabelById = async (id) => {
  return await db.Padilabel.findByPk(id);
};

const updatePadilabel = async (id, payload) => {
  const padilabel = await db.Padilabel.findByPk(id);
  if (padilabel) {
    return await padilabel.update(payload);
  }
  return null;
};

const deletePadilabel = async (id) => {
  const padilabel = await db.Padilabel.findByPk(id);
  if (padilabel) {
    return await padilabel.destroy();
  }
  return null;
};

const getByRoles = async (role) => {
  const data = await db.Padilabel.findAll({
    where: {
      roles: {
        [db.Sequelize.Op.contains]: [role],
      },
    }
  });
  let payload = [];
  for(let item of data){
    payload.push({
      id: item.id,
      label: item.label,
      url: item.url,
      path: item.path,
    });
  }
  return payload;
};

module.exports = {
  createPadilabel,
  getAllPadilabels,
  getPadilabelById,
  updatePadilabel,
  deletePadilabel,
  getByRoles,
};
