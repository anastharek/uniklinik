import i18n from 'i18next';
import { id } from './id';
import {
  initToolGroups as basicInitToolGroups,
  ohif,
  cornerstone,
  dicomsr,
  dicomvideo,
  basicLayout,
  basicRoute,
  extensionDependencies as basicDependencies,
  mode as basicMode,
  modeInstance as basicModeInstance,
} from '@ohif/mode-basic';

export const tracked = {
  measurements: '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements',
  thumbnailList: '@ohif/extension-measurement-tracking.panelModule.seriesList',
  viewport: '@ohif/extension-measurement-tracking.viewportModule.cornerstone-tracked',
};

export const extensionDependencies = {
  // Can derive the versions at least process.env.from npm_package_version
  ...basicDependencies,
  '@ohif/extension-measurement-tracking': '^3.0.0',
  '@ohif/extension-padi-ai-labeling': '^3.0.0',
  '@ohif/extension-padi-nifti': '^3.0.0',
};

export const longitudinalInstance = {
  ...basicLayout,
  id: ohif.layout,
  props: {
    ...basicLayout.props,
    // Literal panel lists; the mode route seeds them into the standard
    // `leftPanels` / `rightPanels` customizations so `mode` phase
    // blocks and global customizations can modify them.
    leftPanels: [tracked.thumbnailList],
    rightPanels: [
      cornerstone.segmentation,
      tracked.measurements,
      '@ohif/extension-padi-ai-labeling.panelModule.aiLabeling',
      '@ohif/extension-padi-ai-labeling.panelModule.overlay',
      '@ohif/extension-padi-nifti.panelModule.niftiAnalysis',
    ],
    viewports: [
      {
        namespace: tracked.viewport,
        // Re-use the display sets from basic
        displaySetsToDisplay: basicLayout.props.viewports[0].displaySetsToDisplay,
      },
      {
        namespace: '@ohif/extension-padi-nifti.viewportModule.nifti',
        displaySetsToDisplay: ['niftiSopClassHandlerId'],
      },
      ...basicLayout.props.viewports,
    ],
  },
};

/**
 * PUTRACNS default tool = Stack Scroll (Anas: "default button active when
 * opening, set to Stack scroll").  The basic mode's tool group activates
 * WindowLevel on the primary mouse button by default; we keep everything
 * else identical and only swap which tool owns the primary binding so the
 * toolbar shows StackScroll as the active button on load.
 */
function initToolGroups(args) {
  basicInitToolGroups(args);
  try {
    const { extensionManager, toolGroupService } = args;
    const utilityModule = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone.utilityModule.tools'
    );
    const { toolNames, Enums } = utilityModule.exports;
    const toolGroup = toolGroupService.getToolGroup('default');
    if (toolGroup && toolGroup.hasTool(toolNames.StackScroll)) {
      // Activate StackScroll with the primary mouse binding (drag to scroll);
      // the wheel binding stays untouched.
      toolGroup.setToolActive(toolNames.StackScroll, {
        bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
      });
      // WindowLevel remains available on the toolbar; it is now passive until
      // the user clicks it.
      toolGroup.setToolPassive(toolNames.WindowLevel);
    }
  } catch (err) {
    console.warn('[longitudinal] default-tool override skipped:', err);
  }
}

export const longitudinalRoute = {
  ...basicRoute,
  path: 'longitudinal',
  /*init: ({ servicesManager, extensionManager }) => {
          //defaultViewerRouteInit
        },*/
  layoutInstance: longitudinalInstance,
};

export const modeInstance = {
  ...basicModeInstance,
  // TODO: We're using this as a route segment
  // We should not be.
  id,
  routeName: 'viewer',
  displayName: i18n.t('Modes:Basic Viewer'),
  routes: [longitudinalRoute],
  extensions: extensionDependencies,
};

const mode = {
  ...basicMode,
  id,
  modeInstance: {
    ...modeInstance,
    // PUTRACNS default active tool = Stack Scroll on open
    initToolGroups,
  },
  extensionDependencies,
};

export default mode;
export { initToolGroups };
