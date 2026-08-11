# PUTRACNSPACS — PadiMedical PACS Stack

Production-ready PACS (Picture Archiving and Communication System) stack for **PUTRA CNS** built on Orthanc, with PadiMedical backend, OHIF/Stone web viewers, PostgreSQL, Redis, and Nginx caching.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Internet / Users                      │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTPS (443)
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Nginx Proxy Manager                         │
│  • SSL termination (strokesvr.padimedical.com)          │
│  • Proxy cache for Osimis/Stone viewer (2 GB)           │
│  • Gzip compression                                     │
└──────┬──────────────────────┬───────────────────────────┘
       │ port 8475            │ port 9156
       ▼                      ▼
┌──────────────┐    ┌──────────────────────────────────┐
│   Orthanc    │    │     PadiMedical Backend           │
│   PACS       │    │     (Node.js / Express)           │
│              │◄───│     • User/auth management        │
│  DICOM: 4371 │    │     • Reports & labels            │
│  HTTP:  8475 │    │     • Autorouting                 │
│  Lua scripts │    │     • DICOMweb proxy              │
└──────┬───────┘    └────────┬────────────┬─────────────┘
       │                     │            │
       │ PostgreSQL          │ PostgreSQL │ Redis
       │ (Orthanc index)     │ (App DB)   │ (cache)
       ▼                     ▼            ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│PostgreSQL│    │PostgreSQL│    │  Redis   │
│  index   │    │ app DB   │    │ alpine   │
└──────────┘    └──────────┘    └──────────┘
       │
       │ DICOM storage
       ▼
┌──────────────┐    ┌──────────────────┐
│  ORTHANC/    │    │  Pre-warm Daemon │
│  (DICOM db)  │    │  (background)    │
└──────────────┘    └──────────────────┘
```

### Services

| Service | Container | Ports | Description |
|---------|-----------|-------|-------------|
| **orthanc** | `orthanc-pmstroke5.1` | `8475` (HTTP), `4371` (DICOM) | Orthanc PACS with GDCM transcoding, Osimis + Stone viewers, Lua scripting |
| **padipacs** | `pmstroke5.1` | `9156` | PadiMedical Node.js backend (Express API + OHIF/Stone frontends) |
| **postgres** | `postgres-stroke5.1` | `5490` | PostgreSQL 13 — shared by Orthanc index and PadiMedical app DB |
| **redis** | `redis-stroke5.1` | (internal) | Redis cache for PadiMedical sessions & queues |
| **prewarm** | `prewarm-stroke5.1` | (host network) | Cache pre-warmer daemon — polls for new studies, pre-renders viewer thumbnails |

---

## Prerequisites

- **Docker** 20.10+ and **Docker Compose** v2+
- **Nginx Proxy Manager** running on the host (for SSL + caching)
- **10+ GB free disk space** for DICOM storage, PostgreSQL data, and Docker images
- Ports available: `8475`, `4371`, `9156`, `5490`

---

## Quick Deploy

```bash
# 1. Clone or copy the project
cd "/media/svr04pm01/NAS1/PACS RESEARCH/PUTRACNS"

# 2. Create required directories
mkdir -p ORTHANC orthanc3

# 3. Start the stack
docker compose up -d --build

# 4. Check status
docker compose ps
docker compose logs -f orthanc
```

### First-time build time
~10–20 minutes (builds React frontend + OHIF viewer + Node backend Docker images).

---

## Directory Layout

```
PUTRACNS/
├── docker-compose.yml          # Main stack definition
├── Dockerfile                  # Multi-stage build: React + OHIF + Stone + Backend
├── README.md                   # This file
│
├── BackEnd/                    # PadiMedical Node.js backend
│   ├── PadiMedical.js          # Express app entry point
│   ├── controllers/            # API route handlers
│   ├── model/                  # Sequelize ORM models
│   ├── repository/             # Data access layer
│   ├── routes/                 # Express routes
│   ├── midelwares/             # Auth & activity logging
│   ├── adapter/                # FTP/SFTP/WebDAV adapters
│   └── database/migrations/    # DB migration files
│
├── FrontEnd/                   # React frontend (PadiMedical UI)
│   └── src/
│
├── ohif/Viewers/               # OHIF Medical Image Viewer
│
├── stone/                      # Stone Web Viewer WASM binaries
│   └── wasm-binaries.zip
│
├── orthanc-pacs/               # Orthanc Docker build context
│   ├── Dockerfile              # FROM orthancteam/orthanc:25.12.3-full
│   └── modify.lua              # Lua scripts (InstitutionName, non-image stripping, pre-warm)
│
├── nginx/                      # Nginx Proxy Manager config snippets
│   ├── http.conf               # Proxy cache path definition (goes in http block)
│   ├── server_proxy.conf       # Location blocks + gzip (goes in server block)
│   └── setup.sh                # One-time: copies configs into nginx-proxy-manager
│
├── scripts/
│   ├── prewarm.sh              # External cache pre-warmer (frame-aware, skips non-image)
│   └── cleanup-nonimage.sh     # One-time script: strip GSPS/RawData from existing studies
│
└── docs/
    ├── OHIF_CRASH_RECOVERY.md
    ├── OHIF_OPEN_SERIES_NEW_TAB.md
    ├── OHIF_SERIES_SCROLL_PILL.md
    └── OHIF_STABILITY_MODE_UI.md
