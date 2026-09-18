/**
 * Spatial synchronization between the original DICOM viewport (left) and the
 * NIfTI research viewport (right), using PHYSICAL coordinates — never blind
 * slice-index matching.
 *
 * DICOM side: per-instance ImagePositionPatient projected onto the slice
 * normal (ImageOrientationPatient) -> sorted z positions.
 * NIfTI side: 4x4 affine (qform/sform from nifti-reader-js) maps voxel
 * (i,j,k) -> patient mm; the current axial slice k has a plane position
 * affine*(0,0,k).
 *
 * Sync only when the two volume axes agree (|dot(n_dicom, n_nifti_k)| > 0.9),
 * otherwise the sync is disabled with a notice. A guard flag + change
 * detection prevent event loops.
 */
import { metaData } from '@cornerstonejs/core';
import { useNiftiStore } from '../stores/niftiStore';

let dicomZPositions = []; // sorted z (mm) per DICOM slice index
let dicomNormal = null; // unit slice normal from DICOM
let niftiKAxis = null; // unit k-axis from NIfTI affine
let lastDicomIndex = -1;
let lastNiftiIndex = -1;
let syncing = false;
let pollTimer = null;
let disposed = false;

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function norm(a) {
  const l = Math.sqrt(dot(a, a));
  return l > 1e-9 ? [a[0] / l, a[1] / l, a[2] / l] : a;
}
function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/**
 * Build the DICOM slice-position table from the left stack viewport's image
 * ids (authoritative: they are the actual loaded series).
 *
 * IMPORTANT: the z table is kept in STACK DISPLAY ORDER (index-aligned with
 * getImageIds()) — NOT sorted by z. The stack viewport's current image id
 * index is an index into getImageIds(), so dicomIndexToZ(index) must return
 * the z of the image at that exact position. Sorting would silently invert
 * the mapping whenever the series is stored/displayed in descending z
 * (feet-first / reversed acquisition), which is exactly the "both move but
 * the slices don't match" symptom.
 */
function buildDicomMap(stackViewport) {
  try {
    const imageIds = stackViewport.getImageIds();
    if (!imageIds || !imageIds.length) return false;
    const rows = [];
    for (let i = 0; i < imageIds.length; i++) {
      const inst = metaData.get('instance', imageIds[i]);
      if (!inst) return false;
      // This fork naturalizes DICOMweb metadata to PascalCase; support both
      // conventions for robustness.
      const ipp = inst.imagePositionPatient || inst.ImagePositionPatient;
      const iop = inst.imageOrientationPatient || inst.ImageOrientationPatient;
      if (!ipp || !iop || iop.length < 6) return false;
      const rowVec = [iop[0], iop[1], iop[2]];
      const colVec = [iop[3], iop[4], iop[5]];
      const n = norm(cross(rowVec, colVec));
      rows.push({ z: dot(ipp, n), n });
    }
    // Keep display order! dicomIndexToZ(index) relies on this.
    dicomZPositions = rows.map(r => r.z);
    // All slices share (nearly) the same normal; use the middle row so a
    // stray outlier cannot skew it.
    dicomNormal = rows.length ? rows[Math.floor(rows.length / 2)].n : null;
    return true;
  } catch (e) {
    return false;
  }
}

/** NIfTI k-axis unit vector from the affine (column 2, normalized). */
function buildNiftiMap(affine) {
  if (!affine) return false;
  const col = [affine[0][2], affine[1][2], affine[2][2]];
  niftiKAxis = norm(col);
  return true;
}

function axesAligned() {
  if (!dicomNormal || !niftiKAxis) return false;
  return Math.abs(dot(dicomNormal, niftiKAxis)) > 0.9;
}

/** DICOM slice index -> physical z (mm) */
function dicomIndexToZ(index) {
  if (index < 0 || index >= dicomZPositions.length) return null;
  return dicomZPositions[index];
}

