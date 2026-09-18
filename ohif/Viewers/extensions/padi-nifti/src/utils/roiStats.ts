/**
 * Quantitative ROI statistics — computed from the underlying voxel array
 * (nifti-reader-js parsed data), NEVER from rendered/colormapped pixels.
 *
 * Phase 1: 2D ROIs (ellipse / freehand) on the current axial slice.
 * ROI points are stored in VOXEL space (i, j, sliceIndex), which keeps them
 * attached to physical coordinates, not screen pixels.
 */

export function voxelIndex(nx, ny, i, j, k) {
  return k * nx * ny + j * nx + i;
}

/** Ellipse mask over voxel grid at slice k (center cx,cy; radii rx,ry in voxels). */
export function ellipseMask(nx, ny, k, cx, cy, rx, ry) {
  const mask = [];
  const rxi = Math.max(1, rx);
  const ryi = Math.max(1, ry);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const dx = (i - cx) / rxi;
      const dy = (j - cy) / ryi;
      if (dx * dx + dy * dy <= 1) mask.push(voxelIndex(nx, ny, i, j, k));
    }
  }
  return mask;
}

/** Point-in-polygon (ray casting) for freehand ROIs. */
function inPolygon(px, py, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function polygonMask(nx, ny, k, points) {
  const mask = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      if (inPolygon(i, j, points)) mask.push(voxelIndex(nx, ny, i, j, k));
    }
  }
  return mask;
}

/**
 * Compute statistics for a mask on the given slice.
 * @param data raw voxel array
 * @param mask array of flat indices
 * @param pixArea mm² per voxel (pixdim[1] * pixdim[2])
 * @param scaleFactor optional quantitative scale to apply (validated ADC mapping)
 */
export function computeRoiStats(data, mask, pixArea, scale = { slope: 1, intercept: 0 }) {
  if (!data || !mask || !mask.length) {
    return { mean: null, median: null, min: null, max: null, std: null, area: null, count: 0 };
  }
  const slope = (scale && scale.slope) || 1;
  const intercept = (scale && scale.intercept) || 0;
  const values = [];
  for (let n = 0; n < mask.length; n++) {
    const v = data[mask[n]];
    if (v === undefined || v === null) continue;
    values.push(v * slope + intercept);
  }
  if (!values.length) {
    return { mean: null, median: null, min: null, max: null, std: null, area: null, count: 0 };
  }
  values.sort((a, b) => a - b);
  const sum = values.reduce((s, v) => s + v, 0);
  const mean = sum / values.length;
  const min = values[0];
  const max = values[values.length - 1];
  const mid = values.length >> 1;
  const median = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  const variance = values.reduce((s, v) => s + (v - mean) * (v - mean), 0) / values.length;
  const std = Math.sqrt(variance);
  return {
    mean,
    median,
    min,
    max,
    std,
    area: values.length * pixArea,
    count: values.length,
  };
}
