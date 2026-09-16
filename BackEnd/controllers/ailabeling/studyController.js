'use strict'

/**
 * Study-scoped quick labeling (Phase 0 minimal flow).
 * One project ("Quick Label"); cases and labels are auto-created per study.
 * Auth: requireAuth (panel auto-logs-in as `demo`) — no login UI needed.
 */
const crypto = require('crypto')
const db = require('../../database/models')
const JSZip = require('jszip')

const AiLabelProject = db.AiLabelProject
const AiLabelCase = db.AiLabelCase
const AiLabelProjectLabel = db.AiLabelProjectLabel
const AiLabelAnnotation = db.AiLabelAnnotation
const AiLabelUser = db.AiLabelUser

const ORTHANC = process.env.ORTHANC_ADDRESS + ':' + process.env.ORTHANC_PORT
const ORTHANC_AUTH = Buffer.from(
  `${process.env.ORTHANC_USERNAME}:${process.env.ORTHANC_PASSWORD}`
).toString('base64')

async function orthancGet(api, asJson = true) {
  const res = await fetch(ORTHANC + api, {
    headers: { Authorization: 'Basic ' + ORTHANC_AUTH },
  })
  if (!res.ok) throw new Error(`Orthanc ${api} -> ${res.status}`)
  return asJson ? res.json() : res.arrayBuffer()
}

async function getQuickProject() {
  let project = await AiLabelProject.findOne({ where: { name: 'Quick Label' } })
  if (!project) {
    project = await AiLabelProject.create({
      name: 'Quick Label',
      description: 'auto',
      annotation_type: 'bbox',
    })
  }
  return project
}

async function getOrCreateCase(project, studyUID, seriesUID) {
  const [row] = await AiLabelCase.findOrCreate({
    where: { project_id: project.id, study_instance_uid: studyUID, series_instance_uid: seriesUID },
    defaults: {
      case_code: 'Q' + crypto.createHash('md5').update(studyUID + seriesUID).digest('hex').slice(0, 8).toUpperCase(),
      status: 'assigned',
      assigned_labeler_id: (await getDemoUser()).id,
    },
  })
  return row
}

async function getDemoUser() {
  return AiLabelUser.findOne({ where: { username: 'demo' } })
}

async function getOrCreateLabel(project, name) {
  // enforce uppercase-only label names (Quick Label convention)
  const trimmed = String(name || '').trim().toUpperCase()
  if (!trimmed) throw new Error('Label name is required')
  let label = await AiLabelProjectLabel.findOne({ where: { project_id: project.id, name: trimmed } })
  if (!label) {
    const maxRow = await AiLabelProjectLabel.findOne({
      where: { project_id: project.id },
      order: [['class_id', 'DESC']],
    })
    const nextClassId = (maxRow && maxRow.class_id ? maxRow.class_id : 0) + 1
    label = await AiLabelProjectLabel.create({
      project_id: project.id,
      name: trimmed,
      class_id: nextClassId,
    })
  }
  return label
}

// ── GET /study/:studyUID — labels + annotations for the whole study ─────────
// Optional ?projectId= scopes to that project (default: Quick Label project).
const summary = async (req, res) => {
  const { studyUID } = req.params
  const projectId = Number(req.query.projectId) || null
  const project = projectId
    ? await AiLabelProject.findByPk(projectId)
    : await getQuickProject()
  if (!project) return res.status(404).json({ message: 'Project not found' })

  const cases = await AiLabelCase.findAll({
    where: { project_id: project.id, study_instance_uid: studyUID },
  })
  const caseIds = cases.map(c => c.id)

  const labels = await AiLabelProjectLabel.findAll({
    where: { project_id: project.id },
    order: [['class_id', 'ASC']],
  })
  const labelById = {}
  labels.forEach(l => { labelById[l.id] = l })

  let annotations = []
  if (caseIds.length) {
    annotations = await AiLabelAnnotation.findAll({
      where: { case_id: caseIds },
      order: [['createdAt', 'DESC']],
      include: [{ model: AiLabelUser, as: 'creator', attributes: ['username'] }],
    })
  }

  const labelCounts = {}
  for (const a of annotations) {
    const name = labelById[a.label_id] ? labelById[a.label_id].name : a.label_name
    labelCounts[name] = (labelCounts[name] || 0) + 1
  }

  return res.json({
    study_uid: studyUID,
    project: { id: project.id, name: project.name },
    labels: labels.map(l => ({
      id: l.id,
      class_id: l.class_id,
      name: l.name,
      count: labelCounts[l.name] || 0,
    })),
    annotations: annotations.map(a => ({
      id: a.id,
      label: labelById[a.label_id] ? labelById[a.label_id].name : a.label_name,
      class_id: labelById[a.label_id] ? labelById[a.label_id].class_id : null,
      series_instance_uid: a.series_instance_uid,
      sop_instance_uid: a.sop_instance_uid,
      frame_number: a.frame_number,
      bbox: a.data,
      createdAt: a.createdAt,
      labeler: a.creator ? a.creator.username : null,
    })),
  })
}

