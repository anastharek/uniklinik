/**
 * ADC presets, colormaps and display defaults (display-only — never touch
 * the underlying voxel values). Per the research spec, presets do NOT
 * override an unvalidated quantitative scaling.
 */

export const COLORMAPS = ['gray', 'hot', 'turbo', 'viridis', 'inferno'];

/** Display presets — (name, colormap, ww, wl, note). Applied only visually. */
export const PRESETS = [
  { id: 'original', label: 'Original', colormap: 'gray', ww: null, wl: null, note: 'raw windowing' },
  { id: 'adc', label: 'ADC', colormap: 'hot', ww: null, wl: null, note: 'requires validated scaling', requiresValidation: true },
  { id: 'dwi', label: 'DWI', colormap: 'gray', ww: null, wl: null },
  { id: 't1', label: 'T1', colormap: 'gray', ww: null, wl: null },
  { id: 't2', label: 'T2', colormap: 'gray', ww: null, wl: null },
  { id: 'flair', label: 'FLAIR', colormap: 'gray', ww: null, wl: null },
];

/**
 * Safe default ADC display range (research / user-defined, NOT a clinical
 * default). Units: ×10⁻⁶ mm²/s. Shown as "research threshold / user-defined".
 */
export const ADC_DEFAULT_RANGE = { min: 0, max: 2500 };
export const ADC_EXAMPLE_THRESHOLD = 620;

/**
 * Clinical ADC range presets (×10⁻⁶ mm²/s) with assignable colors — the
 * "ADC value range → color" mapping Anas asked for.
 * Ranges are half-open: value >= min && value < max. A null min/max means
 * -Infinity / +Infinity (e.g. "infarct core < 600" → { min: null, max: 600 }).
 */
export const ADC_RANGE_PRESETS = [
  { label: 'Infarct core', min: null, max: 600, color: '#ff3b30' },
  { label: 'Penumbra', min: 600, max: 700, color: '#ff9f0a' },
  { label: 'Normal', min: 700, max: 900, color: '#30d158' },
  { label: 'Above normal', min: 900, max: null, color: '#0a84ff' },
];

export function rangeContains(range, value) {
  if (value === null || value === undefined || Number.isNaN(value)) return false;
  if (range.min !== null && range.min !== undefined && !(value >= range.min)) return false;
  if (range.max !== null && range.max !== undefined && !(value < range.max)) return false;
  return true;
}

/** Parse a #rrggbb hex color to [r,g,b] 0..255. */
export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return [255, 255, 255];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function colormapLabel(name) {
  const map = {
    gray: 'Grayscale',
    hot: 'Hot',
    turbo: 'Turbo',
    viridis: 'Viridis',
    inferno: 'Inferno',
  };
  return map[name] || name;
}
