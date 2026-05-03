"use strict";
module.exports = (sequelize, DataTypes) => {
  const SystemUsage = sequelize.define(
    "SystemUsage",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_count: DataTypes.FLOAT,
      system_usage: DataTypes.FLOAT,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
  SystemUsage.associate = function (models) {};
  return SystemUsage;
};
