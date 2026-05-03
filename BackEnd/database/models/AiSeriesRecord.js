"use strict";
module.exports = (sequelize, DataTypes) => {
  const AiSeriesRecord = sequelize.define(
    "AiSeriesRecord",
    {
      id: {
        type:DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4, 
      },
      series_id: {
          type: DataTypes.STRING,
          allowNull: false,
      },
      instance_id: {
          type: DataTypes.STRING,
          allowNull: false,
      },
      status: {
          type: DataTypes.STRING,//pending,completed,failed
          defaultValue: 'pending',
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
  AiSeriesRecord.associate = function (models) {};
  return AiSeriesRecord;
};
