# CHANGELOG

All notable changes to PUTRACNS.

## 2026-08-11 — AI series short-output fix + secret hygiene

- **AI output validation** (`BackEnd/cron/generateAiSeries.js`): after generation the cron counts the AI
  series instances vs source frames (expected ~2×). If the external AI app returns fewer images than
  source frames (intermittent AI-server bug — seen 11-Aug 20:12: 58→2, 10-Aug 23:12: 50→2), the bad AI
  output series is auto-deleted, the record marked failed (02:00 full scan retries), and an ALERT is
  logged. Prevents a bad 2-image series from blocking retries forever via the dedup rule.
- **Crash-proof cron**: try/catch per config in the 2-min incremental and 02:00 full scans — a 5xx
  lookup under load no longer aborts the whole run.
- **Secrets externalized**: `ORTHANC_USERNAME` / `ORTHANC_PASSWORD` / `ADMIN_PASSWORD` moved from
  `docker-compose.yml` + `preferences.js` into gitignored `.env` (see `.env.example`). Credentials are
  no longer part of the repository.

## 2026-08-11 — Preload fixes (viewer slowness on XA/angio)

- **Quality-aware warming** (`BackEnd/services/preloadService.js`): preload only warms qualities each
  series actually supports (XA studies: low + lossless; CT/MR: lossless). Fixes "certain series not
  load" on XA cases.
- **Deep-warm strategy**: series ≤16 frames (cine loops) → warm every frame at every quality; larger
  series → every frame at fastest preview quality + first/middle frames full quality (cap 1000
  frames/series).
- **Parallel warming**: 4-worker pool — a big XA study ~10–15 min instead of 40–60.
- **Hang fix**: `orthancGet` timeout 15 min → 60 s; `orthancWarm` → 2 min; per-series catch skips and
  continues. Hanging viewer endpoints no longer freeze the whole job.
- **60 GB warm cache**: `ORTHANC__WEB_VIEWER__SHORT_TERM_CACHE_SIZE=60000` MB (NAS-backed disk cache,
  ~100 big XA studies stay warm).
- **Cached-badge honesty**: job that fails >25% of series does not persist a "Cached" record (badge
  stays "Preload" → retried).
- **Flood monitor fix**: CPU alert now requires CPU >90% AND DICOM ingest >0.5/s — preload warming no
  longer triggers false flood alerts.
