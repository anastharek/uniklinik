/**
 * Tiny client for the shared fusion-template endpoints (/api/fusion).
 * Auth: the viewer session cookie (JWT) or the external/shared-link cookie —
 * same posture as /api/research (the server enforces it).
 */

const BASE = '/api/fusion';

export class FusionApiError extends Error {
  constructor(status, message) {
    super(message || `Request failed (${status})`);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    credentials: 'same-origin',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new FusionApiError(res.status, body.message || res.statusText);
  }
  return res.json();
}

export const fusionApi = {
  /** GET /api/fusion/templates — every template (shared, viewer-wide). */
  listTemplates: () => request('/templates'),

  /**
   * POST /api/fusion/templates
   * payload: { name, base: {pattern, color, opacity, ww, wc, ww0, wc0},
   *            overlays: [{pattern, color, opacity, ww, wc, ww0, wc0, offset}] }
   */
  createTemplate: payload =>
    request('/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  /**
   * DELETE /api/fusion/templates/:id — requires the export password
   * (header x-export-password, same as the AI-label export function).
   */
  deleteTemplate: async (id, password) => {
    const res = await fetch(`${BASE}/templates/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: password ? { 'x-export-password': password } : {},
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new FusionApiError(res.status, body.message || res.statusText);
    }
    return res.json();
  },
};
