"use strict";
module.exports = (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define(
    "ActivityLog",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      type: DataTypes.STRING,
      description: DataTypes.TEXT,
      username: DataTypes.STRING,
      ip: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
  ActivityLog.associate = function (models) {};
  return ActivityLog;
};