// ── POST /study/:studyUID/annotations — auto case+label, create annotation ──
// Optional body.projectId scopes to that project (default: Quick Label project).
const createAnnotation = async (req, res) => {
  const { studyUID } = req.params
  const {
    seriesInstanceUID,
    sopInstanceUID,
    frameNumber = 1,
    labelName,
    projectId,
    x1, y1, x2, y2, imageWidth, imageHeight,
    windowWidth, windowCenter, invert,
  } = req.body || {}

  if (!seriesInstanceUID || !sopInstanceUID || !labelName || x1 == null || y1 == null || x2 == null || y2 == null) {
    return res.status(400).json({ message: 'Missing required fields (series/sop/labelName/bbox)' })
  }

  const project = projectId
    ? await AiLabelProject.findByPk(Number(projectId))
    : await getQuickProject()
  if (!project) return res.status(404).json({ message: 'Project not found' })
  const label = await getOrCreateLabel(project, labelName)
  const kase = await getOrCreateCase(project, studyUID, seriesInstanceUID)
  const demo = await getDemoUser()

  const ann = await AiLabelAnnotation.create({
    project_id: project.id,
    case_id: kase.id,
    study_instance_uid: studyUID,
    series_instance_uid: seriesInstanceUID,
    sop_instance_uid: sopInstanceUID,
    frame_number: Number(frameNumber) || 1,
    annotation_type: 'bbox',
    label_id: label.id,
    label_name: label.name,
    data: {
      x1: Number(x1), y1: Number(y1), x2: Number(x2), y2: Number(y2),
      imageWidth: Number(imageWidth), imageHeight: Number(imageHeight),
      // windowing the labeler had applied at draw time (used by the
      // client-rendered YOLO export so exported images match the viewer)
      ...(Number.isFinite(Number(windowWidth)) ? { windowWidth: Number(windowWidth) } : {}),
      ...(Number.isFinite(Number(windowCenter)) ? { windowCenter: Number(windowCenter) } : {}),
      ...(invert ? { invert: true } : {}),
    },
    status: 'saved',
    created_by: demo ? demo.id : null,
  })

  if (kase.status === 'assigned' || kase.status === 'unassigned') {
    kase.status = 'in_progress'
    await kase.save()
  }

  return res.json({
    id: ann.id,
    label: label.name,
    class_id: label.class_id,
    series_instance_uid: seriesInstanceUID,
    sop_instance_uid: sopInstanceUID,
    frame_number: ann.frame_number,
    bbox: ann.data,
    createdAt: ann.createdAt,
  })
}

// ── GET /study/:studyUID/export-yolo — ZIP: images + labels + manifest ─────
const EXPORT_PASSWORD = process.env.EXPORT_PASSWORD || 'qwertyuiop@12'

/** Check the export password (header x-export-password or ?password=). */
function exportPasswordOk(req) {
  const given = req.headers['x-export-password'] || req.query.password
  return typeof given === 'string' && given === EXPORT_PASSWORD
}

/** Safe zip filename: project name + local date/time of export. */
function exportZipName(projectName) {
  const safe = String(projectName || 'yolo').replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'yolo'
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return `${safe}_${ts}.zip`
}

