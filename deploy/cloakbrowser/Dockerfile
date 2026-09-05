# Standalone CloakBrowser image — single instance, no Hypeman.
#
# Built once and published (see ../publish-images.sh). Railway pulls the
# published image; locally you can `docker run -p 9223:9223 <image>`.
#
# Base image already contains: CloakBrowser (Chromium 146, stealth),
# Xvfb, openbox, xdotool, and the Chrome binary under /root/.cloakbrowser/.
FROM ghcr.io/ch-yousafali/cloakbrowser:151-poc-v2

# Persistent profile data lives here. On Railway, mount a volume at this path
# so cookies/localStorage survive redeploys. Locally it is ephemeral.
ENV HOME=/root
RUN mkdir -p /home/clawbrowser/profile && \
    apt-get update && apt-get install -y --no-install-recommends socat && \
    rm -rf /var/lib/apt/lists/*

# Drop in our standalone entrypoint (the base image's default entrypoint
# assumes Hypeman-style orchestration; this one is self-contained).
COPY entrypoint.sh /opt/clawbrowser/entrypoint.sh
RUN chmod +x /opt/clawbrowser/entrypoint.sh

# Railway injects PORT and proxies to it. Locally, the entrypoint defaults to
# 9223. Expose for documentation; the actual port is $PORT at runtime.
EXPOSE 9223

# CDP discovery endpoint. Railway performs its own HTTP healthcheck against
# /json/version (see railway.json); this Docker HEALTHCHECK is for local
# `docker run`. Uses bash /dev/tcp so it works without curl in the base image.
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD bash -c 'p="${PORT:-9223}"; exec 3<>/dev/tcp/127.0.0.1/$p && printf "GET /json/version HTTP/1.0\r\n\r\n" >&3 && head -n1 <&3 | grep -q 200' || exit 1

ENTRYPOINT ["/opt/clawbrowser/entrypoint.sh"]
