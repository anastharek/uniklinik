import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@ohif/ui-next';
import { metaData } from '@cornerstonejs/core';
import { FUSION_COLOR_OPTIONS, registerFusionColormaps } from '../utils/fusionColormaps';
import { fusionApi } from '../utils/fusionApi';
import { FusionNameModal, FusionPasswordModal } from '../components/FusionDialogs';

const SLICE_STEP = 1;

/** Fallback window if the engine hasn't computed values yet (MR-friendly). */
const FALLBACK_WINDOW = { windowWidth: 1500, windowCenter: 800 };

/**
 * Window slider bounds derived from the layer's initial window.
 * Width scales 1..~3x initial; center spans around the initial center.
 */
function windowBounds(ww0, wc0) {
  const ww = Number.isFinite(ww0) && ww0 > 0 ? ww0 : FALLBACK_WINDOW.windowWidth;
  const wc = Number.isFinite(wc0) ? wc0 : FALLBACK_WINDOW.windowCenter;
  return {
    wwMin: 1,
    wwMax: Math.max(4096, Math.round(ww * 3)),
    wcMin: Math.min(-1024, Math.round(wc - ww * 2)),
    wcMax: Math.max(4096, Math.round(wc + ww * 2)),
    ww0: ww,
    wc0: wc,
  };
}

/**
 * Overlay (fusion) panel — right sidebar.
 *
 * SLICE-BY-SLICE FUSION MODEL:
 *   - base  = the grayscale background series (layer 0)
 *   - overlays = series fused on top, each with its own color / opacity /
 *     window (W/C) / slice offset (layers 1..N)
 *
 * "Apply Fusion" binds base + overlays to the ACTIVE viewport as an
 * ORTHOGRAPHIC volume viewport (NOT a 3D volume-rendered viewport): you
 * scroll slice by slice, and base + overlays stay on the SAME slice because
 * every volume shares one Frame of Reference. Per-layer controls adjust that
 * actor only via the fusion commands (per-volume colormap/opacity/window,
 * actor position for slice alignment).
 */
