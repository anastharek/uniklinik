/**
 * PUTRACNS — OHIF Viewer v3.12.x configuration
 * Served at /viewer-ohif/app-config.js (baked into the OHIF dist at image build).
 * Data source: the app's DICOMweb proxy (/api/dicom-web, /api/wado) which
 * authenticates with the logged-in session and forwards to Orthanc.
 * Format follows OHIF's official docker-nginx-orthanc reference config.
 */
window.config = {
  name: 'config/app-config.js',
  routerBasename: '/viewer-ohif',
  defaultDataSourceName: 'dicomweb',
  extensions: [],
  modes: [],
  customizationService: {},
  // PUTRACNS — suppress OHIF's built-in "INVESTIGATIONAL USE ONLY" dialog.
  // Option values (OHIF enum): 'always' | 'configure' | 'never'.
  investigationalUseDialog: {
    option: 'never',
  },
  // PUTRACNS — replace the OHIF top-header logo with the PadiMedical mark.
  // OHIF renders whiteLabeling.createLogoComponentFn(React, config) if present,
  // otherwise falls back to the built-in OHIFLogoHorizontal. Assets are served
  // from /viewer-ohif/assets/ (copied via FrontEnd/public/viewer-ohif/assets).
  whiteLabeling: {
    // Inlined as a data URI so it needs no extra asset wiring in the CRA build.
    createLogoComponentFn: function (React, config) {
      return React.createElement('img', {
        src: 'data:image/png;base64,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',
        alt: 'PadiMedical',
        style: { height: '32px', width: 'auto', display: 'block' },
      });
    },
  },
  // PUTRACNS patient-scoped viewer: showStudyList=false removes the worklist
  // route and the top-left back arrow (isReturnEnabled=false in ViewerHeader).
  // Users enter via PUTRA CNS with ?StudyInstanceUIDs=... and cannot navigate
  // back to the general study/patient list (see ViewerHeader no-op too).
  showStudyList: false,
  maxNumberOfWebWorkers: 3,
  // Cap cornerstone's decoded-image cache at 256MB (default is 3GB!). The
  // stack prefetcher fills ~1/4 of the cache with the active series; for the
  // AI screenshot series (1280x1969 RGB, ~10MB decoded/frame) the 3GB default
  // made OHIF decode the whole 60-frame stack (~1.2GB with GPU textures) and
  // crash Safari. 256MB bounds worst-case memory ~512MB (CPU+GPU) — safe on
  // phones and desktops, and CT series (524KB/frame) still prefetch fully.
  maxCacheSize: 268435456,
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  experimentalStudyBrowserSort: false,
  strictZSpacingForVolumeViewport: true,
  groupEnabledModesFirst: true,
  allowMultiSelectExport: false,
  maxNumRequests: {
    interaction: 100,
    thumbnail: 75,
    prefetch: 60,
  },
  showErrorDetails: 'always',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'PadiMedical PACS',
        name: 'PadiMedical',
        wadoUriRoot: '/api/wado',
        qidoRoot: '/api/dicom-web',
        wadoRoot: '/api/dicom-web',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        // Serve frames as JPEG-LS (lossless) instead of raw 524KB pixel data:
        // ~281KB/frame for CT -> faster scroll, less bandwidth. Orthanc
        // transcodes on the fly; CharLS decoder is bundled in the viewer.
        requestTransferSyntaxUID: '1.2.840.10008.1.2.4.80',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        staticWado: true,
        singlepart: 'bulkdata,video',
      },
    },
  ],
  // Supported Keys: https://craig.is/killing/mice
  hotkeys: [
    // ~ Global
    {
      commandName: 'incrementActiveViewport',
      label: 'Next Viewport',
      keys: ['right'],
    },
    {
      commandName: 'decrementActiveViewport',
      label: 'Previous Viewport',
      keys: ['left'],
    },
    // ~ Cornerstone Extension
    { commandName: 'rotateViewportCW', label: 'Rotate Right', keys: ['r'] },
    { commandName: 'rotateViewportCCW', label: 'Rotate Left', keys: ['l'] },
    { commandName: 'invertViewport', label: 'Invert', keys: ['i'] },
    { commandName: 'flipViewportVertical', label: 'Flip Horizontally', keys: ['h'] },
    { commandName: 'flipViewportHorizontal', label: 'Flip Vertically', keys: ['v'] },
    { commandName: 'scaleUpViewport', label: 'Zoom In', keys: ['+'] },
    { commandName: 'scaleDownViewport', label: 'Zoom Out', keys: ['-'] },
    { commandName: 'fitViewportToWindow', label: 'Zoom to Fit', keys: ['='] },
    { commandName: 'resetViewport', label: 'Reset', keys: ['space'] },
    { commandName: 'nextImage', label: 'Next Image', keys: ['down'] },
    { commandName: 'previousImage', label: 'Previous Image', keys: ['up'] },
    { commandName: 'nextViewport', label: 'Next Viewport', keys: [']'] },
    { commandName: 'previousViewport', label: 'Previous Viewport', keys: ['['] },
  ],
};
