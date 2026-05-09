import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';

let initialized = false;

const isMobile = /iPhone|iPad|iPod|Android/i.test(
  typeof navigator !== 'undefined' ? navigator.userAgent : ''
);

const MAX_WEB_WORKERS = isMobile ? 2 : 6;
const MAX_SIMULTANEOUS_REQUESTS = isMobile ? 4 : 8;

export default function initWebWorkers() {
  const config = {
    maxWebWorkers: Math.max(Math.min(navigator.hardwareConcurrency - 1, MAX_WEB_WORKERS), 1),
    startWebWorkersOnDemand: true,
    taskConfiguration: {
      decodeTask: {
        initializeCodecsOnStartup: true,
        usePDFJS: false,
        strict: false,
      },
    },
  };

  if (!initialized) {
    cornerstoneWADOImageLoader.webWorkerManager.initialize(config);

    // Limit concurrent image requests to prevent browser connection saturation.
    // Mobile browsers have 6-8 max connections per host — keeping requests
    // within this limit prevents connection failures and UI freezes.
    if (cornerstoneWADOImageLoader.imageLoader) {
      cornerstoneWADOImageLoader.imageLoader.maxConcurrentRequests = MAX_SIMULTANEOUS_REQUESTS;
    }

    initialized = true;
  }
}
