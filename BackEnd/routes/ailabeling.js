'use strict'

const express = require('express')
const router = express.Router()

const authController = require('../controllers/ailabeling/authController')
const projectController = require('../controllers/ailabeling/projectController')
const caseController = require('../controllers/ailabeling/caseController')
const annotationController = require('../controllers/ailabeling/annotationController')
const studyController = require('../controllers/ailabeling/studyController')
const { requireAuth } = require('../services/ailabeling/authMiddleware')

// ---- Auth (panel-only login) ----
router.post('/auth/login', authController.login)
router.post('/auth/logout', authController.logout)
router.get('/auth/me', requireAuth, authController.me)

// Grant this browser's DICOMweb proxy access to a study (sets `external`
// cookie like POST /api/auth/external/:studyInstanceId, but authenticated
// via the AI Labeling session so the panel can load any case in place).
router.post('/auth/external/:studyInstanceId', requireAuth, authController.externalStudy)

// ---- Projects ----
router.get('/projects', requireAuth, projectController.list)
router.get('/projects/:id', requireAuth, projectController.detail)
router.post('/projects', requireAuth, projectController.create)
router.put('/projects/:id', requireAuth, projectController.update)
router.post('/projects/:id/labels', requireAuth, projectController.addLabel)
router.put('/projects/:id/labels/:labelId', requireAuth, projectController.updateLabel)
router.delete('/projects/:id/labels/:labelId', requireAuth, projectController.removeLabel)

// ---- Project-wide export (all cases in the project) ----
router.get('/project/:projectId/export-yolo', requireAuth, studyController.exportYoloProject)
// Client-rendered variant: PNGs are rendered in the browser with the labeler's
// adjusted windowing (native resolution), posted here as base64 JSON.
router.post('/project/:projectId/export-yolo-rendered', requireAuth, studyController.exportYoloProjectRendered)

// ---- Cases ----
router.get('/projects/:id/cases', requireAuth, caseController.list)
router.get('/cases/:id/annotations', requireAuth, caseController.annotations)
router.get('/cases/:id', requireAuth, caseController.get)

// ---- Annotations ----
router.post('/annotations', requireAuth, annotationController.create)
router.put('/annotations/:id', requireAuth, annotationController.update)
router.delete('/annotations/:id', requireAuth, annotationController.remove)

// ---- Quick Label (study-scoped, no login UI — panel auto-logs-in) ----
router.get('/study/:studyUID', requireAuth, studyController.summary)
router.post('/study/:studyUID/annotations', requireAuth, studyController.createAnnotation)
router.get('/study/:studyUID/export-yolo', requireAuth, studyController.exportYolo)

module.exports = router
