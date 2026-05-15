/**
 * OHIF Stability Mode — Low-Memory & Crash Recovery
 *
 * localStorage keys (persistent across sessions):
 *   ohif_last_error         - Last window.onerror message
 *   ohif_last_promise_error - Last unhandledrejection reason
 *   ohif_last_session       - Last viewer session snapshot
 *   ohif_heartbeat          - Unix ms timestamp, updated every 3s
 *   ohif_crash_detected     - 'true' if previous abnormal reload detected
 *
 * sessionStorage keys (current tab only):
 *   ohif_stability_override - 'on' | 'off' (manual user override)
 *   ohif_stability_banner_hidden - 'true' if user dismissed banner
 *   ohif_large_study_banner_hidden - 'true' if user dismissed large-study specific banner
 */

const STORAGE = {
  LAST_ERROR: 'ohif_last_error',
  LAST_PROMISE_ERROR: 'ohif_last_promise_error',
  LAST_SESSION: 'ohif_last_session',
  HEARTBEAT: 'ohif_heartbeat',
  CRASH_DETECTED: 'ohif_crash_detected',
};

const SESSION = {
  STABILITY_OVERRIDE: 'ohif_stability_override',
  BANNER_HIDDEN: 'ohif_stability_banner_hidden',
  LARGE_STUDY_BANNER_HIDDEN: 'ohif_large_study_banner_hidden',
};

const HEARTBEAT_MS = 3000;
const SESSION_GRACE_MS = 15000;

export const LARGE_STUDY_SERIES_THRESHOLD = 50;
export const MOBILE_SERIES_THRESHOLD = 20;
export const INITIAL_THUMBNAILS_DESKTOP = 20;
export const INITIAL_THUMBNAILS_MOBILE = 10;
export const SERIES_INCREMENT = 20;

// ── Core detection ───────────────────────────────────────

export function isMobile() {
  return (
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1) ||
    (typeof window !== 'undefined' && window.innerWidth < 768)
  );
}

export function isCrashRecoveryDetected() {
  try {
    return sessionStorage.getItem(STORAGE.CRASH_DETECTED) === 'true';
  } catch (e) {
    return false;
  }
}

function _detectAbnormalReload() {
  const lastHeartbeat = _getLastHeartbeat();
  const lastSession = _getLastSession();
  if (!lastSession) return false;
  const heartbeatAge = lastHeartbeat ? Date.now() - lastHeartbeat : Infinity;
  return heartbeatAge <= SESSION_GRACE_MS + HEARTBEAT_MS;
}

export function isLargeStudyDetected(displaySetCount) {
  return displaySetCount > LARGE_STUDY_SERIES_THRESHOLD;
}

export function isMobileLargeStudyDetected(displaySetCount) {
  return isMobile() && displaySetCount > MOBILE_SERIES_THRESHOLD;
}

/**
 * Compute stability mode state.
 * Returns: { stabilityMode, crashDetected, largeStudy, mobileLargeStudy, reason }
 */
export function checkStabilityMode(displaySetCount) {
  const override = _getSession(SESSION.STABILITY_OVERRIDE);
  const crashDetected = isCrashRecoveryDetected();
  const largeStudy = isLargeStudyDetected(displaySetCount);
  const mobileLargeStudy = isMobileLargeStudyDetected(displaySetCount);

  let stabilityMode;
  let reason;

  if (override === 'on') {
    stabilityMode = true;
    reason = 'manual_on';
  } else if (override === 'off') {
    stabilityMode = false;
    reason = 'manual_off';
  } else if (crashDetected) {
    stabilityMode = true;
    reason = 'crash';
  } else if (largeStudy) {
    stabilityMode = true;
    reason = 'large_study';
  } else if (mobileLargeStudy) {
    stabilityMode = true;
    reason = 'mobile_large';
  } else {
    stabilityMode = false;
    reason = 'normal';
  }

  return { stabilityMode, crashDetected, largeStudy, mobileLargeStudy, reason };
}

export function getStabilityBannerText(result) {
  const { crashDetected, largeStudy, mobileLargeStudy, stabilityMode } = result;
  if (!stabilityMode) return null;

  if (crashDetected) {
    return 'Stability Mode is ON because the previous viewer session may not have closed normally. Series will load progressively.';
  }
  if (largeStudy) {
    return 'Large study detected. Stability Mode is ON to reduce memory use.';
  }
  if (mobileLargeStudy) {
    return 'Mobile low-memory mode is ON. Series will load progressively.';
  }
  return 'Stability Mode is ON. Series will load progressively.';
}

// ── Manual override (session only) ───────────────────────

export function setStabilityOverride(value) {
  _setSession(SESSION.STABILITY_OVERRIDE, value); // 'on' | 'off'
}

export function clearStabilityOverride() {
  _clearSession(SESSION.STABILITY_OVERRIDE);
}

