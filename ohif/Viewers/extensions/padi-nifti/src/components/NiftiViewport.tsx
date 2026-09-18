import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNiftiStore } from '../stores/niftiStore';
import { startSync, stopSync } from '../utils/syncService';
import { createNiftiDisplaySet } from '../getSopClassHandlerModule';
import { ellipseMask, polygonMask, computeRoiStats } from '../utils/roiStats';
import { buildSliceScDicom, generateUid } from '../utils/dicomWriter';
import { buildRangeColorMap, buildRangeLutRgba, getQuantScale, renderSliceRgb } from '../utils/rangeLut';
import * as api from '../services/niftiApi';

const TOOL_STRIP = [
  { id: 'wl', label: 'WL' },
  { id: 'pan', label: 'Pan' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'slice', label: 'Slice' },
];

const STAGE_LABELS = {
  'Preparing series': 'Preparing series',
  'Retrieving DICOM': 'Retrieving DICOM',
  'Retrieving DICOM (transcoding compressed)': 'Retrieving DICOM',
  'Retrieving DICOM (per instance)': 'Retrieving DICOM',
  'Converting volume': 'Converting volume',
  'Validating geometry': 'Validating geometry',
  'Loading NIfTI': 'Loading NIfTI',
  Ready: 'Ready',
  Error: 'Error',
};

/**
 * NIfTI research viewport: hosts Niivue, drives the conversion state
 * machine, renders overlays (progress / error / ready / analysis), owns the
 * ROI overlay canvas and the DICOM <-> NIfTI spatial sync.
 */
