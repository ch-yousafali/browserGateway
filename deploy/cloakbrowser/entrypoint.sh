#!/bin/bash
# Standalone CloakBrowser entrypoint — no Hypeman.
#
# Runs a single CloakBrowser (Chromium 146, stealth) with a virtual X server
# and a TCP forwarder (socat) that exposes CDP on $PORT (Railway injects PORT;
# defaults to 9223 for local/docker run). /json/version is served on the same
# port, which is what the Browser Gateway probes and what Railway healthchecks.
#
# Chrome's --remote-debugging-address=0.0.0.0 is ignored by this build (it
# always binds to 127.0.0.1), so we forward via socat.
set -e

export DISPLAY=:99
export HOME=/root

# 1. Clean up stale Xvfb locks (survives `docker restart` because /tmp is not
#    tmpfs in this image).
rm -f /tmp/.X99-lock /tmp/.X11-unix/X99

# 2. Virtual framebuffer (CloakBrowser is a headed Chromium build).
Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp -noreset +extension RANDR &
for i in $(seq 1 50); do
  DISPLAY=:99 xdotool getdisplaygeometry >/dev/null 2>&1 && break
  sleep 0.2
done

# 3. Window manager so --start-maximized is honored (bare Xvfb has no WM).
DISPLAY=:99 openbox &

# 4. Resolve the Chrome binary path (versioned directory under ~/.cloakbrowser).
CHROME_BIN=$(ls /root/.cloakbrowser/chromium-*/chrome 2>/dev/null | head -1)
if [ -z "$CHROME_BIN" ]; then
  echo "[cloakbrowser] Chrome binary not found in /root/.cloakbrowser/" >&2
  exit 1
fi

# 5. Forward the public port -> the browser's loopback CDP port.
#    Chrome binds CDP to 127.0.0.1:9222; socat exposes it on 0.0.0.0:$PORT.
PUBLIC_PORT="${PORT:-9223}"
socat TCP-LISTEN:${PUBLIC_PORT},bind=0.0.0.0,reuseaddr,fork TCP:127.0.0.1:9222 &

# 6. Launch Chrome with CDP on 127.0.0.1:9222.
#    --remote-allow-origins=* lets the Browser Gateway drive it from any origin.
exec "$CHROME_BIN" \
  --no-sandbox \
  --no-first-run \
  --no-default-browser-check \
  --disable-dev-shm-usage \
  --disable-gpu \
  --remote-debugging-port=9222 \
  --remote-debugging-address=127.0.0.1 \
  --remote-allow-origins=* \
  --user-data-dir=/home/clawbrowser/profile \
  --window-size=1920,1080 \
  about:blank
