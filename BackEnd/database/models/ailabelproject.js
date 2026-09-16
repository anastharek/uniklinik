'use strict'

module.exports = (sequelize, DataTypes) => {
  const AiLabelProject = sequelize.define(
    'AiLabelProject',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      annotation_type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'bbox' },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
      created_by: { type: DataTypes.INTEGER, allowNull: true }
    },
    { tableName: 'ai_label_projects' }
  )

  AiLabelProject.associate = function (db) {
    AiLabelProject.hasMany(db.AiLabelProjectLabel, { as: 'labels', foreignKey: 'project_id' })
    AiLabelProject.hasMany(db.AiLabelCase, { as: 'cases', foreignKey: 'project_id' })
    AiLabelProject.hasMany(db.AiLabelAnnotation, { as: 'annotations', foreignKey: 'project_id' })
  }

  return AiLabelProject
}