const exportYolo = async (req, res) => {
  const { studyUID } = req.params
  const project = await getQuickProject()
  const cases = await AiLabelCase.findAll({ where: { project_id: project.id, study_instance_uid: studyUID } })
  const caseIds = cases.map(c => c.id)

  if (!caseIds.length) {
    return res.status(404).json({ message: 'No annotations for this study yet' })
  }

  const caseCodeById = {}
  cases.forEach(c => { caseCodeById[c.id] = c.case_code })

  const annotations = await AiLabelAnnotation.findAll({ where: { case_id: caseIds } })

  const labels = await AiLabelProjectLabel.findAll({
    where: { project_id: project.id },
    order: [['class_id', 'ASC']],
  })
  // YOLO class index = position in class_id order (0..N-1)
  const classIndex = {}
  const classIdByName = {}
  labels.forEach((l, i) => {
    classIndex[l.class_id] = i
    classIdByName[l.name] = l.class_id
  })

  const zip = new JSZip()
  const imageDir = zip.folder('images')
  const labelDir = zip.folder('labels')

  zip.file('labels.txt', labels.map(l => `${classIndex[l.class_id]} ${l.name}`).join('\n'))

  // group annotations per image (sop + frame)
  const byImage = {}
  for (const a of annotations) {
    const key = a.sop_instance_uid + '#' + (a.frame_number || 1)
    if (!byImage[key]) {
      byImage[key] = { sop: a.sop_instance_uid, frame: a.frame_number || 1, rows: [] }
    }
    byImage[key].rows.push(a)
  }

  const manifest = []
  let idx = 0
  for (const key of Object.keys(byImage)) {
    const group = byImage[key]

    const id = await findOrthancInstanceId(group.sop)
    if (!id) {
      console.warn('[ailabeling] export: instance not found for sop', group.sop)
      continue
    }

    const meta = await orthancGet(`/instances/${id}`)
    const png = await framePreview(id, group.frame, meta)
    const t = meta.MainDicomTags || {}
    const iw = Number(t.Columns) || 512
    const ih = Number(t.Rows) || 512

    const base = `img_${String(idx).padStart(4, '0')}`
    imageDir.file(base + '.png', Buffer.from(png))

    const yoloLines = []
    for (const a of group.rows) {
      const b = a.data || {}
      const w = b.imageWidth || iw
      const h = b.imageHeight || ih
      const cx = ((b.x1 + b.x2) / 2) / w
      const cy = ((b.y1 + b.y2) / 2) / h
      const bw = (b.x2 - b.x1) / w
      const bh = (b.y2 - b.y1) / h
      const classId = classIdByName[a.label_name] != null ? classIdByName[a.label_name] : 0
      const ci = classIndex[classId] != null ? classIndex[classId] : 0
      yoloLines.push(`${ci} ${clamp01(cx)} ${clamp01(cy)} ${clamp01(bw)} ${clamp01(bh)}`)
      manifest.push({
        image_id: base,
        case_code: caseCodeById[a.case_id] || a.case_id,
        study_uid: studyUID,
        series_uid: a.series_instance_uid,
        sop_uid: a.sop_instance_uid,
        frame: a.frame_number || 1,
        label: a.label_name,
        class_id: classId,
        original_w: w,
        original_h: h,
        export_w: iw,
        export_h: ih,
        split: splitFor(a.sop_instance_uid),
      })
    }
    labelDir.file(base + '.txt', yoloLines.join('\n'))
    idx++
  }

  if (!idx) {
    return res.status(404).json({ message: 'No annotatable images resolved from Orthanc' })
  }

  const header =
    'image_id,case_code,study_uid,series_uid,sop_uid,frame,label,class_id,original_w,original_h,export_w,export_h,split'
  const rows = manifest.map(m =>
    [
      m.image_id, m.case_code, m.study_uid, m.series_uid, m.sop_uid, m.frame,
      `"${m.label}"`, m.class_id, m.original_w, m.original_h, m.export_w, m.export_h, m.split,
    ].join(','))
  zip.file('manifest.csv', [header, ...rows].join('\n'))

  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  res.set('Content-Type', 'application/zip')
  res.set('Content-Disposition', `attachment; filename="yolo_${studyUID.slice(0, 12)}.zip"`)
  return res.send(buf)
}

