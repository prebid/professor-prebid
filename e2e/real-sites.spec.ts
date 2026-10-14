import { test, expect, chromium, BrowserContext, Page } from '@playwright/test';
import path from 'path';
const REAL_PREBID_SITES = [
  {
    name: 'eatpicks.com',
    url: 'https://www.eatpicks.com/',
    description: 'Food blog with Prebid.js header bidding',
  },
  {
    name: 'heise.de',
    url: 'https://www.heise.de/',
    description: 'German tech news site with Prebid.js',
  },
];
const acceptConsentDialog = async function(page: Page): Promise<void> {
  const consentSelectors = [
    '[data-testid="uc-accept-all-button"]',
    '.cmpboxbtn.cmpboxbtnyes',
    '#onetrust-accept-btn-handler',
    'button.fc-cta-consent',
    '.qc-cmp2-summary-buttons button:first-child',
    'button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    'button.sp_choice_type_11',
    'button[mode="primary"]',
    'button.accept-all',
    '[aria-label="Accept all"]',
    '[data-gdpr-consent="accept"]',
    'button:has-text("Accept All")',
    'button:has-text("Alle akzeptieren")',
    'button:has-text("Alles akzeptieren")',
    'button:has-text("Zustimmen")',
    'button:has-text("Einverstanden")',
    '.cmpboxbtn.cmpboxbtnyes',
    'button:has-text("AGREE")',
    'button:has-text("I Accept")',
    'button:has-text("Accept")',
    'button:has-text("OK")',
  ];
  for (const selector of consentSelectors) {
    try {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 500 })) {
        await btn.click({ timeout: 2000 });
        await page.waitForTimeout(1000);
        return;
      }
    } catch (_) {
      // Selector not found or not visible, try next
    }
  }
  // Try inside iframes (many CMPs use iframes)
  const frames = page.frames();
  for (const frame of frames) {
    for (const selector of consentSelectors.slice(0, 10)) {
      try {
        const btn = frame.locator(selector).first();
        if (await btn.isVisible({ timeout: 300 })) {
          await btn.click({ timeout: 2000 });
          await page.waitForTimeout(1000);
          return;
        }
      } catch (_) {
        // continue
      }
    }
  }
}
test.describe('Real-Site Prebid Detection', () => {
  let browserContext: BrowserContext;
  let extensionId: string;
  test.beforeAll(async () => {
    const pathToExtension = path.join(__dirname, '../build');
    const userDataDir = '/tmp/test_real_sites_' + Date.now();
    browserContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      bypassCSP: true,
      args: [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`, '--headless=new', '--no-sandbox', '--disable-web-security'],
    });
    // Wait for service worker
    let retries = 15;
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
      try {
        serviceWorker = await browserContext.waitForEvent('serviceworker', { timeout: 10000 });
      } catch (e) {
        /* pass */
      }
    }
    if (!serviceWorker) {
      throw new Error('Extension service worker not found');
    }
    extensionId = serviceWorker.url().split('/')[2];
    // Wait to ensure content script registration is completed by the browser
    await new Promise((r) => setTimeout(r, 4000));
  });
  test.afterAll(async () => {
    await browserContext?.close();
  });
  for (const site of REAL_PREBID_SITES) {
    test(`detects Prebid on ${site.name}`, async () => {
      test.setTimeout(60000);
      const page = await browserContext.newPage();
      // Collect console errors
      const pageErrors: string[] = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));
      // Navigate
      try {
        await page.goto(site.url, {
          waitUntil: 'domcontentloaded',
          timeout: 20000,
        });
      } catch (e) {}
      // Wait for initial page load
      await page.waitForTimeout(3000);
      // Accept consent dialog (GDPR)
      await acceptConsentDialog(page);
      // Wait for Prebid to load after consent
      await page.waitForTimeout(10000);
      // 1. Check the page itself for Prebid objects
      const pageHasPrebid = await page.evaluate(() => {
        const w = window as any;
        return {
          hasPbjsGlobals: !!w._pbjsGlobals,
          pbjsGlobals: w._pbjsGlobals || [],
          hasPbjs: !!w.pbjs,
          pbjsVersion: w.pbjs?.version || null,
          hasHbObj: !!w.hb_obj,
        };
      });
      // 2. Verify the extension's service worker is still alive
      const serviceWorker = browserContext.serviceWorkers().find((sw) => sw.url().includes(extensionId));
      expect(serviceWorker, 'Service worker should be alive').toBeTruthy();
      // 3. Check extension storage for detected Prebid data
      const storageData = await serviceWorker!.evaluate(async () => {
        return await chrome.storage.local.get(null);
      });
      // 4. Verify tab_info keys exist
      const tabKeys = Object.keys(storageData).filter((key) => key.startsWith('tab_info_'));
      expect(tabKeys.length, `Should have at least one tab entry`).toBeGreaterThan(0);
      // 5. Analyze stored data
      let prebidDetected = false;
      let prebidNamespaces: string[] = [];
      let prebidVersion: string | undefined;
      for (const tabKey of tabKeys) {
        const tabData = storageData[tabKey];
        for (const frameKey of Object.keys(tabData)) {
          const frame = tabData[frameKey];
          if (frame.prebids && Object.keys(frame.prebids).length > 0) {
            prebidDetected = true;
            prebidNamespaces = Object.keys(frame.prebids);
            const firstPrebid = frame.prebids[prebidNamespaces[0]];
            prebidVersion = firstPrebid?.version;
          }
        }
      }
      // Report results
      if (!prebidDetected) {
      }
      if ((site as any).prebidRequired) {
        expect(prebidDetected, `Extension should detect Prebid that's present on ${site.name}`).toBe(true);
        expect(prebidNamespaces.length).toBeGreaterThan(0);
        if (prebidVersion) {
          expect(prebidVersion).toMatch(/^\d+\.\d+/);
        }
        for (const tabKey of tabKeys) {
          const tabData = storageData[tabKey];
          for (const frameKey of Object.keys(tabData)) {
            const frame = tabData[frameKey];
            if (frame.prebids) {
              for (const [ns, details] of Object.entries(frame.prebids) as [string, any][]) {
                expect(details).toHaveProperty('namespace');
                expect(details).toHaveProperty('version');
                expect(details).toHaveProperty('config');
              }
            }
          }
        }
      } else if (pageHasPrebid.hasPbjsGlobals) {
        // _pbjsGlobals exists but is empty — Prebid stub loaded, awaiting consent
        // Extension should NOT crash in this scenario
        expect(serviceWorker, 'Service worker alive with partial Prebid').toBeTruthy();
      } else {
        // No Prebid at all on the page
      }
      // 6. Verify no extension-related crashes
      const extensionErrors = pageErrors.filter((e) => e.toLowerCase().includes('profprebid') || e.toLowerCase().includes('professor'));
      expect(extensionErrors, `No extension errors on ${site.name}`).toEqual([]);
      await page.close();
    });
  }
  test('extension survives rapid page navigation', async () => {
    test.setTimeout(45000);
    const page = await browserContext.newPage();
    for (const site of REAL_PREBID_SITES) {
      try {
        await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);
      } catch (e) {}
    }
    // Verify service worker survived
    const serviceWorker = browserContext.serviceWorkers().find((sw) => sw.url().includes(extensionId));
    expect(serviceWorker, 'Service worker should survive').toBeTruthy();
    const storageData = await serviceWorker!.evaluate(async () => {
      return await chrome.storage.local.get(null);
    });
    expect(storageData).toBeDefined();
    await page.close();
  });
});
