import { test, expect } from '@playwright/test';
import { launchExtensionContext, ExtensionContextInfo } from '../helpers/extensionTestUtils';
import { LiveSitePage } from '../pom/LiveSitePage';
import { attachAiDiagnosticOnFailure } from '../helpers/mcpTestHelpers';
import { LIVE_SITES_CATALOG } from '../fixtures/liveSitesCatalog';
test.describe('02 - Live Ad Units & Bids Waterfall', () => {
  let extInfo: ExtensionContextInfo;
  test.beforeAll(async () => {
    extInfo = await launchExtensionContext();
  });
  test.afterAll(async () => {
    if (extInfo?.browserContext) {
      await extInfo.browserContext.close();
    }
  });
  test.afterEach(async ({ page }, testInfo) => {
    await attachAiDiagnosticOnFailure(testInfo, page);
  });
  test('captures live ad units and multi-bidder responses on lifestyle publisher (eatpicks.com)', async () => {
    test.setTimeout(60000);
    const siteConfig = LIVE_SITES_CATALOG.find((s) => s.name === 'eatpicks.com')!;
    const page = await extInfo.browserContext.newPage();
    const liveSite = new LiveSitePage(page);
    await liveSite.navigateAndHandleConsent(siteConfig.url);
    await liveSite.waitForMcpBridge();
    const snapshot = await liveSite.getMcpSnapshot();
    expect(snapshot).toBeDefined();
    expect(snapshot.adUnitsCount).toBeGreaterThan(0);
    const latencySummary = await liveSite.getMcpLatencySummary();
    expect(latencySummary).toBeDefined();
    await page.close();
  });
  test('captures multi-bidder setup and installed adapters on news publisher (heise.de)', async () => {
    test.setTimeout(60000);
    const siteConfig = LIVE_SITES_CATALOG.find((s) => s.name === 'heise.de')!;
    const page = await extInfo.browserContext.newPage();
    const liveSite = new LiveSitePage(page);
    await liveSite.navigateAndHandleConsent(siteConfig.url);
    await liveSite.waitForMcpBridge();
    const snapshot = await liveSite.getMcpSnapshot();
    expect(snapshot).toBeDefined();
    await page.close();
  });
});
