import { test, expect } from '@playwright/test';
import { launchExtensionContext, ExtensionContextInfo} from '../helpers/extensionTestUtils';
import { LiveSitePage } from '../pom/LiveSitePage';

import { attachAiDiagnosticOnFailure } from '../helpers/mcpTestHelpers';
import { LIVE_SITES_CATALOG } from '../fixtures/liveSitesCatalog';
test.describe('06 - Live Tools, Debugging Rules & DOM Overlays', () => {
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
  test('toggles and activates on-page ad overlays via Tools panel', async () => {
    test.setTimeout(60000);
    const siteConfig = LIVE_SITES_CATALOG.find((s) => s.name === 'eatpicks.com')!;
    const livePage = await extInfo.browserContext.newPage();
    const liveSite = new LiveSitePage(livePage);
    await liveSite.navigateAndHandleConsent(siteConfig.url);
    await liveSite.waitForMcpBridge();
    await extInfo.serviceWorker.evaluate(async () => {
      await chrome.storage.local.set({ PP_CONSOLE_STATE: true });
    });
    const snapshot = await liveSite.getMcpSnapshot();
    expect(snapshot).toBeDefined();
    await livePage.close();
  });
  test('generates comprehensive AI diagnostic snapshot from live page auction data', async () => {
    test.setTimeout(60000);
    const siteConfig = LIVE_SITES_CATALOG.find((s) => s.name === 'eatpicks.com')!;
    const livePage = await extInfo.browserContext.newPage();
    const liveSite = new LiveSitePage(livePage);
    await liveSite.navigateAndHandleConsent(siteConfig.url);
    await liveSite.waitForMcpBridge();
    const prompt = await livePage.evaluate(() => {
      const win = window as any;
      return win.__PROFESSOR_PREBID_MCP__?.generateAiPrompt ? win.__PROFESSOR_PREBID_MCP__.generateAiPrompt() : '';
    });
    expect(prompt).toContain('Prebid.js & AdTech Diagnostic Snapshot');
    expect(prompt).toContain('Auction Summary');
    await livePage.close();
  });
});
