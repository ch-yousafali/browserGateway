#!/usr/bin/env bash
# Publish both Railway images ONE TIME:
#   1. browser-gateway (with the /v1/browser/launch endpoint) — overlay image
#   2. cloakbrowser (standalone, no Hypeman)
#
# Usage:
#   REGISTRY=ghcr.io NAMESPACE=yourorg ./publish-images.sh
#
# Prereqs:
#   - docker installed and logged in to your registry
#       (ghcr.io:  echo $GITHUB_TOKEN | docker login ghcr.io -u YOURUSER --password-stdin)
#   - This repo with browser-gateway/ built source present (it is, gitignored)
#
# Override defaults via env:
#   REGISTRY   (default ghcr.io)
#   NAMESPACE  (required — your GitHub user/org or Docker Hub namespace)
#   GATEWAY_TAG  (default 0.4.21-railway)
#   CLOAK_TAG    (default 151-poc-v2-standalone)
#   PUSH         (default 1; set PUSH=0 to build only, not push)
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

REGISTRY="${REGISTRY:-ghcr.io}"
NAMESPACE="${NAMESPACE:?Set NAMESPACE to your registry namespace, e.g. yourorg}"
GATEWAY_TAG="${GATEWAY_TAG:-0.4.21-railway}"
CLOAK_TAG="${CLOAK_TAG:-151-poc-v2-standalone}"
PUSH="${PUSH:-1}"

GATEWAY_BASE="${REGISTRY}/${NAMESPACE}/browser-gateway:${GATEWAY_TAG}-base"
GATEWAY_IMAGE="${REGISTRY}/${NAMESPACE}/browser-gateway:${GATEWAY_TAG}"
CLOAK_IMAGE="${REGISTRY}/${NAMESPACE}/cloakbrowser:${CLOAK_TAG}"

echo "==> Building gateway BASE from source (browser-gateway/Dockerfile)"
docker build \
  -t "${GATEWAY_BASE}" \
  -f browser-gateway/Dockerfile \
  browser-gateway/

echo "==> Building gateway Railway overlay (deploy/gateway/Dockerfile)"
docker build \
  --build-arg GATEWAY_BASE="${GATEWAY_BASE}" \
  -t "${GATEWAY_IMAGE}" \
  deploy/gateway/

echo "==> Building standalone CloakBrowser (deploy/cloakbrowser/Dockerfile)"
docker build \
  -t "${CLOAK_IMAGE}" \
  deploy/cloakbrowser/

if [ "${PUSH}" = "1" ]; then
  echo "==> Pushing images"
  docker push "${GATEWAY_BASE}"
  docker push "${GATEWAY_IMAGE}"
  docker push "${CLOAK_IMAGE}"
fi

cat <<EOF

Done. Published images:
  Gateway:      ${GATEWAY_IMAGE}
  CloakBrowser: ${CLOAK_IMAGE}

Next: edit deploy/deploy-railway.sh to reference these, then run it.
Or set these in deploy-railway.sh:
  GATEWAY_IMAGE=${GATEWAY_IMAGE}
  CLOAK_IMAGE=${CLOAK_IMAGE}
EOF
