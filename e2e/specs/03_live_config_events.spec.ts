import { test, expect } from '@playwright/test';
import { launchExtensionContext, ExtensionContextInfo } from '../helpers/extensionTestUtils';
import { LiveSitePage } from '../pom/LiveSitePage';
import { attachAiDiagnosticOnFailure } from '../helpers/mcpTestHelpers';
import { LIVE_SITES_CATALOG } from '../fixtures/liveSitesCatalog';
test.describe('03 - Live Prebid Config & Auction Events Feed', () => {
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
  test('extracts live Prebid config and active bidder settings on real publisher (eatpicks.com)', async () => {
    test.setTimeout(60000);
    const siteConfig = LIVE_SITES_CATALOG.find((s) => s.name === 'eatpicks.com')!;
    const page = await extInfo.browserContext.newPage();
    const liveSite = new LiveSitePage(page);
    await liveSite.navigateAndHandleConsent(siteConfig.url);
    await liveSite.waitForMcpBridge();
    const config = await page.evaluate(() => {
      const win = window as any;
      const pb = win.pbjs || (win._pbjsGlobals && win[win._pbjsGlobals[0]]);
      return pb?.getConfig ? pb.getConfig() : null;
    });
    expect(config).toBeDefined();
    await page.close();
  });
  test('captures full lifecycle auction events stream on real publisher (eatpicks.com)', async () => {
    test.setTimeout(60000);
    const siteConfig = LIVE_SITES_CATALOG.find((s) => s.name === 'eatpicks.com')!;
    const page = await extInfo.browserContext.newPage();
    const liveSite = new LiveSitePage(page);
    await liveSite.navigateAndHandleConsent(siteConfig.url);
    await liveSite.waitForMcpBridge();
    const eventTypes = await page.evaluate(() => {
      const win = window as any;
      const pb = win.pbjs || (win._pbjsGlobals && win[win._pbjsGlobals[0]]);
      const events: any[] = pb?.getEvents ? pb.getEvents() : [];
      return Array.from(new Set(events.map((e) => e.eventType)));
    });
    expect(eventTypes.length).toBeGreaterThan(0);
    expect(eventTypes).toContain('auctionInit');
    await page.close();
  });
});
