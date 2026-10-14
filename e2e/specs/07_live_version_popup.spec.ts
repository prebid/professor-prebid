import { test, expect } from '@playwright/test';
import { launchExtensionContext, ExtensionContextInfo, openExtensionPopup } from '../helpers/extensionTestUtils';
import { LiveSitePage } from '../pom/LiveSitePage';
import { PopupPage } from '../pom/PopupPage';
import { attachAiDiagnosticOnFailure } from '../helpers/mcpTestHelpers';
import { LIVE_SITES_CATALOG } from '../fixtures/liveSitesCatalog';
test.describe('07 - Live Version Inspector & Extension Popup', () => {
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
  test('inspects live Prebid core version and list of installed bid adapters on live publisher (theguardian.com)', async () => {
    test.setTimeout(60000);
    const siteConfig = LIVE_SITES_CATALOG.find((s) => s.name === 'theguardian.com')!;
    const livePage = await extInfo.browserContext.newPage();
    const liveSite = new LiveSitePage(livePage);
    await liveSite.navigateAndHandleConsent(siteConfig.url);
    await liveSite.waitForMcpBridge();
    const snapshot = await liveSite.getMcpSnapshot();
    expect(snapshot.prebidVersion).toBeDefined();
    await livePage.close();
  });
  test('renders extension popup interface', async () => {
    const popupPage = await openExtensionPopup(extInfo.browserContext, extInfo.extensionId);
    const popupPom = new PopupPage(popupPage);
    const isNavVisible = await popupPom.isNavBarVisible();
    expect(isNavVisible).toBe(true);
    await popupPage.close();
  });
});
