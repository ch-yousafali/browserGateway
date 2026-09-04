# BrowserFleet — Browser Gateway + CloakBrowser + Hypeman

## Architecture

```
WEB BROWSER / CLIENT
    │
    ▼
┌────────────────────────┐
│   BROWSER GATEWAY      │  http://localhost:9500
│   v0.4.20              │  Dashboard: http://localhost:9500/web
│                        │  WS: ws://localhost:9500/v1/connect
│   Web Dashboard        │  MCP: POST http://localhost:9500/mcp
│   REST API             │  Profiles: enabled (AES-256-GCM encrypted)
│   MCP                  │
│   Profiles (encrypted) │
└───────────┬────────────┘
            │ CDP / WebSocket (per-profile routing + failover)
            │
            ▼
┌───────────────────────┐
│  CloakBrowser 151.x   │  Chrome/151.0.7922.109
│  Image: 151-poc-v2    │  navigator.webdriver: false (stealth)
│  CDP: http://<ip>:9223│  --remote-allow-origins=*
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  Hypeman v0.18.0      │  MicroVM orchestrator
│  Instance + Volume    │  Persistent browser data per profile
└───────────────────────┘

Profile 01 → Hypeman VM 01 → CloakBrowser → CDP URL 01 → Browser Gateway
Profile 02 → Hypeman VM 02 → CloakBrowser → CDP URL 02 → Browser Gateway
Profile 03 → Hypeman VM 03 → CloakBrowser → CDP URL 03 → Browser Gateway
```

## Component Versions

| Component | Version | Notes |
| --- | --- | --- |
| CloakBrowser | Chromium 151.0.7922.109 | Image: `docker.io/library/cloakbrowser:151-poc-v2` |
| Hypeman | 0.18.0 | MicroVM orchestrator CLI |
| Browser Gateway | 0.4.21 | Cloned from GitHub, built from source in `browser-gateway/` |
| Playwright | installed | For testing CDP connections |

## Files

| File | Purpose |
| --- | --- |
| `hypeman.compose.yaml` | Declarative config for CloakBrowser deployments in Hypeman |
| `gateway.yml` | Browser Gateway config — providers, routing, profiles |
| `fleet.sh` | Management script: start/stop/restart/status/teardown |
| `add-profile.sh` | Create a new isolated CloakBrowser profile + add to Gateway |
| `test_gateway.py` | End-to-end test: Playwright → Gateway → CloakBrowser |
| `test_cdp.py` | Direct CDP test (bypasses Gateway) |
| `browser-gateway/` | Cloned browser-gateway repo (built from source) — gitignored |
| `deploy/` | Railway deployment: standalone CloakBrowser + gateway images, configs, scripts (see `deploy/README.md`) |
| `Dockerfile` | Reference build file (not used; compose overrides entrypoint) |
| `.bg-data/` | Browser Gateway data (encryption key, profiles) — gitignored |
| `.gitignore` | Ignores `.bg-data/`, `browser-gateway/`, `*.png`, `__pycache__/` |

## Current Deployment (Profile 01)

| Field | Value |
| --- | --- |
| Compose name | `cloakbrowser-fleet` |
| Service name | `cloak-profile-01` |
| Instance name | `cloakbrowser-fleet-cloak-profile-01` |
| Volume name | `cloak-data-01` (5GB, persistent) |
| CloakBrowser image | `docker.io/library/cloakbrowser:151-poc-v2` |
| CDP URL (instance) | `http://10.100.105.96:9223` (changes on recreate) |
| CDP URL (localhost) | `http://localhost:9301` (ingress) |
| Browser Gateway URL | `http://localhost:9500` |
| Gateway Dashboard | `http://localhost:9500/web` |
| Gateway WS endpoint | `ws://localhost:9500/v1/connect` |
| Gateway data dir | `./.bg-data/` |
| Persistent browser data | Hypeman volume `cloak-data-01` → `/home/clawbrowser/.config/clawbrowser` |

> **Note**: The instance IP (`10.100.105.96`) changes when the instance is recreated.
> The localhost ingress port (9301) is stable. The gateway config uses the instance IP
> for direct access (recommended — see "Remote CDP Access" below). After recreate,
> update `gateway.yml` with the new IP and restart the gateway, or use `fleet.sh restart`.

## Commands

### Start everything

```bash
cd /home/ch-yousufali/Work/abdulRehman/browserFleet
./fleet.sh start
```

### Stop everything

```bash
./fleet.sh stop
```

### Restart everything

```bash
./fleet.sh restart
```

### Check status

```bash
./fleet.sh status
```

### Start / stop / restart individual components

```bash
./fleet.sh start-gateway        # Start only Browser Gateway
./fleet.sh stop-gateway         # Stop only Browser Gateway
./fleet.sh restart-gateway      # Restart only Browser Gateway
./fleet.sh start-hypeman        # Start only Hypeman deployments
./fleet.sh stop-hypeman         # Stop only Hypeman deployments
./fleet.sh restart-hypeman      # Restart only Hypeman deployments
```

