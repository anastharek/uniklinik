"use strict";
module.exports = (sequelize, DataTypes) => {
  const AiAutorouter = sequelize.define(
    "AiAutorouter",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4, 
      },
      modality: {
          type: DataTypes.STRING,
          allowNull: false,
      },
      series_description: {
          type: DataTypes.STRING,
          allowNull: false,
      },
      link: {
          type: DataTypes.TEXT,
          allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
  AiAutorouter.associate = function (models) {};
  return AiAutorouter;
};
