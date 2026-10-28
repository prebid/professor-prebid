import { test, expect } from './fixtures/extensionTest';
import { setExtensionStorage } from './helpers/extensionTestUtils';

// The key the Tools tab's overlay toggle stores (CONSOLE_TOGGLE in src/pages/Shared/constants.ts).
const CONSOLE_STATE_KEY = 'PP_CONSOLE_STATE';

const AD_UNITS = ['div-top', 'div-mid', 'div-bottom'];

const MOCK_PREBID_PAGE = `
  <html>
    <head>
      <style>body { margin: 20px; } .slot { width: 300px; height: 50px; margin-bottom: 8px; background: #ddd; }</style>
      <script>
        const listeners = {};
        const storedEvents = [];
        const units = ${JSON.stringify(AD_UNITS)};
        window._pbjsGlobals = ['pbjs'];
        window.pbjs = {
          que: { push: (fn) => fn() },
          version: '9.53.0',
          installedModules: [],
          bidderSettings: {},
          adUnits: units.map((code) => ({ code, mediaTypes: { banner: { sizes: [[300, 50]] } }, bids: [] })),
          onEvent: (event, handler) => (listeners[event] = [...(listeners[event] || []), handler]),
          getEvents: () => storedEvents,
          getConfig: () => ({}),
          getUserIdsAsEids: () => [],
        };
        window.runAuction = () => {
          const emit = (eventType, args) => {
            storedEvents.push({ eventType, args });
            (listeners[eventType] || []).forEach((fn) => fn(args));
          };
          emit('auctionInit', { auctionId: 'a', adUnitCodes: units });
          units.forEach((code, i) => {
            const bid = { auctionId: 'a', bidder: 'appnexus', bidderCode: 'appnexus', adUnitCode: code, cpm: 1 + i, currency: 'USD', timeToRespond: 100, adId: 'ad' + i };
            emit('bidResponse', bid);
            emit('bidWon', bid);
          });
          emit('auctionEnd', { auctionId: 'a', adUnitCodes: units });
        };
      </script>
    </head>
    <body>${AD_UNITS.map((code) => `<div id="${code}" class="slot"></div>`).join('')}</body>
  </html>
`;

test.describe('Professor Prebid ad overlays', () => {
  test('draws an overlay per ad unit, and the opened popover covers them', async ({ extension, liveSite }) => {
    const { page } = liveSite;
    // The injected app reads the stored state on load, as it does after the Tools toggle.
    await setExtensionStorage(extension.serviceWorker, { [CONSOLE_STATE_KEY]: true });
    try {
      await page.route('https://example.com/overlay-test', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_PREBID_PAGE }));
      await page.goto('https://example.com/overlay-test');
      await page.waitForFunction(() => typeof (window as any).runAuction === 'function');
      await page.evaluate(() => (window as any).runAuction());

      await expect.poll(() => liveSite.countOverlays(), { timeout: 15000 }).toBe(AD_UNITS.length);

      await page.locator('#prpb-mask--container-div-top [title="Open in Popover"]').click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Whatever is drawn on top at the centre of each slot must not be one of the slot overlays.
      const topmostOverlays = await page.evaluate((codes) => {
        return codes
          .map((code) => {
            const rect = document.getElementById(code)!.getBoundingClientRect();
            return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest('[id^="prpb-mask--container-"]')?.id;
          })
          .filter(Boolean);
      }, AD_UNITS);
      expect(topmostOverlays).toEqual([]);
    } finally {
      await setExtensionStorage(extension.serviceWorker, { [CONSOLE_STATE_KEY]: false });
    }
  });
});
