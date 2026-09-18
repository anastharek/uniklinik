import { create } from 'zustand';
import * as nifti from 'nifti-reader-js';
import * as api from '../services/niftiApi';
import { ADC_DEFAULT_RANGE } from '../utils/adc';

/**
 * Shared NIfTI analysis state (viewport <-> right panel).
 * `status` follows the UI state machine:
 * idle -> preparing -> retrieving -> converting -> validating -> loading
 *      -> ready -> analysis (ADC mapping active) -> saving -> error
 */
const emptySettings = {
  preset: 'original',
  colormap: 'gray',
  wl: null, // window level (null = volume default)
  ww: null, // window width
  rangeMin: ADC_DEFAULT_RANGE.min,
  rangeMax: ADC_DEFAULT_RANGE.max,
  colormapOpacity: 100, // 0-100
  thresholdEnabled: false,
  thresholdValue: null,
  thresholdOpacity: 50, // 0-100
  // NIfTI viewport interaction tool: 'wl' | 'pan' | 'zoom' | 'slice'
  tool: 'wl',
  // ADC value-range colorization (item: infarct core / penumbra / normal)
  rangeColorizeEnabled: false,
  ranges: [], // [{ label, min, max, color }]
};

const initialState = {
  status: 'idle',
  stage: '',
  percent: null,
  processed: 0,
  total: 0,
  error: null,
  details: null,
  jobId: null,
  studyUid: null,
  seriesUid: null,
  viewportId: null, // nifti viewport
  dicomViewportId: null, // left DICOM viewport
  niftiDisplaySetUID: null,
  metadata: null, // server metadata (geometry/adcValidation/provenance)
  niftiHeader: null, // parsed NIfTI header (nifti-reader-js)
  niftiData: null, // raw voxel typed array
  niftiAffine: null, // 4x4 patient-space affine
  niftiRawBuffer: null, // original .nii.gz ArrayBuffer (for Niivue blob URL)
  adc: { validated: false, units: null, reason: null, evidence: [], mapping: null },
  geometry: { validated: false, warnings: [] },
  syncActive: false,
  settings: { ...emptySettings },
  roi: { type: 'ellipse', points: null, results: null }, // points in voxel space
  roiArmed: false,
  isActiveViewport: false,
  seriesDescription: 'ADC Parametric Map – Research',
  requestSave: 0,
  // actions
  setup: () => {},
  start: () => {},
  poll: () => {},
  cancelPoll: () => {},
  setStatus: () => {},
  setSettings: () => {},
  resetAnalysis: () => {},
  setRoi: () => {},
  setActiveViewport: () => {},
  setSyncActive: () => {},
  setSeriesDescription: () => {},
};

export const useNiftiStore = create(set => ({
  ...initialState,

  setup({ studyUid, seriesUid, viewportId, dicomViewportId, niftiDisplaySetUID }) {
    set({
      studyUid,
      seriesUid,
      viewportId,
      dicomViewportId,
      niftiDisplaySetUID,
      jobId: null, // invalidate any in-flight conversion poll
      status: 'preparing',
      error: null,
      settings: { ...emptySettings },
      roi: { type: 'ellipse', points: null, results: null },
      metadata: null,
      niftiHeader: null,
      niftiData: null,
      niftiAffine: null,
    });
  },

  async start() {
    const { studyUid, seriesUid } = useNiftiStore.getState();
    if (!studyUid || !seriesUid) return;
    set({ status: 'preparing', error: null });
    try {
      const { jobId, cached } = await api.convertToNifti(studyUid, seriesUid);
      set({ jobId });
      if (cached) {
        // Server already has it — load directly
        const meta = await api.getNiftiMetadata(jobId);
        set({ metadata: meta, status: 'loading' });
        await loadNiftiIntoStore(jobId);
        applyMetadataToState(meta);
      } else {
        useNiftiStore.getState().poll();
      }
    } catch (err) {
      set({ status: 'error', error: String((err && err.message) || err), stage: 'Error' });
    }
  },

  async poll() {
    const { jobId } = useNiftiStore.getState();
    if (!jobId) return;
    try {
      for (;;) {
        // Bail out if the session was restarted for another series while this
        // job was converting (the old loop must never clobber the new state).
        if (useNiftiStore.getState().jobId !== jobId) return;
        const st = await api.getNiftiStatus(jobId);
        set({
          status: st.status === 'ready' ? 'loading' : st.status === 'error' ? 'error' : 'preparing',
          stage: st.stage,
          percent: st.percent,
          processed: st.processed,
          total: st.total,
          error: st.error,
        });
        if (st.status === 'error') return;
        if (st.status === 'ready') {
          const meta = await api.getNiftiMetadata(jobId);
          set({ metadata: meta, status: 'loading' });
          await loadNiftiIntoStore(jobId);
          applyMetadataToState(meta);
          return;
        }
        await new Promise(r => setTimeout(r, 1200));
      }
    } catch (err) {
      set({ status: 'error', error: String((err && err.message) || err), stage: 'Error' });
    }
  },

  setStatus(status, extra = {}) {
    set({ status, ...extra });
  },

  setSettings(patch) {
    set(state => ({ settings: { ...state.settings, ...patch } }));
  },

  setRoi(patch) {
    set(state => ({ roi: { ...state.roi, ...patch } }));
  },

  setRoiArmed(roiArmed) {
    set({ roiArmed });
  },

  setActiveViewport(isActive) {
    set({ isActiveViewport: isActive });
  },

  setSyncActive(syncActive) {
    set({ syncActive });
  },

  setSeriesDescription(seriesDescription) {
    set({ seriesDescription });
  },

  requestSaveDerived() {
    set(state => ({ requestSave: state.requestSave + 1 }));
  },

  resetAnalysis() {
    set({
      settings: { ...emptySettings },
      roi: { type: 'ellipse', points: null, results: null },
      status: useNiftiStore.getState().status === 'analysis' ? 'analysis' : 'ready',
    });
  },

  markAnalysisActive() {
    set({ status: 'analysis' });
  },

  markSaving(saving) {
    set({ status: saving ? 'saving' : 'analysis' });
  },
}));

