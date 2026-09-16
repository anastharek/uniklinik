'use strict'

module.exports = (sequelize, DataTypes) => {
  const AiLabelAnnotation = sequelize.define(
    'AiLabelAnnotation',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: { type: DataTypes.INTEGER, allowNull: false },
      case_id: { type: DataTypes.INTEGER, allowNull: false },
      study_instance_uid: { type: DataTypes.STRING, allowNull: false },
      series_instance_uid: { type: DataTypes.STRING, allowNull: false },
      sop_instance_uid: { type: DataTypes.STRING, allowNull: false },
      frame_number: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      annotation_type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'bbox' },
      label_id: { type: DataTypes.INTEGER, allowNull: false },
      label_name: { type: DataTypes.STRING, allowNull: false },
      data: { type: DataTypes.JSONB, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'draft' },
      created_by: { type: DataTypes.INTEGER, allowNull: false },
      updated_by: { type: DataTypes.INTEGER, allowNull: true }
    },
    { tableName: 'ai_label_annotations' }
  )

  AiLabelAnnotation.associate = function (db) {
    AiLabelAnnotation.belongsTo(db.AiLabelProject, { as: 'project', foreignKey: 'project_id' })
    AiLabelAnnotation.belongsTo(db.AiLabelCase, { as: 'case', foreignKey: 'case_id' })
    AiLabelAnnotation.belongsTo(db.AiLabelUser, { as: 'creator', foreignKey: 'created_by' })
    AiLabelAnnotation.belongsTo(db.AiLabelUser, { as: 'editor', foreignKey: 'updated_by' })
  }

  return AiLabelAnnotation
}