export default function OverlayPanel({ commandsManager, servicesManager }) {
  const {
    displaySetService,
    viewportGridService,
    cornerstoneViewportService,
  } = servicesManager.services;
  const uiModalService = servicesManager.services.uiModalService;
  const uiNotificationService = servicesManager.services.uiNotificationService;

  const [baseUID, setBaseUID] = useState(null);
  const [baseCtrl, setBaseCtrl] = useState({
    // { color, opacity, ww, wc, ww0, wc0 } — color null = plain grayscale
    color: null,
    opacity: 1,
    ww: null,
    wc: null,
    ww0: null,
    wc0: null,
  });
  const [layers, setLayers] = useState([]); // { uid, seriesDescription, color, opacity, offset, ww, wc, ww0, wc0 }
  const [activeViewportId, setActiveViewportId] = useState(null);
  const [fusionActive, setFusionActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveInfo, setSaveInfo] = useState(null); // { done, total, stage }
  const cancelTokenRef = useRef({ cancelled: false });
  const [templates, setTemplates] = useState([]);
  const [tplError, setTplError] = useState('');
  const [tplResolve, setTplResolve] = useState(null); // { tpl, pending: [...] }

  // register the solid fusion colormaps once
  useEffect(() => {
    registerFusionColormaps();
  }, []);

  const displaySets = useMemo(() => {
    try {
      return displaySetService.getActiveDisplaySets() || [];
    } catch (e) {
      return [];
    }
  }, [displaySetService]);

  const seriesOptions = useMemo(() => {
    // AI-derived series (e.g. "sb1000 (AI 23-Aug-2026 02:09 AM)") have NO
    // FrameOfReferenceUID (the scanner/session anchor that fusion needs) —
    // cornerstone3D rejects them, so exclude them from both dropdowns and
    // sort the remaining series by SeriesNumber (missing → last) so the
    // real source scans appear first.
    const isAiDerived = ds => (ds.SeriesDescription || '').includes('(AI');
    return displaySets
      .filter(ds => ds && ds.displaySetInstanceUID && ds.images && ds.images.length)
      .filter(ds => !isAiDerived(ds))
      .map(ds => ({
        uid: ds.displaySetInstanceUID,
        label: `${ds.SeriesDescription || 'Series'} (${ds.Modality || '?'} · ${ds.numImageFrames ?? ds.images.length})`,
        desc: (ds.SeriesDescription || '').trim(),
        modality: ds.Modality || '?',
        count: ds.numImageFrames ?? ds.images.length,
        seriesNumber: (() => {
          const n = Number(ds.SeriesNumber);
          return Number.isFinite(n) ? n : Infinity;
        })(),
      }))
      .sort((a, b) => a.seriesNumber - b.seriesNumber);
  }, [displaySets]);

  const aiExcludedCount = useMemo(() => {
    return displaySets.filter(ds => ds && (ds.SeriesDescription || '').includes('(AI')).length;
  }, [displaySets]);

  // track the active viewport so controls hit the right one
  useEffect(() => {
    const sync = () => {
      try {
        const state = viewportGridService.getState();
        setActiveViewportId(state.activeViewportId);
      } catch (e) {
        /* ignore */
      }
    };
    sync();
    const unsub = viewportGridService.subscribe(
      viewportGridService.EVENTS.GRID_STATE_CHANGED,
      () => sync()
    );
    return () => unsub && unsub();
  }, [viewportGridService]);

  const run = (name, options = {}) => {
    commandsManager.runCommand(name, {
      viewportId: activeViewportId,
      ...options,
    });
  };

  const runAsync = (name, options = {}) =>
    Promise.resolve(
      commandsManager.runCommand(name, {
        viewportId: activeViewportId,
        ...options,
      })
    );

  // ----- helpers to find the volumeId of a layer in the active viewport -----
  const findVolumeId = useCallback(
    uid => {
      try {
        const viewport = cornerstoneViewportService.getCornerstoneViewport(activeViewportId);
        if (!viewport || typeof viewport.getAllVolumeIds !== 'function') {
          return undefined;
        }
        const ids = viewport.getAllVolumeIds() || [];
        return ids.find(id => id.includes(uid)) ?? ids[0];
      } catch (e) {
        return undefined;
      }
    },
    [activeViewportId, cornerstoneViewportService]
  );

  const readViewportWindow = useCallback(
    uid => {
      try {
        const viewport = cornerstoneViewportService.getCornerstoneViewport(activeViewportId);
        const volumeId = findVolumeId(uid);
        if (!viewport || !volumeId || typeof viewport.getProperties !== 'function') {
          return null;
        }
        const p = viewport.getProperties(volumeId) || {};
        if (Number.isFinite(p.windowWidth) && Number.isFinite(p.windowCenter)) {
          return { ww: p.windowWidth, wc: p.windowCenter };
        }
        // fall back to the DICOM-stored window of the series' first image
        try {
          const ds = displaySetService.getDisplaySetByUID(uid);
          if (ds && ds.images && ds.images.length) {
            const pixel = metaData.get('imagePixelModule', ds.images[0].imageId);
            const wwArr = pixel && pixel.windowWidth;
            const wcArr = pixel && pixel.windowCenter;
            if (wwArr && wcArr && Number.isFinite(wwArr[0]) && Number.isFinite(wcArr[0])) {
              return { ww: wwArr[0], wc: wcArr[0] };
            }
          }
        } catch (e) {
          /* ignore */
        }
        return null;
      } catch (e) {
        return null;
      }
    },
    [activeViewportId, cornerstoneViewportService, displaySetService, findVolumeId]
  );

  // After Apply Fusion the volumes stream in asynchronously — poll a few
  // times for the engine's actual per-volume window and store it as the
  // layer's initial window (sliders then operate around the true values).
  const syncInitialWindows = useCallback(
    (uidList, attempt = 0, baseUidOverride) => {
      const targets = uidList.filter(Boolean);
      if (!targets.length) {
        return;
      }
      const bUid = baseUidOverride || baseUID;
      let allReady = true;
      const found = {};
      targets.forEach(uid => {
        if (found[uid]) {
          return;
        }
        const w = readViewportWindow(uid);
        if (w) {
          found[uid] = w;
        } else {
          allReady = false;
        }
      });
      if (Object.keys(found).length) {
        setBaseCtrl(prev => {
          const next = { ...prev };
          if (found[bUid]) {
            next.ww0 = found[bUid].ww;
            next.wc0 = found[bUid].wc;
            next.ww = next.ww ?? found[bUid].ww;
            next.wc = next.wc ?? found[bUid].wc;
          }
          return next;
        });
        setLayers(prev =>
          prev.map(l =>
            found[l.uid]
              ? {
                  ...l,
                  ww0: l.ww0 ?? found[l.uid].ww,
                  wc0: l.wc0 ?? found[l.uid].wc,
                  ww: l.ww ?? found[l.uid].ww,
                  wc: l.wc ?? found[l.uid].wc,
                }
              : l
          )
        );
      }
      if (!allReady && attempt < 12) {
        setTimeout(() => syncInitialWindows(uidList, attempt + 1, bUid), 800);
      }
    },
    [baseUID, readViewportWindow]
  );

  const setBase = uid => {
    setBaseUID(uid);
    // drop the previous base from overlay layers and reset its control state
    setLayers(prev => prev.filter(l => l.uid !== uid));
    setBaseCtrl({ color: null, opacity: 1, ww: null, wc: null, ww0: null, wc0: null });
    setFusionActive(false);
  };

  const addLayer = uid => {
    if (!uid || uid === baseUID || layers.some(l => l.uid === uid)) {
      return;
    }
    const ds = seriesOptions.find(o => o.uid === uid);
    setLayers(prev => [
      ...prev,
      {
        uid,
        seriesDescription: ds ? ds.label : 'Overlay',
        desc: ds ? ds.desc : '',
        color: 'Fusion Green',
        opacity: 0.6,
        offset: 0,
        ww: null,
        wc: null,
        ww0: null,
        wc0: null,
      },
    ]);
  };

  const updateLayer = (uid, patch) => {
    setLayers(prev => prev.map(l => (l.uid === uid ? { ...l, ...patch } : l)));
  };

  const removeLayer = uid => {
    setLayers(prev => prev.filter(l => l.uid !== uid));
  };

  /**
   * Bind base + overlays to the active viewport with explicit per-layer
   * settings (used by Apply Fusion AND by template application).
   */
  const runFusionPayload = (baseUid, overlayUids, baseSettings, layerRows) => {
    if (!baseUid || !overlayUids.length) {
      return;
    }
    setFusionActive(true);
    run('openFusion', {
      baseDisplaySetUID: baseUid,
      overlayDisplaySetUIDs: overlayUids,
      base: {
        color: baseSettings.color || undefined,
        opacity: baseSettings.opacity ?? 1,
        windowWidth: baseSettings.ww,
        windowCenter: baseSettings.wc,
      },
      layers: layerRows.map(l => ({
        displaySetInstanceUID: l.uid,
        color: l.color,
        opacity: l.opacity,
        windowWidth: l.ww,
        windowCenter: l.wc,
      })),
    });
    // after volumes mount, capture the real per-volume window values
    setTimeout(() => {
      syncInitialWindows([baseUid, ...overlayUids], 0, baseUid);
    }, 1200);
    // re-apply any saved slice nudges once the actors exist
    setTimeout(() => {
      layerRows
        .filter(l => l.offset)
        .forEach(l =>
          run('setFusionLayerOffset', {
            displaySetInstanceUID: l.uid,
            sliceDelta: l.offset,
          })
        );
    }, 1600);
  };

  const applyFusion = () => {
    if (!baseUID || !layers.length) {
      return;
    }
    runFusionPayload(baseUID, layers.map(l => l.uid), baseCtrl, layers);
  };

  const resetViewport = () => {
    setFusionActive(false);
    run('resetFusionViewport', { baseDisplaySetUID: baseUID });
  };

  // ---------------- save fusion as series ----------------

  const baseDesc = useMemo(() => {
    const o = seriesOptions.find(x => x.uid === baseUID);
    return o ? o.desc : '';
  }, [baseUID, seriesOptions]);

  const defaultFusionName = useMemo(() => {
    const parts = [baseDesc, ...layers.map(l => l.desc)].filter(Boolean);
    return parts.length >= 2 ? `${parts.join('-')} fusion` : '';
  }, [baseDesc, layers]);

  const startSaveFusion = () => {
    if (!fusionActive || saving || !baseUID || !layers.length) {
      return;
    }
    uiModalService.show({
      title: 'Save Fusion as Series',
      content: FusionNameModal,
      contentProps: {
        purpose: 'series',
        defaultName: defaultFusionName,
        onSave: async name => {
          setSaving(true);
          setSaveInfo({ done: 0, total: 0, stage: 'render' });
          cancelTokenRef.current = { cancelled: false };
          try {
            await runAsync('saveFusionAsSeries', {
              name,
              baseUID,
              cancelToken: cancelTokenRef.current,
              onProgress: (done, total, stage) =>
                setSaveInfo({ done, total, stage }),
            });
          } finally {
            setSaving(false);
            setSaveInfo(null);
          }
        },
      },
    });
  };

  // ---------------- templates (shared, viewer-wide) ----------------

  const loadTemplates = useCallback(async () => {
    try {
      const list = await fusionApi.listTemplates();
      setTemplates(Array.isArray(list) ? list : []);
      setTplError('');
    } catch (e) {
      if (e && e.status === 401) {
        setTplError('Templates need a logged-in viewer session (shared-link cannot manage them).');
      } else {
        setTplError((e && e.message) || 'Could not load templates.');
      }
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  /** Series-description pattern match (case-insensitive, either direction). */
  const descMatches = (pattern, desc) => {
    const p = String(pattern || '').toLowerCase();
    const d = String(desc || '').toLowerCase();
    return !!p && !!d && (d.includes(p) || p.includes(d));
  };

  const saveCurrentTemplate = () => {
    if (!baseUID || !layers.length) {
      return;
    }
    if (!baseDesc || layers.some(l => !l.desc)) {
      uiNotificationService.show({
        title: 'Template',
        message: 'Series need a description to become a reusable template.',
        type: 'warning',
      });
      return;
    }
    const base = {
      pattern: baseDesc,
      color: baseCtrl.color || null,
      opacity: baseCtrl.opacity ?? 1,
      ww: baseCtrl.ww ?? null,
      wc: baseCtrl.wc ?? null,
      ww0: baseCtrl.ww0 ?? null,
      wc0: baseCtrl.wc0 ?? null,
    };
    const overlays = layers.map(l => ({
      pattern: l.desc,
      color: l.color || 'Fusion Green',
      opacity: l.opacity ?? 0.6,
      ww: l.ww ?? null,
      wc: l.wc ?? null,
      ww0: l.ww0 ?? null,
      wc0: l.wc0 ?? null,
      offset: l.offset || 0,
    }));
    uiModalService.show({
      title: 'Save Template',
      content: FusionNameModal,
      contentProps: {
        purpose: 'template',
        defaultName: defaultFusionName || '',
        onSave: async name => {
          try {
            await fusionApi.createTemplate({ name, base, overlays });
            uiNotificationService.show({
              title: 'Template',
              message: `Template "${name}" saved — visible to everyone.`,
              type: 'success',
            });
            loadTemplates();
          } catch (e) {
            uiNotificationService.show({
              title: 'Template',
              message: (e && e.message) || 'Could not save the template.',
              type: 'error',
            });
          }
        },
      },
    });
  };

  const askDeleteTemplate = tpl => {
    uiModalService.show({
      title: 'Delete Template',
      content: FusionPasswordModal,
      contentProps: {
        templateName: tpl.name,
        onConfirm: async password => {
          try {
            await fusionApi.deleteTemplate(tpl.id, password);
            loadTemplates();
            uiNotificationService.show({
              title: 'Template',
              message: `Deleted "${tpl.name}".`,
              type: 'success',
            });
          } catch (e) {
            throw e; // keep the dialog open — modal shows the error
          }
        },
      },
    });
  };

  /** Resolve a template's patterns against the current study's series. */
  const resolveTemplate = tpl => {
    if (!tpl) {
      return;
    }
    const slots = [
      { role: 'base', index: undefined, pattern: (tpl.base && tpl.base.pattern) || '' },
      ...(tpl.overlays || []).map((o, i) => ({
        role: 'overlay',
        index: i,
        pattern: o.pattern || '',
      })),
    ];
    const pending = [];
    for (const s of slots) {
      const options = seriesOptions.filter(o => descMatches(s.pattern, o.desc));
      if (!options.length) {
        uiNotificationService.show({
          title: 'Template',
          message:
            `This study has no series matching "${s.pattern}" — ` +
            'open a study with the template’s series (e.g. DWI + SWI MIP) first.',
          type: 'error',
        });
        return;
      }
      pending.push({
        role: s.role,
        index: s.index,
        pattern: s.pattern,
        options,
        value: options.length === 1 ? options[0].uid : '',
      });
    }
    if (pending.every(p => p.value)) {
      applyResolvedTemplate(tpl, pending);
    } else {
      setTplResolve({ tpl, pending });
    }
  };

  /** Apply an already-resolved template (single match or picker-confirmed). */
  const applyResolvedTemplate = (tpl, pending) => {
    const baseP = pending.find(p => p.role === 'base');
    if (!baseP || !baseP.value) {
      return;
    }
    const baseOpt = baseP.options.find(o => o.uid === baseP.value);
    if (!baseOpt) {
      return;
    }
    const bSettings = tpl.base || {};
    const overlayRows = (tpl.overlays || [])
      .map((o, i) => {
        const p = pending.find(x => x.role === 'overlay' && x.index === i);
        const opt = p && p.options.find(x => x.uid === p.value);
        if (!opt || !p || !p.value || opt.uid === baseOpt.uid) {
          return null;
        }
        return {
          uid: opt.uid,
          seriesDescription: opt.label,
          desc: opt.desc,
          color: o.color || 'Fusion Green',
          opacity: typeof o.opacity === 'number' ? o.opacity : 0.6,
          offset: o.offset || 0,
          ww: o.ww ?? null,
          wc: o.wc ?? null,
          ww0: o.ww0 ?? null,
          wc0: o.wc0 ?? null,
        };
      })
      .filter(Boolean);
    if (!overlayRows.length) {
      uiNotificationService.show({
        title: 'Template',
        message: 'The template’s overlays all match the base series — nothing to fuse.',
        type: 'error',
      });
      setTplResolve(null);
      return;
    }
    setBaseUID(baseOpt.uid);
    setBaseCtrl({
      color: bSettings.color || null,
      opacity: typeof bSettings.opacity === 'number' ? bSettings.opacity : 1,
      ww: bSettings.ww ?? null,
      wc: bSettings.wc ?? null,
      ww0: bSettings.ww0 ?? null,
      wc0: bSettings.wc0 ?? null,
    });
    setLayers(overlayRows);
    setTplResolve(null);
    setFusionActive(true);
    runFusionPayload(baseOpt.uid, overlayRows.map(r => r.uid), bSettings, overlayRows);
    uiNotificationService.show({
      title: 'Template',
      message: `Applied "${tpl.name}" — adjust the layers and Save Fusion when happy.`,
      type: 'info',
    });
  };

  const renderResolveBar = () => {
    if (!tplResolve) {
      return null;
    }
    const { tpl, pending } = tplResolve;
    const canApply = pending.every(p => p.value);
    return (
      <div className="bg-popover text-foreground mb-1 rounded-md border p-2 text-[11px]">
        <div className="mb-1 font-medium">
          “{tpl.name}” — pick matching series:
        </div>
        {pending.map((p, i) => (
          <div key={i} className="mb-1 flex items-center gap-1">
            <span className="text-muted-foreground w-16 shrink-0 capitalize">
              {p.role}
              {p.index !== undefined ? ` #${p.index + 1}` : ''}
            </span>
            <select
              className="border-input bg-popover w-full rounded border px-1 py-0.5 text-[11px]"
              value={p.value}
              onChange={e =>
                setTplResolve(prev => ({
                  ...prev,
                  pending: prev.pending.map((q, j) =>
                    j === i ? { ...q, value: e.target.value } : q
                  ),
                }))
              }
            >
              <option value="">— pick —</option>
              {p.options.map(o => (
                <option key={o.uid} value={o.uid}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ))}
        <div className="mt-1 flex justify-end gap-2">
          <button
            className="text-muted-foreground underline"
            onClick={() => setTplResolve(null)}
          >
            Cancel
          </button>
          <button
            className="text-white underline disabled:text-muted-foreground"
            disabled={!canApply}
            onClick={() => applyResolvedTemplate(tpl, pending)}
          >
            Apply
          </button>
        </div>
      </div>
    );
  };

  // ---------------- reusable sub-renderers ----------------

  const renderColorSwatches = (currentColor, onChange, allowNone = false) => (
    <div className="mb-1 flex flex-wrap gap-1">
      {allowNone && (
        <button
          title="No color (grayscale)"
          className={`h-4 w-4 rounded-full border ${
            !currentColor ? 'ring-foreground ring-2' : 'border-border'
          }`}
          style={{
            background:
              'linear-gradient(135deg,#fff 25%,#888 25%,#888 50%,#fff 50%,#fff 75%,#888 75%)',
          }}
          onClick={() => onChange(null)}
        />
      )}
      {FUSION_COLOR_OPTIONS.map(opt => (
        <button
          key={opt.name}
          title={opt.name}
          className={`h-4 w-4 rounded-full border ${
            currentColor === opt.colormap ? 'ring-foreground ring-2' : 'border-border'
          }`}
          style={{ backgroundColor: opt.css }}
          onClick={() => onChange(opt.colormap)}
        />
      ))}
    </div>
  );

  const renderWindowControls = (ww, wc, ww0, wc0, onChangeWindow, onReset) => {
    const { wwMin, wwMax, wcMin, wcMax, ww0: baseW, wc0: baseC } = windowBounds(ww0, wc0);
    const curW = Number.isFinite(ww) ? ww : baseW;
    const curC = Number.isFinite(wc) ? wc : baseC;
    return (
      <div className="mb-1 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-14 shrink-0 text-[10px]">Width</span>
          <input
            type="range"
            min={wwMin}
            max={wwMax}
            value={Math.min(Math.max(curW, wwMin), wwMax)}
            className="h-1.5 w-full"
            onChange={e => onChangeWindow(Number(e.target.value), curC)}
          />
          <span className="text-foreground w-12 shrink-0 text-right text-[10px]">
            {Math.round(curW)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-14 shrink-0 text-[10px]">Center</span>
          <input
            type="range"
            min={wcMin}
            max={wcMax}
            value={Math.min(Math.max(curC, wcMin), wcMax)}
            className="h-1.5 w-full"
            onChange={e => onChangeWindow(curW, Number(e.target.value))}
          />
          <span className="text-foreground w-12 shrink-0 text-right text-[10px]">
            {Math.round(curC)}
          </span>
        </div>
        {onReset && (
          <button
            className="text-muted-foreground hover:text-foreground self-end text-[10px] underline"
            onClick={onReset}
          >
            Reset window
          </button>
        )}
      </div>
    );
  };

  // ---------------- base layer controls ----------------

  const baseWindowChange = (ww, wc) => {
    setBaseCtrl(prev => ({ ...prev, ww, wc }));
    run('setFusionLayerWindow', {
      displaySetInstanceUID: baseUID,
      windowWidth: ww,
      windowCenter: wc,
    });
  };

  const baseColorChange = color => {
    setBaseCtrl(prev => ({ ...prev, color }));
    if (color) {
      run('setFusionLayerColor', { displaySetInstanceUID: baseUID, colorName: color });
    } else {
      // back to grayscale: opacity-only colormap
      run('setFusionLayerOpacity', { displaySetInstanceUID: baseUID, opacity: baseCtrl.opacity ?? 1 });
    }
  };

  const baseOpacityChange = opacity => {
    setBaseCtrl(prev => ({ ...prev, opacity }));
    run('setFusionLayerOpacity', { displaySetInstanceUID: baseUID, opacity });
  };

  const renderBaseSection = () => {
    if (!baseUID) {
      return null;
    }
    return (
      <div className="bg-popover rounded-md border p-2">
        <div className="mb-1 flex items-center justify-between gap-1">
          <span className="text-foreground truncate text-xs font-semibold">
            Base · {seriesOptions.find(o => o.uid === baseUID)?.label || 'series'}
          </span>
          <span className="text-muted-foreground shrink-0 text-[10px]">grayscale bg</span>
        </div>
        {renderColorSwatches(
          baseCtrl.color,
          color => {
            setBaseCtrl(prev => ({ ...prev, color }));
            baseColorChange(color);
          },
          true
        )}
        <div className="mb-1 flex items-center gap-2">
          <span className="text-muted-foreground w-14 shrink-0 text-[10px]">Opacity</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round((baseCtrl.opacity ?? 1) * 100)}
            className="h-1.5 w-full"
            onChange={e => baseOpacityChange(Number(e.target.value) / 100)}
          />
          <span className="text-foreground w-8 shrink-0 text-right text-[10px]">
            {Math.round((baseCtrl.opacity ?? 1) * 100)}%
          </span>
        </div>
        {fusionActive &&
          renderWindowControls(
            baseCtrl.ww,
            baseCtrl.wc,
            baseCtrl.ww0,
            baseCtrl.wc0,
            baseWindowChange,
            () => {
              const rw = baseCtrl.ww0 ?? FALLBACK_WINDOW.windowWidth;
              const rc = baseCtrl.wc0 ?? FALLBACK_WINDOW.windowCenter;
              setBaseCtrl(prev => ({ ...prev, ww: rw, wc: rc }));
              run('setFusionLayerWindow', {
                displaySetInstanceUID: baseUID,
                windowWidth: rw,
                windowCenter: rc,
              });
            }
          )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3">
      <div className="mb-2 text-base font-semibold">Overlay / Fusion</div>

      {aiExcludedCount > 0 && (
        <div className="text-muted-foreground mb-2 rounded border border-dashed px-2 py-1 text-[10px]">
          {aiExcludedCount} AI-derived series hidden (no frame of reference — cannot be fused).
        </div>
      )}

      {/* base series picker */}
      <label className="text-muted-foreground mb-1 text-xs">Base series (background)</label>
      <select
        className="border-input bg-popover text-foreground mb-2 w-full rounded-md border px-2 py-1 text-sm"
        value={baseUID || ''}
        onChange={e => setBase(e.target.value)}
      >
        <option value="">— select base series —</option>
        {seriesOptions.map(o => (
          <option key={o.uid} value={o.uid}>
            {o.label}
          </option>
        ))}
      </select>

      {renderBaseSection()}

      {/* add overlay */}
      <label className="text-muted-foreground mb-1 mt-2 text-xs">Add overlay series</label>
      <select
        className="border-input bg-popover text-foreground mb-2 w-full rounded-md border px-2 py-1 text-sm"
        value=""
        onChange={e => {
          if (e.target.value) {
            addLayer(e.target.value);
            e.target.value = '';
          }
        }}
      >
        <option value="">— add overlay —</option>
        {seriesOptions
          .filter(o => o.uid !== baseUID && !layers.some(l => l.uid === o.uid))
          .map(o => (
            <option key={o.uid} value={o.uid}>
              {o.label}
            </option>
          ))}
      </select>

      {/* layer list */}
      <div className="flex flex-col gap-2">
        {layers.map(layer => (
          <div key={layer.uid} className="bg-popover rounded-md border p-2">
            <div className="mb-1 flex items-center justify-between gap-1">
              <span className="text-foreground truncate text-xs font-medium">
                {layer.seriesDescription}
              </span>
              <button
                className="text-muted-foreground hover:text-foreground text-sm leading-none"
                title="Remove layer"
                onClick={() => removeLayer(layer.uid)}
              >
                ✕
              </button>
            </div>

            {renderColorSwatches(layer.color, color => {
              updateLayer(layer.uid, { color });
              run('setFusionLayerColor', {
                displaySetInstanceUID: layer.uid,
                colorName: color,
              });
            })}

            {/* opacity */}
            <div className="mb-1 flex items-center gap-2">
              <span className="text-muted-foreground w-14 shrink-0 text-[10px]">Opacity</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(layer.opacity * 100)}
                className="h-1.5 w-full"
                onChange={e => {
                  const opacity = Number(e.target.value) / 100;
                  updateLayer(layer.uid, { opacity });
                  run('setFusionLayerOpacity', {
                    displaySetInstanceUID: layer.uid,
                    opacity,
                  });
                }}
              />
              <span className="text-foreground w-8 shrink-0 text-right text-[10px]">
                {Math.round(layer.opacity * 100)}%
              </span>
            </div>

            {/* windowing (per layer) */}
            {fusionActive &&
              renderWindowControls(
                layer.ww,
                layer.wc,
                layer.ww0,
                layer.wc0,
                (ww, wc) => {
                  updateLayer(layer.uid, { ww, wc });
                  run('setFusionLayerWindow', {
                    displaySetInstanceUID: layer.uid,
                    windowWidth: ww,
                    windowCenter: wc,
                  });
                },
                () => {
                  const rw = layer.ww0 ?? FALLBACK_WINDOW.windowWidth;
                  const rc = layer.wc0 ?? FALLBACK_WINDOW.windowCenter;
                  updateLayer(layer.uid, { ww: rw, wc: rc });
                  run('setFusionLayerWindow', {
                    displaySetInstanceUID: layer.uid,
                    windowWidth: rw,
                    windowCenter: rc,
                  });
                }
              )}

            {/* slice offset */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-14 shrink-0 text-[10px]">Slice</span>
              <button
                className="border-input hover:bg-accent text-foreground rounded border px-2 py-0.5 text-sm"
                onClick={() => {
                  const offset = layer.offset - SLICE_STEP;
                  updateLayer(layer.uid, { offset });
                  run('setFusionLayerOffset', {
                    displaySetInstanceUID: layer.uid,
                    sliceDelta: offset,
                  });
                }}
              >
                −
              </button>
              <span className="text-foreground w-10 text-center text-xs">
                {layer.offset > 0 ? `+${layer.offset}` : layer.offset}
              </span>
              <button
                className="border-input hover:bg-accent text-foreground rounded border px-2 py-0.5 text-sm"
                onClick={() => {
                  const offset = layer.offset + SLICE_STEP;
                  updateLayer(layer.uid, { offset });
                  run('setFusionLayerOffset', {
                    displaySetInstanceUID: layer.uid,
                    sliceDelta: offset,
                  });
                }}
              >
                +
              </button>
              <span className="text-muted-foreground ml-auto text-[10px]">slices</span>
            </div>
          </div>
        ))}
      </div>

      {layers.length === 0 && (
        <div className="text-muted-foreground text-center text-xs">
          Pick a base series, then add overlay series.
        </div>
      )}

      {/* save fusion as a new series */}
      <div className="mt-3">
        <Button
          className="w-full"
          disabled={!fusionActive || saving || !baseUID || layers.length === 0}
          onClick={startSaveFusion}
        >
          {saving ? 'Saving Fusion…' : '💾 Save Fusion as Series'}
        </Button>
        {saving && saveInfo && (
          <div className="bg-popover text-foreground mt-2 flex items-center justify-between rounded-md border px-2 py-1.5 text-[11px]">
            <span className="truncate">
              {saveInfo.stage === 'render'
                ? saveInfo.total > 0
                  ? `Rendering slice ${Math.min(saveInfo.done + 1, saveInfo.total)} / ${saveInfo.total}`
                  : 'Preparing fusion view…'
                : `Uploading ${saveInfo.done} / ${saveInfo.total} slices…`}
            </span>
            <button
              className="text-muted-foreground hover:text-foreground ml-2 shrink-0 underline"
              onClick={() => {
                cancelTokenRef.current.cancelled = true;
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* actions */}
      <div className="mt-2 flex gap-2">
        <Button
          className="w-full"
          disabled={!baseUID || layers.length === 0 || saving}
          onClick={applyFusion}
        >
          Apply Fusion
        </Button>
        <Button
          variant="outline"
          className="w-full"
          disabled={!baseUID || saving}
          onClick={resetViewport}
        >
          Reset
        </Button>
      </div>

      {/* shared templates */}
      <div className="mt-4 border-t pt-2">
        <div className="mb-1 flex items-center justify-between gap-1">
          <span className="text-foreground text-xs font-semibold">Templates (shared)</span>
          <button
            className="text-muted-foreground hover:text-foreground text-[11px] underline disabled:text-muted-foreground/50"
            disabled={!baseUID || layers.length === 0 || saving}
            onClick={saveCurrentTemplate}
            title="Save current base/overlay + color/opacity/window/slice settings as a reusable template"
          >
            + Save current
          </button>
        </div>
        {tplError && <div className="text-red-400 mb-1 text-[10px]">{tplError}</div>}
        {renderResolveBar()}
        {templates.length === 0 && !tplError && (
          <div className="text-muted-foreground py-1 text-center text-[10px]">
            No templates yet — tune a fusion, then “+ Save current”.
          </div>
        )}
        <div className="flex max-h-36 flex-col gap-1 overflow-y-auto">
          {templates.map(t => (
            <div
              key={t.id}
              className="bg-popover flex items-center gap-1 rounded-md border px-2 py-1"
              title={`${(t.base && t.base.pattern) || '?'} + ${(t.overlays || [])
                .map(o => o.pattern)
                .join(', ') || '?'}`}
            >
              <span className="text-foreground flex-1 truncate text-[11px]">{t.name}</span>
              <button
                className="text-muted-foreground hover:text-foreground rounded border border-transparent px-1.5 text-[11px] hover:border-border disabled:text-muted-foreground/50"
                disabled={saving || seriesOptions.length === 0}
                onClick={() => resolveTemplate(t)}
              >
                Apply
              </button>
              <button
                className="text-muted-foreground hover:text-red-400 px-1 text-[11px]"
                title="Delete template (export password required)"
                onClick={() => askDeleteTemplate(t)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="text-muted-foreground mt-3 text-[10px] leading-relaxed">
        Tip: pick a base + overlays then <b>Apply Fusion</b>. The viewport becomes a{' '}
        <b>slice-by-slice overlay</b> — scrolling keeps every layer on the same slice. Each
        layer has its own color, opacity, window (width/center) and slice alignment. If a
        layer is off by one slice, nudge it with <b>Slice − / +</b>. When the fusion looks
        right, <b>💾 Save Fusion as Series</b> stores every slice as one new series (e.g.{' '}
        <i>sb1000-swi mip fusion</i>) at the top of this study. Loved a combination?{' '}
        <b>+ Save current</b> makes a shared template anyone can apply to matching series.
      </div>
    </div>
  );
}