```

---

## Configuration

### Environment Variables (docker-compose.yml)

Key settings you may need to change for a new deployment:

```yaml
# In the padipacs service:
DOMAIN_ADDRESS: "stroke.padimedical.com"   # Your domain
TOKEN_SECRET: "..."                        # Generate: openssl rand -base64 32

# In the orthanc service:
ORTHANC__NAME: "STROKE"                    # Server name shown in UI
ORTHANC__DICOM__AET: "STROKE"             # DICOM Application Entity Title
ORTHANC__LIMIT_FIND_RESULTS: "200"
ORTHANC__MAXIMUM_STORAGE_SIZE: "100000"    # MB — recycle old studies when exceeded

# In the prewarm service:
PROXY_URL: "https://strokesvr.padimedical.com"  # Your nginx proxy URL
```

### Ports to change per deployment

| Service | Current | Notes |
|---------|---------|-------|
| Orthanc HTTP | `8475` | Change to unique port per stack |
| Orthanc DICOM | `4371` | DICOM C-STORE port |
| PadiMedical | `9156` | Backend API + UI |
| PostgreSQL | `5490` | External DB port |

---

## Nginx Proxy Manager Setup (one-time per server)

The Nginx Proxy Manager already provides SSL termination. These configs add **caching** for Osimis/Stone viewer assets:

```bash
# Run once (nginx-proxy-manager is shared across stacks)
cd nginx
bash setup.sh
```

The script copies `http.conf` and `server_proxy.conf` into the running NPM container and reloads. These enable:

- **Proxy cache** (2 GB) for rendered DICOM images — keys on URI, 1h TTL
- **Gzip** for JSON/JS/CSS responses
- **Static asset caching** (24h) for Stone Web Viewer WASM/JS/CSS

---

## Accessing the System

After deployment:

| URL | Purpose |
|-----|---------|
| `https://strokesvr.padimedical.com:9156` | PadiMedical web UI (React + OHIF/Stone) |
| `https://strokesvr.padimedical.com:8475` | Orthanc Explorer (DICOM browser) |
| `https://strokesvr.padimedical.com:8475/osimis-viewer/` | Osimis Web Viewer |
| `https://strokesvr.padimedical.com:8475/stone-webviewer/` | Stone Web Viewer |

Credentials (Orthanc): `REDACTED` / `REDACTED`

---

## Key Features

### 1. Automatic Institution Name Override
Every DICOM instance uploaded gets its `InstitutionName` set to **"PUTRA CNS"** and `OperatorsName` removed. Original `PatientName` and `PatientID` are preserved. Handled by `orthanc-pacs/modify.lua` → `OnStoredInstance`.

### 2. Non-Image Series Auto-Stripping
When a study stabilizes, the Lua script automatically removes non-diagnostic DICOM objects that would cause the Osimis viewer to show broken thumbnails or 500 errors:

| Removed SOP Class | Type |
|-------------------|------|
| `1.2.840.10008.5.1.4.1.1.11.*` | GSPS / Presentation States |
| `1.2.840.10008.5.1.4.1.1.66*` | Raw Data |
| `1.2.840.10008.5.1.4.1.1.88.*` | Structured Reports |
| `1.2.840.10008.5.1.4.1.1.481.*` | RT Objects (Dose, Structure Set, Plan) |
| `1.2.840.10008.5.1.4.1.1.104.*` | Encapsulated PDF/CDA |

These objects contain **no pixel data** — they are supplementary metadata/presentation states that are safe to remove.

### 3. Image Cache Pre-warming
Two layers of pre-warming ensure instant viewer loading:

1. **Lua-level** (`OnStableStudy`): Immediately calls Osimis viewer image endpoints to populate the Orthanc-side render cache
2. **Background daemon** (`prewarm.sh --watch`): Polls for new studies every 120s, requests images through the nginx proxy to warm the edge cache

Both layers skip non-image instances (respect `Rows`/`Columns` presence) and cap at 3 frames per multi-frame instance to avoid unnecessary load.

### 4. GDCM Transcoding
Restricts incoming transfer syntaxes to speed up rendering — only `1.2.840.10008.5.1.4.1.1.77.1.6` (JPEG Lossless SV1) is transcoded.

### 5. PostgreSQL-Backed Index
Orthanc uses PostgreSQL for its database index (configured via `ORTHANC__POSTGRESQL__*` env vars), not SQLite. Better performance for large study counts.

---

## Operations

### Starting / Stopping

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Rebuild and restart (after code changes)
docker compose up -d --build

# Restart just one service
docker compose restart orthanc
docker compose restart padipacs
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f orthanc
docker compose logs -f padipacs
docker compose logs -f prewarm

