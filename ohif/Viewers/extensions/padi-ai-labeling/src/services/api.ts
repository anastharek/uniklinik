const BASE = '/api/ailabeling';

class ApiError extends Error {
  constructor(status, message) {
    super(message || `Request failed (${status})`);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  if (res.status === 401) {
    throw new ApiError(401, 'Not authenticated');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || res.statusText);
  }
  return res.json();
}

export const api = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  // Grant DICOMweb proxy access to a study (sets `external` cookie server-side)
  openStudy: studyInstanceUID =>
    request(`/auth/external/${studyInstanceUID}`, { method: 'POST' }),
  // ── Quick Label (study-scoped, minimal flow) ──
  studySummary: (studyUID, projectId) =>
    request(`/study/${studyUID}${projectId ? `?projectId=${projectId}` : ''}`),
  createStudyAnnotation: (studyUID, payload) =>
    request(`/study/${studyUID}/annotations`, { method: 'POST', body: JSON.stringify(payload) }),
  exportYolo: async studyUID => {
    const res = await fetch(BASE + `/study/${studyUID}/export-yolo`, {
      credentials: 'same-origin',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.message || res.statusText);
    }
    return res.blob();
  },
  // ── Projects (Quick Label project mode) ──
  createProject: payload =>
    request('/projects', { method: 'POST', body: JSON.stringify(payload) }),
  updateProject: (id, payload) =>
    request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  addProjectLabel: (projectId, name) =>
    request(`/projects/${projectId}/labels`, { method: 'POST', body: JSON.stringify({ name }) }),
  updateProjectLabel: (projectId, labelId, name) =>
    request(`/projects/${projectId}/labels/${labelId}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteProjectLabel: (projectId, labelId) =>
    request(`/projects/${projectId}/labels/${labelId}`, { method: 'DELETE' }),
  exportProjectYolo: async (projectId, studyUID, password) => {
    const q = studyUID ? `?studyUID=${encodeURIComponent(studyUID)}` : '';
    const res = await fetch(BASE + `/project/${projectId}/export-yolo${q}`, {
      credentials: 'same-origin',
      headers: password ? { 'x-export-password': password } : {},
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.message || res.statusText);
    }
    const blob = await res.blob();
    // Server names the zip <project>_<YYYYMMDD>_<HHMMSS>.zip via Content-Disposition
    let filename = null;
    const cd = res.headers.get('content-disposition');
    if (cd) {
      const m = cd.match(/filename\*?=(?:UTF-8''|"|')([^";']+)/i) || cd.match(/filename="([^"]+)"/i);
      if (m) filename = decodeURIComponent(m[1]);
    }
    return { blob, filename };
  },
  // Client-rendered export: images = { '<sop>#<frame>': { png: base64, w, h } }.
  // The panel renders each annotated frame at native resolution with the
  // labeler's adjusted windowing, so the zip matches what was seen in OHIF.
  exportProjectYoloRendered: async (projectId, images, password) => {
    const res = await fetch(BASE + `/project/${projectId}/export-yolo-rendered`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(password ? { 'x-export-password': password } : {}),
      },
      body: JSON.stringify({ images }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.message || res.statusText);
    }
    const blob = await res.blob();
    let filename = null;
    const cd = res.headers.get('content-disposition');
    if (cd) {
      const m = cd.match(/filename\*?=(?:UTF-8''|"|')([^";']+)/i) || cd.match(/filename="([^"]+)"/i);
      if (m) filename = decodeURIComponent(m[1]);
    }
    return { blob, filename };
  },
  // All annotations of a project (cases + per-case annotations, flattened).
  projectAnnotations: async projectId => {
    const d = await request(`/projects/${projectId}/cases`);
    const cases = (d && d.cases) || [];
    const out = [];
    for (const c of cases) {
      const dd = await request(`/cases/${c.id}/annotations`);
      const anns = (dd && dd.annotations) || [];
      for (const a of anns) {
        out.push({
          ...a,
          case_code: c.case_code,
          study_instance_uid: c.study_instance_uid,
          series_instance_uid: a.series_instance_uid || c.series_instance_uid,
        });
      }
    }
    return out;
  },
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  projects: () => request('/projects'),
  projectDetail: projectId => request(`/projects/${projectId}`),
  cases: projectId => request(`/projects/${projectId}/cases`),
  caseAnnotations: caseId => request(`/cases/${caseId}/annotations`),
  createAnnotation: payload =>
    request('/annotations', { method: 'POST', body: JSON.stringify(payload) }),
  updateAnnotation: (id, payload) =>
    request(`/annotations/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteAnnotation: id => request(`/annotations/${id}`, { method: 'DELETE' }),
};

export { ApiError };
