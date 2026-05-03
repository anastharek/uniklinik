"use strict";
module.exports = (sequelize, DataTypes) => {
  const Padilabel = sequelize.define(
    "Padilabel",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      label: DataTypes.STRING,
      path : DataTypes.TEXT,
      url: {
            type: DataTypes.TEXT,
            unique: true,
     },
      roles: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
  return Padilabel;
};
