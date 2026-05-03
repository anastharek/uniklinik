var express = require("express");
var routerAuthentication = express.Router();
const { userAuthMidelware } = require("../midelwares/authentication");
const {
  login,
  loginExternal,
  logOut,
  disconnectClientAPI,
} = require("../controllers/authentication");
const  authenticationPatient = require("../controllers/authenticationPatient");
//Authentication APIs
routerAuthentication.post("/", login);
routerAuthentication.post("/external/:studyInstanceId", loginExternal);
routerAuthentication.delete("/", [userAuthMidelware], logOut);
routerAuthentication.get(
  "/logout-other",
  [userAuthMidelware],
  disconnectClientAPI
);

// patient auth api
routerAuthentication.post("/patient/get-otp", authenticationPatient.getOTP);
routerAuthentication.post("/patient/verify-otp", authenticationPatient.verifyOTP);

module.exports = routerAuthentication;
