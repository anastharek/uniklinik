'use strict'

module.exports = (sequelize, DataTypes) => {
  const AiLabelProjectLabel = sequelize.define(
    'AiLabelProjectLabel',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: { type: DataTypes.INTEGER, allowNull: false },
      class_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      color: { type: DataTypes.STRING, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
    },
    { tableName: 'ai_label_project_labels' }
  )

  AiLabelProjectLabel.associate = function (db) {
    AiLabelProjectLabel.belongsTo(db.AiLabelProject, { as: 'project', foreignKey: 'project_id' })
  }

  return AiLabelProjectLabel
}
