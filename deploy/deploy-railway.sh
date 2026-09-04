#!/usr/bin/env bash
# Deploy the Browser Gateway + one standalone CloakBrowser to Railway.
#
# Prereqs:
#   - Railway CLI installed:  npm i -g @railway/cli
#   - Logged in:              railway login
#   - Both images published:  ./publish-images.sh   (sets the two image URLs below)
#
# What this does:
#   1. Creates a Railway project (or links an existing one).
#   2. Adds the `cloakbrowser` service from the published standalone image,
#      mounts a persistent volume, and gives it a public domain.
#   3. Adds the `gateway` service from the published gateway image, mounts a
#      volume, and wires it to the CloakBrowser via Railway cross-service
#      variable interpolation: BG_CLOAKBROWSER_CDP_URL points at the
#      cloakbrowser service's public domain automatically.
#   4. Prints the gateway URL and the launch endpoint to call.
#
# Override via env:
#   GATEWAY_IMAGE  (must match publish-images.sh output)
#   CLOAK_IMAGE    (must match publish-images.sh output)
#   PROJECT_NAME   (default browserfleet)
#   BG_TOKEN       (default: a freshly generated random token)
#   BG_ENCRYPTION_KEY (default: a freshly generated random key)
set -euo pipefail

GATEWAY_IMAGE="${GATEWAY_IMAGE:?Set GATEWAY_IMAGE, e.g. ghcr.io/yourorg/browser-gateway:0.4.21-railway}"
CLOAK_IMAGE="${CLOAK_IMAGE:?Set CLOAK_IMAGE, e.g. ghcr.io/yourorg/cloakbrowser:151-poc-v2-standalone}"
PROJECT_NAME="${PROJECT_NAME:-browserfleet}"
BG_TOKEN="${BG_TOKEN:-$(openssl rand -base64 32)}"
BG_ENCRYPTION_KEY="${BG_ENCRYPTION_KEY:-$(openssl rand -base64 32)}"

echo "==> Creating / linking Railway project: ${PROJECT_NAME}"
# Non-interactive project creation. If a project is already linked, this is a no-op.
railway link || railway init --name "${PROJECT_NAME}"

echo "==> Adding cloakbrowser service (standalone image)"
railway add --image "${CLOAK_IMAGE}" --service cloakbrowser \
  --variables "HOME=/home/clawbrowser"

# Persistent browser profile data.
railway volume add --service cloakbrowser --mount-path /home/clawbrowser/profile || true

# Public domain so the gateway (and you) can reach CDP over https.
railway domain --service cloakbrowser || true

echo "==> Adding gateway service"
# NOTE: the CDP URL uses Railway cross-service interpolation ${{...}}.
# It MUST be single-quoted so bash doesn't try to expand it — Railway
# resolves it at deploy time.
railway add --image "${GATEWAY_IMAGE}" --service gateway \
  --variables "BG_DATA_DIR=/data" \
  --variables "BG_TOKEN=${BG_TOKEN}" \
  --variables "BG_ENCRYPTION_KEY=${BG_ENCRYPTION_KEY}" \
  --variables 'BG_CLOAKBROWSER_CDP_URL=https://${{cloakbrowser.RAILWAY_PUBLIC_DOMAIN}}' \
  --variables "BG_LAUNCH_PROVIDER_ID=cloakbrowser"

railway volume add --service gateway --mount-path /data || true
railway domain --service gateway || true

echo
echo "==> Done. Wait ~60s for both services to pass healthchecks."
echo
echo "Find your gateway public domain in the Railway dashboard (or: railway domain --service gateway)."
echo "  Gateway dashboard:  https://<gateway-domain>/web   (login with BG_TOKEN: ${BG_TOKEN})"
echo
echo "Launch a browser (registers CloakBrowser, returns live CDP URL):"
echo "  curl -X POST https://<gateway-domain>/v1/browser/launch -H 'Authorization: Bearer ${BG_TOKEN}'"
echo
echo "Then drive it through the gateway:"
echo "  playwright: chromium.connectOverCDP('https://<gateway-domain>?token=${BG_TOKEN}')"
echo "  MCP (HTTP/SSE): POST https://<gateway-domain>/mcp"
echo
echo "NOTE: BG_CLOAKBROWSER_CDP_URL uses Railway cross-service interpolation"
echo "\${{cloakbrowser.RAILWAY_PUBLIC_DOMAIN}} which Railway resolves at deploy time."
echo "If your CLI version doesn't expand it, run: railway domain --service cloakbrowser"
echo "and paste the result into BG_CLOAKBROWSER_CDP_URL on the gateway service, then redeploy."
