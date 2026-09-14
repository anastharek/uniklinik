# FASTPACS — Pre-built Frontend Build Strategy

This folder is a **working copy** for the "pre-built image" refactor. The
original `FASTPACS` folder is untouched and remains the safe fallback.

## The problem

The original `Dockerfile` compiles the React app and the OHIF viewer on **every**
build. The OHIF stage uses `NODE_OPTIONS=--max-old-space-size=4096` (4 GB heap),
which — combined with webpack/Terser and buildkit overhead — ballooned the
Docker VM to ~12.8 GB of the 16 GB host and caused **OOM kills of live PACS
containers**.

## The fix: split the build

| Image | Built | Contains | Where |
|---|---|---|---|
| `anastharek/pcns-frontend-base:<v>` | **Rarely** (only when frontend source changes) | Compiled React + OHIF + Stone assets | Capable machine / idle Mac |
| `anastharek/pcns:<tag>` | **Often** (normal deploys) | Runtime (BackEnd + pulled artifacts) | **Mac mini** |

The Mac mini's build becomes a **pull + assemble**: no webpack, no Terser,
~1–2 min, <500 MB RAM.

## Files

| File | Purpose |
|---|---|
| `Dockerfile.frontend-base` | Builds + packages the heavy artifacts into a small image |
| `Dockerfile` | **New thin** runtime image (pulls the base) — the normal build |
| `Dockerfile.full` | **Original** all-in-one Dockerfile (fallback / reference) |
| `scripts/build-frontend-base.sh` | Build + push the heavy base (run rarely) |
| `scripts/build-thin.sh` | Build the thin runtime image (run often) |

## Workflow

### 1. Build & push the heavy base (rarely — only when FrontEnd/ or ohif/Viewers/ changes)

On a capable machine (your laptop, a cloud VM, or this Mac overnight):

```bash
cd "FASTPACS-stage-build"
./scripts/build-frontend-base.sh v9
```

This runs webpack/Terser once, pushes `anastharek/pcns-frontend-base:v9` to
Docker Hub.

### 2. Build the thin runtime image (the normal build, on the Mac mini)

```bash
cd "FASTPACS-stage-build"
./scripts/build-thin.sh v9 fastpacs
```

Pulls the base, assembles `anastharek/pcns:fastpacs` in ~1–2 min with almost
no memory pressure.

## Rollback

If anything looks wrong, the original build still works:

```bash
docker build -f Dockerfile.full -t anastharek/pcns:fastpacs-rollback .
```

The live `FASTPACS/` folder is also untouched — you can always build from there.

## ⚠️ Requirements

- **Docker Hub account** with push access to `anastharek/pcns-frontend-base`
  (`docker login` first).
- BuildKit enabled (`DOCKER_BUILDKIT=1`, default in Docker 23+).
- The base image must be **pulled** before the thin build (the script does this).

## Notes

- The base image holds **only static assets** (no node_modules, no source) — it's
  small (~50–100 MB).
- Docker Hub free tier: 200 pulls / 6h — plenty for this use.
- Consider GitHub Container Registry (`ghcr.io`) if you want private + unlimited.
