"use strict";
module.exports = (sequelize, DataTypes) => {
  const StoreLocation = sequelize.define(
    "StoreLocation",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      location: DataTypes.STRING,
      description: DataTypes.TEXT,
      section: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
  StoreLocation.associate = function (models) {};
  return StoreLocation;
};