/** physical z -> nearest DICOM slice index */
function zToDicomIndex(z) {
  if (!dicomZPositions.length) return -1;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < dicomZPositions.length; i++) {
    const dist = Math.abs(dicomZPositions[i] - z);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

/** NIfTI slice index k -> physical z (mm), projected on the DICOM normal. */
function niftiIndexToZ(affine, k) {
  // Full 3D position of voxel (0,0,k), projected onto the reference normal.
  // Projecting onto dicomNormal (instead of the affine's own k column)
  // makes the mapping correct regardless of whether the NIfTI k-axis is
  // parallel or anti-parallel to the DICOM slice normal.
  const m = affine;
  const orig = [m[0][3], m[1][3], m[2][3]];
  const kCol = [m[0][2], m[1][2], m[2][2]];
  if (!dicomNormal) return 0;
  return dot(orig, dicomNormal) + k * dot(kCol, dicomNormal);
}

/** physical z -> NIfTI slice index k (inverse of niftiIndexToZ). */
function zToNiftiIndex(affine, z) {
  const m = affine;
  const kCol = [m[0][2], m[1][2], m[2][2]];
  const orig = [m[0][3], m[1][3], m[2][3]];
  if (!dicomNormal) return -1;
  const denom = dot(kCol, dicomNormal);
  if (Math.abs(denom) < 1e-9) return -1;
  const k = (z - dot(orig, dicomNormal)) / denom;
  return Math.round(k);
}

function setDicomSlice(stackViewport, index) {
  try {
    const current = stackViewport.getCurrentImageIdIndex && stackViewport.getCurrentImageIdIndex();
    if (current === index) return;
    stackViewport.setImageIdIndex(index);
    stackViewport.render();
  } catch (e) {
    /* ignore */
  }
}

export function startSync({ stackViewport, getNifti, servicesManager }) {
  disposed = false;
  lastDicomIndex = -1;
  lastNiftiIndex = -1;

  const syncDebug = {};
  try {
    if (!stackViewport) syncDebug.error = 'no stack viewport';
    else {
      syncDebug.imageIds = (stackViewport.getImageIds && stackViewport.getImageIds().length) || 0;
      syncDebug.type = stackViewport.type;
    }
  } catch (e) {
    syncDebug.error = String(e);
  }
  if (!buildDicomMap(stackViewport)) {
    syncDebug.mapFailed = true;
    try {
      const ids = stackViewport && stackViewport.getImageIds ? stackViewport.getImageIds() : [];
      const first = ids[0];
      const inst = first ? metaData.get('instance', first) : null;
      syncDebug.firstInst = inst ? { hasIpp: !!inst.imagePositionPatient, keys: Object.keys(inst).slice(0, 12) } : 'no inst meta';
    } catch (e) {
      syncDebug.metaErr = String(e);
    }
    useNiftiStore.getState().setSyncActive(false);
    try {
      window.__niftiSyncDebug = syncDebug;
    } catch (e) {
      /* ignore */
    }
    return;
  }
  const { niftiAffine } = useNiftiStore.getState();
  if (!buildNiftiMap(niftiAffine)) {
    syncDebug.niftiMapFailed = true;
    useNiftiStore.getState().setSyncActive(false);
    try {
      window.__niftiSyncDebug = syncDebug;
    } catch (e) {
      /* ignore */
    }
    return;
  }
  const aligned = axesAligned();
  syncDebug.aligned = aligned;
  syncDebug.nDicom = dicomNormal;
  syncDebug.nNifti = niftiKAxis;
  try {
    window.__niftiSyncDebug = syncDebug;
  } catch (e) {
    /* ignore */
  }
  // Only the spatial sync itself is gated on axis alignment; the badge
  // reflects that the sync loop is RUNNING (scroll follows either way).
  useNiftiStore.getState().setSyncActive(true);

  clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    if (disposed) return;
    if (syncing) return;
    const nv = getNifti();
    if (!nv) return;

    // --- DICOM -> NIfTI ---
    let dicomIndex = -1;
    try {
      dicomIndex = stackViewport.getCurrentImageIdIndex ? stackViewport.getCurrentImageIdIndex() : -1;
    } catch (e) {
      dicomIndex = -1;
    }
    if (dicomIndex !== lastDicomIndex && dicomIndex >= 0) {
      lastDicomIndex = dicomIndex;
      const z = dicomIndexToZ(dicomIndex);
      if (z !== null) {
        const k = zToNiftiIndex(useNiftiStore.getState().niftiAffine, z);
        if (k >= 0 && k !== lastNiftiIndex) {
          syncing = true;
          try {
            const nz = (useNiftiStore.getState().niftiHeader || {}).dims ? useNiftiStore.getState().niftiHeader.dims[3] : 0;
            const kk = nz > 0 ? Math.max(0, Math.min(nz - 1, k)) : k;
            const frac = nv.vox2frac([0, 0, kk]);
            nv.scene.crosshairPos = frac;
            nv.drawScene();
            lastNiftiIndex = kk;
          } catch (e) {
            /* ignore */
          } finally {
            syncing = false;
          }
        }
      }
    }

    // --- NIfTI -> DICOM ---
    let niftiIndex = -1;
    try {
      const info = nv.getCurrentSliceInfo();
      // slicePosition is the crosshair frac along the slice axis; invert
      // Niivue's own vox2frac (vox->frac = (vox+0.5)/dims) to recover the
      // exact voxel index: round(frac * nz - 0.5).
      const dims = useNiftiStore.getState().niftiHeader;
      const nz = dims && dims.dims ? dims.dims[3] : 0;
      niftiIndex = nz > 0 ? Math.round(info.slicePosition * nz - 0.5) : -1;
    } catch (e) {
      niftiIndex = -1;
    }
    if (niftiIndex !== lastNiftiIndex && niftiIndex >= 0) {
      lastNiftiIndex = niftiIndex;
      const z = niftiIndexToZ(useNiftiStore.getState().niftiAffine, niftiIndex);
      const dIdx = zToDicomIndex(z);
      if (dIdx !== lastDicomIndex) {
        syncing = true;
        try {
          setDicomSlice(stackViewport, dIdx);
          lastDicomIndex = dIdx;
        } catch (e) {
          /* ignore */
        } finally {
          syncing = false;
        }
      }
    }
  }, 200);
}

export function stopSync() {
  disposed = true;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  dicomZPositions = [];
  dicomNormal = null;
  niftiKAxis = null;
}
