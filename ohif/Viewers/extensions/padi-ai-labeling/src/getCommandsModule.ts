/**
 * Commands exposed by the AI Labeling extension.
 *
 * NOTE: commandFn must reference the actual action FUNCTION (like the
 * cornerstone extension does) — this OHIF version does NOT resolve string
 * commandFn names, so string commandFns silently no-op on click.
 */
import captureViewportToDicom from './utils/captureViewportToDicom';
import CaptureNameModal from './components/CaptureNameModal';
import AnnotationStyleModal from './components/AnnotationStyleModal';
import getFusionCommands from './commands/fusionCommands';
import { annotation } from '@cornerstonejs/tools';
import { triggerAnnotationRenderForViewportIds } from '@cornerstonejs/tools/utilities';

/** Tools whose default style the annotation-style dialog controls. */
const ANNOTATION_TOOLS = [
  'ArrowAnnotate',
  'RectangleROI',
  'EllipticalROI',
  'CircleROI',
  'Length',
  'Bidirectional',
  'Angle',
  'CobbAngle',
  'Probe',
  'PlanarFreehandROI',
  'SplineROI',
  'LivewireContour',
];

export default function getCommandsModule({ commandsManager, servicesManager }) {
  // Fusion / overlay commands (OpenFusion, per-layer color/opacity/offset)
  const fusion = getFusionCommands({ servicesManager });
  /**
   * Apply a chosen color/lineWidth to annotation tools: sets the DEFAULT style
   * (so new annotations use it) and overrides EXISTING annotations in the
   * current study, then re-renders the annotation layers.
   */
  const applyAnnotationStyle = ({ color, lineWidth }) => {
    try {
      const style = { color, lineWidth: String(lineWidth) };
      const defaults = {};
      ANNOTATION_TOOLS.forEach(t => {
        defaults[t] = style;
      });
      annotation.config.style.setDefaultToolStyles(defaults);

      // existing annotations in the current viewer session
      const all = annotation.state.getAllAnnotations() || [];
      all.forEach(a => {
        const toolName = a && a.metadata && a.metadata.toolName;
        if (toolName && ANNOTATION_TOOLS.includes(toolName)) {
          annotation.config.style.setAnnotationStyles(a.annotationUID, style);
        }
      });

      const { viewportGridService, uiNotificationService } = servicesManager.services;
      const state = viewportGridService.getState();
      const viewports = (state.viewportGrid && state.viewportGrid.viewports) || {};
      const viewportIds = Object.values(viewports)
        .map(v => v && v.viewportId)
        .filter(Boolean);
      if (viewportIds.length) {
        triggerAnnotationRenderForViewportIds(viewportIds);
      }

      uiNotificationService.show({
        title: 'Annotation Style',
        message: `Annotations: ${color} / ${lineWidth}px.`,
        type: 'success',
      });
    } catch (e) {
      console.warn('[Annotation Style] apply failed', e);
      servicesManager.services.uiNotificationService &&
        servicesManager.services.uiNotificationService.show({
          title: 'Annotation Style',
          message: 'Could not apply style.',
          type: 'error',
        });
    }
  };

  const actions = {
    /** Activate the RectangleROI tool for bounding-box labeling. */
    setBBoxToolActive: () => {
      commandsManager.runCommand('setToolActiveToolbar', { toolName: 'RectangleROI' });
    },
    /**
     * Capture the active viewport and save it as a new DICOM series.
     * Asks for the series name with an in-app modal (window.prompt is ignored
     * by iOS Safari, which made Capture appear broken on mobile), then runs
     * the capture with the supplied name.
     */
    captureViewportToDicom: () => {
      servicesManager.services.uiModalService.show({
        title: 'Capture Image',
        content: CaptureNameModal,
        contentProps: {
          onSave: name => captureViewportToDicom(servicesManager, name),
        },
      });
    },
    /** Open the color/thickness picker for annotations. */
    openAnnotationStyleDialog: () => {
      servicesManager.services.uiModalService.show({
        title: 'Annotation Style',
        content: AnnotationStyleModal,
        contentProps: {
          onApply: applyAnnotationStyle,
        },
      });
    },
    applyAnnotationStyle,
    ...fusion,
  };

  return {
    actions,
    definitions: {
      setBBoxToolActive: {
        commandFn: actions.setBBoxToolActive,
      },
      captureViewportToDicom: {
        commandFn: actions.captureViewportToDicom,
      },
      openAnnotationStyleDialog: {
        commandFn: actions.openAnnotationStyleDialog,
      },
      applyAnnotationStyle: {
        commandFn: actions.applyAnnotationStyle,
      },
      openFusion: {
        commandFn: actions.openFusion,
      },
      resetFusionViewport: {
        commandFn: actions.resetFusionViewport,
      },
      setFusionLayerOpacity: {
        commandFn: actions.setFusionLayerOpacity,
      },
      setFusionLayerColor: {
        commandFn: actions.setFusionLayerColor,
      },
      setFusionLayerOffset: {
        commandFn: actions.setFusionLayerOffset,
      },
      setFusionLayerVisible: {
        commandFn: actions.setFusionLayerVisible,
      },
      setFusionLayerWindow: {
        commandFn: actions.setFusionLayerWindow,
      },
      saveFusionAsSeries: {
        commandFn: actions.saveFusionAsSeries,
      },
    },
    defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
  };
}
