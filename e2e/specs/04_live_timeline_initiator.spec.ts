import { test, expect, liveSiteNamed, LIVE } from '../fixtures/extensionTest';

test.describe('04 - Live Timeline & Bidder Latencies', { tag: LIVE }, () => {
  test.describe.configure({ timeout: 90000 });

  test('reports bidder latencies and their min/max on a live site (eatpicks.com)', async ({ liveSite }) => {
    await liveSite.open(liveSiteNamed('eatpicks.com').url);
    // Bidders are listed for bids and timeouts; an auction in which every bidder passes lists none.
    expect(await liveSite.waitForPrebidEvent('bidResponse'), 'a bidder should bid').toBe(true);
    expect(await liveSite.waitForMcpBridge()).toBe(true);

    const latency = await liveSite.getMcpLatencySummary();
    const bidResponses = await liveSite.countPrebidEvents('bidResponse');
    expect(latency.totalBidsReceived).toBeGreaterThanOrEqual(bidResponses);
    expect(latency.bidders.length).toBeGreaterThan(0);
    for (const bidder of latency.bidders) {
      expect(typeof bidder.bidder).toBe('string');
      expect(typeof bidder.latencyMs).toBe('number');
    }
    expect(latency.minLatencyMs).toBeLessThanOrEqual(latency.maxLatencyMs);
  });
});
