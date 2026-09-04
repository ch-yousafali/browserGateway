#!/usr/bin/env bash
#
# add-profile.sh — Spin up a new CloakBrowser VM in Hypeman and add it
# to Browser Gateway as a new provider.
#
# Usage:  ./add-profile.sh <NN>
#   NN = two-digit profile number, e.g. 02, 03, ...
#
# What it does:
#   1. Appends a new service + volume block to hypeman.compose.yaml
#   2. Runs `hypeman compose up --wait` to deploy it
#   3. Waits for the browser to boot and CDP to be ready
#   4. Gets the instance IP and prints the CDP URL
#   5. Appends the provider block to gateway.yml
#   6. Reminds you to restart Browser Gateway (or use fleet.sh restart)
#
set -euo pipefail

cd "$(dirname "$0")"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <NN>   (e.g. 02, 03, 04)"
  exit 1
fi

NN="$1"
SVC_NAME="cloak-profile-${NN}"
VOL_NAME="cloak-data-${NN}"
HOST_PORT=$((9300 + 10#$NN))   # 9302, 9303, ...
COMPOSE_FILE="hypeman.compose.yaml"
GATEWAY_FILE="gateway.yml"
IMAGE="docker.io/library/cloakbrowser:151-poc-v2"

# ── Check for duplicates ──────────────────────────────────────
if grep -q "  ${SVC_NAME}:" "$COMPOSE_FILE" 2>/dev/null; then
  echo "ERROR: Service '${SVC_NAME}' already exists in ${COMPOSE_FILE}"
  exit 1
fi

echo ">>> Creating profile ${NN}: ${SVC_NAME}"
echo "    Volume: ${VOL_NAME} (5GB, persistent)"
echo "    Host port: ${HOST_PORT}"
echo ""

# ── 1. Append service block to compose file ───────────────────
# Insert before the `volumes:` top-level key
SERVICE_BLOCK="
  ${SVC_NAME}:
    image: ${IMAGE}
    resources:
      vcpus: 2
      memory: 2GB
    env:
      HOME: /home/clawbrowser
    entrypoint:
      - bash
      - -c
      - |
        set -e
        Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp -noreset +extension RANDR &
        for i in \$(seq 1 40); do [ -S /tmp/.X11-unix/X99 ] && break; sleep 0.25; done
        socat TCP-LISTEN:9223,bind=0.0.0.0,reuseaddr,fork TCP:127.0.0.1:9222 &
        export DISPLAY=:99
        export HOME=/home/clawbrowser
        exec /opt/clawbrowser/clawbrowser.real \\
          --no-sandbox --no-first-run --no-default-browser-check \\
          --disable-dev-shm-usage \\
          --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 \\
          --remote-allow-origins=* \\
          --user-data-dir=/home/clawbrowser/profile \\
          --window-size=1920,1080 about:blank
    volumes:
      - volume: ${VOL_NAME}
        mount_path: /home/clawbrowser/.config/clawbrowser
    healthcheck:
      type: http
      http:
        port: 9223
        path: /json/version
        scheme: http
        expected_status: 200
      interval: 10s
      timeout: 5s
      start_period: 40s
      failure_threshold: 5
    restart:
      policy: on_failure
      backoff: 5s
    ingress:
      - hostname: localhost
        host_port: ${HOST_PORT}
        target_port: 9223
"

VOLUME_BLOCK="
  ${VOL_NAME}:
    name: ${VOL_NAME}
    size_gb: 5
"

# Insert service block before the `volumes:` line
sed -i "/^volumes:/i\\${SERVICE_BLOCK}" "$COMPOSE_FILE"

# Append volume block after the last volume entry
# Find the last `  cloak-data-NN:` under volumes: and insert after its block
# Simpler: append before EOF if volumes section is at end
echo "${VOLUME_BLOCK}" >> "$COMPOSE_FILE"

echo ">>> Updated ${COMPOSE_FILE}"

# ── 2. Deploy via Hypeman ─────────────────────────────────────
echo ">>> Deploying ${SVC_NAME} via Hypeman..."
hypeman compose up --wait --wait-timeout 120s
echo ">>> Deployment complete"

# ── 3. Wait for CDP to be ready ───────────────────────────────
INSTANCE_NAME="cloakbrowser-fleet-${SVC_NAME}"
echo ">>> Waiting for browser to boot..."
INSTANCE_IP=""
for i in $(seq 1 40); do
  INSTANCE_IP=$(hypeman inspect "$INSTANCE_NAME" --format json 2>/dev/null | jq -r '.network.ip // empty')
  if [ -n "$INSTANCE_IP" ]; then
    if curl -sf --max-time 5 "http://${INSTANCE_IP}:9223/json/version" >/dev/null 2>&1; then
      break
    fi
  fi
  sleep 2
done

if [ -z "$INSTANCE_IP" ]; then
  echo "ERROR: Could not get instance IP for ${INSTANCE_NAME}"
  exit 1
fi

if ! curl -sf --max-time 5 "http://${INSTANCE_IP}:9223/json/version" >/dev/null 2>&1; then
  echo "ERROR: CDP not ready at http://${INSTANCE_IP}:9223 after 80s"
  echo "       Check: hypeman inspect ${INSTANCE_NAME}"
  exit 1
fi

CDP_URL="http://${INSTANCE_IP}:9223"
echo ">>> CDP is ready: ${CDP_URL}"

# ── 4. Add provider to gateway.yml ────────────────────────────
# Insert before the `dashboard:` line
PROVIDER_BLOCK="
  # Profile ${NN} → CloakBrowser VM ${NN}
  ${SVC_NAME}:
    url: ${CDP_URL}
    limits:
      maxConcurrent: 5
    priority: 1
"

sed -i "/^dashboard:/i\\${PROVIDER_BLOCK}" "$GATEWAY_FILE"
echo ">>> Updated ${GATEWAY_FILE} with provider ${SVC_NAME}"

# ── 5. Print summary ──────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Profile ${NN} created successfully"
echo "════════════════════════════════════════════════════════════"
echo "  Service:        ${SVC_NAME}"
echo "  Instance:       ${INSTANCE_NAME}"
echo "  Volume:         ${VOL_NAME} (persistent, 5GB)"
echo "  CDP URL:        ${CDP_URL}"
echo "  Host port:      localhost:${HOST_PORT}"
echo ""
echo "  To activate in Browser Gateway, restart it:"
echo "    ./fleet.sh restart-gateway"
echo ""
echo "  Or add the provider from the dashboard at:"
echo "    http://localhost:9500/web"
echo "════════════════════════════════════════════════════════════"
