"use strict";
module.exports = (sequelize, DataTypes) => {
  const Manufacture = sequelize.define(
    "Manufacture",
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
  Manufacture.associate = function (models) {};
  return Manufacture;
};
