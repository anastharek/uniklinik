"use strict";
module.exports = (sequelize, DataTypes) => {
  const PreloadRecord = sequelize.define(
    "PreloadRecord",
    {
      study_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      cached_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      total_series: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
  PreloadRecord.associate = function (models) {};
  return PreloadRecord;
};
