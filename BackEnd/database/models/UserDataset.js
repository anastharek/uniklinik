"use strict";
module.exports = (sequelize, DataTypes) => {
  const UserDataset = sequelize.define(
    "UserDataset",
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
  UserDataset.associate = function (models) {
    UserDataset.belongsTo(models.Dataset, {foreignKey: "dataset"});
  };
  return UserDataset;
};
