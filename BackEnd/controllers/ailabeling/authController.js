'use strict'

const authService = require('../../services/ailabeling/authService')

const login = async (req, res) => {
  const { username, password } = req.body || {}
  const user = await authService.login(username, password)
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' })
  }
  const token = authService.issueToken(user)
  res.cookie(authService.COOKIE_NAME, token, authService.cookieOptions(req))
  return res.json(authService.publicUser(user))
}

const logout = (req, res) => {
  res.clearCookie(authService.COOKIE_NAME, { httpOnly: true, sameSite: 'lax' })
  return res.json({ ok: true })
}

const me = (req, res) => {
  return res.json(req.ailabelUser)
}

// Grant DICOMweb proxy access to a study by setting the same `external`
// cookie the FrontEnd uses (see BackEnd/controllers/authentication.js
// loginExternal) — but authenticated through the AI Labeling session so the
// panel can load any assigned case in the current viewer without navigating.
const externalStudy = (req, res) => {
  const { studyInstanceId } = req.params
  if (!studyInstanceId || !/^[0-9.]+$/.test(studyInstanceId)) {
    return res.status(400).json({ message: 'Invalid StudyInstanceUID' })
  }
  res.cookie('external', studyInstanceId, { httpOnly: true, sameSite: 'lax', path: '/' })
  return res.json({ ok: true })
}

module.exports = { login, logout, me, externalStudy }
