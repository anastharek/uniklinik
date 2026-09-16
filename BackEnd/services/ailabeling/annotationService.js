'use strict'

const db = require('../../database/models')

const AiLabelCase = db.AiLabelCase
const AiLabelAnnotation = db.AiLabelAnnotation
const AiLabelProjectLabel = db.AiLabelProjectLabel

/** Can this user annotate the given case? Labeler must be assigned; validator
 *  and admin may also annotate. */
async function canAnnotate(caseId, user) {
  const c = await AiLabelCase.findByPk(caseId)
  if (!c) return { ok: false, code: 404, message: 'Case not found' }
  if (user.role === 'labeler' && c.assigned_labeler_id !== user.id) {
    return { ok: false, code: 403, message: 'Case not assigned to you' }
  }
  if (c.status === 'validated') {
    return { ok: false, code: 409, message: 'Case already validated — cannot modify' }
  }
  return { ok: true, case: c }
}

/** Validate + normalize a bbox annotation payload. */
function sanitizeBbox(body) {
  const nums = ['x1', 'y1', 'x2', 'y2', 'imageWidth', 'imageHeight']
  const data = {}
  for (const k of nums) {
    const v = Number(body[k])
    if (!Number.isFinite(v)) return { error: `Missing or invalid ${k}` }
    data[k] = v
  }
  if (data.x2 <= data.x1 || data.y2 <= data.y1) {
    return { error: 'Invalid bbox: x2>x1 and y2>y1 required' }
  }
  return { data }
}

async function create(payload, user) {
  const { caseId, labelId, labelName, annotationType, sopInstanceUID, frameNumber, ...rest } = payload

  if (!caseId || labelId === undefined || !labelName || !sopInstanceUID) {
    return { error: 'caseId, labelId, labelName, sopInstanceUID are required', code: 400 }
  }
  const check = await canAnnotate(caseId, user)
  if (!check.ok) return { error: check.message, code: check.code }
  const c = check.case

  // label must belong to the project
  const label = await AiLabelProjectLabel.findOne({
    where: { project_id: c.project_id, class_id: labelId, is_active: true }
  })
  if (!label) return { error: `Label class ${labelId} does not exist in this project`, code: 400 }

  const sanitized = sanitizeBbox(rest)
  if (sanitized.error) return { error: sanitized.error, code: 400 }

  const ann = await AiLabelAnnotation.create({
    project_id: c.project_id,
    case_id: c.id,
    study_instance_uid: c.study_instance_uid,
    series_instance_uid: c.series_instance_uid,
    sop_instance_uid: sopInstanceUID,
    frame_number: frameNumber || 1,
    annotation_type: annotationType || 'bbox',
    label_id: labelId,
    label_name: labelName,
    data: sanitized.data,
    status: 'draft',
    created_by: user.id
  })

  // case → IN_PROGRESS when it has its first annotation
  if (c.status === 'unassigned' || c.status === 'assigned') {
    await c.update({ status: 'in_progress' })
  }

  return { annotation: ann }
}

async function update(id, payload, user) {
  const ann = await AiLabelAnnotation.findByPk(id)
  if (!ann) return { error: 'Annotation not found', code: 404 }

  // Only drafts can be edited; only owner (or validator/admin) may edit
  if (ann.status !== 'draft') {
    return { error: 'Only draft annotations can be edited', code: 409 }
  }
  if (user.role === 'labeler' && ann.created_by !== user.id) {
    return { error: 'You can only edit your own annotations', code: 403 }
  }

  const sanitized = sanitizeBbox(payload)
  if (sanitized.error) return { error: sanitized.error, code: 400 }

  await ann.update({
    label_id: payload.labelId ?? ann.label_id,
    label_name: payload.labelName ?? ann.label_name,
    data: sanitized.data,
    updated_by: user.id
  })
  return { annotation: ann }
}

async function remove(id, user) {
  const ann = await AiLabelAnnotation.findByPk(id)
  if (!ann) return { error: 'Annotation not found', code: 404 }
  if (ann.status !== 'draft') {
    return { error: 'Only draft annotations can be deleted', code: 409 }
  }
  if (user.role === 'labeler' && ann.created_by !== user.id) {
    return { error: 'You can only delete your own annotations', code: 403 }
  }
  await ann.destroy()
  return { ok: true }
}

module.exports = { create, update, remove, canAnnotate }
