"use strict";
module.exports = (sequelize, DataTypes) => {
  const Addendum = sequelize.define(
    "Addendum",
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
      text: DataTypes.TEXT,
      study_date: DataTypes.STRING,
      signature: DataTypes.TEXT,
      image: DataTypes.TEXT,
      addendumby: DataTypes.TEXT,
      addendum_at: DataTypes.STRING,
      practicing_no: DataTypes.STRING,
      usg_no: DataTypes.STRING,
      table: DataTypes.TEXT,
    },
    {
      freezeTableName: true,
    }
  );
  Addendum.associate = function (models) {};
  return Addendum;
};