### Create additional profiles

```bash
./fleet.sh add-profile 02      # Creates cloak-profile-02
./fleet.sh add-profile 03      # Creates cloak-profile-03
# ... etc.
```

This will:
1. Add a new service + volume to `hypeman.compose.yaml`
2. Deploy the new CloakBrowser VM via Hypeman
3. Wait for the browser to boot and CDP to be ready
4. Get the instance IP and print the CDP URL
5. Add the provider to `gateway.yml`
6. You then restart the gateway: `./fleet.sh restart-gateway`

### Full teardown (deletes everything including volumes)

```bash
./fleet.sh teardown
```

### Manual commands (without fleet.sh)

```bash
# Deploy CloakBrowser via Hypeman
hypeman compose up --wait --wait-timeout 120s

# Start Browser Gateway (from cloned source)
BG_DATA_DIR=./.bg-data node browser-gateway/dist/server/index.js serve --config gateway.yml &

# Stop Browser Gateway
kill $(lsof -ti tcp:9500)

# Stop Hypeman
hypeman stop cloakbrowser-fleet-cloak-profile-01

# Start Hypeman
hypeman start cloakbrowser-fleet-cloak-profile-01

# Full teardown
hypeman compose down --volumes
```

## Browser Gateway — Connecting

### Playwright (Python)

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as pw:
    # Without profile (stateless)
    browser = pw.chromium.connect_over_cdp("http://localhost:9500")
    page = browser.contexts[0].pages[0]
    page.goto("https://example.com")
    print(page.title())
    browser.close()  # Disconnects only; browser keeps running

    # With profile (persistent state — cookies, localStorage)
    browser = pw.chromium.connect_over_cdp("http://localhost:9500?profile=my-profile")
    # ... do work, log in, etc.
    browser.close()  # Gateway saves profile state on disconnect
```

### Puppeteer (JavaScript)

```js
const browser = await puppeteer.connect({
  browserWSEndpoint: "ws://localhost:9500/v1/connect",
});
```

### REST API

```bash
# Screenshot
curl -X POST http://localhost:9500/v1/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","format":"png"}' --output shot.png

# Content extraction
curl -X POST http://localhost:9500/v1/content \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","formats":["markdown"]}'
```

### Dashboard

Open `http://localhost:9500/web` in your browser:
- **Overview**: Active sessions, provider health, connection endpoint
- **Providers**: Add/edit/delete providers, test connectivity
- **Profiles**: Create, export, import, delete browser profiles
- **REST API**: Form-driven screenshot/content/scrape
- **Playground**: Drive any provider live from the browser
- **Config**: Edit `gateway.yml` in-browser with validation

## Browser Gateway — Profiles

Profiles are **enabled** in the current config. They persist browser state
(cookies, localStorage, IndexedDB) across sessions, encrypted at rest.

### How profiles work

1. Connect with `?profile=acme` → gateway loads saved state into the browser
2. Do your work (log in, browse, etc.)
3. Disconnect → gateway captures updated state, encrypts, saves to `.bg-data/profiles/`
4. Next connect with `?profile=acme` → already logged in

### Creating profiles

**From the dashboard** (recommended):
1. Open `http://localhost:9500/web/profiles/`
2. Click "+ New Profile" → get a connect URL with `?profile=<id>`

**Via REST API**:
```bash
curl http://localhost:9500/v1/profiles | jq          # List profiles
curl -X POST http://localhost:9500/v1/profiles/setup  # Enable (already done)
```

**Auto-create**: Just connect with `?profile=anything` — profile is saved on first disconnect.

### Profile isolation with CloakBrowser

CloakBrowser instances are **external CDP providers**. Each VM can serve **one profile**
with write-back. To serve N profiles, run N CloakBrowser VMs and pin each:

```yaml
# gateway.yml
providers:
  cloak-profile-01:
    url: http://<ip-01>:9223
    profile: account-acme     # pinned to this profile

  cloak-profile-02:
    url: http://<ip-02>:9223
    profile: account-bravo    # pinned to this profile
```

Or pin from the dashboard: Providers page → "Which profiles it serves" dropdown.

### Read-only mode (fan-out)

Once a profile is built, unlimited read-only sessions can use it across any provider:
```python
browser = pw.chromium.connect_over_cdp("http://localhost:9500?profile=acme&readOnly=1")
```

### Encryption key

The encryption key is auto-generated at `.bg-data/.encryption-key` (mode 0600).
**Do not lose this file** — all profiles become unreadable without it.

## Remote CDP Access (For Browser Gateway)

The Browser Gateway connects to CloakBrowser via the **direct instance IP** (recommended):

