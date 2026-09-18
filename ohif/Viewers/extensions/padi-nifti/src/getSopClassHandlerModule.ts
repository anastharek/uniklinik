import { utils } from '@ohif/core';

/**
 * Synthetic display sets for the NIfTI research viewport.
 *
 * These display sets are NOT DICOM-derived — they are created by the
 * `setDicomNiftiLayout` command to give the right grid pane a display set
 * whose SOPClassHandlerId routes to the NIfTI viewport component. They carry
 * the source study/series identity and the conversion state.
 */
export const NIFTI_SOP_CLASS_HANDLER_ID = 'niftiSopClassHandlerId';

export function createNiftiDisplaySet({ studyInstanceUID, seriesInstanceUID, sourceDisplaySetUID, sourceSeriesDescription, sourceModality }) {
  return {
    displaySetInstanceUID: utils.guid(),
    SOPClassHandlerId: NIFTI_SOP_CLASS_HANDLER_ID,
    Modality: 'NIFTI',
    SeriesDescription: 'NIfTI (research)',
    StudyInstanceUID: studyInstanceUID,
    SeriesInstanceUID: seriesInstanceUID,
    sourceDisplaySetUID,
    sourceSeriesDescription,
    sourceModality,
    // Viewport-level hints (used by the NIfTI viewport component)
    viewportOptions: {
      viewportType: 'nifti',
    },
    unsupported: false,
    isDerivedDisplaySet: true,
  };
}

const getSopClassHandlerModule = () => {
  return [
    {
      name: 'niftiSopClassHandler',
      SOPClassHandlerId: NIFTI_SOP_CLASS_HANDLER_ID,
      getDisplaySetsFromSeries: () => [],
    },
  ];
};

export default getSopClassHandlerModule;
