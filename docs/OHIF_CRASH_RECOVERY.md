# OHIF Crash Recovery & Low-Memory Restore Mode

## Overview

When OHIF Viewer loads studies with many series (50+ display sets), the app can exhaust
browser memory and crash — causing a blank page or browser reload. This implementation
adds crash prevention and recovery without changing the OHIF version, React, Webpack,
or the existing UI.

## Files Changed

| File | Change |
|------|--------|
| `ohif/Viewers/platform/viewer/src/utils/crashRecovery.js` | **NEW** — Core recovery utility |
| `ohif/Viewers/platform/viewer/src/components/ViewerErrorBoundary/ViewerErrorBoundary.js` | **NEW** — Top-level React error boundary |
| `ohif/Viewers/platform/viewer/src/components/ViewerErrorBoundary/ViewerErrorBoundary.css` | **NEW** — Error boundary styles |
| `ohif/Viewers/platform/viewer/src/App.js` | **MODIFIED** — Global error handlers, heartbeat, recovery init |
| `ohif/Viewers/platform/viewer/src/connectedComponents/Viewer.js` | **MODIFIED** — Error boundary wrapping, session save, large study protection, recovery banner |
| `ohif/Viewers/platform/viewer/src/connectedComponents/Viewer.css` | **MODIFIED** — Recovery banner + "Show more" button styles |
| `ohif/Viewers/platform/viewer/src/connectedComponents/ViewerMain.js` | **MODIFIED** — Cache purge on study switch |
| `ohif/Viewers/extensions/cornerstone/src/init.js` | **MODIFIED** — Image cache limit (512 MB) |

## How Recovery Mode Works

### Detection
1. Every 3 seconds, a heartbeat timestamp is written to `localStorage.ohif_heartbeat`
2. On every session change, the viewer state is saved to `localStorage.ohif_last_session`
3. At startup, if the last heartbeat is recent (< ~18s old) AND a session was saved,
   the system detects an abnormal reload → enables recovery mode

### Recovery Mode Behavior
- Prefetching is disabled (StudyPrefetcher not rendered)
- Only the first 10 thumbnails are shown initially
- "Show more series" button loads next 20 thumbnails
- A warning banner appears: "Recovery mode enabled: large study detected or previous crash occurred. Series are loaded progressively."
- Cornerstone image cache is limited to 512 MB (configurable via `window.config.maxCornerstoneCacheMB`)

### Large Study Protection
- If a study has > 50 display sets, it's automatically treated as a large study
- Same protections as recovery mode apply
- Marker saved to `localStorage.ohif_large_study`

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `ohif_last_error` | Last `window.onerror` message |
| `ohif_last_promise_error` | Last unhandled rejection reason |
| `ohif_last_session` | JSON: StudyInstanceUID, SeriesInstanceUID, displaySetInstanceUID, route, layout, image index, savedAt |
| `ohif_heartbeat` | Unix ms timestamp, updated every 3s |
| `ohif_recovery_mode` | `'true'` when recovery mode is active |
| `ohif_large_study` | `'true'` when study has > 50 display sets |

## Error Boundary

The `ViewerErrorBoundary` wraps the entire `Viewer` component. On render error:
- Shows a fallback card with error details instead of a blank screen
- Saves error to `localStorage.ohif_last_error`
- Saves current session snapshot
- Offers three actions:
  - **Reload & Recover Session** — reloads with recovery mode enabled
  - **Reload Viewer** — normal reload
  - **Clear Data & Reload** — wipes all recovery localStorage keys, fresh start

## Cache Management

### Cache Limit
- Cornerstone image cache: 512 MB (default)
- Set via `window.config.maxCornerstoneCacheMB` in app config
- Configured in `extensions/cornerstone/src/init.js` during cornerstone init

### Cache Purge
- When switching between different StudyInstanceUIDs, the cornerstone cache is purged
- Does NOT purge while scrolling within the same active series
- Handled in `ViewerMain.js` `componentDidUpdate()`

## Global Error Handlers
- `window.onerror` → saves message to `ohif_last_error`
- `window.addEventListener('unhandledrejection')` → saves reason to `ohif_last_promise_error`
- Both log to console for debugging

## Session Saving
On each meaningful change (study switch, viewport change, series selection):
```
{
  studyInstanceUIDs: [...],
  StudyInstanceUID: "...",
  SeriesInstanceUID: "...",
  displaySetInstanceUID: "...",
  currentRoute: "/viewer-ohif/viewer/...",
  viewportLayout: { rows, columns },
  activeViewportIndex: 0,
  imageIndex: 0,
  savedAt: 1746814400000
}
```

## How to Disable Recovery Mode
- Clear `ohif_recovery_mode` from localStorage via browser DevTools
- Or click "Clear Data & Reload" on the error boundary card
- Or programmatically: `localStorage.removeItem('ohif_recovery_mode')`

## Known Limitations
1. Session restore does not automatically reload the previous study — it only limits
   resource usage on the current study URL. The session data is available for manual
   or future auto-restore implementation.
2. MPR vertical stacking on mobile may still stress memory with large 3D volumes.
3. Older browsers with stricter localStorage quotas (5 MB) may be unable to save
   session data for extremely large studies.
4. Cache purge on study switch requires the StudyInstanceUID to change — if the
   same study is reloaded with different parameters, cache is not purged.
5. The heartbeat interval (3s) means there's a small window where a crash within 3s
   of startup might not be detected as abnormal.

## Build
- Bundle hash: `798379715e7bb64b6deb`
- CSS hash: `c525f85ec9159a389f44`
- Build command: `export NODE_OPTIONS=--openssl-legacy-provider && export PUBLIC_URL=/viewer-ohif/ && rm -rf platform/viewer/dist && yarn build`
- Post-build: `./fix-sw.sh` (passthrough service worker)
