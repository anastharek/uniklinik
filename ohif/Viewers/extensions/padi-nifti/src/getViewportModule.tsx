import React, { Suspense } from 'react';

/**
 * Registers the NIfTI research viewport type.
 *
 * The grid resolves the per-pane component by matching the display set's
 * SOPClassHandlerId against `displaySetsToDisplay` — so the synthetic NIfTI
 * display sets created by `niftiSopClassHandler` render in this viewport.
 */
const NiftiViewport = props => {
  const Component = React.lazy(() => import('./components/NiftiViewport'));

  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center bg-black text-white">Loading NIfTI viewport…</div>}>
      <Component {...props} />
    </Suspense>
  );
};

const getViewportModule = ({ servicesManager, commandsManager }) => {
  const ExtendedNiftiViewport = props => (
    <NiftiViewport
      {...props}
      servicesManager={servicesManager}
      commandsManager={commandsManager}
    />
  );

  return [
    {
      name: 'nifti',
      component: ExtendedNiftiViewport,
      displaySetsToDisplay: ['niftiSopClassHandlerId'],
    },
  ];
};

export default getViewportModule;
