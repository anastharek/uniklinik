'use strict'

const db = require('../../database/models')

const AiLabelCase = db.AiLabelCase
const AiLabelAnnotation = db.AiLabelAnnotation

/** Cases of a project visible to the user (assigned to them, or all for admin). */
async function listForUser(projectId, user) {
  const where = { project_id: projectId }
  if (user.role === 'labeler') where.assigned_labeler_id = user.id
  if (user.role === 'validator') where.assigned_validator_id = user.id

  const cases = await AiLabelCase.findAll({
    where,
    order: [['id', 'ASC']],
    include: [
      { model: db.AiLabelUser, as: 'labeler', attributes: ['id', 'username', 'full_name'] },
      { model: db.AiLabelUser, as: 'validator', attributes: ['id', 'username', 'full_name'] }
    ]
  })

  const result = []
  for (const c of cases) {
    const annCount = await AiLabelAnnotation.count({ where: { case_id: c.id } })
    const ann = await AiLabelAnnotation.findOne({
      where: { case_id: c.id },
      order: [['updatedAt', 'DESC']],
      include: [{ model: db.AiLabelUser, as: 'creator', attributes: ['username', 'full_name'] }]
    })
    result.push({
      id: c.id,
      case_code: c.case_code,
      status: c.status,
      study_instance_uid: c.study_instance_uid,
      series_instance_uid: c.series_instance_uid,
      labeler: c.labeler ? c.labeler.full_name : null,
      validator: c.validator ? c.validator.full_name : null,
      annotation_count: annCount,
      last_annotation: ann
        ? {
            label_name: ann.label_name,
            created_by: ann.creator ? ann.creator.full_name : null,
            updated_at: ann.updatedAt
          }
        : null
    })
  }
  return result
}

/** Single case with its annotations. */
async function getWithAnnotations(caseId, user) {
  const c = await AiLabelCase.findByPk(caseId, {
    include: [
      { model: db.AiLabelUser, as: 'labeler', attributes: ['id', 'username', 'full_name'] },
      { model: db.AiLabelUser, as: 'validator', attributes: ['id', 'username', 'full_name'] }
    ]
  })
  if (!c) return null

  // Role scoping: labeler/validator only see cases assigned to them (admin all)
  if (user.role === 'labeler' && c.assigned_labeler_id !== user.id) return null
  if (user.role === 'validator' && c.assigned_validator_id !== user.id) return null

  const annotations = await AiLabelAnnotation.findAll({
    where: { case_id: caseId },
    order: [['id', 'ASC']],
    include: [
      { model: db.AiLabelUser, as: 'creator', attributes: ['username', 'full_name'] },
      { model: db.AiLabelUser, as: 'editor', attributes: ['username', 'full_name'] }
    ]
  })

  return {
    id: c.id,
    project_id: c.project_id,
    case_code: c.case_code,
    status: c.status,
    study_instance_uid: c.study_instance_uid,
    series_instance_uid: c.series_instance_uid,
    labeler: c.labeler ? c.labeler.full_name : null,
    validator: c.validator ? c.validator.full_name : null,
    annotations: annotations.map((a) => ({
      id: a.id,
      label_id: a.label_id,
      label_name: a.label_name,
      annotation_type: a.annotation_type,
      series_instance_uid: a.series_instance_uid,
      sop_instance_uid: a.sop_instance_uid,
      frame_number: a.frame_number,
      data: a.data,
      status: a.status,
      created_by: a.creator ? a.creator.full_name : null,
      created_at: a.createdAt,
      updated_by: a.editor ? a.editor.full_name : null,
      updated_at: a.updatedAt
    }))
  }
}

module.exports = { listForUser, getWithAnnotations }
