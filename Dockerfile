# =============================================================================
# PUTRACNS — THIN runtime image (uses pre-built frontend base)
# =============================================================================
# Purpose:
#   This is the FAST build. It only assembles the runtime image by copying
#   the already-built frontend artifacts FROM the pre-built base image.
#   No webpack. No Terser. No 4 GB Node heap. ~1-2 min, <500 MB RAM.
#
# Build (on the Mac mini — the normal, frequent build):
#   DOCKER_BUILDKIT=1 docker build \
#     --build-arg FRONTEND_BASE=anastharek/pcns-frontend-base:v9 \
#     -t anastharek/pcns:fastpacs \
#     .
#
# NOTE: BuildKit must be able to resolve the base image tag. Pull it first to
#       be safe:  docker pull anastharek/pcns-frontend-base:v9
#
# Fallback: the original all-in-one Dockerfile is preserved as Dockerfile.full
# =============================================================================

ARG FRONTEND_BASE=anastharek/pcns-frontend-base-uniklinik:v9
FROM ${FRONTEND_BASE} AS frontend-base

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

# ── Gather frontend artifacts from the PRE-BUILT base image (no rebuild!) ──
RUN mkdir -p build
COPY --from=frontend-base /artifacts/build          ./build/
COPY --from=frontend-base /artifacts/viewer-ohif    ./build/viewer-ohif/
COPY --from=frontend-base /artifacts/viewer-stone   ./build/viewer-stone/

EXPOSE 4000

ENV OrthancAddress=http://localhost
ENV OrthancPort=8042
ENV OrthancUsername=orthanc
ENV OrthancPassword=orthanc

CMD ["yarn", "start"]
