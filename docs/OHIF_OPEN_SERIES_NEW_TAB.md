# OHIF Open Series in New Tab — Single-Series Viewer Mode

## 1. Purpose

Each series thumbnail now has an **OPEN IN TAB** button. Clicking it opens a new browser tab that loads **only that single series**, reducing memory usage and improving stability for large studies.

## 2. Button Location

The new button appears beside **Load** and **ZIP** below each series thumbnail:

```
[ Load / Loaded ] [ ZIP ] [ OPEN IN TAB ]
```

All three buttons are inline in a single flex row with equal widths.

## 3. Button States

| State | Load button | ZIP button | OPEN button |
|-------|------------|------------|-------------|
| **Default** | `[Load]` — gray | `[ZIP]` — gray | `[OPEN IN TAB]` — cyan |
| **Loading** | `[Loading]` — amber | — | always active |
| **Active** | `[Loaded]` — green (disabled) | normal | always active |
| **ZIP downloading** | normal | `[N%]` — amber | always active |
| **ZIP done** | normal | `[Done]` — green | always active |
| **ZIP error** | normal | `[Retry]` — red | always active |

## 4. URL Format

New tab URL structure:

```
/viewer-ohif/viewer?StudyInstanceUID=<studyUID>&SeriesInstanceUID=<seriesUID>&singleSeries=true
```

Parameters:
- `StudyInstanceUID` — the study DICOM UID
- `SeriesInstanceUID` — the target series DICOM UID
- `singleSeries=true` — triggers single-series mode

## 5. Single-Series Mode Behavior

When `singleSeries=true` is detected on startup:

| Feature | Normal viewer | Single-series mode |
|---------|--------------|-------------------|
| DisplaySets | All series | Only target series |
| Thumbnails | All series shown | Only target series |
| Initial layout | Default (e.g. 1×2) | 1×1 (single pane) |
| Prefetch | Enabled | Disabled |
| Load More Series | Visible | Hidden |
| Stability banner | May show | Hidden (single-series banner shown instead) |
| All tools (Zoom, WL, Pan, Measurements, PADI-AI) | ✓ | ✓ |
| ZIP download | All series | Target series only |

## 6. DisplaySet Filtering

```javascript
// In componentDidMount and _updateThumbnails
if (singleSeriesMode && targetSeriesInstanceUID) {
  studies = studies.map(study => ({
    ...study,
    displaySets: (study.displaySets || []).filter(ds =>
      ds.SeriesInstanceUID === targetSeriesInstanceUID
    ),
  }));
}
```

If no matching series is found, the full study loads (no crash).

## 7. Single-Series Banner

A compact dark-cyan banner appears below the header:

```
◉ Single-series mode: only this sequence is loaded for stability.  [Open Full Study]
```

- `[Open Full Study]` removes `singleSeries` and `SeriesInstanceUID` params and navigates to normal full-study viewer
- Banner uses the existing `.stability-banner` class with `.single-series-banner` variant

## 8. Open Full Study

```javascript
handleOpenFullStudy = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('singleSeries');
  url.searchParams.delete('SeriesInstanceUID');
  window.location.href = url.toString();
};
```

## 9. Large Series Recommendation

When a series has >1000 instances, a small italic hint appears below the buttons:

> *Large series — tab recommended*

## 10. Mobile Design

- Buttons compact with `4px 3px` padding on screens <768px
- `white-space: nowrap` prevents text wrapping
- `min-width: 0` allows flex shrinking
- Existing `padding-bottom` mobile fixes remain intact
- `window.open()` called directly in click handler (no async delay) for Safari

## 11. Files Changed

| File | Changes |
|------|---------|
| `StudyBrowser.js` | +62 lines: `handleOpenInTab` callback, OPEN IN TAB button, "Loaded" state, tab recommendation |
| `StudyBrowser.styl` | +24 lines: `.action-open` style, `.tab-recommendation-text`, `&.loaded` state, mobile compact |
| `Viewer.js` | +82 lines: URL param detection, displaySet filtering, single-series banner, `handleOpenFullStudy`, `_updateThumbnails` filter, `hasMoreSeries` gate |
| `Viewer.css` | +12 lines: `.single-series-banner` variant with cyan styling |

## 12. Build

- Branch: `restore-v1.17-open-series-new-tab`
- Tag: `v1.17-open-series-new-tab`
- Commit: `db569f4`
- Bundle: `app.bundle.521656938ebead879d8d.js` (767KB)
- CSS: `app.8ab1177ad0a73ed055db.css`
- Container: `pmstroke5.1`

## 13. Manual QA

| Test | Expected |
|------|----------|
| Full study viewer | Normal operation, 3 buttons per series, no layout break |
| Click OPEN on DWI series | New tab opens, only DWI series loads, toolbar works, Stack Scroll works |
| Click OPEN on another series | New tab opens correct series, not previous |
| Single-series mode displaySets | Only 1 displaySet active, 1 thumbnail |
| Open Full Study | Returns to full study with all series |
| ZIP in single-series mode | Downloads only target series, .dcm files |
| Load button shows "Loaded" | Green disabled when series is active in viewport |
| Large series hint | "Large series — tab recommended" text for >1000 instances |
| Mobile Safari | OPEN button works, no popup blocker, bottom bar doesn't hide button |
| No more series button | Hidden in single-series mode |

## 14. Remaining Risks

- **window.open popup blocker**: Some aggressive blockers may still block. User gets direct URL if blocked.
- **Multi-study displaySets**: If a SeriesInstanceUID appears across multiple studies in an edge case, all matching series will be shown (not just one).
