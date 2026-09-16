'use strict'

const projectService = require('../../services/ailabeling/projectService')

const list = async (req, res) => {
  const projects = await projectService.listForUser(req.ailabelUser)
  return res.json({ projects })
}

const detail = async (req, res) => {
  const data = await projectService.detail(Number(req.params.id), req.ailabelUser)
  if (!data) return res.status(404).json({ message: 'Project not found' })
  return res.json(data)
}

// POST /projects — create a project with its initial label list
const create = async (req, res) => {
  const { name, description, labels = [] } = req.body || {}
  const trimmedName = String(name || '').trim()
  if (!trimmedName) return res.status(400).json({ message: 'Project topic/name is required' })

  const project = await projectService.create(
    { name: trimmedName, description, annotationType: 'bbox' },
    labels,
    req.ailabelUser
  )
  return res.status(201).json({ project })
}

// PUT /projects/:id — rename / edit project (topic)
const update = async (req, res) => {
  const { name, description } = req.body || {}
  const project = await projectService.update(Number(req.params.id), { name, description }, req.ailabelUser)
  if (!project) return res.status(404).json({ message: 'Project not found' })
  return res.json({ project })
}

// POST /projects/:id/labels — add a label to the project
const addLabel = async (req, res) => {
  const { name } = req.body || {}
  const label = await projectService.addLabel(Number(req.params.id), name, req.ailabelUser)
  if (!label) return res.status(404).json({ message: 'Project not found' })
  if (label.error) return res.status(400).json({ message: label.error })
  return res.status(201).json({ label })
}

// PUT /projects/:id/labels/:labelId — rename / edit a label
const updateLabel = async (req, res) => {
  const { name } = req.body || {}
  const label = await projectService.updateLabel(
    Number(req.params.id),
    Number(req.params.labelId),
    name,
    req.ailabelUser
  )
  if (!label) return res.status(404).json({ message: 'Label not found' })
  if (label.error) return res.status(400).json({ message: label.error })
  return res.json({ label })
}

// DELETE /projects/:id/labels/:labelId — soft-delete a label
const removeLabel = async (req, res) => {
  const ok = await projectService.removeLabel(
    Number(req.params.id),
    Number(req.params.labelId),
    req.ailabelUser
  )
  if (!ok) return res.status(404).json({ message: 'Label not found' })
  if (ok.error) return res.status(400).json({ message: ok.error })
  return res.json({ ok: true })
}

module.exports = { list, detail, create, update, addLabel, updateLabel, removeLabel }
