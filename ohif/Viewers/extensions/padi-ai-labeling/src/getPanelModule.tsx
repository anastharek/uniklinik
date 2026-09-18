import React from 'react';
import { Icons } from '@ohif/ui-next';
import AiLabelingPanel from './panels/AiLabelingPanel';
import OverlayPanel from './panels/OverlayPanel';

/**
 * Custom sidebar icon for the Overlay (fusion) panel: two overlapping
 * squares — one filled, one outlined.
 */
const OverlayIcon = props => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect x="3" y="3" width="13" height="13" rx="2" fill="currentColor" opacity="0.55" />
    <rect x="6.5" y="6.5" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

/**
 * Custom sidebar icon for the AI Labeling panel: a rounded "LB" badge so it
 * is clearly distinct from the segmentation / linear measurement icons.
 */
const AiLabelingIcon = props => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect
      x="1.5"
      y="1.5"
      width="19"
      height="19"
      rx="4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <text
      x="11"
      y="15.5"
      textAnchor="middle"
      fontSize="9.5"
      fontWeight="bold"
      fill="currentColor"
      fontFamily="Arial, Helvetica, sans-serif"
    >
      LB
    </text>
  </svg>
);

// Register once (module load). Sidebar looks up Icons[iconName].
Icons.addIcon('ai-labeling-lb', AiLabelingIcon);
Icons.addIcon('padi-overlay', OverlayIcon);

/**
 * Registers the "AI Labeling" right-side panel.
 * Panel id: @ohif/extension-padi-ai-labeling.panelModule.aiLabeling
 */
const getPanelModule = ({ commandsManager, servicesManager, extensionManager }) => {
  const wrappedAiLabelingPanel = ({ configuration }) => {
    return <AiLabelingPanel commandsManager={commandsManager} servicesManager={servicesManager} />;
  };

  const wrappedOverlayPanel = ({ configuration }) => {
    return <OverlayPanel commandsManager={commandsManager} servicesManager={servicesManager} />;
  };

  return [
    {
      name: 'aiLabeling',
      iconName: 'ai-labeling-lb',
      iconLabel: 'AI Labeling',
      label: 'AI Labeling',
      component: wrappedAiLabelingPanel,
    },
    {
      name: 'overlay',
      iconName: 'padi-overlay',
      iconLabel: 'Overlay',
      label: 'Overlay',
      component: wrappedOverlayPanel,
    },
  ];
};

export default getPanelModule;
