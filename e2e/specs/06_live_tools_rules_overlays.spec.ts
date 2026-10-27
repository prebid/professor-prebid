import { test, expect, liveSiteNamed, LIVE } from '../fixtures/extensionTest';
import { setExtensionStorage } from '../helpers/extensionTestUtils';

// The key the Tools tab's overlay toggle stores (CONSOLE_TOGGLE in src/pages/Shared/constants.ts).
const CONSOLE_STATE_KEY = 'PP_CONSOLE_STATE';

test.describe('06 - Live Ad Overlays & AI Diagnostic', { tag: LIVE }, () => {
  test.describe.configure({ timeout: 90000 });

  test('draws ad overlays on the page when overlays are switched on', async ({ extension, liveSite }) => {
    // The injected app asks for the stored state on load, as it does after the Tools toggle.
    await setExtensionStorage(extension.serviceWorker, { [CONSOLE_STATE_KEY]: true });
    try {
      await liveSite.open(liveSiteNamed('eatpicks.com').url);
      expect(await liveSite.waitForAuctionEnd(), 'an auction should finish').toBe(true);

      await expect.poll(() => liveSite.countOverlays(), { timeout: 20000 }).toBeGreaterThan(0);
    } finally {
      await setExtensionStorage(extension.serviceWorker, { [CONSOLE_STATE_KEY]: false });
    }
  });

  test('draws no overlays while overlays are switched off', async ({ liveSite }) => {
    await liveSite.open(liveSiteNamed('eatpicks.com').url);
    expect(await liveSite.waitForAuctionEnd(), 'an auction should finish').toBe(true);

    expect(await liveSite.countOverlays()).toBe(0);
  });

  test('generates the AI diagnostic prompt from live auction data', async ({ liveSite }) => {
    await liveSite.open(liveSiteNamed('eatpicks.com').url);
    expect(await liveSite.waitForAuctionEnd(), 'an auction should finish').toBe(true);
    expect(await liveSite.waitForMcpBridge()).toBe(true);

    const prompt = await liveSite.generateAiPrompt();
    expect(prompt).toContain('Prebid.js & AdTech Diagnostic Snapshot');
    expect(prompt).toContain('Auction Summary');
  });
});
