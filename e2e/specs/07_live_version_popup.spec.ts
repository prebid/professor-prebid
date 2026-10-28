import { test, expect, liveSiteNamed, PREBID_VERSION, LIVE } from '../fixtures/extensionTest';
import { openExtensionPopup } from '../helpers/extensionTestUtils';
import { PopupPage } from '../pom/PopupPage';

test.describe('07 - Live Version Inspector & Extension Popup', () => {
  test.describe.configure({ timeout: 90000 });

  test('reports the live Prebid version and installed modules on a news publisher (theguardian.com)', { tag: LIVE }, async ({ liveSite }) => {
    await liveSite.open(liveSiteNamed('theguardian.com').url);
    expect(await liveSite.waitForPrebid(), 'Prebid.js should load after consent').toBe(true);
    expect(await liveSite.waitForMcpBridge()).toBe(true);

    const snapshot = await liveSite.getMcpSnapshot();
    expect(snapshot.prebidVersion).toMatch(PREBID_VERSION);
    expect(snapshot.installedModules.length).toBeGreaterThan(0);
  });

  test('renders the popup with the no-Prebid card for a tab without Prebid', async ({ extension }) => {
    const popup = await openExtensionPopup(extension.browserContext, extension.extensionId);
    try {
      const popupPage = new PopupPage(popup);
      await expect.poll(() => popupPage.isNoPrebidCardVisible()).toBe(true);
    } finally {
      await popup.close();
    }
  });
});
