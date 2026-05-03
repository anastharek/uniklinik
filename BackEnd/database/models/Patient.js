"use strict";
module.exports = (sequelize, DataTypes) => {
  const Patient = sequelize.define(
    "Patient",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: DataTypes.STRING,
      gender: DataTypes.STRING,
      dob: DataTypes.STRING,
      age: DataTypes.STRING,
      patient_id: DataTypes.STRING,
      nric: DataTypes.STRING,
      phone: DataTypes.STRING,
      allergic: DataTypes.STRING,
      asthma: DataTypes.STRING,
      // creatinine: DataTypes.STRING,
      // patient_type: DataTypes.STRING,
      // clinical_summary: DataTypes.TEXT,
      // accesion_number: DataTypes.TEXT,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
  Patient.associate = function (models) {};
  return Patient;
};
