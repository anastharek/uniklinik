# OHIF Series Scroll Pill Handle

## Overview
A draggable pill-shaped vertical scroll indicator/controller for the series thumbnail panel. Addresses the problem that native scrollbars are invisible on iOS Safari and series lists with 142+ items are hard to navigate.

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `platform/viewer/src/components/SeriesScrollPill/SeriesScrollPill.js` | React component — pill handle with pointer-based drag |
| `platform/viewer/src/components/SeriesScrollPill/SeriesScrollPill.css` | Pill and track CSS — dark/cyan PadiMedical theme |

### Modified Files
| File | Change |
|------|--------|
| `platform/viewer/src/connectedComponents/Viewer.js` | Import pill, create `seriesScrollRef`, wrap scroll container in `position: relative` div, render `<SeriesScrollPill>` |

## Scroll Container
- Element: `div.series-scroll-container` (id: `series-scroll-container`)
- CSS: `overflow-y: auto`, `-webkit-overflow-scrolling: touch`
- Ref: `this.seriesScrollRef` (React.createRef)
- Location: Inside `SidePanel from="left"`, wrapped in `<div style={{ position: 'relative', height: '100%' }}>`

## Pill Placement
- Pill is rendered as a sibling of the scroll container, inside a `position: relative` wrapper
- Track: `position: absolute; right: 4px; top: 8px; bottom: calc(96px + env(safe-area-inset-bottom))`
- Mobile: `right: 2px; bottom: calc(130px + env(safe-area-inset-bottom))`
- Pill: `position: absolute; right: 4px; width: 10px; min-height: 48px; border-radius: 999px`
- Does NOT overlap viewport, toolbar, or series buttons
- z-index: 20 (above thumbnails, below overlays)

## Drag Scrolling Logic
- **Pointer events** (pointerdown/pointermove/pointerup/cancel) — works for both mouse and touch
- On pointerdown: capture pointer, record `startY` and `startScrollTop`
- On pointermove: `scrollTop = startScrollTop + deltaY * (maxScrollTop / maxPillTop)`
- Clamped to valid range (0 to maxScrollTop)
- Uses `setPointerCapture` for reliable drag tracking
- `preventDefault()` on drag events to avoid interfering with native scrolling

## Visibility Behaviour
- **Shown:** When `scrollHeight > clientHeight + 20` (content overflows)
- **Hidden:** When not scrollable, single-series mode with 1 item, or sidebar closed
- **Fade:** Pill opacity decreases to 0.45 after 1200ms of inactivity
- **On scroll/drag:** Opacity immediately goes to 1, then fades after delay
- Uses MutationObserver to recalculate when thumbnails are added/removed

## Interaction with Load More Series
- Pill scrolls only currently visible loaded series
- Does NOT auto-load more series on drag
- Drag to bottom stops at current content boundary
- "Load 20 more series?" prompt appears via existing scroll-triggered logic

## Mobile Browser Bottom Bar Fix
- Pill track ends above browser URL bar via bottom padding
- Mobile CSS: `bottom: calc(130px + env(safe-area-inset-bottom))`
- Last thumbnail and buttons remain clickable

## Accessibility
- `aria-label="Scroll series list"`, `title="Scroll series list"`
- `role="scrollbar"`, `aria-controls="series-scroll-container"`
- Pill touch target: 18px track width, 10-12px visible handle

## Build
- Bundle: `22a115e0` (768KB)
- Build command: `yarn build` with `NODE_OPTIONS=--openssl-legacy-provider`, `PUBLIC_URL=/viewer-ohif/`
- Deployed to: `pmstroke5.1:/OrthancToolsJs/build/viewer-ohif/`

## QA
### Test scenarios
1. **Desktop:** Pill appears when scrollable, dragging scrolls thumbnails, mouse wheel works, buttons clickable
2. **Mobile Safari:** Pill visible on right of panel, drag-to-scroll works, normal touch scroll works, no viewport overlap
3. **Large study (142 series):** Pill position reflects scroll, drag to bottom works, Load More prompt appears
4. **Single-series mode:** Pill hidden (no scroll needed)
5. **Stability Mode:** Pill works with progressive loading, no crash
6. **PadiMedical dark/cyan theme preserved**

## Remaining Risks
- iOS Safari may occasionally capture scroll events instead of pointer events during initial touch — mitigated by `touch-action: none` on pill element
- MutationObserver may fire frequently with many series — performance acceptable for 142 series
- Pill fade timing may need tuning for mobile UX preferences
