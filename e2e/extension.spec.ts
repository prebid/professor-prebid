import { test, expect, chromium } from '@playwright/test';
import path from 'path';
test.describe('Professor Prebid Extension', () => {
  let browserContext;
  let extensionId;
  test.beforeAll(async () => {
    const pathToExtension = path.join(__dirname, '../build');
    const userDataDir = path.join(__dirname, '../test-results/test_user_data_dir_' + Date.now());
    const isHeadless = process.env.HEADED !== 'true' && process.env.HEADLESS !== 'false';
    const args = [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`, '--no-sandbox', '--disable-web-security'];
    if (isHeadless) {
      args.push('--headless=new');
    }
    browserContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      bypassCSP: true,
      args,
    });
    // Wait for the extension to load (serviceworker)
    // Poll for service worker
    let retries = 10;
    let serviceWorker = null;
    while (retries > 0) {
      const workers = browserContext.serviceWorkers();
      if (workers.length > 0) {
        serviceWorker = workers[0];
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
      retries--;
    }
    if (!serviceWorker) {
      // Try waitForEvent as backup
      try {
        serviceWorker = await browserContext.waitForEvent('serviceworker', { timeout: 5000 });
      } catch (e) {}
    }
    if (!serviceWorker) {
      throw new Error('Service worker not found');
    }
    extensionId = serviceWorker.url().split('/')[2];
  });
  test.afterAll(async () => {
    if (browserContext) {
      await browserContext.close();
    }
  });
  test('injects content script and detects Prebid', async () => {
    const page = await browserContext.newPage();
    // Create a mock page that defines pbjs
    await page.route('https://example.com/mock-prebid', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head>
              <script>
                window.pbjs = window.pbjs || {};
                window.pbjs.que = window.pbjs.que || [];
                window.pbjs.que.push = function(...args) {
                    args.forEach(fn => {
                        if (typeof fn === 'function') {
                            try {
                                fn();
                            } catch (e) {
                                console.error('Error executing queued function:', e);
                            }
                        }
                    });
                    return Array.prototype.push.apply(this, args);
                };
                window.pbjs.que.forEach(fn => {
                    if (typeof fn === 'function') {
                         try {
                                fn();
                            } catch (e) {
                                console.error('Error executing queued function:', e);
                            }
                    }
                });
                window._pbjsGlobals = ['pbjs'];
                const listeners = {};
                const storedEvents = [];
                window.pbjs.onEvent = (event, handler) => {
                    if (!listeners[event]) listeners[event] = [];
                    listeners[event].push(handler);
                };
                window.triggerEvent = (event, data) => {
                    storedEvents.push({ eventType: event, args: data, elapsedTime: Date.now() });
                    if (listeners[event]) {
                        listeners[event].forEach(fn => fn(data));
                    }
                };
                window.listenerCount = (event) => {
                    return listeners[event] ? listeners[event].length : 0;
                };
                window.pbjs.getEvents = () => storedEvents;
                window.pbjs.getConfig = () => ({});
                window.pbjs.getUserIdsAsEids = () => [];
                window.pbjs.installedModules = [];
                window.pbjs.version = '1.0.0';
                window.pbjs.bidderSettings = {};
              </script>
            </head>
            <body>
              <h1>Mock Prebid Page</h1>
            </body>
          </html>
        `,
      });
    });
    page.on('console', (msg) => void 0);
    page.on('pageerror', (err) => void 0);
    await page.goto('https://example.com/mock-prebid');
    // Verify injected script runs by checking if it communicates or modifies DOM
    // For now, let's check if the generic content script logic fired by inspecting console logs or events
    // But better: check if the badge update logic would have been triggered in background.
    // We can verify this via the Service Worker.
    const serviceWorker = browserContext.serviceWorkers().find((sw) => sw.url().includes(extensionId));
    expect(serviceWorker).toBeTruthy();
    // Evaluate in Service Worker to check if tab data was stored
    // We need to wait a bit for message passing
    await page.waitForTimeout(1000);
    const tabId = page.mainFrame().page().context().pages().indexOf(page);
    // Wait, tabId in extension != index.
    // We can get the tabId from the page handle in some ways, or just query storage in SW.
    // Let's just check if ANY data is stored in storage
    const storageData = await serviceWorker.evaluate(async () => {
      return await chrome.storage.local.get(null);
    });
    // We expect *some* data if the content script detected prebid and sent a message
    // The previous logic sends POPUP_LOADED or detected events.
    // actually, `prebid.ts` detects `window._pbjsGlobals` and instantiates `Prebid`.
    // It sends "POPUP_LOADED" only when popup opens? No.
    // It sends details on specific events.
    // However, `addEventListenersForPrebid` runs immediately.
    // It creates `new Prebid()`.
    // That doesn't automatically send data unless an event happens.
    // But `detectPrebid` loops or uses defineProperty.
    // Check if content script injected the bundle
    const scriptTag = await page.$('#professor\\ prebid\\ injected\\ bundle');
    if (scriptTag) {
    } else {
    }
    // Listen for messages from injected script
    await page.evaluate(() => {
      window.addEventListener('message', (event) => {
        if (event.data && event.data.profPrebid) {
        }
      });
    });
    // Wait for the injected script to register listeners
    await page.waitForFunction(
      () => {
        // @ts-ignore
        return window.pbjs && window.listenerCount && window.listenerCount('auctionInit') > 0;
      },
      null,
      { timeout: 10000 }
    );
    // Trigger a prebid event in the page using our mock
    await page.evaluate(() => {
      // @ts-ignore
      window.triggerEvent('auctionInit', { auctionId: 'test-auction' });
    });
    // Wait for message passing and storage write
    await page.waitForTimeout(2000);
    // Check storage again
    const finalStorageData = await serviceWorker.evaluate(async () => {
      return await chrome.storage.local.get(null);
    });
    // Expect tab info to exist and contain data
    const tabInfoKeys = Object.keys(finalStorageData).filter((key) => key.startsWith('tab_info_'));
    expect(tabInfoKeys.length).toBeGreaterThan(0);
    // Also verify that the MCP bridge is available on page
    const isBridgeReady = await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent('PP_MCP_BRIDGE_ENABLE'));
      const win = window as any;
      return typeof win.__PROFESSOR_PREBID_MCP__ !== 'undefined' && win.__PROFESSOR_PREBID_MCP__.bridgeVersion === '1.0.0';
    });
    expect(isBridgeReady).toBe(true);
  });
});
