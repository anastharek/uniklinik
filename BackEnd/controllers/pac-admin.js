const PacAdminModel = require("../model/PacAdmin");

const get_pacadmin = async (req, res) => {
  let data = await PacAdminModel.get_pacadmin();
  return res.send(data);
};

const create_pacadmin = async (req, res) => {
  const { name, email, phone_no, profile } = req.body;
  let data = await PacAdminModel.create_pacadmin(
    name,
    email,
    phone_no,
    profile
  );
  return res.send(data);
};

module.exports = { get_pacadmin, create_pacadmin };
