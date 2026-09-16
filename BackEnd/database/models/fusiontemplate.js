'use strict'

module.exports = (sequelize, DataTypes) => {
  const FusionTemplate = sequelize.define(
    'FusionTemplate',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
      // { pattern, color, opacity, ww, wc, ww0, wc0 }
      base: { type: DataTypes.JSON, allowNull: false },
      // [{ pattern, color, opacity, ww, wc, ww0, wc0, sliceOffset }]
      overlays: { type: DataTypes.JSON, allowNull: false },
      created_by: { type: DataTypes.INTEGER, allowNull: true }
    },
    { tableName: 'fusion_templates' }
  )

  return FusionTemplate
}
