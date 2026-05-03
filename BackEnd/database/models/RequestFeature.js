"use strict";
module.exports = (sequelize, DataTypes) => {
  const RequestFeature = sequelize.define(
    "RequestFeature",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      patient_id: DataTypes.STRING,
      patient_name: DataTypes.STRING,
      study_type: DataTypes.STRING,
      study_date: DataTypes.STRING,
      study_id: DataTypes.STRING,
      hospital: DataTypes.STRING,
      radiologist: DataTypes.STRING,
      request_type: DataTypes.STRING,
      indication: DataTypes.TEXT,
      metadata: DataTypes.TEXT,
      requested_by: DataTypes.STRING,
    },
    {
      freezeTableName: true,
    }
  );
  RequestFeature.associate = function (models) {};
  return RequestFeature;
};
