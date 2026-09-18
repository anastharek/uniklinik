/**
 * Research API client — same-origin /api/research endpoints (JWT cookie auth,
 * identical to the existing /api/dicom-web proxy posture).
 */

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body && body.message) message = body.message;
    } catch (e) {
      /* keep default */
    }
    throw new Error(message);
  }
  return res.json();
}

export async function convertToNifti(studyInstanceUID, seriesInstanceUID) {
  return jsonFetch('/api/research/nifti/convert', {
    method: 'POST',
    body: JSON.stringify({ studyInstanceUID, seriesInstanceUID }),
  });
}

export async function getNiftiStatus(jobId) {
  return jsonFetch(`/api/research/nifti/${jobId}/status`);
}

export async function getNiftiMetadata(jobId) {
  return jsonFetch(`/api/research/nifti/${jobId}/metadata`);
}

/** Download the .nii.gz as an ArrayBuffer (auth via same-origin cookie). */
export async function downloadNifti(jobId, onProgress) {
  const res = await fetch(`/api/research/nifti/${jobId}/file`, {
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error(`NIfTI download failed (HTTP ${res.status})`);
  const total = parseInt(res.headers.get('Content-Length') || '0', 10) || 0;
  if (!res.body) return res.arrayBuffer();
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (onProgress && total) onProgress(Math.round((received / total) * 100));
  }
  const blob = new Blob(chunks);
  return blob.arrayBuffer();
}

export async function postDerivedProvenance(payload) {
  return jsonFetch('/api/research/derived-dicom/provenance', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Upload a built DICOM (Part 10 bytes) via the existing import route. */
export async function uploadDicom(part10Buffer) {
  const res = await fetch('/api/instances', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/dicom',
    },
    body: part10Buffer,
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body && body.message) message = body.message;
    } catch (e) {
      /* ignore */
    }
    throw new Error(`DICOM upload failed: ${message}`);
  }
  return res.json();
}
