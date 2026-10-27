import { test, expect, liveSiteNamed } from '../fixtures/extensionTest';

test.describe('03 - Live Prebid Config & Auction Events Feed', () => {
  test.describe.configure({ timeout: 90000 });

  test('reads the live Prebid config on a real publisher (eatpicks.com)', async ({ liveSite }) => {
    await liveSite.open(liveSiteNamed('eatpicks.com').url);
    expect(await liveSite.waitForPrebid(), 'Prebid.js should load').toBe(true);

    const config = await liveSite.getPrebidConfig();
    expect(config).not.toBeNull();
    expect(typeof config!.bidderTimeout).toBe('number');
  });

  test('captures the auction lifecycle events on a real publisher (eatpicks.com)', async ({ liveSite }) => {
    await liveSite.open(liveSiteNamed('eatpicks.com').url);
    expect(await liveSite.waitForAuctionEnd(), 'an auction should finish').toBe(true);

    const eventTypes = await liveSite.getPrebidEventTypes();
    expect(eventTypes).toEqual(expect.arrayContaining(['auctionInit', 'bidRequested', 'auctionEnd']));
  });
});
