/**
 * Parse Study/Series/Instance UIDs + frame number out of a cornerstone
 * wadors imageId, e.g.:
 *   wadors:https://host/api/dicom-web/studies/1.2.3/series/4.5.6/instances/7.8.9/frames/1
 */
export function parseImageId(imageId = '') {
  const m = imageId.match(
    /studies\/([^/]+)\/series\/([^/]+)\/instances\/([^/]+)(?:\/frames\/(\d+))?/
  );
  if (!m) return null;
  return {
    studyInstanceUID: m[1],
    seriesInstanceUID: m[2],
    sopInstanceUID: m[3],
    // DICOMweb frame numbers are 1-based; fall back to 1 when absent
    frameNumber: m[4] ? Number(m[4]) : 1,
  };
}