export default function NiftiViewport({ displaySets, viewportId, servicesManager, commandsManager }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null); // ROI drawing overlay
  const nvRef = useRef(null);
  const stackRef = useRef(null); // left DICOM stack viewport
  const watchedSeriesRef = useRef(null); // '<studyUid>/<seriesUid>' the session is bound to

  const [nvReady, setNvReady] = useState(false);

  const displaySet = displaySets && displaySets[0];
  const {
    status,
    stage,
    percent,
    processed,
    total,
    error,
    studyUid,
    seriesUid,
    viewportId: storeVpId,
    metadata,
    niftiData,
    niftiHeader,
    niftiAffine,
    settings,
    roi,
    roiArmed,
    adc,
    syncActive,
    requestSave,
  } = useNiftiStore();

  // panel "Save as DICOM" button -> this viewport's save handler
  const saveRequestedRef = useRef(requestSave);
  useEffect(() => {
    if (requestSave !== saveRequestedRef.current) {
      saveRequestedRef.current = requestSave;
      if (requestSave > 0) {
        handleSaveRef.current && handleSaveRef.current();
      }
    }
  }, [requestSave]);

  // ---- kick off conversion when this viewport gets its display set ----
  useEffect(() => {
    if (!displaySet || !viewportId) return;
    const st = useNiftiStore.getState();
    // Guard must compare the SERIES too: with only studyUid, switching to
    // another series inside the same study was treated as "already loaded"
    // and the old NIfTI stayed on screen forever.
    const already =
      st.viewportId === viewportId &&
      st.studyUid === displaySet.StudyInstanceUID &&
      st.seriesUid === displaySet.SeriesInstanceUID;
    if (already && (st.status === 'ready' || st.status === 'analysis' || st.status === 'error')) return;

    const { viewportGridService } = servicesManager.services;
    const gridState = viewportGridService.getState();
    const vps = Array.from(gridState.viewports.values());
    const leftVp = vps.find(v => v.viewportOptions.viewportId !== viewportId);

    watchedSeriesRef.current = `${displaySet.StudyInstanceUID}/${displaySet.SeriesInstanceUID}`;
    st.setup({
      studyUid: displaySet.StudyInstanceUID,
      seriesUid: displaySet.SeriesInstanceUID,
      viewportId,
      dicomViewportId: leftVp ? leftVp.viewportOptions.viewportId : null,
      niftiDisplaySetUID: displaySet.displaySetInstanceUID,
    });
    st.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displaySet && displaySet.displaySetInstanceUID, viewportId]);

  // ---- watch the LEFT DICOM viewport for series changes ----
  // When the user loads a different series into the left (DICOM) pane, tear
  // down the current research session and restart conversion + sync for the
  // new series. Previously nothing observed this, so the NIfTI viewport kept
  // showing the FIRST series' volume forever.
  useEffect(() => {
    if (!viewportId || !servicesManager) return;
    const { viewportGridService, displaySetService } = servicesManager.services;

    const checkLeftSeries = () => {
      const st = useNiftiStore.getState();
      if (!st.dicomViewportId || st.status === 'saving') return;
      const uids = viewportGridService.getDisplaySetsUIDsForViewport(st.dicomViewportId);
      if (!uids || !uids.length) return;
      const ds = displaySetService.getDisplaySetByUID(uids[0]);
      if (!ds || ds.Modality === 'NIFTI') return;

      const key = `${ds.StudyInstanceUID}/${ds.SeriesInstanceUID}`;
      if (key === watchedSeriesRef.current) return;
      watchedSeriesRef.current = key;

      // Left pane switched series -> restart the whole research session.
      stopSync();
      const oldNv = nvRef.current;
      if (oldNv) {
        try {
          oldNv.destroy && oldNv.destroy();
        } catch (e) {
          /* ignore */
        }
        nvRef.current = null;
      }
      setNvReady(false);
      if (overlayRef.current && overlayRef.current._resizeCleanup) {
        try {
          overlayRef.current._resizeCleanup();
        } catch (e) {
          /* ignore */
        }
      }

      // Fresh synthetic display set for the new series -> the kick-off effect
      // above re-runs (new displaySetInstanceUID) and starts the conversion.
      const niftiDs = createNiftiDisplaySet({
        studyInstanceUID: ds.StudyInstanceUID,
        seriesInstanceUID: ds.SeriesInstanceUID,
        sourceDisplaySetUID: ds.displaySetInstanceUID,
        sourceSeriesDescription: ds.SeriesDescription,
        sourceModality: ds.Modality,
      });
      displaySetService.addDisplaySets(niftiDs);
      commandsManager && commandsManager.run('setDisplaySetsForViewports', {
        viewportsToUpdate: [
          {
            viewportId: st.viewportId,
            displaySetInstanceUIDs: [niftiDs.displaySetInstanceUID],
          },
        ],
      });
    };

    const sub = viewportGridService.subscribe(
      viewportGridService.EVENTS.GRID_STATE_CHANGED,
      checkLeftSeries
    );
    return () => {
      sub && sub.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewportId, servicesManager]);

  // ---- load the volume into Niivue when the store becomes ready ----
  useEffect(() => {
    if (status !== 'ready' && status !== 'analysis') return;
    if (nvRef.current) return;
    let cancelled = false;

    (async () => {
      // Capture the session we belong to; bail if the viewport was told to
      // load a different series while we were mid-flight.
      const sessionSeries = useNiftiStore.getState().seriesUid;
      try {
        const { Niivue } = await import('@niivue/niivue');
        if (cancelled || !canvasRef.current) return;
        const nv = new Niivue({ isWebGLAvailable: true });
        nvRef.current = nv;
        await nv.attachToCanvas(canvasRef.current);
        if (cancelled || sessionSeries !== useNiftiStore.getState().seriesUid) return;
        // Feed Niivue the SAME downloaded bytes (single download, both consumers)
        const raw = useNiftiStore.getState().niftiRawBuffer;
        if (!raw) return;
        const blob = new Blob([raw], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        await nv.loadVolumes([{ url, name: 'research.nii.gz' }]);
        URL.revokeObjectURL(url);
        if (cancelled || sessionSeries !== useNiftiStore.getState().seriesUid) return;
        nv.setSliceType(nv.sliceTypeAxial);
        // The red/green crosshair lines (drawn because the sync moves the
        // crosshair to drive the slice) are not needed — keep them invisible.
        try {
          nv.setCrosshairColor([0, 0, 0, 0]);
        } catch (e) {
          /* older Niivue */
        }
        applySettingsToNv(nv, useNiftiStore.getState().settings);
        if (cancelled || sessionSeries !== useNiftiStore.getState().seriesUid) return;
        setNvReady(true);

        // wire ROI overlay interaction
        setupOverlay(overlayRef.current, nv, useNiftiStore);
        // start spatial sync with the left DICOM viewport
        const { cornerstoneViewportService } = servicesManager.services;
        const dvp = useNiftiStore.getState().dicomViewportId;
        const stackVp = dvp ? cornerstoneViewportService.getCornerstoneViewport(dvp) : null;
        if (stackVp && stackVp.type === 'stack') {
          stackRef.current = stackVp;
          startSync({
            stackViewport: stackVp,
            getNifti: () => nvRef.current,
            servicesManager,
          });
        }
      } catch (e) {
        // Only surface the error if we are still the current session (a stale
        // load must not paint an error over a freshly started conversion).
        if (!cancelled && sessionSeries === useNiftiStore.getState().seriesUid) {
          console.error('[NIfTI] viewport init failed', e);
          useNiftiStore.getState().setStatus('error', { error: String((e && e.message) || e), stage: 'Error' });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ---- react to display settings from the panel ----
  useEffect(() => {
    const nv = nvRef.current;
    if (!nv || !nvReady) return;
    applySettingsToNv(nv, settings);
    // recompute ROI results when threshold/range change (display-only, results recompute from voxels)
    if (roi.points) {
      recomputeRoi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, nvReady]);

  const applySettingsToNv = useCallback((nv, s) => {
    try {
      const vol = nv.volumes[0];
      if (!vol) return;
      if (s.rangeColorizeEnabled && s.ranges && s.ranges.length > 0) {
        // ADC value-range colorization: custom LUT mapped over rangeMin..rangeMax.
        try {
          nv.addColormap('padi-ranges', buildRangeColorMap(s));
        } catch (e) {
          /* colormap may already exist — re-add is idempotent enough */
        }
        vol.colormap = 'padi-ranges';
        vol.wl = (s.rangeMin + s.rangeMax) / 2;
        vol.ww = Math.max(1, s.rangeMax - s.rangeMin);
        nv.updateGLVolume(0);
      } else {
        if (s.colormap) {
          vol.colormap = s.colormap;
        }
        nv.updateGLVolume(0);
        if (s.wl !== null && s.wl !== undefined) vol.wl = s.wl;
        if (s.ww !== null && s.ww !== undefined) vol.ww = s.ww;
        nv.updateGLVolume(0);
      }
      nv.setOpacity(0, s.colormapOpacity / 100);
      nv.drawScene();
    } catch (e) {
      /* ignore transient */
    }
  }, []);

  // ---- ROI drawing ----
  const setupOverlay = useCallback((canvas, nv, store) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let startPt = null;
    let freehandPts = [];

    const canvasToVoxel = (x, y) => {
      try {
        const rect = canvas.getBoundingClientRect();
        const px = ((x - rect.left) / rect.width) * canvas.width;
        const py = ((y - rect.top) / rect.height) * canvas.height;
        const info = nv.getCurrentSliceInfo();
        const dims = useNiftiStore.getState().niftiHeader.dims;
        const nx = dims[1];
        const ny = dims[2];
        // Invert Niivue's vox2frac (frac = (vox+0.5)/dims) -> exact voxel index.
        const k = Math.max(0, Math.min(dims[3] - 1, Math.round(info.slicePosition * dims[3] - 0.5)));
        let i, j;
        try {
          const frac = nv.screenXY2TextureFrac(px, py, k, true);
          if (frac && Number.isFinite(frac[0]) && Number.isFinite(frac[1])) {
            i = Math.round(frac[0] * (nx - 1));
            j = Math.round(frac[1] * (ny - 1));
          } else {
            throw new Error('bad frac');
          }
        } catch (e) {
          // Fallback: linear screen->voxel map (valid for the single-slice
          // axial view without zoom/pan).
          i = Math.round((px / canvas.width) * (nx - 1));
          j = Math.round((py / canvas.height) * (ny - 1));
        }
        return { i, j, k };
      } catch (e) {
        return null;
      }
    };

    const redraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const s = store.getState().roi;
      if (!s.points || s.points.length < 2) return;
      const dims = store.getState().niftiHeader.dims;
      const nx = dims[1];
      const ny = dims[2];
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (s.type === 'ellipse') {
        const [cx, cy, rx, ry] = s.points;
        const scx = (cx / nx) * canvas.width;
        const scy = (cy / ny) * canvas.height;
        const srx = (rx / nx) * canvas.width;
        const sry = (ry / ny) * canvas.height;
        ctx.ellipse(scx, scy, Math.max(2, srx), Math.max(2, sry), 0, 0, Math.PI * 2);
      } else {
        const pts = s.points;
        ctx.moveTo((pts[0][0] / nx) * canvas.width, (pts[0][1] / ny) * canvas.height);
        for (let p = 1; p < pts.length; p++) {
          ctx.lineTo((pts[p][0] / nx) * canvas.width, (pts[p][1] / ny) * canvas.height);
        }
        ctx.closePath();
      }
      ctx.stroke();
    };

    canvas.onpointerdown = e => {
      if (!store.getState().adc.validated) return;
      const mode = store.getState().roi.type;
      if (mode !== 'ellipse' && mode !== 'freehand') return;
      drawing = true;
      const v = canvasToVoxel(e.clientX, e.clientY);
      if (!v) return;
      startPt = v;
      freehandPts = [v];
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {
        /* non-critical (synthetic/unsupported pointer) */
      }
    };
    canvas.onpointermove = e => {
      if (!drawing) return;
      const v = canvasToVoxel(e.clientX, e.clientY);
      if (!v) return;
      freehandPts.push(v);
      const mode = store.getState().roi.type;
      if (mode === 'freehand') {
        // live preview
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo((freehandPts[0][0] / nx()) * canvas.width, (freehandPts[0][1] / ny()) * canvas.height);
        for (let p = 1; p < freehandPts.length; p++) {
          ctx.lineTo((freehandPts[p][0] / nx()) * canvas.width, (freehandPts[p][1] / ny()) * canvas.height);
        }
        ctx.stroke();
      } else if (mode === 'ellipse' && startPt) {
        // live ellipse preview
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = (startPt.i + v.i) / 2;
        const cy = (startPt.j + v.j) / 2;
        const rx = Math.abs(v.i - startPt.i) / 2;
        const ry = Math.abs(v.j - startPt.j) / 2;
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse((cx / nx()) * canvas.width, (cy / ny()) * canvas.height, Math.max(2, (rx / nx()) * canvas.width), Math.max(2, (ry / ny()) * canvas.height), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    };
    canvas.onpointerup = () => {
      if (!drawing) return;
      drawing = false;
      const mode = store.getState().roi.type;
      const dims = store.getState().niftiHeader.dims;
      const nxD = dims[1];
      const nyD = dims[2];
      const k = startPt.k;
      const last = freehandPts[freehandPts.length - 1] || startPt;
      if (mode === 'ellipse' && startPt && last) {
        const cx = (startPt.i + last.i) / 2;
        const cy = (startPt.j + last.j) / 2;
        const rx = Math.abs(last.i - startPt.i) / 2;
        const ry = Math.abs(last.j - startPt.j) / 2;
        store.getState().setRoi({ points: [cx, cy, Math.max(1, rx), Math.max(1, ry)], slice: k });
        recomputeRoi();
      } else if (mode === 'freehand' && freehandPts.length >= 3) {
        const pts = freehandPts.map(p => [p.i, p.j]);
        store.getState().setRoi({ points: pts, slice: k });
        recomputeRoi();
      }
      freehandPts = [];
      redraw();
    };
    const nx = () => useNiftiStore.getState().niftiHeader.dims[1];
    const ny = () => useNiftiStore.getState().niftiHeader.dims[2];

    // keep overlay sized to canvas
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    canvas._resizeCleanup = () => window.removeEventListener('resize', resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recomputeRoi = useCallback(() => {
    const st = useNiftiStore.getState();
    const { niftiData, niftiHeader, niftiAffine, roi, adc } = st;
    if (!niftiData || !roi.points) return;
    const dims = niftiHeader.dims;
    const nx = dims[1];
    const ny = dims[2];
    const k = roi.slice !== undefined ? roi.slice : 0;
    // Quantitative transform on top of NIfTI voxels:
    //  - 'rescale': dcm2niix already applied RescaleSlope/Intercept -> voxels
    //    are already in quantitative units -> identity.
    //  - 'realWorldValueMapping': RWV maps the (post-rescale) stored values to
    //    real-world units -> apply the RWV slope/intercept.
    const scale =
      adc.validated && adc.mapping
        ? adc.mapping.type === 'realWorldValueMapping'
          ? { slope: adc.mapping.slope || 1, intercept: adc.mapping.intercept || 0 }
          : { slope: 1, intercept: 0 }
        : { slope: 1, intercept: 0 };
    const mask =
      roi.type === 'ellipse'
        ? ellipseMask(nx, ny, k, roi.points[0], roi.points[1], roi.points[2], roi.points[3])
        : polygonMask(nx, ny, k, roi.points);
    const pixArea = (niftiHeader.pixDims[1] || 1) * (niftiHeader.pixDims[2] || 1);
    const results = computeRoiStats(niftiData, mask, pixArea, scale);
    // Debug snapshot (lightweight; helps diagnose ROI issues in the field)
    try {
      window.__niftiDebug = {
        nx, ny, k, nz: dims[3],
        points: roi.points,
        maskLen: mask.length,
        dataLen: niftiData.length,
        dataSample: Array.from(niftiData.slice(0, 3)),
        pixDims: niftiHeader.pixDims && niftiHeader.pixDims.slice(0, 4),
        results,
      };
    } catch (e) {
      /* ignore */
    }
    st.setRoi({ results });
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      stopSync();
      const nv = nvRef.current;
      if (nv) {
        try {
          nv.destroy && nv.destroy();
        } catch (e) {
          /* ignore */
        }
        nvRef.current = null;
      }
      if (overlayRef.current && overlayRef.current._resizeCleanup) {
        overlayRef.current._resizeCleanup();
      }
    };
  }, []);

  // ---- viewport interaction tools: WL / Pan / Zoom (scroll = slice) ----
  const panRef = useRef([0, 0, 0, 1]); // [x, y, z, zoom] in mm space
  const [saveProgress, setSaveProgress] = useState(null); // { done, total }

  useEffect(() => {
    if (!nvReady) return;
    const nv = nvRef.current;
    const canvas = canvasRef.current;
    if (!nv || !canvas) return;
    let drag = null;

    const mmPerPx = () => {
      const h = useNiftiStore.getState().niftiHeader;
      const pix = (h && h.pixDims) || [0, 1, 1, 1];
      return pix[1] / Math.max(0.1, panRef.current[3] || 1);
    };

    const onPointerDown = e => {
      const tool = useNiftiStore.getState().settings.tool;
      if (tool !== 'wl' && tool !== 'pan') return;
      drag = { x: e.clientX, y: e.clientY, pan: [...panRef.current] };
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {
        /* non-critical */
      }
      e.preventDefault();
    };
    const onPointerMove = e => {
      if (!drag) return;
      const tool = useNiftiStore.getState().settings.tool;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (tool === 'wl') {
        const cur = useNiftiStore.getState().settings;
        const ww = cur.ww === null || cur.ww === undefined ? 400 : cur.ww;
        const wl = cur.wl === null || cur.wl === undefined ? 50 : cur.wl;
        useNiftiStore.getState().setSettings({ wl: Math.round(wl - dy * 2), ww: Math.round(ww + dx * 2) });
      } else if (tool === 'pan') {
        const m = mmPerPx();
        panRef.current = [drag.pan[0] - dx * m, drag.pan[1] - dy * m, drag.pan[2], drag.pan[3]];
        try {
          nv.setPan2Dxyzmm([panRef.current[0], panRef.current[1], panRef.current[2], panRef.current[3]]);
        } catch (err) {
          /* ignore */
        }
      }
      e.preventDefault();
    };
    const onPointerUp = () => {
      drag = null;
    };
    const onWheel = e => {
      const tool = useNiftiStore.getState().settings.tool;
      const zoomWheel = tool === 'zoom' || e.ctrlKey || e.metaKey;
      if (!zoomWheel) return; // plain wheel -> Niivue slice scroll
      e.preventDefault();
      const z = Math.max(0.1, Math.min(20, panRef.current[3] * (e.deltaY < 0 ? 1.12 : 0.89)));
      panRef.current[3] = z;
      try {
        nv.setPan2Dxyzmm([panRef.current[0], panRef.current[1], panRef.current[2], z]);
      } catch (err) {
        /* ignore */
      }
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [nvReady]);

  const resetViewport = () => {
    const nv = nvRef.current;
    useNiftiStore.getState().setSettings({ wl: null, ww: null });
    panRef.current = [0, 0, 0, 1];
    if (nv) {
      try {
        nv.setPan2Dxyzmm([0, 0, 0, 1]);
        const frac = nv.vox2frac([0, 0, 0]);
        nv.scene.crosshairPos = frac;
        nv.drawScene();
      } catch (e) {
        /* ignore */
      }
    }
  };

  // ---- save as DICOM (full volume: one instance per slice) ----
  const handleSave = async () => {
    const st = useNiftiStore.getState();
    const { niftiData, niftiHeader, niftiAffine, adc, settings, studyUid, seriesUid } = st;
    if (!niftiData || !niftiHeader) {
      const { uiNotificationService } = servicesManager.services;
      uiNotificationService.show({
        title: 'Save as DICOM',
        message: 'NIfTI volume is not ready yet',
        type: 'error',
        duration: 4000,
      });
      return;
    }
    try {
      st.markSaving(true);
      const dims = niftiHeader.dims;
      const nx = dims[1];
      const ny = dims[2];
      const nz = dims[3];
      const pix = niftiHeader.pixDims || [0, 1, 1, 1];
      // Colormap LUT (256 RGBA) — prefer the live Niivue LUT so the export
      // matches the on-screen colors exactly; fall back to gray.
      let lutRgba = null;
      try {
        const nv = nvRef.current;
        if (nv && nv.colormap) {
          const name = settings.rangeColorizeEnabled ? 'padi-ranges' : settings.colormap;
          const lut = name === 'padi-ranges' ? buildRangeLutRgba(settings) : nv.colormap(settings.colormap);
          if (lut && lut.length >= 1024) lutRgba = lut;
        }
      } catch (e) {
        /* fall through */
      }
      if (!lutRgba) {
        lutRgba = new Uint8Array(1024);
        for (let i = 0; i < 256; i++) {
          lutRgba[i * 4] = i;
          lutRgba[i * 4 + 1] = i;
          lutRgba[i * 4 + 2] = i;
          lutRgba[i * 4 + 3] = 255;
        }
      }
      const rangeLutRgba = buildRangeLutRgba(settings);
      const scale = getQuantScale(adc);

      const seriesDescription = st.seriesDescription || 'ADC Parametric Map – Research';
      const outSeriesUid = generateUid();

      // Image orientation: row direction = affine col 1, col direction = affine col 0.
      const norm3 = v => {
        const l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
        return [v[0] / l, v[1] / l, v[2] / l];
      };
      const aff = niftiAffine || [
        [pix[1], 0, 0, 0],
        [0, pix[2], 0, 0],
        [0, 0, pix[3], 0],
        [0, 0, 0, 1],
      ];
      const rowDir = norm3([aff[0][1], aff[1][1], aff[2][1]]);
      const colDir = norm3([aff[0][0], aff[1][0], aff[2][0]]);
      const imageOrientationPatient = [...rowDir, ...colDir];

      for (let k = 0; k < nz; k++) {
        setSaveProgress({ done: k + 1, total: nz });
        const rgb = renderSliceRgb({
          data: niftiData,
          nx,
          ny,
          k,
          settings,
          lutRgba,
          scale,
          rangeLutRgba,
        });
        const ipp = [
          aff[0][3] + aff[0][2] * k,
          aff[1][3] + aff[1][2] * k,
          aff[2][3] + aff[2][2] * k,
        ];
        const part10 = buildSliceScDicom({
          name: seriesDescription,
          rows: ny,
          cols: nx,
          rgb,
          studyUid,
          seriesUid: outSeriesUid,
          sopUid: generateUid(),
          instanceNumber: k + 1,
          imagePositionPatient: ipp,
          imageOrientationPatient,
          pixelSpacing: [pix[2] || 1, pix[1] || 1],
          sliceThickness: pix[3] || 1,
        });
        await api.uploadDicom(part10);
      }
      setSaveProgress(null);
      // record provenance
      try {
        await api.postDerivedProvenance({
          sourceStudyInstanceUID: studyUid,
          sourceSeriesInstanceUID: seriesUid,
          outputSeriesInstanceUID: outSeriesUid,
          sourceSeriesDescription: st.metadata && st.metadata.source && st.metadata.source.seriesDescription,
          sourceModality: st.metadata && st.metadata.source && st.metadata.source.modality,
          converterSoftware: st.metadata && st.metadata.converter && st.metadata.converter.software,
          converterVersion: st.metadata && st.metadata.converter && st.metadata.converter.version,
          adcUnits: st.adc.units,
          analysisModule: 'adc-mapping',
          analysisPayload: {
            colormap: settings.colormap,
            colormapOpacity: settings.colormapOpacity,
            wl: settings.wl,
            ww: settings.ww,
            rangeMin: settings.rangeMin,
            rangeMax: settings.rangeMax,
            thresholdEnabled: settings.thresholdEnabled,
            thresholdValue: settings.thresholdValue,
            thresholdOpacity: settings.thresholdOpacity,
            rangeColorizeEnabled: settings.rangeColorizeEnabled,
            ranges: settings.ranges,
            roi: st.roi,
            roiResults: st.roi.results,
            adcValidation: st.adc,
            savedAt: new Date().toISOString(),
          },
        });
      } catch (e) {
        console.warn('[NIfTI] provenance record failed', e);
      }
      // refresh study/series list
      try {
        const { dataSourcesService } = servicesManager.services;
        const ds = dataSourcesService.getActiveDataSource();
        await ds.retrieve.series.metadata({ StudyInstanceUID: studyUid });
      } catch (e) {
        /* non-fatal */
      }
      const { uiNotificationService } = servicesManager.services;
      uiNotificationService.show({
        title: 'Save as DICOM',
        message: `Saved ${nz} slices as "${seriesDescription}" (new derived series)`,
        type: 'success',
        duration: 5000,
      });
    } catch (e) {
      setSaveProgress(null);
      const { uiNotificationService } = servicesManager.services;
      uiNotificationService.show({
        title: 'Save as DICOM',
        message: `Failed at slice ${saveProgress ? saveProgress.done : '?'}: ${(e && e.message) || e}`,
        type: 'error',
        duration: 5000,
      });
    } finally {
      useNiftiStore.getState().markSaving(false);
    }
  };

  const handleSaveRef = useRef(null);
  handleSaveRef.current = handleSave;

  // ---- render ----
  const showProgress = status === 'preparing' || status === 'loading';
  const showError = status === 'error';
  const showReady = status === 'ready' || status === 'analysis' || status === 'saving';

  return (
    <div ref={containerRef} className="relative h-full w-full bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <canvas
        ref={overlayRef}
        className="absolute inset-0 h-full w-full"
        style={{
          pointerEvents:
            roiArmed && (status === 'analysis' || status === 'ready') && adc.validated ? 'auto' : 'none',
        }}
      />
      {showProgress && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/85 text-white">
          <div className="mb-2 text-lg font-semibold">{STAGE_LABELS[stage] || stage || 'Preparing NIfTI'}</div>
          {percent !== null && percent !== undefined ? (
            <div className="mb-2 text-sm text-gray-300">
              {percent}%{total > 0 ? ` — ${processed} / ${total} images processed` : ''}
            </div>
          ) : (
            <div className="mb-2 text-sm text-gray-300">{total > 0 ? `${processed} / ${total} images processed` : 'Working…'}</div>
          )}
          <div className="h-2 w-64 overflow-hidden rounded bg-gray-700">
            {percent !== null && percent !== undefined ? (
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${percent}%` }} />
            ) : (
              <div className="h-full w-1/3 animate-pulse bg-blue-500" />
            )}
          </div>
        </div>
      )}
      {showError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/85 p-4 text-center text-white">
          <div className="mb-1 text-lg font-semibold text-red-400">NIfTI conversion failed</div>
          <div className="mb-4 max-w-md text-sm text-gray-300">{error}</div>
          <button
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
            onClick={() => useNiftiStore.getState().start()}
          >
            Retry
          </button>
          <button
            className="mt-2 text-xs text-gray-400 underline"
            onClick={() => {
              const el = document.getElementById('nifti-error-details');
              if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
            }}
          >
            Technical Details
          </button>
          <div id="nifti-error-details" className="mt-2 hidden max-w-md break-all text-left text-xs text-gray-500">
            {error}
          </div>
        </div>
      )}
      {showReady && (
        <div className="pointer-events-none absolute right-2 top-2 z-10 rounded bg-black/60 px-2 py-1 text-[10px] text-white">
          {syncActive ? '🔗 Synced' : 'NIfTI'}
          {adc.validated ? ` · ADC ${adc.units || ''}` : ' · ADC not validated'}
        </div>
      )}
      {status === 'saving' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 text-white">
          <div className="text-center text-sm">
            <div>Exporting derived DICOM series…</div>
            {saveProgress && saveProgress.total > 0 && (
              <div className="mt-2 text-xs text-gray-300">
                Slice {saveProgress.done} / {saveProgress.total}
              </div>
            )}
          </div>
        </div>
      )}
      {showReady && (
        <div className="pointer-events-auto absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded bg-black/60 p-1">
          {TOOL_STRIP.map(t => (
            <button
              key={t.id}
              className={`rounded px-2 py-1 text-[11px] font-medium ${
                settings.tool === t.id && !roiArmed ? 'bg-blue-600 text-white' : 'text-white/70 hover:bg-white/10'
              }`}
              onClick={() => {
                useNiftiStore.getState().setSettings({ tool: t.id });
                useNiftiStore.getState().setRoiArmed(false);
              }}
            >
              {t.label}
            </button>
          ))}
          <button
            className="rounded px-2 py-1 text-[11px] font-medium text-white/70 hover:bg-white/10"
            onClick={resetViewport}
            title="Reset view (window, pan, zoom, slice)"
          >
            Reset
          </button>
        </div>
      )}
      {showReady && (
        <div className="pointer-events-auto absolute bottom-2 right-2 z-10">
          <button
            className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
            onClick={handleSave}
          >
            Save as DICOM
          </button>
        </div>
      )}
    </div>
  );
}
