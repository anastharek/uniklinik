'use strict'

module.exports = (sequelize, DataTypes) => {
  const ResearchProvenance = sequelize.define(
    'ResearchProvenance',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      source_study_instance_uid: { type: DataTypes.STRING, allowNull: false },
      source_series_instance_uid: { type: DataTypes.STRING, allowNull: false },
      output_series_instance_uid: { type: DataTypes.STRING, allowNull: true },
      source_series_description: { type: DataTypes.STRING, allowNull: true },
      source_modality: { type: DataTypes.STRING, allowNull: true },
      converter_software: { type: DataTypes.STRING, allowNull: true },
      converter_version: { type: DataTypes.STRING, allowNull: true },
      adc_units: { type: DataTypes.STRING, allowNull: true },
      analysis_module: { type: DataTypes.STRING, allowNull: true },
      analysis_payload: { type: DataTypes.TEXT, allowNull: true }, // JSON: threshold/colormap/range/roi stats etc.
      created_by: { type: DataTypes.STRING, allowNull: true }
    },
    { tableName: 'research_provenance' }
  )

  ResearchProvenance.associate = function () {}

  return ResearchProvenance
}
