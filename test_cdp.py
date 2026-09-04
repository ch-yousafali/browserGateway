#!/usr/bin/env python3
"""Connect to CloakBrowser via CDP and verify we can drive a page."""
import json
from playwright.sync_api import sync_playwright

CDP_URL = "http://localhost:9301"

with sync_playwright() as pw:
    browser = pw.chromium.connect_over_cdp(CDP_URL)
    # Use the existing context/page (the browser already has a page open)
    ctx = browser.contexts[0]
    page = ctx.pages[0]
    page.goto("https://reddit.com", wait_until="domcontentloaded")
    title = page.title()
    ua = page.evaluate("navigator.userAgent")
    webdriver = page.evaluate("navigator.webdriver")
    print(json.dumps({
        "title": title,
        "user_agent": ua,
        "navigator_webdriver": webdriver,
        "url": page.url,
    }, indent=2))
    # Disconnect (does NOT kill the remote browser)
    browser.close()
    print("CDP connection test PASSED")
