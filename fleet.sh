#!/usr/bin/env bash
#
# fleet.sh — Manage the BrowserFleet stack (Hypeman + Browser Gateway)
#
# Usage:
#   ./fleet.sh start         Start everything (Hypeman deployments + Browser Gateway)
#   ./fleet.sh stop          Stop everything
#   ./fleet.sh restart       Restart everything
#   ./fleet.sh status        Show status of all components
#   ./fleet.sh start-gateway Start only Browser Gateway
#   ./fleet.sh stop-gateway  Stop only Browser Gateway
#   ./fleet.sh restart-gateway  Restart only Browser Gateway
#   ./fleet.sh start-hypeman Start only Hypeman deployments
#   ./fleet.sh stop-hypeman  Stop only Hypeman deployments
#   ./fleet.sh restart-hypeman  Restart only Hypeman deployments
#   ./fleet.sh teardown      Full teardown (deletes instances, volumes, data)
#   ./fleet.sh add-profile NN  Create a new profile (delegates to add-profile.sh)
#
set -euo pipefail
cd "$(dirname "$0")"

PROJECT_DIR="$(pwd)"
COMPOSE_FILE="hypeman.compose.yaml"
GATEWAY_FILE="gateway.yml"
GATEWAY_DATA_DIR="${PROJECT_DIR}/.bg-data"
GATEWAY_PID_FILE="${PROJECT_DIR}/.bg-data/gateway.pid"
GATEWAY_REPO="${PROJECT_DIR}/browser-gateway"
GATEWAY_BIN="node ${GATEWAY_REPO}/dist/server/index.js"

# ── Helpers ───────────────────────────────────────────────────

start_gateway() {
  if lsof -ti tcp:9500 >/dev/null 2>&1; then
    echo "Browser Gateway is already running on port 9500"
    return 0
  fi
  echo ">>> Starting Browser Gateway (from source: browser-gateway/)..."
  mkdir -p "$GATEWAY_DATA_DIR"
  BG_DATA_DIR="$GATEWAY_DATA_DIR" nohup $GATEWAY_BIN serve --config "$GATEWAY_FILE" \
    > "${GATEWAY_DATA_DIR}/gateway.log" 2>&1 &
  GATEWAY_PID=$!
  echo "$GATEWAY_PID" > "$GATEWAY_PID_FILE"
  sleep 5
  if lsof -ti tcp:9500 >/dev/null 2>&1; then
    echo "    Gateway running on http://localhost:9500 (PID ${GATEWAY_PID})"
    echo "    Dashboard: http://localhost:9500/web"
  else
    echo "ERROR: Gateway failed to start. Check ${GATEWAY_DATA_DIR}/gateway.log"
    cat "${GATEWAY_DATA_DIR}/gateway.log" 2>/dev/null | tail -20
    exit 1
  fi
}

stop_gateway() {
  PID=$(lsof -ti tcp:9500 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo ">>> Stopping Browser Gateway (PID ${PID})..."
    kill "$PID" 2>/dev/null || true
    sleep 2
    kill -9 "$PID" 2>/dev/null || true
    echo "    Stopped."
  else
    echo "    Browser Gateway was not running"
  fi
  rm -f "$GATEWAY_PID_FILE" 2>/dev/null || true
}

start_hypeman() {
  echo ">>> Starting Hypeman deployments..."
  hypeman compose up --wait --wait-timeout 120s
  echo "    Hypeman deployments running"
}

stop_hypeman() {
  echo ">>> Stopping Hypeman deployments..."
  # Stop all instances in the compose project
  INSTANCES=$(hypeman ps -a --format json 2>/dev/null | jq -r '.[].name // empty' | grep 'cloakbrowser-fleet' || true)
  if [ -n "$INSTANCES" ]; then
    echo "$INSTANCES" | while read -r name; do
      echo "    Stopping ${name}..."
      hypeman stop "$name" 2>/dev/null || true
    done
  else
    echo "    No running instances found"
  fi
}

restart_hypeman() {
  stop_hypeman
  start_hypeman
}

show_status() {
  echo "════════════════════════════════════════════════════════════"
  echo "  BrowserFleet Status"
  echo "════════════════════════════════════════════════════════════"
  echo ""
  echo "── Hypeman Instances ──"
  hypeman ps -a 2>/dev/null || echo "  (hypeman not available)"
  echo ""

  echo "── Browser Gateway ──"
  if lsof -ti tcp:9500 >/dev/null 2>&1; then
    echo "  Status:  running (port 9500)"
    echo "  URL:     http://localhost:9500"
    echo "  Dashboard: http://localhost:9500/web"
  else
    echo "  Status:  stopped"
  fi
  echo ""

  echo "── CDP Endpoints ──"
  curl -sf --max-time 3 http://localhost:9500/v1/status 2>/dev/null | jq -r '.providers[] | "  \(.id): \(.healthy) → \(.active)/\(.maxConcurrent) active"' 2>/dev/null || echo "  (gateway not running)"
  echo ""

  echo "── Direct CloakBrowser CDP ──"
  for port in 9301 9302 9303 9304 9305; do
    if curl -sf --max-time 2 "http://localhost:${port}/json/version" >/dev/null 2>&1; then
      echo "  localhost:${port} → UP"
    fi
  done
  echo "════════════════════════════════════════════════════════════"
}

# ── Main ──────────────────────────────────────────────────────

case "${1:-status}" in
  start)
    start_hypeman
    start_gateway
    ;;
  stop)
    stop_gateway
    stop_hypeman
    ;;
  restart)
    stop_gateway
    stop_hypeman
    sleep 2
    start_hypeman
    start_gateway
    ;;
  start-gateway)
    start_gateway
    ;;
  stop-gateway)
    stop_gateway
    ;;
  restart-gateway)
    stop_gateway
    sleep 1
    start_gateway
    ;;
  start-hypeman)
    start_hypeman
    ;;
  stop-hypeman)
    stop_hypeman
    ;;
  restart-hypeman)
    restart_hypeman
    ;;
  status)
    show_status
    ;;
  teardown)
    echo "WARNING: This will delete ALL instances, volumes, and gateway data."
    echo "         This cannot be undone."
    read -rp "Type 'yes' to confirm: " confirm
    if [ "$confirm" = "yes" ]; then
      stop_gateway
      hypeman compose down --volumes
      rm -rf "$GATEWAY_DATA_DIR"
      echo ">>> Teardown complete. All data deleted."
    else
      echo "Aborted."
    fi
    ;;
  add-profile)
    shift
    ./add-profile.sh "$@"
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|start-gateway|stop-gateway|restart-gateway|start-hypeman|stop-hypeman|restart-hypeman|teardown|add-profile NN}"
    exit 1
    ;;
esac
