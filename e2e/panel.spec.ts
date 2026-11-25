import { Page } from '@playwright/test';
import { test, expect } from './fixtures/extensionTest';
import { waitForDetectedPrebid } from './helpers/extensionTestUtils';

const MOCK_PREBID_PAGE = `
  <html>
    <head>
      <script>
        const listeners = {};
        const storedEvents = [];
        window._pbjsGlobals = ['pbjs'];
        window.pbjs = {
          que: { push: (fn) => fn() },
          version: '9.53.0',
          installedModules: ['appnexusBidAdapter', 'rubiconBidAdapter'],
          bidderSettings: {},
          adUnits: [
            { code: 'div-gpt-ad-leaderboard', mediaTypes: { banner: { sizes: [[728, 90]] } }, bids: [{ bidder: 'appnexus', params: {} }] },
            { code: 'div-gpt-ad-mrec', mediaTypes: { banner: { sizes: [[300, 250]] } }, bids: [{ bidder: 'rubicon', params: {} }] },
          ],
          onEvent: (event, handler) => (listeners[event] = [...(listeners[event] || []), handler]),
          getEvents: () => storedEvents,
          getConfig: () => ({ bidderTimeout: 1500, priceGranularity: 'medium' }),
          getUserIdsAsEids: () => [{ source: 'id5-sync.com', uids: [{ id: 'ID5*e2e', atype: 1 }] }],
        };
        window.runAuction = () => {
          const emit = (eventType, args) => {
            storedEvents.push({ eventType, args, elapsedTime: storedEvents.length * 10 });
            (listeners[eventType] || []).forEach((fn) => fn(args));
          };
          const auctionId = 'e2e-auction';
          const bid = { auctionId, bidder: 'appnexus', bidderCode: 'appnexus', adUnitCode: 'div-gpt-ad-leaderboard', cpm: 1.23, currency: 'USD', width: 728, height: 90, size: '728x90', mediaType: 'banner', adId: 'e2e-ad', timeToRespond: 120, status: 'rendered' };
          const bidderRequests = [{ auctionId, bidderCode: 'appnexus', bids: [{ bidder: 'appnexus', adUnitCode: 'div-gpt-ad-leaderboard', bidId: 'e2e-bid' }] }];
          emit('auctionInit', { auctionId, adUnitCodes: ['div-gpt-ad-leaderboard', 'div-gpt-ad-mrec'], adUnits: window.pbjs.adUnits, bidderRequests, timeout: 1500 });
          emit('bidRequested', bidderRequests[0]);
          emit('bidResponse', bid);
          emit('auctionEnd', { auctionId, adUnitCodes: ['div-gpt-ad-leaderboard', 'div-gpt-ad-mrec'], adUnits: window.pbjs.adUnits, bidderRequests, bidsReceived: [bid], noBids: [], timeout: 1500 });
          emit('bidWon', bid);
        };
      </script>
    </head>
    <body><div id="div-gpt-ad-leaderboard"></div><div id="div-gpt-ad-mrec"></div></body>
  </html>
`;

/**
 * Opens the DevTools panel page for `tabId` in a tab of its own. Playwright cannot open DevTools, so the
 * page gets the part of chrome.devtools the panel reads: the inspected tab and the network listener.
 */
const openPanel = async (page: Page, extensionId: string, tabId: number): Promise<void> => {
  await page.addInitScript((inspectedTabId) => {
    (window as any).chrome.devtools = {
      inspectedWindow: { tabId: inspectedTabId, reload: (): void => undefined, eval: (): void => undefined },
      network: { onRequestFinished: { addListener: (): void => undefined } },
    };
  }, tabId);
  await page.goto(`chrome-extension://${extensionId}/panel.html`);
};

test.describe('Professor Prebid DevTools panel', () => {
  test('shows the ad units, bids, events and user IDs it captured from the inspected page', async ({ extension, liveSite }) => {
    const { page } = liveSite;
    await page.route('https://example.com/panel-test', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_PREBID_PAGE }));
    await page.goto('https://example.com/panel-test');
    await page.waitForFunction(() => typeof (window as any).runAuction === 'function');
    await page.evaluate(() => (window as any).runAuction());

    const detected = await waitForDetectedPrebid(extension.serviceWorker, page.url(), 10000);
    expect(detected).not.toBeNull();
    // The events URL is written by the throttled update after the auction.
    await expect.poll(async () => (await waitForDetectedPrebid(extension.serviceWorker, page.url(), 1000))?.details.eventsUrl, { timeout: 10000 }).toMatch(/^blob:https:\/\/example\.com\//);
    const tabId = Number(detected!.tabKey.replace('tab_info_', ''));

    const panel = await extension.browserContext.newPage();
    try {
      await openPanel(panel, extension.extensionId, tabId);
      const nav = (label: string) => panel.locator('header').getByRole('link', { name: label, exact: true });

      // Ad Units: the configured units and the bid on the leaderboard.
      await expect(panel.getByText('AdUnits: 2')).toBeVisible();
      await expect(panel.getByText('div-gpt-ad-leaderboard', { exact: true })).toBeVisible();
      await expect(panel.getByText('div-gpt-ad-mrec', { exact: true })).toBeVisible();
      await expect(panel.getByText('appnexus (1.23 USD)')).toBeVisible();

      // Bids: the received bid, which needs the events the panel downloads from the page.
      await nav('Bids').click();
      await expect(panel.getByText('Received (1)')).toBeVisible();

      // Events: every event Prebid logged.
      await nav('Events').click();
      await expect(panel.getByText('Events: 5')).toBeVisible();
      await expect(panel.getByText('bidWon', { exact: true })).toBeVisible();

      // User IDs: the EID source.
      await nav('User Id').click();
      await expect(panel.getByText('id5-sync.com', { exact: true })).toBeVisible();
    } finally {
      await panel.close();
    }
  });
});
