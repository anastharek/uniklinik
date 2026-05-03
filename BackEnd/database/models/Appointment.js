"use strict";
module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define(
    "Appointment",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      appointment_datetime: DataTypes.DATE,
      patient_id: DataTypes.STRING,
      status: DataTypes.STRING,
      request_department: DataTypes.STRING,
      scan_region: DataTypes.STRING,
      ref_physician: DataTypes.STRING,
      modality_type: DataTypes.STRING,
      creatinine: DataTypes.STRING,
      patient_type: DataTypes.STRING,
      clinical_summary: DataTypes.TEXT,
      accesion_number: DataTypes.STRING,
      institution_name: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
  Appointment.associate = function (models) {
    Appointment.belongsTo(models.Patient, { foreignKey: 'patient_id' });
  };
  return Appointment;
};
