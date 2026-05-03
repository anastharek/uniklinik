"use strict";
module.exports = (sequelize, DataTypes) => {
  const Vendor = sequelize.define(
    "Vendor",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: DataTypes.STRING,
      address: DataTypes.TEXT,
      phone: DataTypes.STRING,
      ssm: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
  Vendor.associate = function (models) {};
  return Vendor;
};