```bash
# Get the instance IP
hypeman inspect cloakbrowser-fleet-cloak-profile-01 --format json | jq -r .network.ip
# e.g. 10.100.105.96

# CDP is directly accessible at http://<ip>:9223
# The socat forwarder binds to 0.0.0.0:9223 inside the instance
# --remote-allow-origins=* is set in the compose entrypoint
```

The localhost ingress (`localhost:9301`) is an alternative access path but has
WebSocket limitations for remote clients. The gateway uses the instance IP.

## Persistence

### Browser data (Hypeman volume)
- Volume `cloak-data-01` → mounted at `/home/clawbrowser/.config/clawbrowser`
- Survives stop/start cycles
- Deleted only on `hypeman compose down --volumes` or `fleet.sh teardown`

### Gateway data (profiles, encryption key)
- `.bg-data/` directory in the project root
- Contains `.encryption-key` and `profiles/` subdirectory
- Survives gateway restarts
- Deleted only on `fleet.sh teardown`

## Resource Planning

Each CloakBrowser instance uses:
- 2 vCPUs, 2GB RAM (configurable in `hypeman.compose.yaml`)
- ~5GB disk volume (browser profile)
- 1 host port (CDP ingress: 9301, 9302, ...)

Current server: 4 physical CPUs (16 vCPU with oversub), 15GB RAM.
At 2 vCPUs / 2GB per instance: ~7 concurrent instances.
Reduce to 1 vCPU / 1GB for up to ~15 instances.

## What Was NOT Done (Per Requirements)

- Automatic profile provisioning: not built (manual via `add-profile.sh` or dashboard)
- CAPTCHA/Cloudflare/Reddit detection bypass: not implemented
- Vote manipulation: not implemented

## Railway Deployment (standalone, no Hypeman)

The `deploy/` directory deploys the complete Browser Gateway + **one**
standalone CloakBrowser to Railway. Both images are built and pushed once;
Railway pulls them. Full guide: [`deploy/README.md`](./deploy/README.md).

### Files

| File | Purpose |
| --- | --- |
| `deploy/publish-images.sh` | Build & push both images once (gateway base+overlay, cloakbrowser) |
| `deploy/deploy-railway.sh` | Create Railway project + two services, wire them, print URLs |
| `deploy/gateway/Dockerfile` | Gateway overlay (seeds Railway `gateway.yml`, drops privileges) |
| `deploy/gateway/gateway.yml` | Env-interpolated config (no providers — launch endpoint registers one) |
| `deploy/gateway/railway.json` | Gateway healthcheck (`/health`) |
| `deploy/cloakbrowser/Dockerfile` | Standalone CloakBrowser image (no Hypeman) |
| `deploy/cloakbrowser/entrypoint.sh` | Xvfb + socat + cloakbrowser, CDP on `$PORT` |
| `deploy/cloakbrowser/railway.json` | CloakBrowser healthcheck (`/json/version`) |

### Browser-launch endpoint (`/v1/browser/launch`)

Added to the gateway source (`browser-gateway/src/server/app.ts`, baked into
the published gateway image). Verifies a CloakBrowser is live over CDP,
registers it as the `cloakbrowser` provider, and returns the live CDP URL +
the gateway connect URL so the browser is drivable through the gateway.

- `GET /v1/browser/launch` — read-only liveness + connect URL.
- `POST /v1/browser/launch` — verify + register. Body: `{"cdpUrl":"...", "profile":"...", "maxConcurrent":N}` (all optional; `cdpUrl` falls back to `BG_CLOAKBROWSER_CDP_URL` env, then the existing `cloakbrowser` provider).
- Override the provider id with `BG_LAUNCH_PROVIDER_ID` (default `cloakbrowser`).

```bash
curl -X POST http://localhost:9500/v1/browser/launch \
  -H "Authorization: Bearer $BG_TOKEN"
# -> {"ok":true,"providerId":"cloakbrowser","registered":true,
#     "cdpUrl":"https://cloakbrowser-xxx.up.railway.app",
#     "gatewayConnectUrl":"wss://gateway-xxx.up.railway.app/v1/connect",...}
```

### Quick deploy

```bash
# 1. Publish images once (run where the private cloakbrowser base image is accessible)
NAMESPACE=<your-org> ./deploy/publish-images.sh

# 2. Deploy to Railway
GATEWAY_IMAGE=ghcr.io/<your-org>/browser-gateway:0.4.21-railway \
CLOAK_IMAGE=ghcr.io/<your-org>/cloakbrowser:151-poc-v2-standalone \
./deploy/deploy-railway.sh
```

The gateway already exposes REST (`/v1/screenshot`, `/v1/content`, `/v1/scrape`)
and HTTP/SSE MCP (`/mcp`, Streamable HTTP) — no changes needed for those; they
route to whatever provider the launch endpoint registered.
