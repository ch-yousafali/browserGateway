#!/usr/bin/env python3
"""Connect to CloakBrowser THROUGH browser-gateway and verify end-to-end CDP routing."""
import json
from playwright.sync_api import sync_playwright

# Connect via the gateway — it auto-resolves /json/version and routes to CloakBrowser
GATEWAY_URL = "http://localhost:9500"

with sync_playwright() as pw:
    browser = pw.chromium.connect_over_cdp(GATEWAY_URL)
    ctx = browser.contexts[0]
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto("https://example.com", wait_until="domcontentloaded")
    title = page.title()
    ua = page.evaluate("navigator.userAgent")
    webdriver = page.evaluate("navigator.webdriver")
    print(json.dumps({
        "title": title,
        "user_agent": ua,
        "navigator_webdriver": webdriver,
        "url": page.url,
        "routed_via": "browser-gateway -> cloak-profile-01",
    }, indent=2))
    browser.close()
    print("Gateway CDP routing test PASSED")
