"use strict";
module.exports = (sequelize, DataTypes) => {
  const RegisteredPatient = sequelize.define(
    "RegisteredPatient",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      patient_id: DataTypes.STRING,
      phone: DataTypes.STRING,
      otp: DataTypes.STRING,
      otp_createdAt: DataTypes.DATE,
      role: {
        type: DataTypes.STRING,
        defaultValue: 'patient',
        allowNull: false
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
  RegisteredPatient.associate = function (models) {};
  return RegisteredPatient;
};
