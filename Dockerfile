# =============================================================================
# PUTRACNS — Multi-stage Docker build (optimized)
# =============================================================================
# Requires: DOCKER_BUILDKIT=1 (enabled by default in Docker 23+)
#
# Build:  docker compose build --no-cache   (full rebuild)
#         docker compose build               (incremental, uses cache)
# =============================================================================

# ─── Shared base: Yarn config ────────────────────────────────────────────
FROM node:16.20.0 AS yarn-base
RUN yarn config set registry https://registry.npmjs.org \
 && yarn config set network-timeout 600000 \
 && yarn config set prefer-offline true \
 && yarn config set progress false


# ─── React Frontend build ────────────────────────────────────────────────
FROM yarn-base AS react
WORKDIR /app

# Layer 1: Dependencies (cached unless package.json/yarn.lock change)
COPY ./FrontEnd/package.json ./FrontEnd/yarn.lock* ./
RUN --mount=type=cache,target=/root/.yarn \
    yarn install --ignore-engines

# Layer 2: Source + build (only re-runs on source changes)
COPY ./FrontEnd .
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV GENERATE_SOURCEMAP=false
RUN npm run build


# ─── OHIF Viewer build ──────────────────────────────────────────────────
FROM yarn-base AS ohif
WORKDIR /ohif/Viewers
COPY ./ohif/Viewers .
RUN yarn install --network-timeout 600000 --frozen-lockfile \
 && npx lerna bootstrap \
 && PUBLIC_URL=/viewer-ohif/ NODE_OPTIONS=--max-old-space-size=4096 yarn run build


# ─── Stone Web Viewer assets ─────────────────────────────────────────────
FROM alpine:3.20 AS stone
RUN apk --no-cache add unzip
WORKDIR /tmp
COPY ["stone/wasm-binaries.zip", "."]
RUN mkdir -p /stone && unzip -q wasm-binaries.zip -d /stone


# ─── Final runtime image ─────────────────────────────────────────────────
FROM node:20 AS final
WORKDIR /OrthancToolsJs

RUN yarn config set registry https://registry.npmjs.org \
 && yarn config set network-timeout 600000 \
 && yarn config set prefer-offline true \
 && yarn config set progress false

# Layer 1: Production deps (cached unless package.json changes)
COPY ./BackEnd/package.json ./BackEnd/yarn.lock* ./
RUN --mount=type=cache,target=/root/.yarn \
    yarn install --production --non-interactive

# Layer 2: Application code
COPY ./BackEnd .

# Gather frontend artifacts from build stages
RUN mkdir -p build
COPY --from=react    /app/build                              ./build/
COPY --from=ohif     /ohif/Viewers/platform/viewer/dist      ./build/viewer-ohif/
COPY --from=stone    /stone/wasm-binaries/StoneWebViewer      ./build/viewer-stone/
COPY --from=react    /app/build/viewer-ohif/app-config.js     ./build/viewer-ohif/

EXPOSE 4000

ENV OrthancAddress=http://localhost
ENV OrthancPort=8042
ENV OrthancUsername=orthanc
ENV OrthancPassword=orthanc

CMD ["yarn", "start"]
