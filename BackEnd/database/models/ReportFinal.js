"use strict";
module.exports = (sequelize, DataTypes) => {
  const ReportFinal = sequelize.define(
    "ReportFinal",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      patient_name: DataTypes.STRING,
      patient_id: DataTypes.STRING,
      study_id: DataTypes.STRING,
      study_type: DataTypes.STRING,
      tag: DataTypes.STRING,
      upload: DataTypes.STRING,
      text: DataTypes.TEXT,
      signature: DataTypes.TEXT,
      image: DataTypes.TEXT,
      addendumby: DataTypes.TEXT,
      practicing_no: DataTypes.STRING,
      created_by: DataTypes.STRING,
      study_date: DataTypes.STRING,
      addendum_at: DataTypes.STRING,
      StudyInstanceUID: DataTypes.STRING,
      accesor: DataTypes.STRING,
      usg_no: DataTypes.STRING,
      nric: DataTypes.STRING,
      RefPhysicianName: DataTypes.STRING,
      type: DataTypes.STRING,
      label: DataTypes.STRING,
      Logo: DataTypes.TEXT,
      InstitutionName: DataTypes.STRING,
      roles: {
        type: DataTypes.STRING,
        allowNull: false,
        get() {
          return this.getDataValue("roles").split(";");
        },
        set(val) {
          this.setDataValue("roles", val.join(";"));
        },
      },
      doctors: {
        type: DataTypes.STRING,
        allowNull: false,
        get() {
          return this.getDataValue("doctors").split(";");
        },
        set(val) {
          this.setDataValue("doctors", val.join(";"));
        },
      },
      table: DataTypes.TEXT,
    },
    {
      freezeTableName: true,
    }
  );
  ReportFinal.associate = function (models) {};
  return ReportFinal;
};
