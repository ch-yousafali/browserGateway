# Browser Gateway overlay image for Railway.
#
# Built in two stages by ../publish-images.sh:
#   1. BASE is built from the browser-gateway source (browser-gateway/Dockerfile),
#      which bakes in our /v1/browser/launch endpoint.
#   2. This overlay adds the Railway gateway.yml + an entrypoint that seeds it
#      into the writable volume on first boot, then drops privileges and runs
#      the gateway.
#
# Build arg:
#   GATEWAY_BASE — the tagged base image produced by stage 1
#      (e.g. ghcr.io/yourorg/browser-gateway:0.4.21-railway-base)
ARG GATEWAY_BASE=ghcr.io/browser-gateway/server:latest
FROM ${GATEWAY_BASE}

# Railway config (env-interpolated, no providers — launch endpoint registers
# the standalone CloakBrowser from BG_CLOAKBROWSER_CDP_URL).
COPY gateway.yml /app/gateway.railway.yml

# Entrypoint that seeds the config into BG_DATA_DIR and drops privileges.
COPY railway-entrypoint.sh /usr/local/bin/bg-railway-entrypoint
RUN chmod +x /usr/local/bin/bg-railway-entrypoint

ENV BG_DATA_DIR=/data
EXPOSE 9500

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/bg-railway-entrypoint"]
CMD ["serve"]
