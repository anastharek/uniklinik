# GitHub Actions Setup — Cloud Build Workflow

This is the **permanent fix**: the heavy frontend base image is built in
GitHub's cloud (14 GB RAM, free), pushed to Docker Hub. The Mac mini only
**pulls** it — no more webpack/Terser, no more OOM risk.

```
┌─────────────────────────────────────────────────────────────────┐
│  GitHub Actions (cloud, 14 GB RAM)                              │
│    React + OHIF + Stone  →  anastharek/pcns-frontend-base:v9    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ push to Docker Hub
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Mac mini (16 GB, PACS running)                                 │
│    docker pull  →  build-thin.sh  →  anastharek/pcns:fastpacs   │
│    ~2 min, <500 MB RAM, zero OOM risk                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 One-time setup (10 minutes)

### Step 1 — Create a Docker Hub Access Token

You already have `docker login` working, but GitHub Actions needs a **token**.

1. Go to **https://hub.docker.com/settings/security**
2. Click **New Access Token**
3. Name: `github-actions`
4. Permissions: **Read & Write**
5. **Copy the token** (shown only once)

### Step 2 — Add secrets to the GitHub repo

1. Go to **https://github.com/anastharek/fastpacs/settings/secrets/actions**
2. Click **New repository secret** — add TWO:

| Name | Value |
|---|---|
| `DOCKERHUB_USERNAME` | `anastharek` |
| `DOCKERHUB_TOKEN` | *(the token from Step 1)* |

### Step 3 — Copy the workflow into the repo

The workflow file lives here in the stage-build folder:

```
.github/workflows/build-frontend-base.yml
```

It must be committed to the **`fastpacs`** repo. (See "Pushing" below.)

### Step 4 — Run it

1. Go to **https://github.com/anastharek/fastpacs/actions**
2. Click **"Build Frontend Base Image"** (left sidebar)
3. Click **"Run workflow"** → version: `v9` → **Run**
4. Watch it build (~10 min)
5. When done → `anastharek/pcns-frontend-base:v9` is on Docker Hub ✅

### Step 5 — On the Mac mini, run the thin build

```bash
cd "FASTPACS-stage-build"
./scripts/build-thin.sh v9 fastpacs
```

Done. Fast, light, safe.

---

## 📤 Pushing this to GitHub

The `FASTPACS-stage-build` folder is a git repo (it's a copy of `FASTPACS`,
which has the `fastpac` remote). To get the workflow onto GitHub:

```bash
cd "FASTPACS-stage-build"

# Commit the new files
git add -A
git commit -m "feat: pre-built frontend strategy + GitHub Actions cloud build"

# Push to the fastpacs repo (some branch, e.g. feature/prebuilt-images)
git push fastpac HEAD:feature/prebuilt-images
```

Then open a PR on GitHub → merge → the workflow is active.

> ⚠️ If the push fails with `did not receive expected object`, the repo is
> shallow. Fix: `git fetch --unshallow fastpac`

---

## 🔄 The new workflow (after setup)

| You changed... | What happens | Cost |
|---|---|---|
| **BackEnd only** | Nothing auto; just `./scripts/build-thin.sh` locally | ~2 min, safe ✅ |
| **FrontEnd / OHIF** | Push → Actions builds base → pull → thin build | ~12 min total, cloud ✅ |
| **Dockerfile / compose** | `./scripts/build-thin.sh` locally | ~2 min, safe ✅ |

**~80% of builds become the fast local kind. The heavy kind runs in the cloud.**

---

## 💰 Cost

- **Public repo:** GitHub Actions is **free** (unlimited minutes)
- **Private repo:** **2,000 free minutes/month** — an OHIF build is ~10 min,
  so ~200 builds/month free

You're on public (`github.com/anastharek/fastpacs`), so it's **free**.

---

## 🆚 Alternatives

| Option | Free | Notes |
|---|---|---|
| **GitHub Actions** | ✅ (public) | What we're doing |
| **GHCR instead of Docker Hub** | ✅ | Use `ghcr.io`, needs `GITHUB_TOKEN` |
| Local registry on Mac mini | ✅ | No cloud, but no offload either |
| Build on laptop | ✅ | You don't have one |

---

## ✅ Why this is the right fix

- The Mac mini **physically cannot** run Terser in a 6.8 GB VM (proven twice tonight).
- GitHub's runners have **14 GB** and are free.
- The Mac mini's build becomes a **pull + assemble** — no memory spike, ever.
- It's **automatic** — push frontend changes, the image rebuilds itself.
