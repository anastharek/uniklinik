// PadiMedical: Manage blocked series descriptions in localStorage + global sync
const STORAGE_KEY = 'ohif-blocked-series';
const GLOBAL_API = '/api/preferences/global';

/**
 * Fetch global preferences from server and merge into localStorage.
 * Called on app startup. Global prefs override local.
 */
async function loadGlobalPreferences() {
  try {
    const resp = await fetch(GLOBAL_API, { credentials: 'same-origin' });
    if (!resp.ok) return;
    const data = await resp.json();
    if (data.success && data.preferences && Array.isArray(data.preferences.blockedSeries)) {
      const global = data.preferences.blockedSeries;
      const local = getBlockedSeries();
      // Merge: global + unique local entries
      const merged = [...new Set([...global, ...local])];
      saveBlockedSeries(merged);
      console.log('Global preferences loaded:', global.length, 'blocked series');
    }
  } catch (e) {
    console.warn('Failed to load global preferences:', e);
  }
}

/**
 * Save preferences to global server (requires admin password).
 * Returns { success, error }.
 */
async function saveGlobalPreferences(password) {
  try {
    const resp = await fetch(GLOBAL_API, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        preferences: { blockedSeries: getBlockedSeries() }
      })
    });
    const data = await resp.json();
    return data;
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getBlockedSeries() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('Failed to load blocked series:', e);
    return [];
  }
}

function saveBlockedSeries(blockedSeries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blockedSeries));
  } catch (e) {
    console.warn('Failed to save blocked series:', e);
  }
}

function addBlockedSeries(pattern) {
  const normalized = pattern.trim().toLowerCase();
  if (!normalized) return false;
  const blocked = getBlockedSeries();
  if (!blocked.includes(normalized)) {
    blocked.push(normalized);
    saveBlockedSeries(blocked);
    return true;
  }
  return false;
}

function removeBlockedSeries(pattern) {
  const normalized = pattern.trim().toLowerCase();
  const blocked = getBlockedSeries();
  const idx = blocked.indexOf(normalized);
  if (idx > -1) {
    blocked.splice(idx, 1);
    saveBlockedSeries(blocked);
    return true;
  }
  return false;
}

function clearBlockedSeries() {
  saveBlockedSeries([]);
}

function shouldFilterSeries(seriesDescription) {
  if (!seriesDescription) return false;
  const blocked = getBlockedSeries();
  const desc = seriesDescription.toLowerCase();
  return blocked.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
      return regex.test(seriesDescription);
    }
    return desc.includes(pattern);
  });
}

const suggestedPatterns = [
  'DWI_og',
  'Reg - DWI',
  'Reg - DWI_og',
  'SCOUT',
  'LOCALIZER',
  'SURVEY',
  'RawData',
  'PR *',
  'SR *',
  'KO *',
];

export {
  getBlockedSeries,
  addBlockedSeries,
  removeBlockedSeries,
  clearBlockedSeries,
  shouldFilterSeries,
  suggestedPatterns,
  loadGlobalPreferences,
  saveGlobalPreferences,
};
