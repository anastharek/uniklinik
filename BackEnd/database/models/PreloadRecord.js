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
      // Orthanc /changes "Last" seq at preload completion — used to detect
      // that a flood of new instances has evicted the warmed RAM cache.
      change_seq: {
        type: DataTypes.BIGINT,
        allowNull: true,
        defaultValue: null,
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
