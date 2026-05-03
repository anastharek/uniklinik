var express = require("express");
var userRouter = express.Router();

const {
  getUsers,
  getInActiveUsers,
  createUser,
  modifyUser,
  deleteUser,
  registerUser,
  toggle_active_status,
  forgot_password,
  reset_password,
  getRadiologist,
  getProfile,
  modifyProfile,
  deleteSignature,
  deleteProfile,
  getUserProfile,
} = require("../controllers/user");
const {
  userAdminMidelware,
  userAuthMidelware,
} = require("../midelwares/authentication");
const padiLabelController = require("../controllers/PadilabelController");

userRouter.get("/", [userAuthMidelware], getUsers);
userRouter.get(
  "/inactive",
  [userAuthMidelware, userAdminMidelware],
  userAdminMidelware,
  getInActiveUsers
);
userRouter.post(
  "/",
  [userAuthMidelware, userAdminMidelware],
  userAdminMidelware,
  createUser
);
userRouter.post("/register", registerUser);
userRouter.post("/forgot-password", forgot_password);
userRouter.post("/reset-password", reset_password);
userRouter.post(
  "/toggle",
  [userAuthMidelware, userAdminMidelware],
  userAdminMidelware,
  toggle_active_status
);
userRouter.put(
  "/:username",
  [userAuthMidelware, userAdminMidelware],
  userAdminMidelware,
  modifyUser
);
userRouter.delete(
  "/:username",
  [userAuthMidelware, userAdminMidelware],
  userAdminMidelware,
  deleteUser
);
userRouter.post("/profile", [userAuthMidelware], modifyProfile);
userRouter.get("/radiologist", [userAuthMidelware], getRadiologist);
userRouter.get("/profile", [userAuthMidelware], getProfile);
userRouter.delete("/profile/signature", [userAuthMidelware], deleteSignature);
userRouter.delete("/profile/profile-img", [userAuthMidelware], deleteProfile);
userRouter.get(
  "/profile/:username",
  [userAuthMidelware, userAdminMidelware],
  getUserProfile
);

userRouter.get("/padi-label/role", [userAuthMidelware], padiLabelController.getPadiLabel);

module.exports = userRouter;
