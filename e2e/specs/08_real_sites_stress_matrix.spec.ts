import { test, expect, LIVE } from '../fixtures/extensionTest';
import { LIVE_SITES_CATALOG } from '../fixtures/liveSitesCatalog';

test.describe('08 - Real Sites Multi-Publisher Stress Matrix', { tag: LIVE }, () => {
  test('starts on every catalog site in turn and keeps the service worker alive', async ({ extension, liveSite }) => {
    test.setTimeout(LIVE_SITES_CATALOG.length * 45000);

    for (const site of LIVE_SITES_CATALOG) {
      await liveSite.open(site.url, { navigationTimeoutMs: 20000, consentTimeoutMs: 5000 });
      expect.soft(await liveSite.waitForMcpBridge(10000), `MCP bridge should start on ${site.name}`).toBe(true);
    }

    // The worker answers and still knows its extension id after all the navigations.
    expect(await extension.serviceWorker.evaluate(() => chrome.runtime.id)).toBe(extension.extensionId);
  });
});
