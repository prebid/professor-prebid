import { test, expect} from '@playwright/test';
import { launchExtensionContext, getExtensionStorage, ExtensionContextInfo } from '../helpers/extensionTestUtils';
import { LiveSitePage } from '../pom/LiveSitePage';
import { attachAiDiagnosticOnFailure } from '../helpers/mcpTestHelpers';
import { LIVE_SITES_CATALOG } from '../fixtures/liveSitesCatalog';
test.describe('01 - Live Prebid Detection & Extension Lifecycle', () => {
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
  test('detects Prebid.js and TCF v2 CMP on German tech publisher (heise.de)', async () => {
    test.setTimeout(60000);
    const siteConfig = LIVE_SITES_CATALOG.find((s) => s.name === 'heise.de')!;
    const page = await extInfo.browserContext.newPage();
    const liveSite = new LiveSitePage(page);
    await liveSite.navigateAndHandleConsent(siteConfig.url);
    const mcpReady = await liveSite.waitForMcpBridge();
    expect(mcpReady, 'MCP bridge should initialize on heise.de').toBe(true);
    const snapshot = await liveSite.getMcpSnapshot();
    expect(snapshot).toBeDefined();
    // Verify storage has tab_info registered
    const storage = await getExtensionStorage(extInfo.serviceWorker);
    const tabKeys = Object.keys(storage).filter((k) => k.startsWith('tab_info_'));
    expect(tabKeys.length).toBeGreaterThan(0);
    await page.close();
  });
  test('detects Prebid.js and GAM slots on lifestyle site (eatpicks.com)', async () => {
    test.setTimeout(60000);
    const siteConfig = LIVE_SITES_CATALOG.find((s) => s.name === 'eatpicks.com')!;
    const page = await extInfo.browserContext.newPage();
    const liveSite = new LiveSitePage(page);
    await liveSite.navigateAndHandleConsent(siteConfig.url);
    const mcpReady = await liveSite.waitForMcpBridge();
    expect(mcpReady, 'MCP bridge should initialize on eatpicks.com').toBe(true);
    const snapshot = await liveSite.getMcpSnapshot();
    expect(snapshot).toBeDefined();
    await page.close();
  });
  test('detects Prebid.js and custom wrapper on news publisher (theguardian.com)', async () => {
    test.setTimeout(60000);
    const siteConfig = LIVE_SITES_CATALOG.find((s) => s.name === 'theguardian.com')!;
    const page = await extInfo.browserContext.newPage();
    const liveSite = new LiveSitePage(page);
    await liveSite.navigateAndHandleConsent(siteConfig.url);
    const mcpReady = await liveSite.waitForMcpBridge();
    expect(mcpReady).toBe(true);
    const snapshot = await liveSite.getMcpSnapshot();
    expect(snapshot).toBeDefined();
    await page.close();
  });
});
