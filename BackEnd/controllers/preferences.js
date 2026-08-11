const fs = require('fs');
const path = require('path');

const PREFS_FILE = path.join(__dirname, '..', 'preferences.json');
// Admin password for the preferences endpoint — read from env (set in
// .env / docker-compose.yml; never hardcoded in source).
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function _readPrefs() {
  try {
    if (fs.existsSync(PREFS_FILE)) {
      return JSON.parse(fs.readFileSync(PREFS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to read preferences:', e.message);
  }
  return { blockedSeries: [] };
}

function _writePrefs(data) {
  fs.writeFileSync(PREFS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * GET /api/preferences/global
 * Returns global preferences (no auth required — read-only).
 */
async function getGlobalPreferences(req, res) {
  const prefs = _readPrefs();
  res.json({ success: true, preferences: prefs });
}

/**
 * POST /api/preferences/global
 * Saves global preferences. Requires admin password in body.
 * Body: { password: "<ADMIN_PASSWORD>", preferences: { blockedSeries: [...] } }
 */
async function saveGlobalPreferences(req, res) {
  const { password, preferences } = req.body;

  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(403).json({ success: false, error: 'Invalid admin password' });
  }

  if (!preferences || typeof preferences !== 'object') {
    return res.status(400).json({ success: false, error: 'Missing preferences object' });
  }

  _writePrefs(preferences);
  console.log('Global preferences updated:', JSON.stringify(preferences));
  res.json({ success: true });
}

module.exports = { getGlobalPreferences, saveGlobalPreferences };
