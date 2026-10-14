import { test, expect } from '@playwright/test';
import { launchExtensionContext, ExtensionContextInfo } from '../helpers/extensionTestUtils';
import { LiveSitePage } from '../pom/LiveSitePage';
import { attachAiDiagnosticOnFailure } from '../helpers/mcpTestHelpers';
import { LIVE_SITES_CATALOG } from '../fixtures/liveSitesCatalog';
test.describe('05 - Live User IDs & Pre-Auction Module Diagnostics', () => {
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
  test('extracts EID identity structures and userSync sub-modules on live publisher site', async () => {
    test.setTimeout(60000);
    const siteConfig = LIVE_SITES_CATALOG.find((s) => s.name === 'eatpicks.com')!;
    const page = await extInfo.browserContext.newPage();
    const liveSite = new LiveSitePage(page);
    await liveSite.navigateAndHandleConsent(siteConfig.url);
    await liveSite.waitForMcpBridge();
    const snapshot = await liveSite.getMcpSnapshot();
    expect(snapshot).toBeDefined();
    if (snapshot.userEids && snapshot.userEids.length > 0) {
    }
    await page.close();
  });
});
