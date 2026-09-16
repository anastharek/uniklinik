'use strict'

const db = require('../../database/models')
const { Op } = require('sequelize')

const AiLabelProject = db.AiLabelProject
const AiLabelProjectLabel = db.AiLabelProjectLabel
const AiLabelCase = db.AiLabelCase
const AiLabelAnnotation = db.AiLabelAnnotation
const AiLabelUser = db.AiLabelUser

/** Projects visible to a user. Admin sees all; labeler/validator see only
 *  projects that contain cases assigned to them. The Quick Label demo user
 *  (no login UI) sees all active projects so it can create/select any. */
async function listForUser(user) {
  if (user.role === 'admin' || user.username === 'demo') {
    return AiLabelProject.findAll({ where: { status: 'active' }, order: [['id', 'DESC']] })
  }

  const assignCol = user.role === 'validator' ? 'assigned_validator_id' : 'assigned_labeler_id'
  const rows = await AiLabelCase.findAll({
    attributes: ['project_id'],
    where: { [assignCol]: user.id },
    group: ['project_id']
  })
  const ids = rows.map((r) => r.project_id)
  if (!ids.length) return []
  return AiLabelProject.findAll({ where: { id: { [Op.in]: ids }, status: 'active' }, order: [['id', 'DESC']] })
}

/** Project + labels + case statistics + per-user progress. */
async function detail(projectId, user) {
  const project = await AiLabelProject.findByPk(projectId)
  if (!project) return null

  const labels = await AiLabelProjectLabel.findAll({
    where: { project_id: projectId, is_active: true },
    order: [['class_id', 'ASC']]
  })

  const totalCases = await AiLabelCase.count({ where: { project_id: projectId } })
  const statusCounts = await AiLabelCase.findAll({
    attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
    where: { project_id: projectId },
    group: ['status'],
    raw: true
  })
  const annotatedCases = await AiLabelCase.count({
    where: { project_id: projectId, status: { [Op.ne]: 'unassigned' } }
  })

  // Labeler progress: cases assigned to me + how many I annotated
  let myAssigned = null
  let myAnnotated = null
  if (user.role === 'labeler' || user.role === 'validator') {
    const col = user.role === 'validator' ? 'assigned_validator_id' : 'assigned_labeler_id'
    myAssigned = await AiLabelCase.count({ where: { project_id: projectId, [col]: user.id } })
    myAnnotated = await AiLabelAnnotation.count({
      where: { project_id: projectId, created_by: user.id }
    })
  }

  return {
    project,
    labels,
    stats: {
      totalCases,
      statusCounts,
      annotatedCases,
      myAssigned,
      myAnnotated
    }
  }
}

/** Create a project with an initial label list (names are uppercased). */
async function create({ name, description, annotationType }, labels = [], user) {
  const labelNames = (Array.isArray(labels) ? labels : [])
    .map((l) => String(l?.name ?? l).trim().toUpperCase())
    .filter(Boolean)

  const project = await AiLabelProject.create({
    name: String(name).trim(),
    description: description || null,
    annotation_type: annotationType || 'bbox',
    created_by: user ? user.id : null
  })

  for (let i = 0; i < labelNames.length; i++) {
    await AiLabelProjectLabel.create({
      project_id: project.id,
      class_id: i + 1,
      name: labelNames[i],
      is_active: true
    })
  }
  return project
}

/** Rename a project (topic) / edit description. */
async function update(projectId, { name, description }, user) {
  const project = await AiLabelProject.findByPk(projectId)
  if (!project) return null
  if (name !== undefined) project.name = String(name).trim()
  if (description !== undefined) project.description = description
  await project.save()
  return project
}

/** Add one label to a project. Uppercase; rejects duplicates. */
async function addLabel(projectId, name, user) {
  const project = await AiLabelProject.findByPk(projectId)
  if (!project) return null
  const trimmed = String(name || '').trim().toUpperCase()
  if (!trimmed) return { error: 'Label name is required' }

  const dup = await AiLabelProjectLabel.findOne({
    where: { project_id: projectId, name: trimmed, is_active: true }
  })
  if (dup) return { error: `Label "${trimmed}" already exists` }

  const maxRow = await AiLabelProjectLabel.findOne({
    where: { project_id: projectId },
    order: [['class_id', 'DESC']]
  })
  const nextClassId = (maxRow && maxRow.class_id ? maxRow.class_id : 0) + 1
  return AiLabelProjectLabel.create({
    project_id: projectId,
    class_id: nextClassId,
    name: trimmed,
    is_active: true
  })
}

/** Rename a label. Uppercase; rejects duplicates. */
async function updateLabel(projectId, labelId, name, user) {
  const label = await AiLabelProjectLabel.findOne({
    where: { id: labelId, project_id: projectId }
  })
  if (!label) return null
  const trimmed = String(name || '').trim().toUpperCase()
  if (!trimmed) return { error: 'Label name is required' }

  const dup = await AiLabelProjectLabel.findOne({
    where: { project_id: projectId, name: trimmed, is_active: true, id: { [Op.ne]: labelId } }
  })
  if (dup) return { error: `Label "${trimmed}" already exists` }

  label.name = trimmed
  await label.save()
  return label
}

/** Soft-delete a label (keeps history on existing annotations). */
async function removeLabel(projectId, labelId, user) {
  const label = await AiLabelProjectLabel.findOne({
    where: { id: labelId, project_id: projectId }
  })
  if (!label) return null
  label.is_active = false
  await label.save()
  return label
}

module.exports = { listForUser, detail, create, update, addLabel, updateLabel, removeLabel }