/** Download the volume + parse header/data with nifti-reader-js. */
async function loadNiftiIntoStore(jobId) {
  const onProgress = pct => useNiftiStore.getState().setStatus('loading', { stage: 'Loading NIfTI', percent: pct });
  let raw = await api.downloadNifti(jobId, onProgress);
  // Keep the original bytes for Niivue (it handles gzip itself); parse a
  // decompressed copy for header/data (nifti-reader-js 0.8 API).
  let buf = nifti.isCompressed(raw) ? nifti.decompress(raw) : raw;
  const header = nifti.readHeader(buf);
  // readImage returns an ArrayBuffer — wrap in the matching typed array
  // (indexing an ArrayBuffer directly yields undefined, silently emptying stats).
  const imgBuf = nifti.readImage(header, buf);
  const data = typedArrayFor(header, imgBuf);
  const affine = getAffine(header);
  useNiftiStore.setState({ niftiHeader: header, niftiData: data, niftiAffine: affine, niftiRawBuffer: raw });
}

/** Wrap a NIfTI image ArrayBuffer in the typed array matching its datatype. */
function typedArrayFor(header, buf) {
  const dt = header.datatypeCode;
  if (dt === 2 || dt === 4) return new Int16Array(buf);
  if (dt === 8) return new Int32Array(buf);
  if (dt === 16 || dt === 1280) return new Float32Array(buf);
  if (dt === 64) return new Float64Array(buf);
  if (dt === 256) return new Int8Array(buf);
  if (dt === 512) return new Uint16Array(buf);
  if (dt === 768) return new Uint32Array(buf);
  return new Float32Array(buf);
}

/**
 * Build the 4x4 patient-space affine from the NIfTI-1 header.
 * qform when available (quaternion -> rotation, per the NIfTI-1 spec),
 * else sform (srow_x/y/z), else a diagonal pixDims matrix (no orientation
 * info — sync will be disabled by the axis-alignment check).
 *
 * CRITICAL: the k-column must be scaled by qfac = pixDims[0]. dcm2niix
 * writes pixDims[0] = -1 for series whose k-axis points opposite to the
 * anatomical normal (e.g. feet-first / reversed acquisitions). Skipping
 * qfac flips the k-axis, which inverts the DICOM <-> NIfTI slice mapping
 * ("both images scroll but the series/slices don't match").
 */
function getAffine(header) {
  const p = header.pixDims || [0, 1, 1, 1];
  const qfac = p[0] === 0 ? 1 : p[0]; // pixDims[0] holds qfac (+/-1)
  try {
    if (header.qform_code !== 0) {
      const b = header.quatern_b || 0;
      const c = header.quatern_c || 0;
      const d = header.quatern_d || 0;
      const a = Math.sqrt(Math.max(0, 1 - b * b - c * c - d * d));
      const R = [
        [a * a + b * b - c * c - d * d, 2 * b * c - 2 * a * d, 2 * b * d + 2 * a * c],
        [2 * b * c + 2 * a * d, a * a + c * c - b * b - d * d, 2 * c * d - 2 * a * b],
        [2 * b * d - 2 * a * c, 2 * c * d + 2 * a * b, a * a + d * d - c * c - b * b],
      ];
      const M = [
        [R[0][0] * p[1], R[0][1] * p[2], R[0][2] * p[3] * qfac, header.qoffset_x || 0],
        [R[1][0] * p[1], R[1][1] * p[2], R[1][2] * p[3] * qfac, header.qoffset_y || 0],
        [R[2][0] * p[1], R[2][1] * p[2], R[2][2] * p[3] * qfac, header.qoffset_z || 0],
        [0, 0, 0, 1],
      ];
      return M;
    }
    if (header.sform_code !== 0 && header.srow_x && header.srow_y && header.srow_z) {
      return [
        header.srow_x.slice(0, 4),
        header.srow_y.slice(0, 4),
        header.srow_z.slice(0, 4),
        [0, 0, 0, 1],
      ];
    }
  } catch (e) {
    /* fall through to diagonal */
  }
  return [
    [p[1], 0, 0, 0],
    [0, p[2], 0, 0],
    [0, 0, p[3], 0],
    [0, 0, 0, 1],
  ];
}

function applyMetadataToState(meta) {
  const adc = (meta && meta.adcValidation) || { status: 'not_validated' };
  const geometry = meta && meta.geometry ? meta.geometry : {};
  const validated =
    adc.status === 'validated' &&
    (!geometry.warnings || geometry.warnings.length === 0);
  setFromMetadata(meta, adc, geometry, validated);
}

function setFromMetadata(meta, adc, geometry, validated) {
  useNiftiStore.setState({
    metadata: meta,
    adc: {
      validated: adc.status === 'validated',
      units: adc.units || null,
      reason: adc.reason || null,
      evidence: adc.evidence || [],
      mapping: adc.mapping || null,
    },
    geometry: {
      validated,
      warnings: geometry.warnings || [],
    },
    status: 'ready',
    stage: 'Ready',
    percent: 100,
  });
}
