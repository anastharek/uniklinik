'use strict'

const jwt = require('jsonwebtoken')
const { verifyToken } = require('./authService')

/** Require a valid AI Labeling session (JWT in httpOnly cookie). */
function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.ailabel_token
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' })
  }
  try {
    req.ailabelUser = verifyToken(token)
    return next()
  } catch (err) {
    return res.status(401).json({ message: 'Session expired or invalid' })
  }
}

/** Role-based authorization: requireRole('admin') / requireRole('admin','validator') */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.ailabelUser) {
      return res.status(401).json({ message: 'Not authenticated' })
    }
    if (!roles.includes(req.ailabelUser.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' })
    }
    return next()
  }
}

module.exports = { requireAuth, requireRole }
