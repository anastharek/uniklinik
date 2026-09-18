/**
 * Solid-color fusion colormaps for the Overlay (fusion) panel.
 *
 * OHIF registers classic multi-color LUTs (hsv, hot_iron, …) but not plain
 * single-hue ramps. For PET/MRI-style fusion (overlay volume tinted one
 * color, blended by opacity) we register black→color ramps:
 *   - low values  → black (transparent-ish dark)
 *   - high values → the solid color
 * plus an "opacity floor" so the overlay is only visible where signal
 * exists. Registered once, before any fusion viewport is created.
 */
import { utilities as csUtilities } from '@cornerstonejs/core';

const { registerColormap } = csUtilities.colormap;

const FUSION_COLORMAPS = [
  { Name: 'Fusion Green', rgb: [0, 1, 0] },
  { Name: 'Fusion Red', rgb: [1, 0, 0] },
  { Name: 'Fusion Yellow', rgb: [1, 1, 0] },
  { Name: 'Fusion Blue', rgb: [0, 0.4, 1] },
  { Name: 'Fusion Cyan', rgb: [0, 1, 1] },
  { Name: 'Fusion Magenta', rgb: [1, 0, 1] },
  { Name: 'Fusion Orange', rgb: [1, 0.55, 0] },
  { Name: 'Fusion Purple', rgb: [0.7, 0.2, 1] },
  { Name: 'Fusion White', rgb: [1, 1, 1] },
];

let registered = false;

export function registerFusionColormaps() {
  if (registered || typeof registerColormap !== 'function') {
    return;
  }
  try {
    FUSION_COLORMAPS.forEach(({ Name, rgb }) => {
      const [r, g, b] = rgb;
      registerColormap({
        ColorSpace: 'RGB',
        Name,
        NanColor: [1, 0, 0],
        RGBPoints: [0, 0, 0, 0, 1, r, g, b],
        description: `Fusion overlay (${Name})`,
      });
    });
    registered = true;
    console.log('[Overlay] fusion colormaps registered');
  } catch (e) {
    console.warn('[Overlay] fusion colormap registration failed', e);
  }
}

/** The color palette offered in the panel UI (maps to colormap names above). */
export const FUSION_COLOR_OPTIONS = [
  { name: 'Green', colormap: 'Fusion Green', css: '#00ff00' },
  { name: 'Red', colormap: 'Fusion Red', css: '#ff0000' },
  { name: 'Yellow', colormap: 'Fusion Yellow', css: '#ffff00' },
  { name: 'Blue', colormap: 'Fusion Blue', css: '#3366ff' },
  { name: 'Cyan', colormap: 'Fusion Cyan', css: '#00ffff' },
  { name: 'Magenta', colormap: 'Fusion Magenta', css: '#ff00ff' },
  { name: 'Orange', colormap: 'Fusion Orange', css: '#ff8c00' },
  { name: 'Purple', colormap: 'Fusion Purple', css: '#b333ff' },
  { name: 'White', colormap: 'Fusion White', css: '#ffffff' },
];
