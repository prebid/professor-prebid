import { test, expect } from '@playwright/test';
import { launchExtensionContext, ExtensionContextInfo } from '../helpers/extensionTestUtils';
import { LiveSitePage } from '../pom/LiveSitePage';
import { attachAiDiagnosticOnFailure } from '../helpers/mcpTestHelpers';
import { LIVE_SITES_CATALOG } from '../fixtures/liveSitesCatalog';
test.describe('04 - Live Timeline & Network Initiator Tracking', () => {
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
  test('calculates accurate bidder waterfall latencies and min/max response times on live site (eatpicks.com)', async () => {
    test.setTimeout(60000);
    const siteConfig = LIVE_SITES_CATALOG.find((s) => s.name === 'eatpicks.com')!;
    const page = await extInfo.browserContext.newPage();
    const liveSite = new LiveSitePage(page);
    await liveSite.navigateAndHandleConsent(siteConfig.url);
    await liveSite.waitForMcpBridge();
    const latencySummary = await liveSite.getMcpLatencySummary();
    expect(latencySummary).toBeDefined();
    if (latencySummary.bidders.length > 0) {
      expect(latencySummary.bidders[0]).toHaveProperty('bidder');
      expect(latencySummary.bidders[0]).toHaveProperty('latencyMs');
    }
    await page.close();
  });
});
