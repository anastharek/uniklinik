const { OTJSBadRequestException } = require("../Exceptions/OTJSErrors");
const jwt = require("jsonwebtoken");
var Users = require("../model/Users");
const mailer = require("../utils/mailer");

createUser = async function (req, res) {
  const body = req.body;
  if (!body.username || !body.password || !body.role) {
    throw new OTJSBadRequestException(
      "Username, Password and Role must be specified"
    );
  }
  await Users.createUser(
    body.username,
    body.firstname,
    body.lastname,
    body.email,
    body.password,
    body.role,
    body.super_admin,
    (is_active = true)
  );
  res.sendStatus(201);
};

registerUser = async function (req, res) {
  const body = req.body;
  if (!body.username || !body.password) {
    throw new OTJSBadRequestException("Username, Password  must be specified");
  }
  await Users.createUser(
    body.username,
    body.firstname,
    body.lastname,
    body.email,
    body.password,
    "guest",
    (super_admin = false),
    (is_active = true),
    (department = body.department),
    (practicing_no = body.practicing_no),
    (phone = body.phone),
    (place = body.place),
    null,
    null,
    body.accepted_toc,
  );
  res.sendStatus(201);
};

toggle_active_status = async function (req, res) {
  const { username } = req.body;
  await Users.toggleActive(username);
  res.sendStatus(200);
};

getUsers = async function (req, res) {
  let user = await Users.getActiveUsers(req.username);
  res.json(user);
};

getInActiveUsers = async function (req, res) {
  let user = await Users.getInActiveUsers();
  res.json(user);
};

getProfile = async function (req, res) {
  let user = await Users.getUserbyUsername(req.username);
  return res.send(user);
};
getUserProfile = async function (req, res) {
  let { username } = req.params;
  let user = await Users.getUserbyUsername(username);
  return res.send(user);
};

modifyUser = async function (req, res) {
  const username = req.params.username;
  const body = req.body;
  await Users.modifyUser(
    username,
    body.firstname,
    body.lastname,
    body.password,
    body.email,
    body.role,
    body.superAdmin,
    body.department,
    body.phone,
    body.practicing_no,
    body.place
  );
  res.sendStatus(200);
};

modifyProfile = async function (req, res) {
  const username = req.username;
  const body = req.body;
  await Users.modifyProfile(
    username,
    body.firstname,
    body.lastname,
    body.practicing_no,
    body.place,
    body.signature,
    body.profile_image,
    body.doctor_description
  );
  res.sendStatus(200);
};

deleteSignature = async function (req, res) {
  let username = req.username;
  await Users.deleteSignature(username);
  res.sendStatus(200);
};

deleteProfile = async function (req, res) {
  let username = req.username;
  await Users.deleteProfile(username);
  res.sendStatus(200);
};

deleteUser = async function (req, res) {
  const username = req.params.username;
  await Users.deleteUser(username);
  res.sendStatus(200);
};

forgot_password = async function (req, res) {
  const { email } = req.body;
  let user = await Users.getUserbyEmail(email);
  if (user) {
    var TOKEN = jwt.sign(
      { email: user.dataValues.email },
      process.env.TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    let link = process.env.WEBSITE_DOMAIN + "/new-password/" + TOKEN;
    mailer.set_password_email(email, link);
    res.sendStatus(200);
  } else {
    throw new OTJSBadRequestException("Invalid Email-ID");
  }
};

reset_password = async function (req, res) {
  try {
    const { password, token } = req.body;
    let { email } = jwt.verify(token, process.env.TOKEN_SECRET);
    let user = await Users.getUserbyEmail(email);
    let { username, firstname, lastname, role, superAdmin } = user.dataValues;
    await Users.modifyUser(
      username,
      firstname,
      lastname,
      password,
      email,
      role,
      superAdmin
    );
    res.sendStatus(200);
  } catch (e) {
    throw new OTJSBadRequestException(e.toString());
  }
};

getRadiologist = async function (req, res) {
  let users = await Users.getRadiologist();
  return res.send(users);
};

module.exports = {
  createUser,
  modifyUser,
  deleteUser,
  getUsers,
  getInActiveUsers,
  registerUser,
  toggle_active_status,
  forgot_password,
  reset_password,
  getRadiologist,
  modifyProfile,
  getProfile,
  deleteSignature,
  deleteProfile,
  getUserProfile,
};
