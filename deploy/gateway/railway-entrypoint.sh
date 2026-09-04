#!/bin/sh
# Railway entrypoint for the Browser Gateway overlay image.
#
# Wraps the base image's bg-entrypoint behavior (chown the data volume, drop
# privileges via gosu) and additionally seeds gateway.yml into the writable
# volume on first boot, so the config editor and provider writes persist.
set -e

DATA_DIR="${BG_DATA_DIR:-/data}"
SEED_CONFIG="/app/gateway.railway.yml"
mkdir -p "$DATA_DIR"

# Seed config into the volume on first boot only (don't clobber edits).
if [ ! -f "$DATA_DIR/gateway.yml" ] && [ -f "$SEED_CONFIG" ]; then
  cp "$SEED_CONFIG" "$DATA_DIR/gateway.yml"
fi

# Tell the gateway to read/write the volume copy explicitly.
export BG_CONFIG_PATH="$DATA_DIR/gateway.yml"

if [ "$(id -u)" = "0" ]; then
  chown -R bguser:bguser "$DATA_DIR" || true
  exec gosu bguser:bguser node /app/dist/server/index.js "$@"
fi

exec node /app/dist/server/index.js "$@"
