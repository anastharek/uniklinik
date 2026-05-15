# OHIF Stability Mode UI — Design & Behavior

## 1. Stability Mode Logic

Three detection mechanisms (mutually traceable):

| Mode | Trigger | Threshold |
|------|---------|-----------|
| `crashDetected` | Previous session had active heartbeat + recent session saved, but page reloaded unexpectedly | Heartbeat stale > 18s |
| `largeStudy` | Total displaySets across all studies exceeds threshold | > 50 series |
| `mobileLargeStudy` | Mobile device + study exceeds mobile threshold | > 20 series (mobile only) |

**Computed state:**
```js
stabilityMode = userOverride === 'on'  ? true
              : userOverride === 'off' ? false
              : crashDetected || largeStudy || mobileLargeStudy;
```

**Storage:**
- Crash detection: `sessionStorage` (per-tab)
- User override: `sessionStorage` (per-tab)
- Banner dismissed: `sessionStorage` (per-tab)
- Session save / heartbeat / errors: `localStorage` (persistent)

## 2. Stability Mode vs Recovery Mode

| Concept | Old Name | New Name | Meaning |
|---------|---------|---------|---------|
| Recovery mode | `recoveryMode` | `stabilityMode` | Overall progressive-loading behavior |
| Crash detected | (mixed into recovery) | `crashDetected` | Only true if abnormal reload |
| Large study | `studyIsLarge` | `largeStudy` | Only true if >50 displaySets |

**Old:** Every large study was called "crash recovery" → confusing.
**New:** Crash recovery is separate; large study is a distinct state.

## 3. Stability Mode Toggle Button

**Location:** Toolbar, between layout button and right panel buttons.
**Labels:**
- ON: "Stability ON" (bolt icon, active state)
- OFF: "Stability OFF" (adjust icon, inactive state)

**States:**
- Normal small study: OFF by default, no banner
- Large study: Auto ON
- Crash detected: Auto ON

## 4. Banner Design

Dark translucent banner with cyan border, above toolbar, does not cover controls.

**Messages by trigger:**

| Trigger | Text |
|---------|------|
| Crash detected | "Stability Mode is ON because the previous viewer session may not have closed normally. Series will load progressively." |
| Large study | "Large study detected. Stability Mode is ON to reduce memory use." + hint: "For transfer or offline review, use ZIP on individual series instead of loading all series." |
| Mobile large | "Mobile low-memory mode is ON. Series will load progressively." |

**Buttons:** [Keep On] [Turn Off] [✕ Close]
**Behavior:** Dismissing hides banner for session. Logic remains active.

## 5. Manual Override

### Turn OFF:
1. Click "Turn Off" in banner or Stability Mode toggle in toolbar
2. If large study: confirmation dialog appears ("Turning off Stability Mode may increase memory use…")
3. After confirm: all thumbnails shown, stabilityMode = false
4. Override saved to sessionStorage (per-tab only)
5. **Kept:** cornerstone cache limit, error boundary, ZIP safety, no forced all-series viewport loading

### Turn ON:
1. Click Stability Mode toggle in toolbar
2. Progressive loading enabled: 10 thumbnails mobile, 20 desktop
3. Prefetch disabled
4. Override saved to sessionStorage

## 6. Progressive Series Loading

**Stability ON:**
- Initial thumbnails: 10 (mobile) / 20 (desktop)
- Each "Load more": +20 series
- Prefetch disabled
- No auto-load all series into viewports
- Viewport loads selected series only

**Stability OFF:**
- All thumbnails shown
- Prefetch enabled (if configured)
- Still: no forced all-series viewport loading
- Still: cornerstone cache limit active

## 7. Load More Series — Two Options

### Manual Button
- Located below series thumbnails at bottom of scroll container
- Text: "Load more series"
- Loads next 20 series in one click

### Scroll Prompt
- When user scrolls near bottom (<160px from end) → prompt appears:
  - "Load more series?"
  - [Load 20 more] [Not now]
- Does NOT auto-load — user must click
- Prevents accidental memory spikes on scroll

## 8. Mobile URL Bar Overlap Fix

**Classes with mobile padding:**
- `.series-scroll-container` → `padding-bottom: calc(120px + env(safe-area-inset-bottom))`
- `.study-browser` → `padding-bottom: calc(96px + env(safe-area-inset-bottom))`

**Applied on:** `@media (max-width: 768px)`
**Ensures:** "Load more series" button, last thumbnail, and ZIP button are visible above the mobile browser URL/navigation bar.

## 9. ZIP Recommendation

**Large study banner:** Additional hint line — "For transfer or offline review, use ZIP on individual series instead of loading all series."

**Large individual series** (>1000 instances): Small italic text below ZIP button — "Large series — ZIP recommended"

**Rules:**
- ZIP downloads only the selected series
- ZIP contains original .dcm files (not metadata)
- ZIP download does NOT load images into Cornerstone viewport
- ZIP progress remains below selected thumbnail only

## 10. Key Imports

```js
import {
  checkStabilityMode,
  initStabilityMode,
  isMobile,
  LARGE_STUDY_SERIES_THRESHOLD,
  MOBILE_SERIES_THRESHOLD,
  SERIES_INCREMENT,
  INITIAL_THUMBNAILS_MOBILE,
  INITIAL_THUMBNAILS_DESKTOP,
  setStabilityOverride,
  clearStabilityOverride,
  getStabilityOverride,
  hideStabilityBanner,
  isStabilityBannerHidden,
  getStabilityBannerText,
  // ... plus existing: saveSession, getLastSession, etc.
} from '../utils/crashRecovery';
```

## 11. Remaining Risks

- **React class component state complexity:** `Viewer.js` is a large class component. State mutations through `setState` are asynchronous and could race with rapid thumbnail expansion.
- **Mobile detection:** Uses `navigator.maxTouchPoints` and `window.innerWidth`. iPad with keyboard may report as desktop.
- **Session-only override:** User must re-enable/disable stability mode each time the study is opened in a new tab.
- **Cache limit enforcement:** Cornerstone cache limit is set once at init; dynamic changes require page reload.
