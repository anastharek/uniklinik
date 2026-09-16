'use strict'

module.exports = (sequelize, DataTypes) => {
  const AiLabelUser = sequelize.define(
    'AiLabelUser',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      username: { type: DataTypes.STRING, allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING, allowNull: false },
      full_name: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'labeler' },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
    },
    { tableName: 'ai_label_users' }
  )

  AiLabelUser.associate = function (db) {
    AiLabelUser.hasMany(db.AiLabelCase, { as: 'assignedCases', foreignKey: 'assigned_labeler_id' })
    AiLabelUser.hasMany(db.AiLabelAnnotation, { as: 'annotations', foreignKey: 'created_by' })
  }

  return AiLabelUser
}
