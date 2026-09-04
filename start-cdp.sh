#!/bin/bash
set -e

# Start Xvfb for headed mode
Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp -noreset +extension RANDR &
XVFB_PID=$!

# Wait for X server
for i in $(seq 1 40); do
  [ -S /tmp/.X11-unix/X99 ] && break
  sleep 0.25
done

# Forward CDP from 127.0.0.1:9222 to 0.0.0.0:9223
socat TCP-LISTEN:9223,bind=0.0.0.0,reuseaddr,fork TCP:127.0.0.1:9222 &
SOCAT_PID=$!

# Start CloakBrowser with CDP on loopback (socat exposes it)
# --user-data-dir points to the persistent volume mount
export DISPLAY=:99
exec /opt/clawbrowser/clawbrowser.real \
  --no-sandbox \
  --no-first-run \
  --no-default-browser-check \
  --disable-dev-shm-usage \
  --remote-debugging-port=9222 \
  --remote-debugging-address=127.0.0.1 \
  --user-data-dir=/home/clawbrowser/profile \
  --window-size=1920,1080 \
  about:blank
