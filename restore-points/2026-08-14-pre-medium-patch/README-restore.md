# Restore Point — 2026-08-14-pre-medium-patch

**STATUS: SUPERSEDED — patch was tested and REVERTED the same day (15:40 MYT).**
Live system returned to original app.js (sha fd8beeb5…) and original NPM conf.
Keep this folder as the reference + re-apply kit if MRA/SWI-heavy studies ever dominate.

**Created:** 2026-08-14 10:51 MYT (Anas: "create restore point first, this version is quite stable")
**Purpose:** Snapshot of the CURRENT stable PUTRACNS state, taken BEFORE the nginx-override
MEDIUM-quality app.js patch (viewer prefetch lossless PNG → 1000px JPEG, saves ~51% transfer).

**System state at capture (all verified):**
- Orthanc `orthanc-pmstroke5.1` up, filter ACTIVE (modify.lua sha `c96bcb2e…` = NAS source, MATCH ✓)
- Compose = identical to `docker-compose.yml.bak-20260813-hqpreload-true`
  (HIGH_QUALITY_IMAGE_PRELOADING_ENABLED=true, 60GB warm cache)
- Viewer bundle: `js/app.js`, sha256 `fd8beeb5ca3c04271528f224bc8137f33117a7357f0b72cd879e403b535facc1` (pristine, unpatched)
- NPM proxy host for strokesvr: `2.conf`, no custom locations yet

## Contents

```
nginx-proxy-manager/
  proxy_host-2.conf     current strokesvr.padimedical.com nginx conf (NPM-generated)
  database.sqlite       NPM SQLite DB (authoritative config source; 2026-08-13 07:08)
viewer/
  app.js.original       pristine viewer bundle as served today (2,009,459 bytes)
  app.js.original.sha256
  app.js.patched-medium patched bundle (sha cdadbdd7…) — study-open prefetch = MEDIUM
compose/
  docker-compose.yml    current compose (known-good, = bak-20260813-hqpreload-true)
  .env                  credentials (chmod 600 — do NOT commit to git)
versions.txt            container images, versions, hashes, timestamps
```

## What the patch does (deployed 2026-08-14 ~13:20 MYT)

Patched 4 spots in the minified app.js (UserSelectedStudyId + UserUnSelectedStudyId
handlers only): study-open prefetch now requests `osimis.quality.MEDIUM` (1000px JPEG)
instead of min/max `availableQualities` (which is lossless for MR). Series-open handler
untouched — opened series still get lossless. Deployed via:
1. `docker cp` patched app.js → NPM container `/data/patched/app.js`
2. NPM DB: `UPDATE proxy_host SET advanced_config='<location = /osimis-viewer/app/js/app.js { alias /data/patched/app.js; ... }>' WHERE id=2`
3. Location block inserted into live `proxy_host/2.conf` + `nginx -s reload` (graceful)

Verified: served app.js sha = cdadbdd7…, index.html 200, image endpoints OK.

## Test outcome (why it was reverted)

PRE/POST on study 02996b55 (8,696 frames, MRI PUTRA ACUTE STROKE):
- PRE lossless: 361.4 MB, avg 40.6 KiB/frame, Orthanc CPU avg 92%/peak 281%, MEM 4.26→4.33 GiB
- POST medium (clean serial sample): avg 43.4 KiB/frame → projected 368.9 MB (**+7% — no saving**)
- Why: corpus is DWI/EPI-heavy where lossless PNG already compresses tiny; medium JPEG is equal-or-bigger.
  Yesterday's −51% applied to an MRA/SWI-heavy study (029c79c9).
- Verdict: no server-side benefit on the current corpus → reverted to stable original.
- Re-apply when MRA/SWI-heavy studies dominate (procedure below).

## How to restore (re-apply the patch if ever wanted)

1. `docker cp viewer/app.js.patched-medium nginx-proxy-manager:/data/patched/app.js`
2. NPM DB: `UPDATE proxy_host SET advanced_config='location = /osimis-viewer/app/js/app.js { alias /data/patched/app.js; default_type application/javascript; add_header Cache-Control "no-cache, must-revalidate"; }' WHERE id=2`
   (via `docker run --rm --entrypoint node -v /opt/nginx-proxy-manager/data:/data jc21/nginx-proxy-manager:2.15.1 -e "..."` with better-sqlite3)
3. Insert the same location block into `/data/nginx/proxy_host/2.conf` (NPM does NOT regenerate confs on boot) + `docker exec nginx-proxy-manager nginx -s reload`
4. Verify: served app.js sha = `cdadbdd72a581267858638e6766fde485b45eda084ab8a648647925530e09b0a`

### Undo the patch
- Remove the location block from `proxy_host/2.conf` (or NPM UI Advanced tab) + clear DB
  `advanced_config` + `nginx -s reload`.
- Verify: app.js sha must equal `fd8beeb5ca3c04271528f224bc8137f33117a7357f0b72cd879e403b535facc1`

### 2. Full NPM config restore (only if NPM itself is broken)
```
docker stop nginx-proxy-manager
cp nginx-proxy-manager/database.sqlite /opt/nginx-proxy-manager/data/database.sqlite
docker start nginx-proxy-manager
```
Note: DB backup predates the patch (2026-08-13 07:08); no NPM config changes were made
between then and capture, so restoring it loses nothing.

### 3. Compose/env restore (NOT needed for this patch — for completeness only)
```
cp compose/docker-compose.yml /media/svr04pm01/NAS1/PACS\ RESEARCH/PUTRACNS/docker-compose.yml
cp compose/.env /media/svr04pm01/NAS1/PACS\ RESEARCH/PUTRACNS/.env
cd "/media/svr04pm01/NAS1/PACS RESEARCH/PUTRACNS" && docker compose up -d
```

## Verify health after any restore
- `docker ps` — orthanc-pmstroke5.1, pmstroke5.1, nginx-proxy-manager all Up
- Lua filter: `docker exec orthanc-pmstroke5.1 sha256sum /etc/orthanc/scripts/modify.lua`
  = `c96bcb2e0d3211d3bf717f7da612f11ef66c5115a5b05d1a0d24fbf9093d0ab0`
- Viewer loads: `curl -skI https://strokesvr.padimedical.com/osimis-viewer/app/index.html` → 200
