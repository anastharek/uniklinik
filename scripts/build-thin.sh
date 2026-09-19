#!/usr/bin/env bash
# =============================================================================
# build-thin.sh — build the THIN runtime image (run OFTEN, on the Mac mini)
# =============================================================================
# This is the fast, light build. It pulls the pre-built frontend base and
# assembles the runtime image. No webpack, no Terser, no memory spike.
#
# Usage:
#   ./scripts/build-thin.sh [base-version] [tag]
#   ./scripts/build-thin.sh v9 uniklinik
#
set -euo pipefail

BASE_VERSION="${1:-v9}"
TAG="${2:-uniklinik}"
BASE_IMAGE="anastharek/pcns-frontend-base-uniklinik:${BASE_VERSION}"
OUT_IMAGE="anastharek/pcns:${TAG}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"

echo "=============================================="
echo " THIN build"
echo "   base : $BASE_IMAGE"
echo "   out  : $OUT_IMAGE"
echo "=============================================="

# Pull the pre-built base so the COPY --from works reliably with BuildKit.
echo "Pulling pre-built frontend base..."
docker pull "$BASE_IMAGE"

echo
echo "Building thin runtime image..."
DOCKER_BUILDKIT=1 docker build \
  --build-arg FRONTEND_BASE="$BASE_IMAGE" \
  -t "$OUT_IMAGE" \
  .

echo
echo "✅ Built $OUT_IMAGE"
docker images "$OUT_IMAGE" --format '  {{.Repository}}:{{.Tag}}  {{.Size}}  (created {{.CreatedSince}})'
