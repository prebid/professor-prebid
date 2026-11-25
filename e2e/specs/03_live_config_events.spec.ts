import { test, expect, liveSiteNamed, LIVE } from '../fixtures/extensionTest';
import { waitForDetectedPrebid } from '../helpers/extensionTestUtils';

test.describe('03 - Live Prebid Config & Auction Events Feed', { tag: LIVE }, () => {
  test.describe.configure({ timeout: 90000 });

  test('stores the live Prebid config on a real publisher (eatpicks.com)', async ({ extension, liveSite }) => {
    await liveSite.open(liveSiteNamed('eatpicks.com').url);
    expect(await liveSite.waitForPrebid(), 'Prebid.js should load').toBe(true);

    const config = await liveSite.getPrebidConfig();
    expect(config).not.toBeNull();
    const detected = await waitForDetectedPrebid(extension.serviceWorker, liveSite.page.url());
    expect(detected, 'Professor Prebid should store the Prebid instance').not.toBeNull();

    // Functions do not survive the message to the background, so only data sections are compared.
    const dataKeys = Object.keys(config!).filter((key) => typeof config![key] !== 'function');
    expect(Object.keys(detected!.details.config)).toEqual(expect.arrayContaining(dataKeys));
    expect(detected!.details.config.bidderTimeout).toBe(config!.bidderTimeout);
  });

  test('stores the auction lifecycle events on a real publisher (eatpicks.com)', async ({ extension, liveSite }) => {
    await liveSite.open(liveSiteNamed('eatpicks.com').url);
    expect(await liveSite.waitForAuctionEnd(), 'an auction should finish').toBe(true);

    // The events the extension stored: the page's events, behind an object URL the panel downloads.
    // Updates are throttled, so the URL may still lead to the log from before auctionEnd for a few seconds.
    const storedEventTypes = async (): Promise<string[]> => {
      const detected = await waitForDetectedPrebid(extension.serviceWorker, liveSite.page.url(), 5000);
      if (!detected?.details.eventsUrl) return [];
      return liveSite.page.evaluate(async (url) => {
        const events: { eventType: string }[] = await (await fetch(url)).json();
        return Array.from(new Set(events.map((event) => event.eventType)));
      }, detected.details.eventsUrl as string);
    };
    await expect.poll(storedEventTypes, { timeout: 20000 }).toEqual(expect.arrayContaining(['auctionInit', 'bidRequested', 'auctionEnd']));
  });
});
