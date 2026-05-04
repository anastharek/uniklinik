// PadiMedical: Manage blocked series descriptions in localStorage
const STORAGE_KEY = 'ohif-blocked-series';

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
};
