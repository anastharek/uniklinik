/**
 * "Capture Image" — snapshot the ACTIVE DICOM viewport and save it as a new
 * DICOM series (Secondary Capture, RGB8) inside the SAME study.
 *
 * How it works:
 *   1. Composites the source viewport element WYSIWYG: its WebGL canvas +
 *      the cornerstone3D annotation SVG overlay (the exact stack the user
 *      sees on screen) into one 2D canvas — annotations (arrows, ROIs,
 *      freehand, label text) are burned in at the position/zoom they appear.
 *   2. Builds a DICOM Secondary Capture file in the browser (dcmjs) with the
 *      user-supplied uppercase series name.
 *   3. Uploads it through the app's DICOMweb proxy (STOW-RS single-part,
 *      authenticated by the session cookie).
 *   4. Registers the new series directly in DicomMetadataStore so it appears
 *      in the thumbnail list immediately (top, like the AI series).
 */
import dcmjs from 'dcmjs';
import { cache } from '@cornerstonejs/core';
import { annotation as csAnnotation, ToolGroupManager } from '@cornerstonejs/tools';
import { DicomMetadataStore } from '@ohif/core';
import { parseImageId } from './imageId';

const { DicomMetaDictionary, DicomDict } = dcmjs.data;

const SC_SOP_CLASS_UID = '1.2.840.10008.5.1.4.1.1.7'; // Secondary Capture Image Storage
const EXPLICIT_VR_LE = '1.2.840.10008.1.2.1';
const MAX_CAPTURE_DIM = 2048; // safe WebGL texture limit on phones

function generateUid() {
  return DicomMetaDictionary.uid();
}

/**
 * Draw the active viewport's annotations directly from cornerstone's
 * annotation state onto the capture canvas (buffer coordinates).
 * Independent of the SVG overlay — deterministic, works at any DPR/zoom.
 */
