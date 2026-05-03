const SystemUsageModel = require("../model/SystemUsage");
const UserModel=require('../model/Users')
const get = (req, res) => {
  SystemUsageModel.get()
    .then(async(data) => {
      let user_count=await UserModel.getActiveUserCount();
      res.send({data,user_count})
    })
    .catch((err) => res.send(err));
};

module.exports = { get };
