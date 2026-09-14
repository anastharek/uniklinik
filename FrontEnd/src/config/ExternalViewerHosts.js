/**
 * ExternalViewerHosts
 *
 * Central configuration for externally-hosted viewer / download endpoints.
 *
 * Historically every table component hard-coded `https://strokesvr.padimedical.com`
 * (the old PADI host, now dead -> blank white page). These values are now
 * centralised here so the deployment can be repointed in exactly one place.
 *
 * FASTPACS deployment hosts:
 *   - OSIMIS viewer shim : fastpacsosimis.anzverse.com  (proxies this PACS' Orthanc,
 *                          expects the *Orthanc study ID* in ?study=)
 *   - Stone Web Viewer   : fastpacsviewer.anzverse.com  (Orthanc's own Stone viewer)
 *
 * Usage:
 *   import { OSIMIS_VIEWER_HOST, STONE_VIEWER_HOST } from '../../config/ExternalViewerHosts';
 *   `${OSIMIS_VIEWER_HOST}/osimis-viewer/app/index.html?study=${orthancId}`
 */

// OSIMIS Web Viewer shim — accepts the Orthanc study ID.
export const OSIMIS_VIEWER_HOST = 'https://fastpacsosimis.anzverse.com';

// Orthanc Stone Web Viewer — accepts the Orthanc study ID.
export const STONE_VIEWER_HOST = 'https://fastpacsviewer.anzverse.com';

// Legacy host that used to serve WSI (whole-slide imaging), downloads and the
// Orthanc REST archive endpoints. No anZverse equivalent is configured yet, so
// these remain on the old host until one is provisioned.
export const LEGACY_PADI_HOST = 'https://strokesvr.padimedical.com';

export default {
  OSIMIS_VIEWER_HOST,
  STONE_VIEWER_HOST,
  LEGACY_PADI_HOST,
};
