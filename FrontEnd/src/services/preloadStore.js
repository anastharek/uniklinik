import preloadApi from "./preload";

/**
 * Global preload job store (module-level singleton).
 * Polls the server for active preload jobs regardless of which page is open,
 * so progress keeps updating when the user navigates away from the search page.
 */
let jobs = {}; // studyId -> job snapshot
let listeners = new Set();
let pollTimer = null;

function emit() {
  listeners.forEach((cb) => cb(jobs));
}

export function subscribe(cb) {
  listeners.add(cb);
  cb(jobs);
  return () => listeners.delete(cb);
}

export function getJobs() {
  return jobs;
}

async function refresh() {
  try {
    const list = await preloadApi.active();
    const next = {};
    list.forEach((j) => {
      next[j.studyId] = j;
    });
    jobs = next;
    emit();
    if (Object.keys(jobs).length) {
      ensurePolling();
    } else {
      stopPolling();
    }
  } catch (e) {
    // transient network/auth error - keep polling if we have jobs
  }
}

function ensurePolling() {
  if (!pollTimer) {
    pollTimer = setInterval(refresh, 2000);
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/** Start preload for one study and begin polling */
export async function start(studyId) {
  const res = await preloadApi.start(studyId);
  refresh();
  return res;
}

/** Start preload for many studies at once (server queues them) */
export async function startMany(studyIds) {
  const res = await preloadApi.startMany(studyIds);
  refresh();
  return res;
}

export default {
  subscribe,
  getJobs,
  start,
  startMany,
};
