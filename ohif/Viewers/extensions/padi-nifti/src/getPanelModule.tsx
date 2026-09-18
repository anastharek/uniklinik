import React from 'react';
import NiftiAnalysisPanel from './panels/NiftiAnalysisPanel';

/**
 * Registers the "NIfTI Analysis" right-side panel.
 * Panel id: @ohif/extension-padi-nifti.panelModule.niftiAnalysis
 */
const getPanelModule = ({ commandsManager, servicesManager }) => {
  const wrappedPanel = ({ configuration }) => (
    <NiftiAnalysisPanel commandsManager={commandsManager} servicesManager={servicesManager} />
  );

  return [
    {
      name: 'niftiAnalysis',
      iconName: 'padi-nifti',
      iconLabel: 'NIfTI Analysis',
      label: 'NIfTI Analysis',
      component: wrappedPanel,
    },
  ];
};

export default getPanelModule;
