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

# Always seed config into the volume. This overwrites any stale config from
# a previous deployment (e.g. one with a bad port value). Provider edits made
# via the dashboard API are re-saved by the gateway at runtime, so they'll be
# re-applied on the next /v1/browser/launch call.
if [ -f "$SEED_CONFIG" ]; then
  cp "$SEED_CONFIG" "$DATA_DIR/gateway.yml"
fi

# Tell the gateway to read/write the volume copy explicitly.
export BG_CONFIG_PATH="$DATA_DIR/gateway.yml"

if [ "$(id -u)" = "0" ]; then
  chown -R bguser:bguser "$DATA_DIR" || true
  exec gosu bguser:bguser node /app/dist/server/index.js "$@"
fi

exec node /app/dist/server/index.js "$@"
