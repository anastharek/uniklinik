/**
 * "Save Fusion" — export the CURRENT fusion (overlay) stack as a NEW DICOM
 * series in the SAME study, e.g. "sb1000-swi mip fusion".
 *
 * How it works:
 *   1. Takes the live ORTHOGRAPHIC fusion viewport (base + tinted overlays
 *      already blended by the engine exactly as the user sees them).
 *   2. Steps through EVERY slice of the base volume (slice centers along the
 *      current viewing normal), renders each one, and reads back the fused
 *      frame WYSIWYG — layer colors, opacity, windowing and slice nudges are
 *      all baked in.
 *   3. Builds ONE DICOM series (Secondary Capture, RGB8, uncompressed) with
 *      one instance per slice (InstanceNumber = slice order) so OHIF scrolls
 *      through the whole saved stack like a normal series.
 *   4. Uploads each instance via the app DICOM proxy (POST /api/instances,
 *      session/external-scope auth — same path as Capture Image) and
 *      registers the new series in DicomMetadataStore so it appears in the
 *      thumbnail list immediately.
 *
 * NOTE: saved frames are exactly what the fusion viewport shows — the blend
 * is baked in (colors/opacity/windowing are NOT re-adjustable afterwards).
 */
import dcmjs from 'dcmjs';
import { cache } from '@cornerstonejs/core';
import { DicomMetadataStore } from '@ohif/core';

const { DicomMetaDictionary, DicomDict } = dcmjs.data;

const SC_SOP_CLASS_UID = '1.2.840.10008.5.1.4.1.1.7'; // Secondary Capture Image Storage
const EXPLICIT_VR_LE = '1.2.840.10008.1.2.1';
const MAX_FRAME_DIM = 2048; // WebGL/texture safety cap
const UPLOAD_CONCURRENCY = 3;

function generateUid() {
  return DicomMetaDictionary.uid();
}

/** True when a plain object has a usable (non-empty) string field. */
function hasStr(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Normalize a possibly-array value from naturalized metadata. */
function str(v) {
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) return String(v[0] || '');
  return String(v);
}

/** Read patient/study identity from the in-memory study metadata. */
function readStudyIdentity(studyUid) {
  const fallback = {};
  try {
    const study = DicomMetadataStore.getStudy(studyUid);
    if (!study) {
      return fallback;
    }
    const firstInstance =
      study.series && study.series[0] && study.series[0].instances
        ? study.series[0].instances[0]
        : undefined;
    const src = firstInstance || study;
    return {
      patientName: str(src.PatientName) || str(study.PatientName),
      patientId: str(src.PatientID) || str(study.PatientID),
      studyDate: str(src.StudyDate) || str(study.StudyDate),
      studyTime: str(src.StudyTime) || str(study.StudyTime),
      studyDescription: str(src.StudyDescription) || str(study.StudyDescription),
      accessionNumber: str(src.AccessionNumber) || str(study.AccessionNumber),
      studyId: str(src.StudyID) || str(study.StudyID),
    };
  } catch (e) {
    console.warn('[Save Fusion] study metadata lookup failed', e);
    return fallback;
  }
}

/** Fallback: QIDO study query for authoritative patient identity. */
async function fetchStudyIdentityFromServer(servicesManager, studyUid) {
  try {
    const { dataSourcesService } = servicesManager.services;
    const dataSource = dataSourcesService.getActiveDataSource
      ? dataSourcesService.getActiveDataSource()
      : undefined;
    if (!dataSource || !dataSource.query || !dataSource.query.studies) {
      return {};
    }
    const results = await dataSource.query.studies.search({
      studyInstanceUid: studyUid,
    });
    const study = Array.isArray(results) ? results[0] : undefined;
    if (!study) {
      return {};
    }
    return {
      patientName: str(study.patientName) || str(study.PatientName),
      patientId: str(study.mrn) || str(study.PatientID),
      studyDate: str(study.date) || str(study.StudyDate),
      studyTime: str(study.time) || str(study.StudyTime),
      studyDescription: str(study.description) || str(study.StudyDescription),
      accessionNumber: str(study.accession) || str(study.AccessionNumber),
      studyId: str(study.StudyID),
    };
  } catch (e) {
    console.warn('[Save Fusion] server study lookup failed', e);
    return {};
  }
}

