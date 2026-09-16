'use strict'

const caseService = require('../../services/ailabeling/caseService')

const list = async (req, res) => {
  const cases = await caseService.listForUser(Number(req.params.id), req.ailabelUser)
  return res.json({ cases })
}

const annotations = async (req, res) => {
  const data = await caseService.getWithAnnotations(Number(req.params.id), req.ailabelUser)
  if (!data) return res.status(404).json({ message: 'Case not found or not assigned to you' })
  return res.json(data)
}

// GET /cases/:id — same payload as annotations (case + its annotations); used
// for deep-linking (e.g. from another tab via ?caseId=)
const get = annotations

module.exports = { list, annotations, get }