# Tail last 100 lines
docker compose logs --tail 100 orthanc
```

### Cleaning Up Non-Image Series (Manual)

For studies that were already stored before the Lua stripping was enabled:

```bash
# Preview (dry run)
DRY_RUN=true bash scripts/cleanup-nonimage.sh <study-uuid>

# Execute
bash scripts/cleanup-nonimage.sh <study-uuid>
```

### Pre-warming Specific Studies

```bash
# Warm a single study
docker exec prewarm-stroke5.1 /tmp/prewarm.sh <study-uuid>

# Warm all studies
docker exec prewarm-stroke5.1 /tmp/prewarm.sh --all

# Warm 5 most recent
docker exec prewarm-stroke5.1 /tmp/prewarm.sh --recent 5
```

### Database Access

```bash
# PostgreSQL (app DB)
docker exec -it postgres-stroke5.1 psql -U postgres -d padimedical

# PostgreSQL (Orthanc uses same instance, different tables/indexes)
docker exec -it postgres-stroke5.1 psql -U postgres -c "\l"
```

### Health Checks

```bash
# Check Orthanc system info
curl -u REDACTED:REDACTED http://localhost:8475/system

# Check PadiMedical API health
curl http://localhost:9156/api/health

# Check pre-warm daemon is running
docker logs --tail 5 prewarm-stroke5.1
```

---

## Scaling / Multi-Tenant Deployment

To deploy additional PACS stacks on the same server:

1. Copy the entire `PUTRACNS/` directory to a new location
2. Update these values in `docker-compose.yml`:
   - All container names (remove `-stroke5.1` suffix, use unique suffix)
   - All external ports (8475, 4371, 9156, 5490)
   - `DOMAIN_ADDRESS`, `ORTHANC__NAME`, `ORTHANC__DICOM__AET`
   - `PROXY_URL` in the prewarm service
   - PostgreSQL data volume path
3. Run `docker compose up -d --build`

---

## Backup & Restore

### What to back up

| Path | Content | Critical? |
|------|---------|-----------|
| `./ORTHANC/` | DICOM files (actual pixel data) | ✅ Yes |
| `./orthanc3/` | PadiMedical Orthanc tools DB | ✅ Yes |
| PostgreSQL data dir | App DB (users, reports, labels) | ✅ Yes |
| `./BackEnd/` | Source code | Nice to have |
| `./orthanc-pacs/` | Dockerfile + Lua scripts | Nice to have |

### Example backup script

```bash
#!/bin/bash
BACKUP_DIR="/backup/putracns-$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# DICOM data
tar -czf "$BACKUP_DIR/orthanc-db.tar.gz" ORTHANC/ orthanc3/

# PostgreSQL dump
docker exec postgres-stroke5.1 pg_dumpall -U postgres > "$BACKUP_DIR/postgres-all.sql"

# Configs
cp docker-compose.yml nginx/*.conf orthanc-pacs/modify.lua "$BACKUP_DIR/"
```

---

## Troubleshooting

### Osimis viewer shows 500 errors for certain series
**Cause:** Non-image DICOM objects (GSPS, Raw Data, SR) in the study.  
**Fix:** Run `bash scripts/cleanup-nonimage.sh <study-uuid>`. The Lua `OnStableStudy` handler now does this automatically for new studies.

### Viewer thumbnails load slowly
**Cause:** Cache not warmed for new studies.  
**Fix:** The prewarm daemon runs automatically. Check logs: `docker logs prewarm-stroke5.1`. Manually warm with `docker exec prewarm-stroke5.1 /tmp/prewarm.sh --all`.

### Orthanc can't connect to PostgreSQL
**Cause:** PostgreSQL not ready before Orthanc starts.  
**Fix:** `docker compose restart orthanc` (Orthanc retries up to 10 times with `MAXIMUM_CONNECTION_RETRIES: 10`).

### Build fails on OHIF/React
**Cause:** Memory limit during yarn build.  
**Fix:** Increase Docker memory or set `NODE_OPTIONS=--max-old-space-size=4096` in the Dockerfile.

### Port already in use
**Cause:** Another PACS stack using the same ports.  
**Fix:** Change port mappings in `docker-compose.yml` (see Scaling section).

---

## Stack Versions

| Component | Version |
|-----------|---------|
| Orthanc | 25.12.3-full |
| PostgreSQL | 13.1 |
| Redis | Alpine (latest) |
| Node.js (backend) | 20 |
| Node.js (frontend build) | 16.20.0 |
| Alpine (prewarm) | 3.20 |
| OHIF Viewer | Custom fork |
| Stone Web Viewer | WASM bundle |

---

## Related Documentation

- [Orthanc Configuration Reference](https://orthanc.uclouvain.be/book/configuration.html)
- [Osimis Web Viewer Plugin](https://orthanc.uclouvain.be/book/plugins/osimis-webviewer.html)
- [Stone Web Viewer](https://orthanc.uclouvain.be/book/plugins/stone-webviewer.html)
- [DICOM Conformance](https://orthanc.uclouvain.be/book/dicom-conformance.html)
- `docs/` directory — OHIF-specific patches and notes
