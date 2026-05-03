"use strict";
module.exports = (sequelize, DataTypes) => {
  const DatasetRequest = sequelize.define(
    "DatasetRequest",
    {
      id: {
        type:DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4, 
      },
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      phone: DataTypes.STRING,
      dataset: DataTypes.INTEGER,
      user: DataTypes.INTEGER,
      status: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
  DatasetRequest.associate = function (models) {
    DatasetRequest.belongsTo(models.Dataset, {foreignKey: "dataset"})
    DatasetRequest.belongsTo(models.User, {foreignKey: "user"})
  };
  return DatasetRequest;
};
