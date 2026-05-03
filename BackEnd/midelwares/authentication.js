const jwt = require("jsonwebtoken");
const { OTJSForbiddenException } = require("../Exceptions/OTJSErrors");
const Task = require("../model/Task");
const Users = require("../model/Users");
const RegisteredPatient = require("../model/RegisteredPatient");
const Roles = require("../model/Roles");
const userAuthMidelware =async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else {
    try {
      let token =req.cookies.tokenOrthancJs||req.headers.systemtoken;
      let payload = jwt.verify(token, process.env.TOKEN_SECRET);
      if(payload.patient_id){
         patient = await RegisteredPatient.getPatientById(payload.id);
         req.roles = await Roles.getPermission(patient.role);
         req.username = payload.patient_id;
         req.user = {id:payload.id};
         req.is_patient = true;
      }else{
      const userObject = new Users(payload.username);
      req.roles = await userObject.getUserRight();
      req.username = payload.username;
      req.roles.username = payload.username;
      req.user={id:payload.id};
      }
      next();
    } catch (err) {
      console.log('err=>',err);
      res.sendStatus(401);
      return;
    }
  }
};

const userOrExternalAuthMiddleware = async(req, res, next) => {
  if (process.env.NODE_ENV == "test") {
    next();
  } else {
    try {
      let studyInstanceId = req.cookies.external;
      if (req.originalUrl.includes(studyInstanceId)) {
        next();
      } else {
        let token = req.cookies.tokenOrthancJs;
        let payload = jwt.verify(token, process.env.TOKEN_SECRET);
        const userObject = new Users(payload.username);
        req.roles = await userObject.getUserRight();
        next();
      }
    } catch (err) {
      res.sendStatus(403);
      return;
    }
  }
};

const isCurrentUserOrAdminMidelWare = function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.admin || req.roles.username === req.params.username) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const userAdminMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.admin) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const importMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.import) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const contentMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.content || req.is_patient) {
    if (req.is_patient){
      req.body.Query.PatientID = req.username;
    }
    next();
  } else {
    res.sendStatus(403);
  }
};

const anonMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.anon) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const exportLocalMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.export_local) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const exportExternMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.export_extern) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const queryMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.query) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const autoQueryMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.auto_query) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const deleteMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.delete) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const modifyMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.modify) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const cdBurnerMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.cd_burner) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const autoroutingMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.autorouting) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const ownTaskOrIsAdminMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else {
    let task = await Task.getTask(req.params.id);
    if (task.creator !== req.roles.username && !req.roles.admin)
      throw new OTJSForbiddenException("Task not owned");
    next();
  }
};

const roleAccessLabelMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV === "test") {
    next();
  } else {
    const RoleLabel = require("../model/RoleLabel");
    const role_label = await RoleLabel.getLabelsFromRoleName(req.roles.name);
    let access = false;

    for (var i = 0; i < role_label.length; i++) {
      if (req.params.name === role_label[i].label_name) {
        access = true;
        break;
      }
    }

    if (access) {
      next();
    } else {
      userAdminMidelware(req, res, next);
    }
  }
};

module.exports = {
  userAuthMidelware,
  userAdminMidelware,
  importMidelware,
  contentMidelware,
  anonMidelware,
  exportLocalMidelware,
  exportExternMidelware,
  queryMidelware,
  autoQueryMidelware,
  deleteMidelware,
  modifyMidelware,
  cdBurnerMidelware,
  isCurrentUserOrAdminMidelWare,
  ownTaskOrIsAdminMidelware,
  roleAccessLabelMidelware,
  autoroutingMidelware,
  userOrExternalAuthMiddleware,
};
