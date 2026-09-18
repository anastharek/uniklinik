/**
 * Deterministic per-label colors: every label name maps to a stable color
 * (hash → palette). Used for the color dot in lists and the box color on
 * the image, so the same label always looks the same.
 */

const PALETTE = [
  '#f44336', // red
  '#2196f3', // blue
  '#4caf50', // green
  '#ff9800', // orange
  '#9c27b0', // purple
  '#00bcd4', // cyan
  '#ffeb3b', // yellow
  '#e91e63', // pink
  '#795548', // brown
  '#607d8b', // blue-grey
  '#3f51b5', // indigo
  '#8bc34a', // light green
];

/** Stable color for a label name (uppercase-insensitive). */
export function labelColor(labelName) {
  const s = String(labelName || '').trim().toUpperCase();
  if (!s) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

/** Inline style for a colored dot. */
export function dotStyle(color, size = 8) {
  return {
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundColor: color,
    display: 'inline-block',
    flexShrink: 0,
  };
}
