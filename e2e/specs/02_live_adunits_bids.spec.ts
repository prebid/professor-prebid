import { test, expect, liveSiteNamed } from '../fixtures/extensionTest';

test.describe('02 - Live Ad Units & Bids Waterfall', () => {
  test.describe.configure({ timeout: 90000 });

  test('captures live ad units and multi-bidder responses on a lifestyle publisher (eatpicks.com)', async ({ liveSite }) => {
    await liveSite.open(liveSiteNamed('eatpicks.com').url);
    expect(await liveSite.waitForAuctionEnd(), 'an auction should finish').toBe(true);
    expect(await liveSite.waitForMcpBridge()).toBe(true);

    const snapshot = await liveSite.getMcpSnapshot();
    expect(snapshot.adUnitsCount).toBeGreaterThan(0);
    expect(snapshot.auctionCount).toBeGreaterThan(0);
    expect(snapshot.latencySummary.totalBidsRequested).toBeGreaterThan(0);
  });

  test('reports the installed bid adapters on a news publisher (heise.de)', async ({ liveSite }) => {
    await liveSite.open(liveSiteNamed('heise.de').url);
    expect(await liveSite.waitForPrebid(), 'Prebid.js should load after consent').toBe(true);
    expect(await liveSite.waitForMcpBridge()).toBe(true);

    const snapshot = await liveSite.getMcpSnapshot();
    expect(snapshot.installedModules.some((module: string) => module.endsWith('BidAdapter'))).toBe(true);
  });
});
