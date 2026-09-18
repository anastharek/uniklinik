import { metaData } from '@cornerstonejs/core';

/**
 * Inverse of worldToPixelBBox: convert a pixel-space axis-aligned bbox
 * (stored in the DB) back to world-space corner points for a given imageId,
 * so saved boxes can be rendered as cornerstone RectangleROI annotations.
 */
export function pixelToWorldBBox(bbox, imageId) {
  if (!bbox || !imageId) return null;
  const plane = metaData.get('imagePlaneModule', imageId);
  if (!plane) return null;

  const { rowCosines, columnCosines, imagePositionPatient: ipp, pixelSpacing } = plane;
  if (!rowCosines || !columnCosines || !ipp || !pixelSpacing) return null;

  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (v, s) => [v[0] * s, v[1] * s, v[2] * s];

  const pxToWorld = (col, row) =>
    add(ipp, add(mul(columnCosines, col * pixelSpacing[1]), mul(rowCosines, row * pixelSpacing[0])));

  return [
    pxToWorld(bbox.x1, bbox.y1),
    pxToWorld(bbox.x2, bbox.y1),
    pxToWorld(bbox.x2, bbox.y2),
    pxToWorld(bbox.x1, bbox.y2),
  ];
}

/** Cross product of two 3-vectors (rowCosines × columnCosines = plane normal). */
export function cross3(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
