const padilebelRepository = require('../repository/Padilabel');

const createPadilabel = (payload) => {
    return padilebelRepository.createPadilabel(payload);
};

const getAllPadilabels = () => {
  return padilebelRepository.getAllPadilabels();
};

const getPadilabelById = (id) => {
  return padilebelRepository.getPadilabelById(id);
};

const updatePadilabel = (id, payload) => {
  return padilebelRepository.updatePadilabel(id, payload);
};

const deletePadilabel = (id) => {
  return padilebelRepository.deletePadilabel(id);
};

const getByRoles = (role) => {
  return padilebelRepository.getByRoles(role);
};

module.exports = {
  createPadilabel,
  getAllPadilabels,
  getPadilabelById,
  updatePadilabel,
  deletePadilabel,
  getByRoles,
};