/**
 * ADC value-range colorization + offscreen slice rendering.
 *
 * Shared by the NIfTI viewport (live range colorize via a custom Niivue
 * colormap) and the full-volume "Save as DICOM" export (per-slice RGB).
 * Ranges are half-open: value >= min && value < max (null = unbounded).
 */
import { rangeContains, hexToRgb } from './adc';

/** Interleaved RGBA LUT (256 entries) mapping rangeMin..rangeMax -> range colors. */
export function buildRangeLutRgba(settings) {
  const { rangeMin, rangeMax, ranges } = settings;
  const span = Math.max(1e-6, (rangeMax || 0) - (rangeMin || 0));
  const lut = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) {
    const q = (rangeMin || 0) + (i / 255) * span;
    const color = ranges.find(r => rangeContains(r, q));
    if (color) {
      const [r, g, b] = hexToRgb(color.color);
      lut[i * 4] = r;
      lut[i * 4 + 1] = g;
      lut[i * 4 + 2] = b;
      lut[i * 4 + 3] = 255;
    } else {
      lut[i * 4 + 3] = 0;
    }
  }
  return lut;
}

/** Niivue ColorMap ({R,G,B,A,I} arrays) for nv.addColormap('padi-ranges', cm). */
export function buildRangeColorMap(settings) {
  const lut = buildRangeLutRgba(settings);
  const R = [], G = [], B = [], A = [];
  for (let i = 0; i < 256; i++) {
    R.push(lut[i * 4]);
    G.push(lut[i * 4 + 1]);
    B.push(lut[i * 4 + 2]);
    A.push(lut[i * 4 + 3] === 0 ? 0 : 255);
  }
  const I = Array.from({ length: 256 }, (_, i) => i);
  return { R, G, B, A, I };
}

/** Resolve the quantitative scale from ADC validation (identity when absent). */
export function getQuantScale(adc) {
  if (adc && adc.validated && adc.mapping && adc.mapping.type === 'realWorldValueMapping') {
    return { slope: adc.mapping.slope || 1, intercept: adc.mapping.intercept || 0 };
  }
  return { slope: 1, intercept: 0 };
}

/**
 * Render one axial slice to RGB24 (nx*ny*3), matching the on-screen look:
 * colormap LUT windowed by wl/ww (or rangeMin..rangeMax), threshold overlay,
 * and range colorization when enabled. 0-valued (background) voxels -> black.
 */
export function renderSliceRgb({ data, nx, ny, k, settings, lutRgba, scale, rangeLutRgba }) {
  const rgb = new Uint8Array(nx * ny * 3);
  const { wl, ww, rangeMin, rangeMax, thresholdEnabled, thresholdValue, thresholdOpacity } = settings;
  const useRanges = settings.rangeColorizeEnabled && settings.ranges && settings.ranges.length > 0;
  const span = Math.max(1e-6, (rangeMax || 0) - (rangeMin || 0));
  const overlayA = (thresholdOpacity || 50) / 100;
  const OVERLAY = [255, 0, 0]; // threshold overlay color (matches viewer red overlay)
  const sliceOffset = k * nx * ny;
  const slope = scale.slope;
  const intercept = scale.intercept;

  for (let j = 0; j < ny; j++) {
    const row = j * nx;
    for (let i = 0; i < nx; i++) {
      const idx = row + i;
      const raw = data[sliceOffset + idx];
      if (raw === 0) continue; // background -> black
      const q = raw * slope + intercept;
      const out = idx * 3;

      if (useRanges) {
        // Range colorize: direct value -> color lookup (window covers rangeMin..rangeMax).
        const t = Math.max(0, Math.min(255, Math.round(((q - (rangeMin || 0)) / span) * 255)));
        const l = t * 4;
        const a = rangeLutRgba[l + 3];
        if (!a) continue; // no range matched -> keep black
        rgb[out] = rangeLutRgba[l];
        rgb[out + 1] = rangeLutRgba[l + 1];
        rgb[out + 2] = rangeLutRgba[l + 2];
        continue;
      }

      // Windowing: explicit wl/ww if set, else rangeMin..rangeMax.
      let t;
      if (wl !== null && wl !== undefined && ww !== null && ww !== undefined && ww > 0) {
        t = (q - (wl - ww / 2)) / ww;
      } else {
        t = (q - (rangeMin || 0)) / span;
      }
      t = Math.max(0, Math.min(1, t));
      const l = Math.round(t * 255) * 4;
      let r = lutRgba[l];
      let g = lutRgba[l + 1];
      let b = lutRgba[l + 2];
      // Threshold overlay (voxels below threshold tinted red)
      if (thresholdEnabled && thresholdValue !== null && thresholdValue !== undefined && q < thresholdValue) {
        r = Math.round(r * (1 - overlayA) + OVERLAY[0] * overlayA);
        g = Math.round(g * (1 - overlayA) + OVERLAY[1] * overlayA);
        b = Math.round(b * (1 - overlayA) + OVERLAY[2] * overlayA);
      }
      rgb[out] = r;
      rgb[out + 1] = g;
      rgb[out + 2] = b;
    }
  }
  return rgb;
}
