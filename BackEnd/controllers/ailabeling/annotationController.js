'use strict'

const annotationService = require('../../services/ailabeling/annotationService')

const create = async (req, res) => {
  const result = await annotationService.create(req.body || {}, req.ailabelUser)
  if (result.error) return res.status(result.code || 400).json({ message: result.error })
  return res.status(201).json({ annotation: result.annotation })
}

const update = async (req, res) => {
  const result = await annotationService.update(Number(req.params.id), req.body || {}, req.ailabelUser)
  if (result.error) return res.status(result.code || 400).json({ message: result.error })
  return res.json({ annotation: result.annotation })
}

const remove = async (req, res) => {
  const result = await annotationService.remove(Number(req.params.id), req.ailabelUser)
  if (result.error) return res.status(result.code || 400).json({ message: result.error })
  return res.json({ ok: true })
}

module.exports = { create, update, remove }
