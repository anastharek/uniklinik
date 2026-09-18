/**
 * Build-time patch for @cornerstonejs/core — run AFTER `pnpm install`,
 * BEFORE the rspack build (see Dockerfile).
 *
 * Fixes a viewer crash: scrolling a VOLUME viewport that has no volume
 * actor yet (volume still loading / failed to load / never attached)
 * made `getVolumeSliceRangeInfo` throw
 *   "Could not find image volume with id undefined in the viewport"
 * via the StackScrollTool mouseWheel path — crashing the whole viewer.
 *
 * We degrade the throw into a zero-range result, so the scroll becomes a
 * silent no-op instead of a crash.
 */
import fs from 'node:fs';

const target =
  'node_modules/@cornerstonejs/core/dist/esm/utilities/getVolumeSliceRangeInfo.js';

if (!fs.existsSync(target)) {
  console.error('[patch-cornerstone] target missing:', target);
  process.exit(1);
}

let src = fs.readFileSync(target, 'utf8');

if (!src.includes('Could not find image volume with id')) {
  console.error('[patch-cornerstone] marker not found — version changed? ABORTING build.');
  process.exit(1);
}

const pattern =
  /if \(!actorUID\) \{\s*throw new Error\(`Could not find image volume with id \$\{volumeId\} in the viewport`\);\s*\}/;

if (!pattern.test(src)) {
  console.error('[patch-cornerstone] throw pattern not found — ABORTING build.');
  process.exit(1);
}

const replacement = `if (!actorUID) {
        // PUTRACNS patch: scrolling a volume viewport with no actor yet
        // (volume still loading / failed to load) used to throw and crash
        // the whole viewer. Degrade to a zero-range (no-op) scroll instead.
        return { sliceRange: { min: 0, max: 0, current: 0 }, spacingInNormalDirection: 1, camera };
      }`;

src = src.replace(pattern, replacement);
fs.writeFileSync(target, src);
console.log('[patch-cornerstone] OK — scroll-on-empty-volume crash patched');
