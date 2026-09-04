#!/bin/bash
# Standalone CloakBrowser entrypoint — no Hypeman.
#
# Runs a single CloakBrowser (Chromium 151, stealth) with a virtual X server
# and a TCP forwarder that exposes CDP on $PORT (Railway injects PORT;
# defaults to 9223 for local/docker run). /json/version is served on the same
# port, which is what the Browser Gateway probes and what Railway healthchecks.
set -e

export DISPLAY=:99
export HOME=/home/clawbrowser

# 1. Virtual framebuffer (CloakBrowser is a headed Chromium build).
Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp -noreset +extension RANDR &
for i in $(seq 1 40); do [ -S /tmp/.X11-unix/X99 ] && break; sleep 0.25; done

# 2. Forward the public port -> the browser's loopback CDP port.
#    Railway sets PORT; socat must bind 0.0.0.0 so the platform proxy can reach it.
PUBLIC_PORT="${PORT:-9223}"
socat TCP-LISTEN:${PUBLIC_PORT},bind=0.0.0.0,reuseaddr,fork TCP:127.0.0.1:9222 &

# 3. Launch CloakBrowser with CDP on 127.0.0.1:9222.
#    --remote-allow-origins=* lets the Browser Gateway (and the dashboard
#    playground) drive it from a different origin.
exec /opt/clawbrowser/clawbrowser.real \
  --no-sandbox \
  --no-first-run \
  --no-default-browser-check \
  --disable-dev-shm-usage \
  --remote-debugging-port=9222 \
  --remote-debugging-address=127.0.0.1 \
  --remote-allow-origins=* \
  --user-data-dir=/home/clawbrowser/profile \
  --window-size=1920,1080 \
  about:blank
