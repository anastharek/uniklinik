"use strict";
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      username: DataTypes.STRING,
      password: DataTypes.STRING,
      super_admin: DataTypes.BOOLEAN,
      firstname: DataTypes.STRING,
      lastname: DataTypes.STRING,
      email: DataTypes.STRING,
      is_active: DataTypes.BOOLEAN,
      department: DataTypes.STRING,
      practicing_no: DataTypes.STRING,
      phone: DataTypes.STRING,
      place: DataTypes.STRING,
      signature: DataTypes.TEXT,
      profile_image: DataTypes.TEXT,
      doctor_description: DataTypes.TEXT,
      uploader_of:DataTypes.STRING,
      plain_password:DataTypes.STRING,
      accepted_toc:DataTypes.BOOLEAN,
    },
    {}
  );
  User.associate = function (models) {};
  return User;
};