// ── GET /project/:projectId/export-yolo — ZIP across ALL cases in the project
// (not just the current study), as requested: export includes every label
// from every case of the selected project. Optional ?studyUID= limits to one
// study (kept for the panel's per-study button).
//
// Image rendering is server-side here: correct annotated FRAME (multi-frame
// aware) but DICOM-default windowing. For exports that reproduce the
// labeler's adjusted windowing, the panel uses the rendered variant below
// (POST /project/:projectId/export-yolo-rendered).
const exportYoloProject = async (req, res) => {
  if (!exportPasswordOk(req)) {
    return res.status(403).json({ message: 'Wrong export password' })
  }
  const projectId = Number(req.params.projectId)
  const studyUID = req.query.studyUID || null
  const project = await AiLabelProject.findByPk(projectId)
  if (!project) return res.status(404).json({ message: 'Project not found' })

  const where = { project_id: projectId }
  if (studyUID) where.study_instance_uid = studyUID
  const cases = await AiLabelCase.findAll({ where })
  const annotations = await AiLabelAnnotation.findAll({ where: { case_id: cases.map(c => c.id) } })

  if (!annotations.length) {
    return res.status(404).json({ message: 'No annotations for this project yet' })
  }

  const zip = await buildProjectZip({
    project,
    cases,
    annotations,
    studyUID,
    pngResolver: async (key, group) => {
      const id = await findOrthancInstanceId(group.sop)
      if (!id) return null
      const meta = await orthancGet(`/instances/${id}`)
      const png = await framePreview(id, group.frame, meta)
      const t = meta.MainDicomTags || {}
      return { png, w: Number(t.Columns) || 512, h: Number(t.Rows) || 512 }
    },
  })

  if (!zip) {
    return res.status(404).json({ message: 'No annotatable images resolved from Orthanc' })
  }

  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  const fname = exportZipName(project.name)
  res.set('Content-Type', 'application/zip')
  res.set('Content-Disposition', `attachment; filename="${fname}"`)
  return res.send(buf)
}

// ── POST /project/:projectId/export-yolo-rendered — ZIP with client-rendered
// images. The panel renders every annotated image at NATIVE resolution in the
// browser (cornerstone decodes the frame, windowing from the annotation's
// stored windowWidth/windowCenter — i.e. exactly what the labeler saw) and
// sends the PNGs here keyed by `<sop>#<frame>`. This solves both export bugs:
//  1. multi-frame series exported the FIRST frame (server `/preview` is
//     frame-0 only); client renders the exact labeled frame.
//  2. adjusted window/level was lost (this Orthanc build ignores window/level
//     query args on preview); client applies the stored windowing.
const exportYoloProjectRendered = async (req, res) => {
  if (!exportPasswordOk(req)) {
    return res.status(403).json({ message: 'Wrong export password' })
  }
  const projectId = Number(req.params.projectId)
  const project = await AiLabelProject.findByPk(projectId)
  if (!project) return res.status(404).json({ message: 'Project not found' })

  const images = (req.body && req.body.images) || {}
  const cases = await AiLabelCase.findAll({ where: { project_id: projectId } })
  const annotations = await AiLabelAnnotation.findAll({ where: { case_id: cases.map(c => c.id) } })

  if (!annotations.length) {
    return res.status(404).json({ message: 'No annotations for this project yet' })
  }

  const zip = await buildProjectZip({
    project,
    cases,
    annotations,
    studyUID: null,
    pngResolver: async (key) => {
      const entry = images[key]
      if (!entry || !entry.png) return null
      return {
        png: Buffer.from(entry.png, 'base64'),
        w: Number(entry.w) || 0,
        h: Number(entry.h) || 0,
      }
    },
  })

  if (!zip) {
    return res.status(404).json({ message: 'No annotatable images resolved' })
  }

  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  const fname = exportZipName(project.name)
  res.set('Content-Type', 'application/zip')
  res.set('Content-Disposition', `attachment; filename="${fname}"`)
  return res.send(buf)
}

