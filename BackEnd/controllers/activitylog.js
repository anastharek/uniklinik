const ActivityLogModel = require("../model/ActivityLog");
const PatientReport = require("../model/PatientReport");
const { log_activity } = require("../midelwares/activity_logger");

const getActivity = (req, res) => {
  let limit = req.query.limit || 50;
  let offset = req.query.offset || 0;
  let username = req.query.username;
  let date = req.query.date;
  let activity = req.query.activity;
  let query = {};
  if (username) {
    query["username"] = username;
  }
  if (activity) {
    query["type"] = activity;
  }
  if (date) {
    query["createdAt"] = date;
  }
  if (!req.roles.admin) {
    query["hide_admin"] = true;
  }
  ActivityLogModel.getAll(query, offset, limit).then((data) => res.send(data));
};

const getActivityUser = async (req, res) => {
  let limit = req.query.limit || 50;
  let offset = req.query.offset || 0;
  let username = req.username;
  let date = req.query.date;
  let activity = req.query.activity;
  let query = {};
  if (username) {
    query["username"] = username;
  }
  if (activity) {
    query["type"] = activity;
  }
  if (date) {
    query["createdAt"] = date;
  }
  let activitydata = await ActivityLogModel.getAll(query, offset, limit);
  let assign_count = await PatientReport.getAssignCount(username);
  res.send({ activitydata, ...assign_count });
};

const createActivity = async (req, res) => {
  const { type, description } = req.body;
  log_activity(req, res, () => {}, type, description);
  //await ActivityLogModel.create(type, description, req.username, req.ip);
  return res.sendStatus(201);
};
module.exports = { getActivity, getActivityUser, createActivity };