export function getStabilityOverride() {
  return _getSession(SESSION.STABILITY_OVERRIDE);
}

// ── Banner dismiss (session only) ────────────────────────

export function hideStabilityBanner() {
  _setSession(SESSION.BANNER_HIDDEN, 'true');
}

export function isStabilityBannerHidden() {
  return _getSession(SESSION.BANNER_HIDDEN) === 'true';
}

export function hideLargeStudyBanner() {
  _setSession(SESSION.LARGE_STUDY_BANNER_HIDDEN, 'true');
}

export function isLargeStudyBannerHidden() {
  return _getSession(SESSION.LARGE_STUDY_BANNER_HIDDEN) === 'true';
}

// ── Initialization ───────────────────────────────────────

export function initStabilityMode(displaySetCount) {
  // Detect crash on fresh load
  const abnormal = _detectAbnormalReload();
  if (abnormal) {
    try {
      sessionStorage.setItem(STORAGE.CRASH_DETECTED, 'true');
    } catch (e) { /* ignore */ }
  }

  // Start heartbeat (session marker)
  startHeartbeat();

  return checkStabilityMode(displaySetCount);
}

// ── Heartbeat ────────────────────────────────────────────

let _heartbeatTimer = null;

export function startHeartbeat() {
  stopHeartbeat();
  _heartbeatTimer = setInterval(() => {
    try {
      localStorage.setItem(STORAGE.HEARTBEAT, Date.now().toString());
    } catch (e) { /* ignore */ }
  }, HEARTBEAT_MS);
}

export function stopHeartbeat() {
  if (_heartbeatTimer) {
    clearInterval(_heartbeatTimer);
    _heartbeatTimer = null;
  }
}

function _getLastHeartbeat() {
  try {
    const raw = localStorage.getItem(STORAGE.HEARTBEAT);
    return raw ? parseInt(raw, 10) : null;
  } catch (e) { return null; }
}

// ── Session save/load ────────────────────────────────────

export function saveSession(session) {
  try {
    localStorage.setItem(STORAGE.LAST_SESSION, JSON.stringify({
      ...session,
      savedAt: Date.now(),
    }));
  } catch (e) { /* ignore */ }
}

function _getLastSession() {
  try {
    const raw = localStorage.getItem(STORAGE.LAST_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

export function getLastSession() {
  return _getLastSession();
}

// ── Error handling ───────────────────────────────────────

export function saveLastError(message) {
  try {
    localStorage.setItem(STORAGE.LAST_ERROR, typeof message === 'string' ? message : JSON.stringify(message));
  } catch (e) { /* ignore */ }
}

export function saveLastPromiseError(reason) {
  const msg = reason instanceof Error ? reason.message
    : typeof reason === 'string' ? reason
    : JSON.stringify(reason).slice(0, 500);
  try {
    localStorage.setItem(STORAGE.LAST_PROMISE_ERROR, msg);
  } catch (e) { /* ignore */ }
}

export function initGlobalErrorHandlers() {
  window.onerror = function (message, source, lineno, colno, error) {
    const msg = error ? error.message || String(message) : String(message);
    saveLastError(msg);
    console.error('[OHIF Stability] window.onerror:', msg, { source, lineno, colno });
    return false;
  };
  window.addEventListener('unhandledrejection', function (event) {
    saveLastPromiseError(event.reason);
    console.error('[OHIF Stability] unhandledrejection:', event.reason);
  });
}

// ── Cache ────────────────────────────────────────────────

export function getMaxCornerstoneCacheMB() {
  if (window.config && window.config.maxCornerstoneCacheMB) {
    return window.config.maxCornerstoneCacheMB;
  }
  return 512;
}

// ── Cleanup ──────────────────────────────────────────────

export function clearAllRecoveryData() {
  try {
    localStorage.removeItem(STORAGE.LAST_SESSION);
    localStorage.removeItem(STORAGE.CRASH_DETECTED);
    localStorage.removeItem(STORAGE.LAST_ERROR);
    localStorage.removeItem(STORAGE.LAST_PROMISE_ERROR);
  } catch (e) { /* ignore */ }
}

// ── Session storage helpers ──────────────────────────────

function _getSession(key) {
  try { return sessionStorage.getItem(key); } catch (e) { return null; }
}
function _setSession(key, val) {
  try { sessionStorage.setItem(key, val); } catch (e) { /* ignore */ }
}
function _clearSession(key) {
  try { sessionStorage.removeItem(key); } catch (e) { /* ignore */ }
}

// ── Backward-compat ──────────────────────────────────────

export function isRecoveryMode() {
  try {
    return localStorage.getItem('ohif_recovery_mode') === 'true'
      || sessionStorage.getItem(STORAGE.CRASH_DETECTED) === 'true';
  } catch (e) { return false; }
}

export { STORAGE, SESSION };
