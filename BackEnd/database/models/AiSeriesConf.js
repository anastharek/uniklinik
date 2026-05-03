"use strict";
module.exports = (sequelize, DataTypes) => {
  const AiSeriesConf = sequelize.define(
    "AiSeriesConf",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: DataTypes.STRING,
      url: DataTypes.TEXT,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
  return AiSeriesConf;
};
