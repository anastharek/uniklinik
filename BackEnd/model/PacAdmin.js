const PacAdmin = require("../repository/PacAdmin");

const get_pacadmin = () => {
  return PacAdmin.get_pacadmin();
};

const create_pacadmin = (name, email, phone, profile) => {
  return PacAdmin.create_pacadmin(name, email, phone, profile);
};

module.exports = { get_pacadmin, create_pacadmin };
