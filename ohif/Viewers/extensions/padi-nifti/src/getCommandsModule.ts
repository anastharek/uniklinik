import findViewportsByPosition, {
  findOrCreateViewport as layoutFindOrCreate,
} from '@ohif/extension-default/src/findViewportsByPosition';
import { useViewportsByPositionStore } from '@ohif/extension-default/src/stores/useViewportsByPositionStore';
import { createNiftiDisplaySet } from './getSopClassHandlerModule';
import { useNiftiStore } from './stores/niftiStore';

/**
 * Commands for the DICOM + NIfTI research workflow.
 *
 * NOTE (this OHIF fork): command definitions MUST pass actual function
 * references — string commandFns are registered verbatim and silently
 * no-op (see ExtensionManager._initCommandsModule).
 */
const getCommandsModule = ({ servicesManager, commandsManager }) => {
  const actions = {};

  /**
   * Layout -> Common -> DICOM + NIfTI.
   * Creates the 1x2 layout: left = the currently active DICOM series
   * (untouched), right = a synthetic NIfTI display set that drives the
   * server-side conversion + research viewport.
   *
   * Uses the same findViewportsByPosition + layoutFindOrCreate machinery as
   * the standard setViewportGridLayout so existing viewports are reused
   * correctly and no stale panes remain.
   */
  actions.setDicomNiftiLayout = () => {
    const { viewportGridService, displaySetService, hangingProtocolService, uiNotificationService } =
      servicesManager.services;

    const activeViewportId = viewportGridService.getActiveViewportId();
    if (!activeViewportId) {
      uiNotificationService.show({
        title: 'DICOM + NIfTI',
        message: 'No active viewport',
        type: 'error',
      });
      return;
    }

    const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(activeViewportId);
    const sourceDs =
      displaySetUIDs && displaySetUIDs[0] ? displaySetService.getDisplaySetByUID(displaySetUIDs[0]) : null;
    if (!sourceDs || sourceDs.Modality === 'NIFTI') {
      uiNotificationService.show({
        title: 'DICOM + NIfTI',
        message: 'Select a DICOM series first (the active viewport has no DICOM series)',
        type: 'error',
      });
      return;
    }

    const completeLayout = () => {
      const state = viewportGridService.getState();
      findViewportsByPosition(state, { numRows: 1, numCols: 2 });
      const { viewportsByPosition, initialInDisplay } = useViewportsByPositionStore.getState();
      const findOrCreateViewport = layoutFindOrCreate.bind(null, hangingProtocolService, false, {
        ...viewportsByPosition,
        initialInDisplay,
      });

      // Force the LEFT pane to a STACK viewport: the NIfTI spatial sync
      // (syncService) relies on stack imageIdIndex + per-instance IPP. A
      // volume viewport would silently disable the link.
      const forcedStackFindOrCreate = (position, positionId, options) => {
        const vp = findOrCreateViewport(position, positionId, options);
        if (vp && positionId === '0-0') {
          return {
            ...vp,
            viewportOptions: { ...(vp.viewportOptions || {}), viewportType: 'stack' },
          };
        }
        return vp;
      };

      viewportGridService.setLayout({
        numRows: 1,
        numCols: 2,
        findOrCreateViewport: forcedStackFindOrCreate,
        isHangingProtocolLayout: false,
      });

      // Let the grid state settle, then assign display sets per pane.
      setTimeout(() => {
        const st = viewportGridService.getState();
        const vps = Array.from(st.viewports.values());
        const leftVp = vps.find(v => v.positionId === '0-0') || vps[0];
        const rightVp = vps.find(v => v.positionId === '1-0') || vps[1];
        if (!leftVp || !rightVp) {
          uiNotificationService.show({
            title: 'DICOM + NIfTI',
            message: 'Layout could not be created',
            type: 'error',
          });
          return;
        }

        // Left = the original DICOM series
        commandsManager.run('setDisplaySetsForViewports', {
          viewportsToUpdate: [
            {
              viewportId: leftVp.viewportId,
              displaySetInstanceUIDs: [sourceDs.displaySetInstanceUID],
            },
          ],
        });

        // Right = synthetic NIfTI display set
        const niftiDs = createNiftiDisplaySet({
          studyInstanceUID: sourceDs.StudyInstanceUID,
          seriesInstanceUID: sourceDs.SeriesInstanceUID,
          sourceDisplaySetUID: sourceDs.displaySetInstanceUID,
          sourceSeriesDescription: sourceDs.SeriesDescription,
          sourceModality: sourceDs.Modality,
        });
        displaySetService.addDisplaySets(niftiDs);

        commandsManager.run('setDisplaySetsForViewports', {
          viewportsToUpdate: [
            {
              viewportId: rightVp.viewportId,
              displaySetInstanceUIDs: [niftiDs.displaySetInstanceUID],
            },
          ],
        });

        // Activate the right (NIfTI) viewport so the progress overlay is visible
        viewportGridService.setActiveViewportId(rightVp.viewportId);
      }, 100);
    };

    setTimeout(completeLayout, 0);
  };

  /** Reset the current analysis session (display settings + ROI only). */
  actions.resetNiftiAnalysis = () => {
    useNiftiStore.getState().resetAnalysis();
  };

  /** Save the processed result as a new derived DICOM series. */
  actions.saveDerivedDicom = () => {
    useNiftiStore.getState().requestSaveDerived();
  };

  return {
    actions,
    definitions: {
      setDicomNiftiLayout: {
        commandFn: actions.setDicomNiftiLayout,
        storeContexts: [],
        options: {},
      },
      resetNiftiAnalysis: {
        commandFn: actions.resetNiftiAnalysis,
        storeContexts: [],
        options: {},
      },
      saveDerivedDicom: {
        commandFn: actions.saveDerivedDicom,
        storeContexts: [],
        options: {},
      },
    },
    defaultContext: 'VIEWER',
  };
};

export default getCommandsModule;
