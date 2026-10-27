import { test, expect, liveSiteNamed } from '../fixtures/extensionTest';

test.describe('04 - Live Timeline & Bidder Latencies', () => {
  test.describe.configure({ timeout: 90000 });

  test('reports bidder latencies and their min/max on a live site (eatpicks.com)', async ({ liveSite }) => {
    await liveSite.open(liveSiteNamed('eatpicks.com').url);
    expect(await liveSite.waitForAuctionEnd(), 'an auction should finish').toBe(true);
    expect(await liveSite.waitForMcpBridge()).toBe(true);

    const latency = await liveSite.getMcpLatencySummary();
    expect(latency.bidders.length).toBeGreaterThan(0);
    for (const bidder of latency.bidders) {
      expect(typeof bidder.bidder).toBe('string');
      expect(typeof bidder.latencyMs).toBe('number');
    }
    expect(latency.minLatencyMs).toBeLessThanOrEqual(latency.maxLatencyMs);
  });
});
