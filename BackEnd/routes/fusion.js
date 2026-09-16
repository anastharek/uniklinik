'use strict'

/**
 * Fusion endpoints — shared templates for the OHIF Overlay/Fusion panel.
 * Auth posture mirrors /api/research: valid viewer session (JWT) required,
 * external/shared-link sessions allowed (they can read/apply templates too).
 */
const express = require('express')
const router = express.Router()

const templateController = require('../controllers/fusion/templateController')
const { userAuthMidelware, researchScopeMidelware } = require('../midelwares/authentication')

router.use(researchScopeMidelware)
router.use((req, res, next) => {
  if (req.isExternal) return next()
  return userAuthMidelware(req, res, next)
})

router.get('/templates', templateController.list)
router.post('/templates', templateController.create)
router.delete('/templates/:id', templateController.remove)

module.exports = router
