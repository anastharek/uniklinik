import { id } from './id.js';
import getViewportModule from './getViewportModule';
import getSopClassHandlerModule from './getSopClassHandlerModule';
import getPanelModule from './getPanelModule';
import getCommandsModule from './getCommandsModule';

/**
 * @ohif/extension-padi-nifti — DICOM + NIfTI research viewer (Phase 1).
 *
 * Modular design: the NIfTI research viewport + analysis panel are a plugin
 * framework. ADC Mapping is the first analysis module; future modules (DWI,
 * perfusion, segmentation, volumetry) plug in without touching the NIfTI
 * infrastructure.
 */
const padiNiftiExtension = {
  id,
  getViewportModule,
  getSopClassHandlerModule,
  getPanelModule,
  getCommandsModule,
};

export default padiNiftiExtension;
