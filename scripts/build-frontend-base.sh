#!/usr/bin/env bash
# =============================================================================
# build-frontend-base.sh — build the HEAVY frontend base image (run RARELY)
# =============================================================================
# Run this on a capable machine (laptop / cloud / this Mac when idle/overnight).
# It compiles React + OHIF and packages the artifacts into a tiny image,
# then pushes it to the registry.
#
# Usage:
#   ./scripts/build-frontend-base.sh v10
#
set -euo pipefail

VERSION="${1:-latest}"
IMAGE="anastharek/pcns-frontend-base-uniklinik:${VERSION}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"

echo "=============================================="
echo " Building FRONTEND BASE image: $IMAGE"
echo " This is the HEAVY build (React + OHIF)."
echo "=============================================="

DOCKER_BUILDKIT=1 docker build \
  -f Dockerfile.frontend-base \
  -t "$IMAGE" \
  .

echo
echo "✅ Built $IMAGE"
echo
echo "Pushing to registry..."
docker push "$IMAGE"

echo
echo "✅ Pushed $IMAGE"
echo
echo "Now the thin build can use it:"
echo "  ./scripts/build-thin.sh $VERSION"
