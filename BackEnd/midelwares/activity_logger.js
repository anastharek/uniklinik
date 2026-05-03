const ActivityModel = require("../model/ActivityLog");
const ActivityType = require("../utils/ActivityType");
const axios = require("axios");
async function log_activity(req, res, next, type, description = null) {
  switch (type) {
    case ActivityType.SEARCH_STUDY:
      description = JSON.stringify(req.body);
      break;
    case ActivityType.SEARCH_MYCASELIST:
      description = JSON.stringify(req.body);
      break;

    case ActivityType.SEARCH_ALLCASELIST:
      description = JSON.stringify(req.body);
      break;
    case ActivityType.DELETE_STUDY:
      const url = req.url;
      let id = url.split("/").slice(-1)[0];
      description = JSON.stringify({ id });
      break;
    case ActivityType.DELETE_STUDY_REPORT:
      description = JSON.stringify(description);
      break;
    case ActivityType.DELETE_CASE_LIST:
      break;

    case ActivityType.UPDATED_DRAFT_REPORT:
      description = JSON.stringify(description);
      break;

    case ActivityType.CREATED_DRAFT_REPORT:
      description = JSON.stringify(description);
      break;

    case ActivityType.CREATED_ADDENDUM_REPORT:
      description = JSON.stringify(description);
      break;

    case ActivityType.CREATE_FINALIZE_REPORT:
      description = JSON.stringify(description);
      break;

    case ActivityType.VIEW_REPORT:
      description = JSON.stringify(description);
      break;
    case ActivityType.IMPORT:
      description = JSON.stringify(description);
      break;
    case ActivityType.CREATE_IMPORT:
      description = JSON.stringify(description);
      break;
    case ActivityType.CREATE_SHARE_CARD:
      description = description;
      break;
    case ActivityType.REQUEST_REPORT:
      description = JSON.stringify(description);
      break;
    default:
      if (description === null) description = "no description";
  }
  ActivityModel.create(type, description, req.username, req.ip);
  next();
}

module.exports = { log_activity };
