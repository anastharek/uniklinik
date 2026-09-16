'use strict'

/**
 * Fusion template controller — shared, viewer-wide recipes for the OHIF
 * Overlay/Fusion panel. Anyone with viewer access can list/create/apply;
 * DELETE is gated by the same export password used by the AI-label export
 * function (header x-export-password or ?password=, env EXPORT_PASSWORD).
 */
const db = require('../../database/models')

const FusionTemplate = db.FusionTemplate

const EXPORT_PASSWORD = process.env.EXPORT_PASSWORD || 'qwertyuiop@12'

function exportPasswordOk(req) {
  const given = req.headers['x-export-password'] || req.query.password
  return typeof given === 'string' && given === EXPORT_PASSWORD
}

/** GET /api/fusion/templates — list all (ordered newest first). */
const list = async (req, res) => {
  const templates = await FusionTemplate.findAll({ order: [['name', 'ASC']] })
  return res.json(templates)
}

/** POST /api/fusion/templates — create (name + base + overlays recipe). */
const create = async (req, res) => {
  const { name, base, overlays } = req.body || {}
  const cleanName = typeof name === 'string' ? name.trim().slice(0, 120) : ''
  if (!cleanName) {
    return res.status(400).json({ message: 'Template name is required' })
  }
  if (!base || typeof base !== 'object' || !Array.isArray(overlays)) {
    return res.status(400).json({ message: 'Template needs base + overlays recipe' })
  }
  const existing = await FusionTemplate.findOne({ where: { name: cleanName } })
  if (existing) {
    return res.status(409).json({ message: `A template named "${cleanName}" already exists` })
  }
  const created = await FusionTemplate.create({
    name: cleanName,
    base,
    overlays,
    created_by: req.user ? req.user.id : null,
  })
  return res.status(201).json(created)
}

/** DELETE /api/fusion/templates/:id — requires the export password. */
const remove = async (req, res) => {
  if (!exportPasswordOk(req)) {
    return res.status(403).json({ message: 'Wrong export password' })
  }
  const tpl = await FusionTemplate.findByPk(req.params.id)
  if (!tpl) {
    return res.status(404).json({ message: 'Template not found' })
  }
  await tpl.destroy()
  return res.json({ ok: true })
}

module.exports = { list, create, remove }
