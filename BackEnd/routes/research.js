'use strict'

/**
 * Research endpoints — DICOM + NIfTI research viewer (Phase 1).
 * Auth: userAuthMidelware (valid viewer session, same as /api/dicom-web).
 */
const express = require('express')
const router = express.Router()
const fs = require('fs')
const db = require('../database/models')
const niftiService = require('../services/ailabeling/niftiService')
const { userAuthMidelware, researchScopeMidelware } = require('../midelwares/authentication')

// All research endpoints require a valid viewer session (tokenOrthancJs JWT)
// — same access posture as the existing /api/dicom-web proxy. Every request
// is also scoped by explicit StudyInstanceUID/SeriesInstanceUID (never by
// filesystem paths).
// External/shared-link sessions (only the `external` cookie, no JWT) are
// allowed ONLY for the study in their cookie (researchScopeMidelware marks
// them; each route enforces the study-scope check).
router.use(researchScopeMidelware)
router.use((req, res, next) => {
  if (req.isExternal) return next() // external/shared-link: scope-checked below
  return userAuthMidelware(req, res, next)
})

/** Reject external sessions whose request is outside their shared study. */
function requireStudyScope(req, res, studyUid) {
  if (!req.isExternal) return true
  if (studyUid && studyUid === req.externalStudyUid) return true
  res.status(403).json({ message: 'Forbidden: study outside external scope' })
  return false
}

/** Reject external sessions fetching a job that belongs to another study. */
function requireJobScope(req, res, job) {
  if (!req.isExternal) return true
  if (job && job.studyUid && job.studyUid === req.externalStudyUid) return true
  res.status(403).json({ message: 'Forbidden: job outside external scope' })
  return false
}

const ResearchProvenance = db.ResearchProvenance

/**
 * POST /api/research/nifti/convert
 * body: { studyInstanceUID, seriesInstanceUID }
 * Returns { jobId, cached }
 */
router.post('/nifti/convert', async (req, res) => {
  try {
    const { studyInstanceUID, seriesInstanceUID } = req.body || {}
    if (!studyInstanceUID || !seriesInstanceUID) {
      return res.status(400).json({ message: 'studyInstanceUID and seriesInstanceUID are required' })
    }
    if (!requireStudyScope(req, res, studyInstanceUID)) return
    const job = await niftiService.convert(studyInstanceUID, seriesInstanceUID)
    return res.json({ jobId: job.id, cached: job.status === 'ready' })
  } catch (err) {
    console.error('[research] convert error', err)
    return res.status(500).json({ message: String((err && err.message) || err) })
  }
})

/** GET /api/research/nifti/:jobId/status */
router.get('/nifti/:jobId/status', async (req, res) => {
  const job = niftiService.getJob(req.params.jobId)
  if (!job) return res.status(404).json({ message: 'Job not found (server restarted?) — start a new conversion' })
  if (!requireJobScope(req, res, job)) return
  return res.json(niftiService.jobPublic(job))
})

/** GET /api/research/nifti/:jobId/file — the .nii.gz (auth-gated) */
router.get('/nifti/:jobId/file', async (req, res) => {
  try {
    const job = niftiService.getJob(req.params.jobId)
    if (!job) return res.status(404).json({ message: 'Job not found' })
    if (!requireJobScope(req, res, job)) return
    if (job.status !== 'ready' || !job.niiPath || !fs.existsSync(job.niiPath)) {
      return res.status(409).json({ message: 'NIfTI not ready yet' })
    }
    res.setHeader('Content-Type', 'application/gzip')
    res.setHeader('Content-Disposition', `attachment; filename="nifti-${job.cacheKey}.nii.gz"`)
    fs.createReadStream(job.niiPath).pipe(res)
  } catch (err) {
    console.error('[research] file error', err)
    return res.status(500).json({ message: String((err && err.message) || err) })
  }
})

/** GET /api/research/nifti/:jobId/metadata — geometry/provenance/ADC validation */
router.get('/nifti/:jobId/metadata', async (req, res) => {
  const job = niftiService.getJob(req.params.jobId)
  if (!job) return res.status(404).json({ message: 'Job not found' })
  if (!requireJobScope(req, res, job)) return
  if (!job.metadata) return res.status(409).json({ message: 'Metadata not ready yet' })
  return res.json(job.metadata)
})

/**
 * POST /api/research/derived-dicom/provenance
 * Record provenance for a derived (research) series saved by the client.
 * body: {
 *   sourceStudyInstanceUID, sourceSeriesInstanceUID,
 *   outputSeriesInstanceUID, sourceSeriesDescription, sourceModality,
 *   converterSoftware, converterVersion, adcUnits, analysisModule,
 *   analysisPayload (JSON object)
 * }
 */
router.post('/derived-dicom/provenance', async (req, res) => {
  try {
    const b = req.body || {}
    if (!b.sourceStudyInstanceUID || !b.sourceSeriesInstanceUID) {
      return res.status(400).json({ message: 'sourceStudyInstanceUID and sourceSeriesInstanceUID are required' })
    }
    const row = await ResearchProvenance.create({
      source_study_instance_uid: b.sourceStudyInstanceUID,
      source_series_instance_uid: b.sourceSeriesInstanceUID,
      output_series_instance_uid: b.outputSeriesInstanceUID || null,
      source_series_description: b.sourceSeriesDescription || null,
      source_modality: b.sourceModality || null,
      converter_software: b.converterSoftware || null,
      converter_version: b.converterVersion || null,
      adc_units: b.adcUnits || null,
      analysis_module: b.analysisModule || null,
      analysis_payload: b.analysisPayload ? JSON.stringify(b.analysisPayload) : null,
      created_by: req.username || req.ailabelUser?.username || null,
    })
    return res.json({ provenanceId: row.id })
  } catch (err) {
    console.error('[research] provenance error', err)
    return res.status(500).json({ message: String((err && err.message) || err) })
  }
})

/** GET /api/research/provenance?studyInstanceUID=... — provenance for a study */
router.get('/provenance', async (req, res) => {
  try {
    const where = {}
    if (req.query.studyInstanceUID) where.source_study_instance_uid = req.query.studyInstanceUID
    if (req.query.seriesInstanceUID) where.source_series_instance_uid = req.query.seriesInstanceUID
    const rows = await ResearchProvenance.findAll({ where, order: [['id', 'DESC']], limit: 100 })
    return res.json(rows)
  } catch (err) {
    console.error('[research] provenance list error', err)
    return res.status(500).json({ message: String((err && err.message) || err) })
  }
})

module.exports = router