function burnAnnotationsFromState(ctx, viewport, outW, outH, cssW, cssH, viewportId) {
  try {
    const all = (csAnnotation.state && csAnnotation.state.getAllAnnotations()) || [];
    if (!all.length) {
      return;
    }
    const sx = outW / cssW;
    const sy = outH / cssH;
    const scale = Math.min(sx, sy) || 1;
    const toolGroup = ToolGroupManager.getToolGroupForViewport(viewportId);
    const toolGroupId = toolGroup ? toolGroup.id : undefined;

    for (const ann of all) {
      if (!ann || !ann.metadata || !ann.metadata.toolName) continue;
      // only annotations belonging to this viewport's frame of reference
      if (
        ann.metadata.FrameOfReferenceUID &&
        viewport.getFrameOfReferenceUID &&
        ann.metadata.FrameOfReferenceUID !== viewport.getFrameOfReferenceUID()
      ) {
        continue;
      }
      // stack: same image; volume: within current slice
      if (typeof viewport.isReferenceViewable === 'function') {
        try {
          if (!viewport.isReferenceViewable(ann.metadata)) continue;
        } catch (e) {
          /* keep it anyway */
        }
      }

      const toolName = ann.metadata.toolName;
      const styleCtx = {
        annotationUID: ann.annotationUID,
        viewportId,
        toolGroupId,
        toolName,
      };
      const color =
        csAnnotation.config.style.getStyleProperty('color', styleCtx) || 'rgb(255, 255, 0)';
      const lw =
        parseInt(csAnnotation.config.style.getStyleProperty('lineWidth', styleCtx) || '1', 10) || 1;

      const pts = (ann.data && ann.data.handles && ann.data.handles.points) || [];
      // PlanarFreehandROI/SplineROI/LivewireContour store their polyline in
      // data.contour.polyline (as [x,y,z] arrays) — handles.points is empty.
      let pointList = pts;
      if ((!pointList || !pointList.length) && ann.data && ann.data.contour && Array.isArray(ann.data.contour.polyline)) {
        pointList = ann.data.contour.polyline;
      }
      const cpts = [];
      for (const p of pointList) {
        if (!p) continue;
        try {
          // accept both {x,y,z} objects and [x,y,z] arrays
          const world =
            Array.isArray(p) ? { x: p[0], y: p[1], z: p[2] !== undefined ? p[2] : 0 } : p;
          const c = viewport.worldToCanvas(world);
          if (Number.isFinite(c.x) && Number.isFinite(c.y)) {
            cpts.push({ x: c.x * sx, y: c.y * sy });
          }
        } catch (e) {
          /* skip */
        }
      }
      if (!cpts.length) continue;

      const label = ann.data && (ann.data.label ?? ann.data.text ?? '');
      const textColor =
        csAnnotation.config.style.getStyleProperty('textBoxColor', styleCtx) || color;
      const fontSize = Math.max(10, Math.round(14 * scale));

      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = Math.max(1, lw * scale);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      switch (toolName) {
        case 'ArrowAnnotate': {
          if (cpts.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(cpts[0].x, cpts[0].y);
            ctx.lineTo(cpts[1].x, cpts[1].y);
            ctx.stroke();
            // arrowhead
            const ang = Math.atan2(cpts[1].y - cpts[0].y, cpts[1].x - cpts[0].x);
            const head = Math.max(8, 10 * scale);
            ctx.beginPath();
            ctx.moveTo(cpts[1].x, cpts[1].y);
            ctx.lineTo(cpts[1].x - head * Math.cos(ang - 0.4), cpts[1].y - head * Math.sin(ang - 0.4));
            ctx.moveTo(cpts[1].x, cpts[1].y);
            ctx.lineTo(cpts[1].x - head * Math.cos(ang + 0.4), cpts[1].y - head * Math.sin(ang + 0.4));
            ctx.stroke();
            if (label) drawBurnText(ctx, label, cpts[1].x + 6 * scale, cpts[1].y - 6 * scale, textColor, fontSize);
          }
          break;
        }
        case 'RectangleROI':
        case 'PolygonROI':
        case 'PlanarFreehandROI':
        case 'SplineROI':
        case 'LivewireContour': {
          ctx.beginPath();
          ctx.moveTo(cpts[0].x, cpts[0].y);
          for (let i = 1; i < cpts.length; i++) ctx.lineTo(cpts[i].x, cpts[i].y);
          ctx.closePath();
          ctx.stroke();
          if (label && cpts.length) drawBurnText(ctx, label, cpts[0].x + 4 * scale, cpts[0].y - 4 * scale, textColor, fontSize);
          break;
        }
        case 'EllipticalROI': {
          const xs = cpts.map(c => c.x);
          const ys = cpts.map(c => c.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          ctx.beginPath();
          ctx.ellipse((minX + maxX) / 2, (minY + maxY) / 2, (maxX - minX) / 2, (maxY - minY) / 2, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'CircleROI': {
          const dx = cpts[1].x - cpts[0].x;
          const dy = cpts[1].y - cpts[0].y;
          ctx.beginPath();
          ctx.arc(cpts[0].x, cpts[0].y, Math.sqrt(dx * dx + dy * dy), 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'Angle':
        case 'Bidirectional':
        case 'CobbAngle':
        case 'Length': {
          ctx.beginPath();
          ctx.moveTo(cpts[0].x, cpts[0].y);
          for (let i = 1; i < cpts.length; i++) ctx.lineTo(cpts[i].x, cpts[i].y);
          ctx.stroke();
          if (label) drawBurnText(ctx, label, cpts[cpts.length - 1].x + 6 * scale, cpts[cpts.length - 1].y - 6 * scale, textColor, fontSize);
          break;
        }
        case 'Probe':
        case 'Label': {
          const p = cpts[0];
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(2, 2 * scale), 0, Math.PI * 2);
          ctx.stroke();
          if (label) drawBurnText(ctx, label, p.x + 6 * scale, p.y - 6 * scale, textColor, fontSize);
          break;
        }
        default: {
          // generic: polyline through the handles
          ctx.beginPath();
          ctx.moveTo(cpts[0].x, cpts[0].y);
          for (let i = 1; i < cpts.length; i++) ctx.lineTo(cpts[i].x, cpts[i].y);
          ctx.stroke();
          break;
        }
      }
      ctx.restore();
    }
  } catch (e) {
    console.warn('[Capture Image] annotation burn failed', e);
  }
}

function drawBurnText(ctx, text, x, y, color, fontSize) {
  ctx.save();
  ctx.font = `${fontSize}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 3;
  ctx.fillText(String(text), x, y);
  ctx.restore();
}

/**
 * Serialize the annotation SVG overlay to a drawable image.
 * A raw SVGSVGElement cannot be passed to ctx.drawImage in Chrome, and an
 * SVG with only CSS sizing (no width/height/viewBox) rasterizes at the
 * default 300×150 intrinsic size — both would silently drop the annotations.
 * We clone the layer with explicit dimensions matching its laid-out CSS size
 * (annotation coordinates are CSS-pixel user units) and load it as a
 * data-URL image, which drawImage accepts.
 */
function svgLayerToImage(svg, w, h) {
  return new Promise(resolve => {
    try {
      const clone = svg.cloneNode(true);
      clone.setAttribute('width', String(w));
      clone.setAttribute('height', String(h));
      clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const xml = new XMLSerializer().serializeToString(clone);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    } catch (e) {
      resolve(null);
    }
  });
}

/** Pull PatientName/ID + Study date/time from the loaded cornerstone image. */
function readPatientInfo(image) {
  const data = image && image.data;
  if (!data || typeof data.string !== 'function') {
    return {};
  }
  const s = tag => {
    try {
      return data.string(tag) || '';
    } catch (e) {
      return '';
    }
  };
  return {
    patientName: s('x00100010'),
    patientId: s('x00100020'),
    studyDate: s('x00080020'),
    studyTime: s('x00080030'),
  };
}

/**
 * Read the FULL patient + study identity from the in-memory study metadata
 * (DicomMetadataStore). This is the authoritative source — the loaded study's
 * metadata always carries PatientName/PatientID/StudyDate etc. (naturalized
 * by the DICOMweb data source), while the cornerstone image object may not.
 *
 * CRITICAL: Orthanc keys studies by (PatientID + StudyInstanceUID). If the
 * capture DICOM has an empty or different PatientID, Orthanc silently stores
 * it in a PHANTOM study with the same StudyInstanceUID but no patient — so it
 * never shows under the patient's thumbnails. Matching the patient identity
 * makes the capture merge into the correct study.
 */
function readStudyIdentity(studyUid) {
  const fallback = {};
  try {
    const study = DicomMetadataStore.getStudy(studyUid);
    if (!study) {
      return fallback;
    }
    // The study object in the store only carries PatientName/PatientID when
    // added via addStudy() (rarely used). In the normal viewing flow the
    // patient/study tags live on the INSTANCE metadata, so read them from the
    // first instance (same approach as StudySummaryFromMetadata).
    const firstInstance = study.series && study.series[0] && study.series[0].instances
      ? study.series[0].instances[0]
      : undefined;
    const src = firstInstance || study;
    const str = v => {
      if (v === undefined || v === null) return '';
      if (Array.isArray(v)) return String(v[0] || '');
      return String(v);
    };
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
    console.warn('[Capture Image] study metadata lookup failed', e);
    return fallback;
  }
}

/** Merge identity sources, preferring the study metadata over the image. */
function readIdentity(image, studyUid) {
  return {
    ...readPatientInfo(image),
    ...readStudyIdentity(studyUid),
  };
}

/**
 * Fallback: fetch the study record from the server via a lightweight QIDO
 * study query (authoritative patient identity even if the in-memory store
 * lookup missed). Returns {} on any failure.
 */
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
    const str = v => {
      if (v === undefined || v === null) return '';
      if (Array.isArray(v)) return String(v[0] || '');
      return String(v);
    };
    // NOTE: query.studies.search() returns processResults() output, which uses
    // its own key names (patientName, mrn, date, time, description, accession).
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
    console.warn('[Capture Image] server study lookup failed', e);
    return {};
  }
}

/** Build a DICOM Secondary Capture (uncompressed RGB8) as an ArrayBuffer. */
function buildScDicom({ name, rows, cols, rgb, studyUid, patientName, patientId, studyDate, studyTime, studyDescription, accessionNumber, studyId }) {
  const sopUid = generateUid();
  const seriesUid = generateUid();

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
    // Empty SeriesNumber — the study browser sorts series by SeriesNumber
    // ascending (undefined/empty sorts FIRST, like the AI series), so the
    // capture lands at the TOP of the series list instead of SeriesNumber
    // '9999' which pinned it to the bottom.
    SeriesNumber: '',
    InstanceNumber: '1',
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
    ImplementationVersionName: 'PUTRACNS_CAPTURE_1',
  };

  const denaturalized = DicomMetaDictionary.denaturalizeDataset(dataset);
  const dicomDict = new DicomDict(DicomMetaDictionary.denaturalizeDataset(meta));
  dicomDict.dict = denaturalized;
  return { dicom: dicomDict.write({ allowInvalidVRLength: false, fragmentMultiframe: false }), seriesUid };
}

/**
 * Build the DICOMweb QIDO URL for the new capture series from the active
 * viewport's imageId (same origin/root the viewer already uses, so the
 * external/shared-link cookie applies).
 */
function buildQidoInstancesUrl(imageId, studyUid, seriesUid) {
  let url = imageId || '';
  if (url.startsWith('wadors:')) {
    url = url.slice('wadors:'.length);
  } else if (url.startsWith('dicomweb:')) {
    url = url.slice('dicomweb:'.length);
  }
  const idx = url.indexOf('/studies/');
  if (idx < 0) return null;
  return url.slice(0, idx) + `/studies/${studyUid}/series/${seriesUid}/instances`;
}

/**
 * Main entry: capture the active viewport and save it as a new DICOM series.
 * `servicesManager` comes from the command module context; `name` (uppercase)
 * comes from the CaptureNameModal dialog — the browser prompt is unreliable
 * on mobile (iOS Safari ignores window.prompt), so the command module shows
 * an in-app modal instead of this function asking the user.
 */
export default async function captureViewportToDicom(servicesManager, name) {
  const { viewportGridService, cornerstoneViewportService, uiNotificationService, displaySetService } =
    servicesManager.services;

  const seriesName = String(name || '').trim().toUpperCase();
  if (!seriesName) {
    return; // cancelled / empty — nothing to save
  }

  const { activeViewportId } = viewportGridService.getState();
  const viewport = cornerstoneViewportService.getCornerstoneViewport(activeViewportId);

  if (!viewport || viewport.type === 'video' || viewport.type === 'wholeSlide') {
    uiNotificationService.show({
      title: 'Capture Image',
      message: 'The active viewport cannot be captured.',
      type: 'error',
    });
    return;
  }

  const sourceImageId =
    typeof viewport.getCurrentImageId === 'function' ? viewport.getCurrentImageId() : undefined;
  const parsed = parseImageId(sourceImageId);
  if (!parsed || !parsed.studyInstanceUID) {
    uiNotificationService.show({
      title: 'Capture Image',
      message: 'Could not determine the current study.',
      type: 'error',
    });
    return;
  }

  // keep the cached image for identity tags (patient/study) below
  const image = sourceImageId ? cache.getImage(sourceImageId) : undefined;

  // ---- capture WYSIWYG from the SOURCE viewport element ----
  // The user sees exactly: the WebGL canvas + the cornerstone3D annotation
  // SVG overlay on top (same DOM stack). Composing those two layers of the
  // source element is guaranteed to include every visible annotation (arrow,
  // ROI, label text…) at the exact position/zoom the user sees — no offscreen
  // viewport, no rAF timing, no tool-group plumbing.
  const info = cornerstoneViewportService.getViewportInfo
    ? cornerstoneViewportService.getViewportInfo(activeViewportId)
    : undefined;
  const sourceEl = info && typeof info.getElement === 'function' ? info.getElement() : undefined;
  const sourceCanvas = sourceEl ? sourceEl.querySelector('canvas') : undefined;
  if (!sourceEl || !sourceCanvas || !sourceCanvas.width || !sourceCanvas.height) {
    uiNotificationService.show({
      title: 'Capture Image',
      message: 'Could not read the viewport — try again.',
      type: 'error',
    });
    return;
  }

  const bufW = sourceCanvas.width;
  const bufH = sourceCanvas.height;
  const cssW = sourceEl.clientWidth || bufW;
  const cssH = sourceEl.clientHeight || bufH;
  const scale = Math.min(1, MAX_CAPTURE_DIM / Math.max(bufW, bufH));
  const outW = Math.max(1, Math.round(bufW * scale));
  const outH = Math.max(1, Math.round(bufH * scale));

  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const octx = outCanvas.getContext('2d');
  octx.drawImage(sourceCanvas, 0, 0, outW, outH);

  // Burn the annotation overlay (SVG) — same dst rect as the canvas so both
  // layers stay perfectly aligned at any DPR / zoom.
  //
  // NOTE: drawImage() on a raw SVGSVGElement THROWS in Chrome (only
  // SVGImageElement is accepted), and a CSS-sized svg without width/height/
  // viewBox attributes rasterizes at the 300x150 default intrinsic size —
  // so we serialize a clone with explicit dimensions to a data-URL image.
  const svgLayer = sourceEl.querySelector('svg.svg-layer');
  if (svgLayer && svgLayer.querySelector('line, path, circle, ellipse, rect, text, polygon, polyline, marker')) {
    const svgImg = await svgLayerToImage(svgLayer, cssW, cssH);
    if (svgImg) {
      try {
        octx.drawImage(svgImg, 0, 0, cssW, cssH, 0, 0, outW, outH);
      } catch (e) {
        console.warn('[Capture Image] annotation composite failed', e);
      }
    } else {
      console.warn('[Capture Image] annotation composite: svg->image conversion failed');
    }
  }

  // Deterministic fallback: draw the annotations straight from cornerstone's
  // annotation state (world coords → viewport canvas coords). Guarantees the
  // drawing is burned in even if the SVG overlay is empty/stale for any
  // reason. Overdraws the SVG layer harmlessly (identical shapes).
  burnAnnotationsFromState(octx, viewport, outW, outH, cssW, cssH, activeViewportId);

  const rgbCanvas = outCanvas;
  if (!rgbCanvas) {
    return;
  }

  // ---- RGBA canvas -> RGB bytes for the DICOM ----
  const rctx = rgbCanvas.getContext('2d');
  const w = rgbCanvas.width;
  const h = rgbCanvas.height;
  const rgba = rctx.getImageData(0, 0, w, h).data;
  const rgb = new Uint8Array(w * h * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i];
    rgb[j + 1] = rgba[i + 1];
    rgb[j + 2] = rgba[i + 2];
  }

  let patient = readIdentity(image, parsed.studyInstanceUID);
  if (!patient.patientId) {
    patient = await fetchStudyIdentityFromServer(servicesManager, parsed.studyInstanceUID);
  }
  const { dicom, seriesUid } = buildScDicom({
    name: seriesName,
    rows: h,
    cols: w,
    rgb,
    studyUid: parsed.studyInstanceUID,
    ...patient,
  });

  // ---- STOW-RS upload through the app's DICOM proxy ----
  // POST /api/instances forwards the raw DICOM body to Orthanc's REST
  // /instances (single-part application/dicom); modify.lua carves out SC
  // captures from the modality filter. Auth: the session cookie normally
  // authenticates; for external/shared-link sessions (external cookie, no
  // JWT) the study UID is passed in the query so the scope guard can verify
  // the upload belongs to the external study.
  let resp;
  try {
    resp = await fetch(
      '/api/instances?studyInstanceUID=' + encodeURIComponent(parsed.studyInstanceUID),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/dicom' },
        body: dicom,
      }
    );
  } catch (e) {
    console.error('[Capture Image] upload failed', e);
    uiNotificationService.show({
      title: 'Capture Image',
      message: 'Upload failed — check your connection.',
      type: 'error',
    });
    return;
  }

  if (!resp.ok) {
    console.error('[Capture Image] upload rejected', resp.status);
    uiNotificationService.show({
      title: 'Capture Image',
      message: `Upload failed (HTTP ${resp.status}).`,
      type: 'error',
    });
    return;
  }

  // ---- make the new capture series appear in the thumbnail panel ----
  // Targeted approach: fetch ONLY the new series' instance metadata and
  // register it through DicomMetadataStore (the same path the datasource
  // uses), so DisplaySetService auto-creates the display set and the panel
  // picks it up. The old approach re-fetched the WHOLE study metadata
  // (`retrieve.series.metadata`) which silently failed once the study
  // already contained a capture series — the new series never appeared
  // until a full page reload.
  try {
    const qidoUrl = buildQidoInstancesUrl(sourceImageId, parsed.studyInstanceUID, seriesUid);
    if (qidoUrl) {
      const metaResp = await fetch(qidoUrl, { credentials: 'same-origin' });
      if (metaResp.ok) {
        const rawList = await metaResp.json();
        const metas = (Array.isArray(rawList) ? rawList : [])
          .map(raw => {
            const meta = DicomMetaDictionary.naturalizeDataset(raw);
            // force the identity fields (QIDO may omit study/series-level tags)
            return {
              ...meta,
              StudyInstanceUID: parsed.studyInstanceUID,
              SeriesInstanceUID: seriesUid,
              SeriesDescription: seriesName,
              Modality: 'OT',
              SeriesNumber: '',
              PatientID: patient.patientId || '',
              PatientName: patient.patientName || '',
            };
          })
          .filter(m => m && m.SOPInstanceUID);
        if (metas.length) {
          DicomMetadataStore.addInstances(metas, true);
        }
      }
    }
  } catch (e) {
    console.warn('[Capture Image] series registration failed', e);
  }

  // ---- move the new capture display set to the TOP of the series list ----
  // (the registration above appends it at the end; the study browser keeps
  // insertion order for the current session, so promote it explicitly)
  try {
    if (displaySetService && seriesUid) {
      const list = displaySetService.activeDisplaySets;
      if (Array.isArray(list)) {
        const idx = list.findIndex(ds => ds && ds.SeriesInstanceUID === seriesUid);
        if (idx > 0) {
          const [captureDs] = list.splice(idx, 1);
          list.unshift(captureDs);
        }
      }
    }
  } catch (e) {
    console.warn('[Capture Image] series reorder failed', e);
  }

  uiNotificationService.show({
    title: 'Capture Image',
    message: `Saved "${seriesName}" as a new series.`,
    type: 'success',
  });
}
