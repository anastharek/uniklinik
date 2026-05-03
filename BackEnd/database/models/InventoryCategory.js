"use strict";
module.exports = (sequelize, DataTypes) => {
  const InventoryCategory = sequelize.define(
    "InventoryCategory",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
  InventoryCategory.associate = function (models) {};
  return InventoryCategory;
};
