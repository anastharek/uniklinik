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
  extensions: [],
  modes: [],
  customizationService: {},
  showStudyList: true,
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
