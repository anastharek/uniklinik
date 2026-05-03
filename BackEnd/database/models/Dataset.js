"use strict";
module.exports = (sequelize, DataTypes) => {
  const Dataset = sequelize.define(
    "Dataset",
    {
      id: {
        type:DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4, 
      },
      name: DataTypes.STRING,
      researcher_name: DataTypes.STRING,
      detail: DataTypes.TEXT,
      sample_count: DataTypes.INTEGER,
      type: DataTypes.STRING,
      study_field: DataTypes.STRING,
      pricing_type: DataTypes.STRING,
      price_range: DataTypes.STRING,
      preview_data: DataTypes.JSONB,
      all_data: DataTypes.JSONB,
      column_sequence: DataTypes.JSONB,
      published: DataTypes.BOOLEAN,
      owner: DataTypes.INTEGER,
      subscribe_count: DataTypes.INTEGER,
      view_count: DataTypes.INTEGER,
      modality: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
      defaultScope: {
        attributes: { exclude: ['all_data','updatedAt'] }, // Exclude by default
      },
      scopes: {
        withAllData: {
          attributes: { include: ['all_data'] }, // Scope to include all_data when needed
        },
      },
    }
  );
  Dataset.associate = function (models) {
    Dataset.belongsTo(models.User, {foreignKey: "owner"})
  };
  return Dataset;
};
