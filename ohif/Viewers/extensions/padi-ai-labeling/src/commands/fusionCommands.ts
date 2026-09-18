/**
 * Fusion (overlay) commands for the Overlay panel.
 *
 * Model (OHIF v3.13 / cornerstone3D v5.6.8):
 *  - An ORTHOGRAPHIC (MPR) viewport can hold MULTIPLE volumes (actors) fused
 *    together. The FIRST display set is the grayscale "base" layer and the
 *    rest are color-tinted "foreground" layers — classic slice-by-slice
 *    fusion (same model as PET/CT fusion).
 *  - Scrolling steps slice-by-slice through the base volume; every overlay is
 *    re-sliced at the same physical plane (volumes share a FrameOfReference),
 *    so base and overlays stay on the SAME slice as you scroll.
 *  - Per-layer properties are addressed by volumeId, which embeds the
 *    display set UID (see ViewportService adapters getDataIdForDisplaySet).
 *  - Per-volume color/opacity/window: viewport.setProperties({ colormap:
 *    { name, opacity }, windowWidth, windowCenter }, volumeId) — applied to
 *    that actor only.
 *  - Manual slice alignment: shift the actor along the camera's
 *    viewPlaneNormal by sliceDelta × that volume's own slice spacing
 *    (whole native slices of the overlay).
 *
 * NOTE: we deliberately do NOT use VOLUME_3D (a true 3D volume-rendering
 * viewport): fusing several volumes there renders black/empty until a layer
 * property forces a re-render, and it is not slice-by-slice.
 */
import { Enums as csEnums, cache, metaData } from '@cornerstonejs/core';
import saveFusionToDicom from '../utils/saveFusionToDicom';

/** FrameOfReferenceUID of a display set (from its first image's metadata). */
function getDisplaySetFOR(displaySet) {
  try {
    if (!displaySet || !displaySet.images || !displaySet.images.length) {
      return undefined;
    }
    const imageId = displaySet.images[0].imageId;
    const plane = metaData.get('imagePlaneModule', imageId);
    return plane && plane.frameOfReferenceUID;
  } catch (e) {
    return undefined;
  }
}

/** Map a display set UID to the volumeId currently used in a viewport. */
function getVolumeIdForDisplaySet(viewport, displaySetInstanceUID) {
  if (!viewport || typeof viewport.getAllVolumeIds !== 'function') {
    return undefined;
  }
  const ids = viewport.getAllVolumeIds() || [];
  return ids.find(id => id.includes(displaySetInstanceUID)) ?? ids[0];
}

/**
 * Slice spacing (mm per slice) ALONG THE CAMERA NORMAL for ONE volume.
 * Uses the volume's own spacing from the cornerstone cache so overlays with
 * different slice thickness (e.g. 10 mm SWI MIP over 4 mm FLAIR) nudge by
 * THEIR native slice, not the base's.
 */
function getVolumeSliceSpacing(viewport, volumeId) {
  try {
    const camera = viewport.getCamera();
    const n = camera.viewPlaneNormal || [0, 0, 1];
    let spacing = null;
    const vol = cache.getVolume(volumeId);
    if (vol && vol.spacing) {
      spacing = vol.spacing;
    } else {
      const vMeta = metaData.get('volume', volumeId);
      if (vMeta && vMeta.spacing) {
        spacing = vMeta.spacing;
      }
    }
    if (spacing) {
      return (
        Math.abs(spacing[0] * n[0] + spacing[1] * n[1] + spacing[2] * n[2]) ||
        spacing[2] ||
        1
      );
    }
    const rangeInfo = viewport.getSliceRangeInfo?.();
    if (rangeInfo && rangeInfo.spacingInNormalDirection) {
      return rangeInfo.spacingInNormalDirection;
    }
  } catch (e) {
    /* fall through */
  }
  return 1;
}

