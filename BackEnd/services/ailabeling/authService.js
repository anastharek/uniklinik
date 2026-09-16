'use strict'

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../../database/models')

const AiLabelUser = db.AiLabelUser

const TOKEN_TTL = '12h'
const COOKIE_NAME = 'ailabel_token'

async function login(username, password) {
  if (!username || !password) return null
  const user = await AiLabelUser.findOne({ where: { username } })
  if (!user || !user.is_active) return null
  const ok = bcrypt.compareSync(String(password), user.password_hash)
  if (!ok) return null
  return user
}

function issueToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role
    },
    process.env.TOKEN_SECRET,
    { expiresIn: TOKEN_TTL }
  )
}

function verifyToken(token) {
  return jwt.verify(token, process.env.TOKEN_SECRET)
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role
  }
}

function cookieOptions(req) {
  const secure = !!(req.secure || req.headers['x-forwarded-proto'] === 'https')
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 12 * 60 * 60 * 1000 // 12h, matches TOKEN_TTL
  }
}

module.exports = { login, issueToken, verifyToken, publicUser, cookieOptions, COOKIE_NAME }
