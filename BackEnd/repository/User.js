const db = require("../database/models");
const { OTJSDBEntityNotFoundException } = require("../Exceptions/OTJSErrors");
const mailer = require("../utils/mailer");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
class User {
  
  static getUser(username) {
    return db.User.findOne({
      where: { username: username },
    });
  }
  static getUserAllCountByRole(role) {
    return db.User.count({
      where: { role: role },
    });
  }

  static getUploader(username){
    return db.User.findOne({
      where: { uploader_of: username },
    });
  }
  static getUserbyEmail(email) {
    return db.User.findOne({
      where: { email: email },
    });
  }

  static getUserbyUsername(username) {
    return db.User.findOne({
      where: { username: username },
    });
  }

  static getActiveUser(username) {
    if(username=='admin'){
      return db.User.findAll({ where: { is_active: true } });
    }
    return db.User.findAll({ where: { 
      is_active: true,
      username: {
        [Op.not]: 'admin'
      }
     } });
    
  }
  
  static getActiveUserCount() {
    return db.User.count({ where: { is_active: true } });
  }


  static getInActiveUser() {
    return db.User.findAll({
      where: { is_active: { [Op.or]: [false, null] } },
    });
  }

  static getRadiogist() {
    return db.User.findAll({ where: { super_admin: false } });
  }

  static async delete(username) {
    const user = await User.getUser(username);
    if (user == null) {
      throw new OTJSDBEntityNotFoundException("This user doesn't exist");
    }
    mailer.delete_account_user(user.email);
    return db.User.destroy({
      where: { username: username },
    });
  }

  static findAndCountAllSuperUser() {
    return db.User.findAndCountAll({ where: { super_admin: true } });
  }

  static async toggleActive(username) {
    const user = await User.getUser(username);
    user.is_active = !user.is_active;
    user.save();
    if (user.is_active) {
      //sending email if account is activated
      mailer.userApproved_mail(user.email, username);
    }
    return;
  }

  static async create(
    username,
    firstname,
    lastname,
    email,
    password,
    role,
    super_admin,
    is_active,
    department,
    practicing_no,
    phone,
    place,
    uploader_of,
    plain_password,
    accepted_toc,
  ) {
    const user = await User.getUser(username);
    if (user !== null) {
      throw new OTJSDBEntityNotFoundException("username already exits");
    }

    let emailUser=await User.getUserbyEmail(email);
    if (emailUser !== null) {
      throw new OTJSDBEntityNotFoundException("email already exits");
    }
    mailer.registration_mail_admin(username, email, department);
    mailer.registration_mail_user(email);

    return db.User.create({
      username: username,
      firstname: firstname,
      lastname: lastname,
      email: email,
      password: password,
      role: role,
      super_admin: super_admin,
      is_active: is_active,
      department: department,
      practicing_no: practicing_no,
      phone: phone,
      place: place,
      uploader_of:uploader_of,
      plain_password:plain_password,
      accepted_toc:accepted_toc,
    });
  }
}

async function test() {
  // let admin = await db.User.findOne({ where: { super_admin: true } });
  // admin.role = "admin";
  // admin.destroy();
  // console.log(admin);
  // let hash=crypto.hash("admin", 16);
  // console.log(hash)
  // let user=await db.User.create({
  //   username: "admin",
  //   password: hash,
  //   super_admin: true,
  //   role: "admin",
  //   createdAt: new Date().toDateString(),
  //   updatedAt: new Date().toDateString(),
  // });
  // console.log(user)
  let role=await db.Role.findOne({name:'admin'});
  role.admin=true;
  role.save();
}

//test();

module.exports = User;
