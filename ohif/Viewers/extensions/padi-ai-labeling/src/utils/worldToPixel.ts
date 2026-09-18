import { metaData } from '@cornerstonejs/core';

/**
 * Convert world-space corner points (from a cornerstone RectangleROI
 * annotation) into an axis-aligned bounding box in source-image pixel space,
 * using the DICOM image plane metadata. Deterministic — independent of
 * viewport zoom/pan, so stored coordinates always match the original pixels.
 */
export function worldToPixelBBox(worldPoints, imageId) {
  if (!Array.isArray(worldPoints) || worldPoints.length < 2) return null;
  const plane = metaData.get('imagePlaneModule', imageId);
  if (!plane) return null;

  const {
    rowCosines,
    columnCosines,
    imagePositionPatient: ipp,
    pixelSpacing,
    rows,
    columns,
  } = plane;
  if (!rowCosines || !columnCosines || !ipp || !pixelSpacing) return null;

  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  const xs = [];
  const ys = [];
  for (const p of worldPoints) {
    const d = [p[0] - ipp[0], p[1] - ipp[1], p[2] - ipp[2]];
    // column index (x) runs along columnCosines; row index (y) along rowCosines
    const colF = dot(d, columnCosines) / pixelSpacing[1];
    const rowF = dot(d, rowCosines) / pixelSpacing[0];
    xs.push(colF);
    ys.push(rowF);
  }

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const x1 = clamp(Math.min(...xs), 0, columns);
  const y1 = clamp(Math.min(...ys), 0, rows);
  const x2 = clamp(Math.max(...xs), 0, columns);
  const y2 = clamp(Math.max(...ys), 0, rows);

  return { x1, y1, x2, y2, imageWidth: columns, imageHeight: rows };
}
