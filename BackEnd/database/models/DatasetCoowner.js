"use strict";
module.exports = (sequelize, DataTypes) => {
  const DatasetCoowner = sequelize.define(
    "DatasetCoowner",
    {
      id: {
        type:DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4, 
      },
      dataset: DataTypes.UUIDV4,
      user: DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
  DatasetCoowner.associate = function (models) {
    DatasetCoowner.belongsTo(models.Dataset, {foreignKey: "dataset"});
    DatasetCoowner.belongsTo(models.User, {foreignKey: "user"});
  };
  return DatasetCoowner;
};