// Shared project-zip builder. `pngResolver(key, group)` must return
// `{ png: Buffer, w, h }` for an image key `<sop>#<frame>` (or null to skip).
async function buildProjectZip({ project, cases, annotations, studyUID, pngResolver }) {
  const caseIds = cases.map(c => c.id)
  if (!caseIds.length || !annotations.length) return null

  const caseCodeById = {}
  cases.forEach(c => { caseCodeById[c.id] = c.case_code })

  const labels = await AiLabelProjectLabel.findAll({
    where: { project_id: project.id, is_active: true },
    order: [['class_id', 'ASC']],
  })
  // YOLO class index = position in class_id order (0..N-1)
  const classIndex = {}
  const classIdByName = {}
  labels.forEach((l, i) => {
    classIndex[l.class_id] = i
    classIdByName[l.name] = l.class_id
  })

  const zip = new JSZip()
  const imageDir = zip.folder('images')
  const labelDir = zip.folder('labels')

  zip.file('labels.txt', labels.map(l => `${classIndex[l.class_id]} ${l.name}`).join('\n'))

  // group annotations per image (sop + frame)
  const byImage = {}
  for (const a of annotations) {
    const key = a.sop_instance_uid + '#' + (a.frame_number || 1)
    if (!byImage[key]) {
      byImage[key] = { sop: a.sop_instance_uid, frame: a.frame_number || 1, rows: [] }
    }
    byImage[key].rows.push(a)
  }

  const manifest = []
  let idx = 0
  for (const key of Object.keys(byImage)) {
    const group = byImage[key]

    let img = null
    try {
      img = await pngResolver(key, group)
    } catch (e) {
      console.warn('[ailabeling] export: png resolve failed for', key, '-', e.message)
    }
    if (!img || !img.png) {
      console.warn('[ailabeling] export: no png for', key)
      continue
    }
    const iw = img.w || 512
    const ih = img.h || 512

    const base = `img_${String(idx).padStart(4, '0')}`
    imageDir.file(base + '.png', Buffer.from(img.png))

    const yoloLines = []
    for (const a of group.rows) {
      const b = a.data || {}
      const w = b.imageWidth || iw
      const h = b.imageHeight || ih
      const cx = ((b.x1 + b.x2) / 2) / w
      const cy = ((b.y1 + b.y2) / 2) / h
      const bw = (b.x2 - b.x1) / w
      const bh = (b.y2 - b.y1) / h
      const classId = classIdByName[a.label_name] != null ? classIdByName[a.label_name] : 0
      const ci = classIndex[classId] != null ? classIndex[classId] : 0
      yoloLines.push(`${ci} ${clamp01(cx)} ${clamp01(cy)} ${clamp01(bw)} ${clamp01(bh)}`)
      manifest.push({
        image_id: base,
        case_code: caseCodeById[a.case_id] || a.case_id,
        project: project.name,
        study_uid: a.study_instance_uid || studyUID,
        series_uid: a.series_instance_uid,
        sop_uid: a.sop_instance_uid,
        frame: a.frame_number || 1,
        label: a.label_name,
        class_id: classId,
        original_w: w,
        original_h: h,
        export_w: iw,
        export_h: ih,
        split: splitFor(a.sop_instance_uid),
      })
    }
    labelDir.file(base + '.txt', yoloLines.join('\n'))
    idx++
  }

  if (!idx) return null

  const header =
    'image_id,case_code,project,study_uid,series_uid,sop_uid,frame,label,class_id,original_w,original_h,export_w,export_h,split'
  const rows = manifest.map(m =>
    [
      m.image_id, m.case_code, `"${m.project}"`, m.study_uid, m.series_uid, m.sop_uid, m.frame,
      `"${m.label}"`, m.class_id, m.original_w, m.original_h, m.export_w, m.export_h, m.split,
    ].join(','))
  zip.file('manifest.csv', [header, ...rows].join('\n'))

  return zip
}

// ── helpers ────────────────────────────────────────────────────────────────

/** Render the annotated frame of a (possibly multi-frame) instance as PNG.
 *  `/instances/{id}/preview` always renders frame 0 — for the multi-frame CT
 *  series labeled here that silently exported the FIRST slice instead of the
 *  labeled one. Orthanc frame indexes are 0-based; clamp to frame count. */
async function framePreview(instanceId, frameNumber, meta) {
  const nf = Number((meta && meta.MainDicomTags && meta.MainDicomTags.NumberOfFrames) || 1)
  const idx = Math.min(Math.max((Number(frameNumber) || 1) - 1, 0), nf - 1)
  return orthancGet(`/instances/${instanceId}/frames/${idx}/preview`, false)
}

async function findOrthancInstanceId(sopUID) {
  const res = await fetch(ORTHANC + '/tools/find', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ORTHANC_AUTH,
    },
    body: JSON.stringify({ Level: 'Instance', Query: { SOPInstanceUID: sopUID } }),
  })
  if (!res.ok) return null
  const ids = await res.json()
  return ids && ids.length ? ids[0] : null
}

function clamp01(v) {
  return Math.min(0.999999, Math.max(0.000001, v))
}

// deterministic 80/10/10 train/val/test split
function splitFor(sopUID) {
  const h = crypto.createHash('md5').update(sopUID).digest()
  const r = h[0] / 255
  if (r < 0.8) return 'train'
  if (r < 0.9) return 'val'
  return 'test'
}

module.exports = { summary, createAnnotation, exportYolo, exportYoloProject, exportYoloProjectRendered }