/** Per-volume property read that never throws. */
function readVolumeProperties(viewport, volumeId) {
  try {
    return (viewport && volumeId && viewport.getProperties(volumeId)) || {};
  } catch (e) {
    return {};
  }
}

export default function getFusionCommands({ servicesManager }) {
  const { viewportGridService, cornerstoneViewportService, uiNotificationService } =
    servicesManager.services;

  /**
   * Create a fusion viewport: bind base + overlay display sets to the active
   * viewport as an ORTHOGRAPHIC (slice-by-slice MPR) viewport with the base
   * as the grayscale layer and each overlay as a tinted layer, then apply the
   * panel's per-layer color/opacity settings so the result is visible
   * immediately (no black/blank state).
   */
  const openFusion = async ({
    baseDisplaySetUID,
    overlayDisplaySetUIDs = [],
    viewportId,
    base = {},          // { color?, opacity?, windowWidth?, windowCenter? }
    layers = [],        // [{ displaySetInstanceUID, color, opacity }]
  } = {}) => {
    const { displaySetService } = servicesManager.services;
    const activeViewportId = viewportId || viewportGridService.getActiveViewportId();
    const displaySetInstanceUIDs = [baseDisplaySetUID, ...overlayDisplaySetUIDs].filter(Boolean);
    if (displaySetInstanceUIDs.length < 2) {
      uiNotificationService.show({
        title: 'Overlay',
        message: 'Pick a base series and at least one overlay series first.',
        type: 'warning',
      });
      return;
    }

    // cornerstone3D only fuses volumes that share the same FrameOfReferenceUID
    // (same acquisition session). Surface a clean message instead of the
    // cryptic engine error.
    const baseDs = displaySetService.getDisplaySetByUID(baseDisplaySetUID);
    const baseFOR = getDisplaySetFOR(baseDs);
    if (!baseFOR) {
      uiNotificationService.show({
        title: 'Overlay',
        message:
          'The base series has no Frame of Reference (likely an AI-derived series) — ' +
          'it cannot be used for fusion. Pick a source scan (e.g. sb100, swi mip).',
        type: 'error',
      });
      return;
    }
    const badLayers = overlayDisplaySetUIDs.filter(uid => {
      const ds = displaySetService.getDisplaySetByUID(uid);
      const for_ = getDisplaySetFOR(ds);
      return !for_ || for_ !== baseFOR;
    });
    if (badLayers.length) {
      uiNotificationService.show({
        title: 'Overlay',
        message:
          'Some overlay series have no Frame of Reference (AI-derived) or come from a ' +
          'different scan session — they cannot be fused together. Pick series from ' +
          'the same study/session.',
        type: 'error',
      });
      return;
    }

    try {
      await viewportGridService.setDisplaySetsForViewports([
        {
          viewportId: activeViewportId,
          displaySetInstanceUIDs,
          viewportOptions: { viewportType: csEnums.ViewportType.ORTHOGRAPHIC },
        },
      ]);

      const viewport = cornerstoneViewportService.getCornerstoneViewport(activeViewportId);

      // --- layer initialization: base grayscale @ 100%, overlays tinted ---
      // (explicitly set so the view is NEVER black/blank after Apply Fusion)
      if (viewport && typeof viewport.setProperties === 'function') {
        const baseVolumeId = getVolumeIdForDisplaySet(viewport, baseDisplaySetUID);
        if (baseVolumeId) {
          const baseColormap = base.color
            ? { name: base.color, opacity: Number.isFinite(Number(base.opacity)) ? Number(base.opacity) : 1 }
            : { opacity: 1 };
          const baseProps = { colormap: baseColormap };
          if (Number.isFinite(Number(base.windowWidth)) && Number.isFinite(Number(base.windowCenter))) {
            baseProps.windowWidth = Number(base.windowWidth);
            baseProps.windowCenter = Number(base.windowCenter);
          }
          viewport.setProperties(baseProps, baseVolumeId);
        }

        const layerSettings = {};
        (layers || []).forEach(l => {
          if (l && l.displaySetInstanceUID) {
            layerSettings[l.displaySetInstanceUID] = l;
          }
        });
        overlayDisplaySetUIDs.forEach(uid => {
          const volumeId = getVolumeIdForDisplaySet(viewport, uid);
          if (!volumeId) {
            return;
          }
          const setting = layerSettings[uid] || {};
          const props = {
            colormap: {
              name: setting.color || 'Fusion Green',
              opacity: Number.isFinite(Number(setting.opacity))
                ? Number(setting.opacity)
                : 0.6,
            },
          };
          if (
            Number.isFinite(Number(setting.windowWidth)) &&
            Number.isFinite(Number(setting.windowCenter))
          ) {
            props.windowWidth = Number(setting.windowWidth);
            props.windowCenter = Number(setting.windowCenter);
          }
          viewport.setProperties(props, volumeId);
        });

        // Crisp native slices: nearest-slice re-slicing instead of linear
        // blending between two adjacent slices of a thick-slab series.
        try {
          if (typeof viewport.setInterpolationType === 'function') {
            viewport.setInterpolationType('NEAREST');
          }
        } catch (e) {
          /* optional — interpolation mode not supported in this build */
        }

        viewport.render();
      }

      uiNotificationService.show({
        title: 'Overlay',
        message:
          'Fusion ready — slice view. Scroll to browse; base is grayscale, overlays are tinted. ' +
          'Use each layer row to adjust color, opacity, window and slice alignment.',
        type: 'info',
      });
    } catch (e) {
      console.warn('[Overlay] openFusion failed', e);
      uiNotificationService.show({
        title: 'Overlay',
        message: `Could not create the fusion viewport: ${e.message}`,
        type: 'error',
      });
    }
  };

  /** Return the active viewport to the base series (single display set, stack). */
  const resetFusionViewport = async ({ baseDisplaySetUID, viewportId } = {}) => {
    const activeViewportId = viewportId || viewportGridService.getActiveViewportId();
    if (!baseDisplaySetUID) {
      return;
    }
    try {
      await viewportGridService.setDisplaySetsForViewports([
        { viewportId: activeViewportId, displaySetInstanceUIDs: [baseDisplaySetUID] },
      ]);
    } catch (e) {
      console.warn('[Overlay] resetFusionViewport failed', e);
    }
  };

  const getFusionViewport = viewportId => {
    const activeViewportId = viewportId || viewportGridService.getActiveViewportId();
    return cornerstoneViewportService.getCornerstoneViewport(activeViewportId);
  };

  /** Opacity 0..1 for one layer (base or overlay). */
  const setFusionLayerOpacity = ({ viewportId, displaySetInstanceUID, opacity }) => {
    const viewport = getFusionViewport(viewportId);
    const volumeId = getVolumeIdForDisplaySet(viewport, displaySetInstanceUID);
    if (!viewport || !volumeId) {
      return;
    }
    try {
      const current = viewport.getProperties(volumeId)?.colormap || {};
      viewport.setProperties({ colormap: { ...current, opacity: Number(opacity) } }, volumeId);
      viewport.render();
    } catch (e) {
      console.warn('[Overlay] setFusionLayerOpacity failed', e);
    }
  };

  /** Color (colormap name from the fusion palette) for one layer. */
  const setFusionLayerColor = ({ viewportId, displaySetInstanceUID, colorName }) => {
    const viewport = getFusionViewport(viewportId);
    const volumeId = getVolumeIdForDisplaySet(viewport, displaySetInstanceUID);
    if (!viewport || !volumeId) {
      return;
    }
    try {
      const current = viewport.getProperties(volumeId)?.colormap || {};
      viewport.setProperties(
        { colormap: { ...current, name: colorName } },
        volumeId
      );
      viewport.render();
    } catch (e) {
      console.warn('[Overlay] setFusionLayerColor failed', e);
    }
  };

  /**
   * Manual slice alignment: shift the layer by `sliceDelta` of ITS OWN slices
   * along the current viewing normal. Positive = deeper (away from camera).
   * Scrolling the viewport still steps the base — this nudges only this layer.
   */
  const setFusionLayerOffset = ({ viewportId, displaySetInstanceUID, sliceDelta }) => {
    const viewport = getFusionViewport(viewportId);
    const volumeId = getVolumeIdForDisplaySet(viewport, displaySetInstanceUID);
    if (!viewport || !volumeId) {
      return;
    }
    try {
      const actorEntry = viewport.getActor(volumeId);
      if (!actorEntry || !actorEntry.actor) {
        return;
      }
      const spacing = getVolumeSliceSpacing(viewport, volumeId);
      const camera = viewport.getCamera();
      const n = camera.viewPlaneNormal || [0, 0, 1];
      const mm = Number(sliceDelta) * spacing;
      actorEntry.actor.setPosition([n[0] * mm, n[1] * mm, n[2] * mm]);
      viewport.render();
    } catch (e) {
      console.warn('[Overlay] setFusionLayerOffset failed', e);
    }
  };

  /** Show/hide a layer (opacity 0 vs last used opacity). */
  const setFusionLayerVisible = ({ viewportId, displaySetInstanceUID, visible }) => {
    const viewport = getFusionViewport(viewportId);
    const volumeId = getVolumeIdForDisplaySet(viewport, displaySetInstanceUID);
    if (!viewport || !volumeId) {
      return;
    }
    try {
      const current = viewport.getProperties(volumeId)?.colormap || {};
      const opacity = visible ? current.opacity ?? 0.6 : 0;
      viewport.setProperties({ colormap: { ...current, opacity } }, volumeId);
      viewport.render();
    } catch (e) {
      console.warn('[Overlay] setFusionLayerVisible failed', e);
    }
  };

  /** Windowing (brightness/contrast) for ONE layer — base or overlay. */
  const setFusionLayerWindow = ({ viewportId, displaySetInstanceUID, windowWidth, windowCenter }) => {
    const viewport = getFusionViewport(viewportId);
    const volumeId = getVolumeIdForDisplaySet(viewport, displaySetInstanceUID);
    if (!viewport || !volumeId) {
      return;
    }
    try {
      const props = {};
      if (Number.isFinite(Number(windowWidth)) && Number(windowWidth) > 0) {
        props.windowWidth = Number(windowWidth);
      }
      if (Number.isFinite(Number(windowCenter))) {
        props.windowCenter = Number(windowCenter);
      }
      if (!Object.keys(props).length) {
        return;
      }
      viewport.setProperties(props, volumeId);
      viewport.render();
    } catch (e) {
      console.warn('[Overlay] setFusionLayerWindow failed', e);
    }
  };

  /**
   * Save the CURRENT fusion stack as a new DICOM series (one instance per
   * slice, shared series UID) — see utils/saveFusionToDicom.ts.
   * opts: { name, baseUID, cancelToken?, onProgress? }
   */
  const saveFusionAsSeries = async ({ name, baseUID, cancelToken, onProgress } = {}) => {
    try {
      await saveFusionToDicom(servicesManager, { name, baseUID, cancelToken, onProgress });
    } catch (e) {
      console.warn('[Overlay] saveFusionAsSeries failed', e);
      uiNotificationService.show({
        title: 'Save Fusion',
        message: `Could not save the fusion series: ${e.message}`,
        type: 'error',
      });
    }
  };

  return {
    openFusion,
    resetFusionViewport,
    setFusionLayerOpacity,
    setFusionLayerColor,
    setFusionLayerOffset,
    setFusionLayerVisible,
    setFusionLayerWindow,
    saveFusionAsSeries,
  };
}