/** Build ONE SC instance (RGB8) as an ArrayBuffer, sharing the series UID. */
function buildScInstance({
  name,
  rows,
  cols,
  rgb,
  studyUid,
  seriesUid,
  instanceNumber,
  patientName,
  patientId,
  studyDate,
  studyTime,
  studyDescription,
  accessionNumber,
  studyId,
}) {
  const sopUid = generateUid();
  const dataset = {
    SOPClassUID: SC_SOP_CLASS_UID,
    SOPInstanceUID: sopUid,
    StudyInstanceUID: studyUid,
    SeriesInstanceUID: seriesUid,
    PatientName: patientName || '',
    PatientID: patientId || '',
    StudyDate: studyDate || '',
    StudyTime: studyTime || '',
    StudyDescription: studyDescription || '',
    AccessionNumber: accessionNumber || '',
    StudyID: studyId || '',
    Modality: 'OT',
    ConversionType: 'WSD',
    SeriesDescription: name,
    // Empty SeriesNumber — sorts the fusion series to the TOP of the study's
    // series list (like Capture Image / AI series).
    SeriesNumber: '',
    InstanceNumber: String(instanceNumber),
    SamplesPerPixel: 3,
    PhotometricInterpretation: 'RGB',
    Rows: String(rows),
    Columns: String(cols),
    BitsAllocated: 8,
    BitsStored: 8,
    HighBit: 7,
    PixelRepresentation: 0,
    PixelData: rgb,
  };
  const meta = {
    MediaStorageSOPClassUID: SC_SOP_CLASS_UID,
    MediaStorageSOPInstanceUID: sopUid,
    TransferSyntaxUID: EXPLICIT_VR_LE,
    ImplementationClassUID: '2.25.0.0.1.4.0.0.1',
    ImplementationVersionName: 'PUTRACNS_FUSION_1',
  };
  const dicomDict = new DicomDict(DicomMetaDictionary.denaturalizeDataset(meta));
  dicomDict.dict = DicomMetaDictionary.denaturalizeDataset(dataset);
  return {
    dicom: dicomDict.write({ allowInvalidVRLength: false, fragmentMultiframe: false }),
    sopUid,
  };
}

/** RGBA buffer → RGB bytes. */
function rgbaToRgb(data, w, h) {
  const rgb = new Uint8Array(w * h * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    rgb[j] = data[i];
    rgb[j + 1] = data[i + 1];
    rgb[j + 2] = data[i + 2];
  }
  return rgb;
}

/**
 * Compute the on-screen rectangle (buffer pixels) covered by the BASE volume
 * — used to crop the viewport canvas so saved frames contain no letterbox
 * bars. Returns null when it cannot be computed (fallback: whole canvas).
 */
function baseImageRect(viewport, vol) {
  try {
    const imageData = vol && vol.imageData;
    if (!imageData || typeof imageData.indexToWorld !== 'function') {
      return null;
    }
    const dims = imageData.getDimensions();
    const corners = [];
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        for (let k = 0; k < 2; k++) {
          const w = imageData.indexToWorld([i * (dims[0] - 1), j * (dims[1] - 1), k * (dims[2] - 1)]);
          corners.push(w);
        }
      }
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const c of corners) {
      const p = viewport.worldToCanvas(c);
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
        return null;
      }
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    if (maxX <= minX || maxY <= minY) {
      return null;
    }
    return { x: Math.floor(minX), y: Math.floor(minY), w: Math.ceil(maxX - minX), h: Math.ceil(maxY - minY) };
  } catch (e) {
    return null;
  }
}

