"use strict";
module.exports = (sequelize, DataTypes) => {
  const PAC_ADMIN = sequelize.define(
    "PAC_ADMIN",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      phone_no: DataTypes.STRING,
      profile: DataTypes.TEXT,
    },
    {
      freezeTableName: true,
    }
  );
  PAC_ADMIN.associate = function (models) {};
  return PAC_ADMIN;
};
