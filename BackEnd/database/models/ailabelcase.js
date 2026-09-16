'use strict'

module.exports = (sequelize, DataTypes) => {
  const AiLabelCase = sequelize.define(
    'AiLabelCase',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: { type: DataTypes.INTEGER, allowNull: false },
      case_code: { type: DataTypes.STRING, allowNull: false },
      study_instance_uid: { type: DataTypes.STRING, allowNull: false },
      series_instance_uid: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'unassigned' },
      assigned_labeler_id: { type: DataTypes.INTEGER, allowNull: true },
      assigned_validator_id: { type: DataTypes.INTEGER, allowNull: true }
    },
    { tableName: 'ai_label_cases' }
  )

  AiLabelCase.associate = function (db) {
    AiLabelCase.belongsTo(db.AiLabelProject, { as: 'project', foreignKey: 'project_id' })
    AiLabelCase.belongsTo(db.AiLabelUser, { as: 'labeler', foreignKey: 'assigned_labeler_id' })
    AiLabelCase.belongsTo(db.AiLabelUser, { as: 'validator', foreignKey: 'assigned_validator_id' })
    AiLabelCase.hasMany(db.AiLabelAnnotation, { as: 'annotations', foreignKey: 'case_id' })
  }

  return AiLabelCase
}