/**
 * Main entry: save the fused viewport stack as a new DICOM series.
 *
 * @param servicesManager OHIF services manager (command context)
 * @param opts
 *   name          series description, e.g. "sb1000-swi mip fusion"
 *   baseUID       display set UID of the base layer
 *   onProgress    (done, total, stage) => void   — stage 'render' | 'upload'
 *   cancelToken   { cancelled: boolean } — set true to abort between frames
 */
export default async function saveFusionToDicom(servicesManager, opts) {
  const {
    viewportGridService,
    cornerstoneViewportService,
    uiNotificationService,
    displaySetService,
  } = servicesManager.services;

  const seriesName = hasStr(opts.name) ? opts.name.trim().slice(0, 64) : '';
  if (!seriesName) {
    return; // cancelled
  }
  const cancelToken = opts.cancelToken || { cancelled: false };
  const onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : () => {};

  const { activeViewportId } = viewportGridService.getState();
  const viewport = cornerstoneViewportService.getCornerstoneViewport(activeViewportId);
  if (!viewport) {
    uiNotificationService.show({ title: 'Save Fusion', message: 'No active viewport.', type: 'error' });
    return;
  }

  const volumeIds =
    typeof viewport.getAllVolumeIds === 'function' ? viewport.getAllVolumeIds() || [] : [];
  if (volumeIds.length < 2) {
    uiNotificationService.show({
      title: 'Save Fusion',
      message: 'Apply Fusion first — the viewport must show base + overlay layers.',
      type: 'warning',
    });
    return;
  }

  // ---- base volume + slice geometry along the current viewing normal ----
  const baseVolumeId = volumeIds.find(id => id.includes(opts.baseUID)) || volumeIds[0];
  const vol = baseVolumeId ? cache.getVolume(baseVolumeId) : undefined;
  const imageData = vol && vol.imageData;
  const dims =
    (imageData && imageData.getDimensions()) ||
    (vol && vol.dimensions) || null;
  const spacing =
    (imageData && imageData.getSpacing()) || (vol && vol.spacing) || null;
  const origin =
    (imageData && imageData.getOrigin()) || (vol && vol.origin) || null;

  let camera = null;
  try {
    camera = viewport.getCamera();
  } catch (e) {
    camera = null;
  }
  if (!dims || !spacing || !camera) {
    uiNotificationService.show({
      title: 'Save Fusion',
      message: 'Could not read the fusion volume geometry — try again.',
      type: 'error',
    });
    return;
  }
  const n = camera.viewPlaneNormal || [0, 0, 1];
  // axis of the volume most aligned with the viewing normal
  let axis = 2;
  let best = -1;
  for (let a = 0; a < 3; a++) {
    const v = Math.abs(n[a]);
    if (v > best) {
      best = v;
      axis = a;
    }
  }
  const sliceCount = dims[axis] || 0;
  if (sliceCount < 1) {
    uiNotificationService.show({ title: 'Save Fusion', message: 'Volume has no slices.', type: 'error' });
    return;
  }
  const sliceSpacing = spacing[axis] || 1;
  const originAxis = origin ? origin[axis] : 0;
  const baseFocal = camera.focalPoint || [0, 0, 0];
  const focalAlongN = baseFocal[0] * n[0] + baseFocal[1] * n[1] + baseFocal[2] * n[2];

  // Fit the whole volume into view (no zoom/pan cropping) once.
  try {
    if (typeof viewport.resetCamera === 'function') {
      viewport.resetCamera();
    }
  } catch (e) {
    /* non-fatal — keep whatever zoom the user had */
  }
  // Reset may change the camera; capture again for canvas mapping.
  try {
    camera = viewport.getCamera();
  } catch (e) {
    /* ignore */
  }

  // ---- source canvas (what the user sees) ----
  const info = cornerstoneViewportService.getViewportInfo
    ? cornerstoneViewportService.getViewportInfo(activeViewportId)
    : undefined;
  const sourceEl = info && typeof info.getElement === 'function' ? info.getElement() : undefined;
  const sourceCanvas = sourceEl ? sourceEl.querySelector('canvas') : undefined;
  if (!sourceCanvas || !sourceCanvas.width || !sourceCanvas.height) {
    uiNotificationService.show({
      title: 'Save Fusion',
      message: 'Could not read the fusion viewport canvas.',
      type: 'error',
    });
    return;
  }

  // Study UID + patient identity come from the base display set / study.
  const baseDs = displaySetService.getDisplaySetByUID(opts.baseUID);
  const studyUid = (baseDs && (baseDs.StudyInstanceUID || baseDs.studyInstanceUid)) || '';
  if (!studyUid) {
    uiNotificationService.show({
      title: 'Save Fusion',
      message: 'Could not determine the study — try again.',
      type: 'error',
    });
    return;
  }
  let patient = readStudyIdentity(studyUid);
  if (!patient.patientId) {
    patient = await fetchStudyIdentityFromServer(servicesManager, studyUid);
  }

  // ---- step through every slice, render + read back the fused frame ----
  const outCanvas = document.createElement('canvas');
  const octx = outCanvas.getContext('2d');
  const seriesUid = generateUid();
  const frames = []; // { rgb, rows, cols, instanceNumber }
  let maxDim = 0;

  onProgress(0, sliceCount, 'render');
  for (let k = 0; k < sliceCount; k++) {
    if (cancelToken.cancelled) {
      uiNotificationService.show({ title: 'Save Fusion', message: 'Cancelled.', type: 'info' });
      return;
    }
    // place the camera on base slice k (slice center)
    const posK = originAxis + (k + 0.5) * sliceSpacing;
    try {
      viewport.setCamera({
        focalPoint: [
          baseFocal[0] + n[0] * (posK - focalAlongN),
          baseFocal[1] + n[1] * (posK - focalAlongN),
          baseFocal[2] + n[2] * (posK - focalAlongN),
        ],
      });
      viewport.render();
    } catch (e) {
      console.warn('[Save Fusion] slice render failed', k, e);
      uiNotificationService.show({
        title: 'Save Fusion',
        message: `Render failed on slice ${k + 1}: ${e.message}`,
        type: 'error',
      });
      return;
    }

    // synchronous read-back right after render (same task as render)
    const bufW = sourceCanvas.width;
    const bufH = sourceCanvas.height;
    outCanvas.width = bufW;
    outCanvas.height = bufH;
    try {
      octx.drawImage(sourceCanvas, 0, 0, bufW, bufH);
    } catch (e) {
      console.warn('[Save Fusion] canvas read failed', k, e);
      uiNotificationService.show({
        title: 'Save Fusion',
        message: `Could not read slice ${k + 1} — try again.`,
        type: 'error',
      });
      return;
    }
    let img = octx.getImageData(0, 0, bufW, bufH);

    // crop letterbox bars (when the base volume doesn't fill the canvas)
    const rect = baseImageRect(viewport, vol);
    if (rect && rect.w > 0 && rect.h > 0 && (rect.w < bufW || rect.h < bufH)) {
      const cx = Math.min(Math.max(rect.x, 0), Math.max(bufW - 1, 0));
      const cy = Math.min(Math.max(rect.y, 0), Math.max(bufH - 1, 0));
      const cw = Math.min(rect.w, bufW - cx);
      const ch = Math.min(rect.h, bufH - cy);
      if (cw > 0 && ch > 0) {
        img = octx.getImageData(cx, cy, cw, ch);
      }
    }

    let w = img.width;
    let h = img.height;
    let rgba = img.data;
    const scale = Math.min(1, MAX_FRAME_DIM / Math.max(w, h));
    if (scale < 1) {
      const sc = document.createElement('canvas');
      sc.width = Math.max(1, Math.round(w * scale));
      sc.height = Math.max(1, Math.round(h * scale));
      const sctx = sc.getContext('2d');
      sctx.drawImage(outCanvas, 0, 0, w, h, 0, 0, sc.width, sc.height);
      const simg = sctx.getImageData(0, 0, sc.width, sc.height);
      w = simg.width;
      h = simg.height;
      rgba = simg.data;
    }
    frames.push({ rgb: rgbaToRgb(rgba, w, h), rows: h, cols: w, instanceNumber: k + 1 });
    maxDim = Math.max(maxDim, w, h);
    if ((k + 1) % 5 === 0 || k + 1 === sliceCount) {
      onProgress(k + 1, sliceCount, 'render');
      // let the UI paint between frames
      await new Promise(r => setTimeout(r, 0));
    }
  }

  // ---- build + upload instances (one per slice, shared series) ----
  const built = frames.map(f => {
    const { dicom, sopUid } = buildScInstance({
      name: seriesName,
      rows: f.rows,
      cols: f.cols,
      rgb: f.rgb,
      studyUid,
      seriesUid,
      instanceNumber: f.instanceNumber,
      ...patient,
    });
    return { dicom, sopUid, rows: f.rows, cols: f.cols };
  });
  frames.length = 0; // free pixel memory before uploading

  let uploaded = 0;
  let next = 0;
  onProgress(0, built.length, 'upload');
  const worker = async () => {
    while (next < built.length) {
      if (cancelToken.cancelled) {
        return;
      }
      const idx = next++;
      const item = built[idx];
      try {
        const resp = await fetch(
          '/api/instances?studyInstanceUID=' + encodeURIComponent(studyUid),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/dicom' },
            body: item.dicom,
          }
        );
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }
      } catch (e) {
        console.error('[Save Fusion] upload failed', idx + 1, e);
        uiNotificationService.show({
          title: 'Save Fusion',
          message: `Upload failed on slice ${idx + 1} (${e.message}). The series is incomplete — delete it and retry.`,
          type: 'error',
        });
        return;
      }
      uploaded++;
      onProgress(uploaded, built.length, 'upload');
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(UPLOAD_CONCURRENCY, built.length) }, () => worker())
  );
  if (cancelToken.cancelled) {
    uiNotificationService.show({
      title: 'Save Fusion',
      message: `Cancelled — ${uploaded} of ${built.length} slices were stored; delete the partial series if unwanted.`,
      type: 'warning',
    });
    return;
  }

  // ---- register the new series so it appears in the thumbnail list ----
  try {
    const metas = built.map((b, i) => ({
      SOPClassUID: SC_SOP_CLASS_UID,
      SOPInstanceUID: b.sopUid,
      StudyInstanceUID: studyUid,
      SeriesInstanceUID: seriesUid,
      SeriesDescription: seriesName,
      SeriesNumber: '',
      Modality: 'OT',
      InstanceNumber: String(i + 1),
      Rows: String(b.rows),
      Columns: String(b.cols),
      PatientID: patient.patientId || '',
      PatientName: patient.patientName || '',
    }));
    DicomMetadataStore.addInstances(metas, true);
    // promote the new fusion series to the top of the active series list
    const list = displaySetService.activeDisplaySets;
    if (Array.isArray(list)) {
      const idx = list.findIndex(ds => ds && ds.SeriesInstanceUID === seriesUid);
      if (idx > 0) {
        const [ds] = list.splice(idx, 1);
        list.unshift(ds);
      }
    }
  } catch (e) {
    console.warn('[Save Fusion] series registration failed', e);
  }

  uiNotificationService.show({
    title: 'Save Fusion',
    message: `Saved "${seriesName}" — ${uploaded} slice${uploaded === 1 ? '' : 's'} in one series (top of list).`,
    type: 'success',
  });
}
