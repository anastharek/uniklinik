"use strict";
module.exports = (sequelize, DataTypes) => {
  const RequestScan = sequelize.define(
    "RequestScan",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      clinic_name: DataTypes.STRING,
      modality: DataTypes.STRING,
      indication: DataTypes.TEXT,
      patient_name: DataTypes.STRING,
      patient_id: DataTypes.STRING,
      study_description: DataTypes.TEXT,
      image: DataTypes.TEXT,
      doctors: DataTypes.TEXT,
      date: DataTypes.DATE,
      req_by: DataTypes.STRING,
      phone:DataTypes.STRING,
    },
    {
      freezeTableName: true,
    }
  );
  RequestScan.associate = function (models) {};
  return RequestScan;
};
