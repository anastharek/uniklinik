"use strict";
module.exports = (sequelize, DataTypes) => {
  const ReportTemplate = sequelize.define(
    "ReportTemplate",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4, 
      },
      name: DataTypes.STRING,
      text: DataTypes.TEXT,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
  ReportTemplate.associate = function (models) {};
  return ReportTemplate;
};
