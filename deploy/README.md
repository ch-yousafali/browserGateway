# Railway deployment — Browser Gateway + standalone CloakBrowser

Deploys the complete Browser Gateway (with REST + HTTP/SSE MCP APIs and a
browser-launch endpoint) and one standalone CloakBrowser (no Hypeman) to
Railway. Both images are built and pushed **once**; Railway pulls them.

```
Client / MCP agent
    │  REST:  POST /v1/screenshot, /v1/content, /v1/scrape
    │  MCP:   POST /mcp  (Streamable HTTP / SSE)
    │  WS:    ws(s)://<gateway>/v1/connect
    │  Launch:POST /v1/browser/launch  -> registers CloakBrowser, returns CDP URL
    ▼
┌─────────────────────────────┐
│  Browser Gateway (Railway)  │  image: <registry>/browser-gateway:0.4.21-railway
│  REST + HTTP/SSE MCP + WS   │  BG_CLOAKBROWSER_CDP_URL -> cloakbrowser service
│  /v1/browser/launch         │
└──────────────┬──────────────┘
               │ CDP / WSS (routed, failover)
               ▼
┌─────────────────────────────┐
│  CloakBrowser (Railway)     │  image: <registry>/cloakbrowser:151-poc-v2-standalone
│  Chromium 151 (stealth)     │  Xvfb + socat, CDP on $PORT, /json/version
│  Persistent profile volume  │
└─────────────────────────────┘
```

## Files

| File | Purpose |
| --- | --- |
| `publish-images.sh` | Build & push both images once (gateway base+overlay, cloakbrowser) |
| `deploy-railway.sh` | Create the Railway project + two services, wire them, print URLs |
| `gateway/Dockerfile` | Overlay on the gateway base; seeds Railway `gateway.yml` into the volume |
| `gateway/railway-entrypoint.sh` | Seeds config, drops privileges, runs the gateway |
| `gateway/gateway.yml` | Env-interpolated config (no providers — launch endpoint registers one) |
| `gateway/railway.json` | Railway healthcheck (/health) |
| `cloakbrowser/Dockerfile` | Standalone CloakBrowser image (no Hypeman) |
| `cloakbrowser/entrypoint.sh` | Xvfb + socat + cloakbrowser, CDP on $PORT |
| `cloakbrowser/railway.json` | Railway healthcheck (/json/version) |

## What the gateway exposes

These all already exist in browser-gateway v0.4.21; the only addition is
`/v1/browser/launch`:

| Endpoint | Method | Description |
| --- | --- | --- |
| `/v1/browser/launch` | GET | Report CloakBrowser CDP liveness + gateway connect URL (read-only) |
| `/v1/browser/launch` | POST | Verify CloakBrowser is live, register it as the `cloakbrowser` provider, return the live CDP URL + gateway connect URL |
| `/mcp` | POST | MCP Streamable HTTP / SSE endpoint (navigate, snapshot, screenshot, interact, evaluate, ...) |
| `/v1/screenshot` | POST | Screenshot any URL |
| `/v1/content` | POST | Extract markdown / text / HTML |
| `/v1/scrape` | POST | Structured scrape via CSS selectors |
| `/v1/connect` | WS | CDP routing (Playwright `connectOverCDP`, Puppeteer `connect`) |
| `/v1/providers` | GET/POST | Provider CRUD |
| `/v1/status` | GET | Health + provider status |
| `/health` | GET | Health (public) |
| `/web` | GET | Dashboard |

### `/v1/browser/launch` resolution order

The CloakBrowser CDP URL is resolved, in order, from:
1. the request body `{"cdpUrl":"..."}`
2. the `BG_CLOAKBROWSER_CDP_URL` env var
3. an already-registered provider named `cloakbrowser` (override id with `BG_LAUNCH_PROVIDER_ID`)

On Railway, `BG_CLOAKBROWSER_CDP_URL` is set to the cloakbrowser service's
public domain via Railway cross-service interpolation, so a plain
`POST /v1/browser/launch` (no body) is all you need.

Response:
```json
{
  "ok": true,
  "providerId": "cloakbrowser",
  "registered": true,
  "cdpUrl": "https://cloakbrowser-xxx.up.railway.app",
  "browser": null,
  "gatewayConnectUrl": "wss://gateway-xxx.up.railway.app/v1/connect",
  "gatewayHttpUrl": "https://gateway-xxx.up.railway.app",
  "profile": null
}
```

## Steps

### 1. Publish both images (one time)

```bash
# Log in to your registry (ghcr.io example):
echo "$GITHUB_TOKEN" | docker login ghcr.io -u <github-user> --password-stdin

# Build & push:
NAMESPACE=<your-org> ./deploy/publish-images.sh
```

This produces:
- `<registry>/<namespace>/browser-gateway:0.4.21-railway`
- `<registry>/<namespace>/cloakbrowser:151-poc-v2-standalone`

### 2. Deploy to Railway

```bash
npm i -g @railway/cli
railway login

GATEWAY_IMAGE=ghcr.io/<your-org>/browser-gateway:0.4.21-railway \
CLOAK_IMAGE=ghcr.io/<your-org>/cloakbrowser:151-poc-v2-standalone \
./deploy/deploy-railway.sh
```

This creates the `cloakbrowser` and `gateway` services, mounts volumes,
gives each a public domain, and wires `BG_CLOAKBROWSER_CDP_URL` on the
gateway to the cloakbrowser's public domain.

### 3. Launch the browser and drive it

```bash
GW=https://<gateway-domain>
TOKEN=<BG_TOKEN from deploy output>

# Launch (registers CloakBrowser, returns live CDP URL):
curl -X POST "$GW/v1/browser/launch" -H "Authorization: Bearer $TOKEN"

# Drive via Playwright:
python3 -c "from playwright.sync_api import sync_playwright as p;
import sys
with p() as pw:
    b=pw.chromium.connect_over_cdp('$GW?token=$TOKEN')
    pg=b.contexts[0].pages[0]; pg.goto('https://example.com'); print(pg.title()); b.close()"

# MCP (HTTP/SSE) — point any MCP client at:
#   URL: $GW/mcp   Header: Authorization: Bearer $TOKEN
```

## Notes / caveats

- **CloakBrowser base image is private** (`docker.io/library/cloakbrowser:151-poc-v2`).
  `publish-images.sh` must run where that image is already pulled / accessible.
- **Single instance**: this deploys exactly one CloakBrowser (one browser slot).
  It is not a fleet. For more, replicate the cloakbrowser service and add more
  providers (or keep using Hypeman on your own hardware).
- **Profiles**: enabled, encrypted at rest with `BG_ENCRYPTION_KEY`. The
  gateway's `/data` volume and the cloakbrowser's `/home/clawbrowser/profile`
  volume must both be persistent for state to survive redeploys.
- **Auth**: set `BG_TOKEN`. Without it the gateway is open. The `/v1/*` and
  `/mcp` endpoints require the token (Bearer header or `?token=`).
- **Cross-service interpolation**: `deploy-railway.sh` sets
  `BG_CLOAKBROWSER_CDP_URL=https://${{cloakbrowser.RAILWAY_PUBLIC_DOMAIN}}`.
  If your Railway CLI version doesn't expand this, generate the cloakbrowser
  domain (`railway domain --service cloakbrowser`) and paste it in manually.
