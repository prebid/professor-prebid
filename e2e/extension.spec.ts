import { test, expect } from './fixtures/extensionTest';
import { waitForDetectedPrebid } from './helpers/extensionTestUtils';
import { waitForMcpBridge } from './helpers/mcpTestHelpers';

const MOCK_PREBID_PAGE = `
  <html>
    <head>
      <script>
        const listeners = {};
        const storedEvents = [];
        window._pbjsGlobals = ['pbjs'];
        window.pbjs = {
          que: { push: (fn) => fn() },
          version: '1.0.0',
          installedModules: ['appnexusBidAdapter'],
          bidderSettings: {},
          onEvent: (event, handler) => (listeners[event] = [...(listeners[event] || []), handler]),
          getEvents: () => storedEvents,
          getConfig: () => ({ bidderTimeout: 1000 }),
          getUserIdsAsEids: () => [],
        };
        window.listenerCount = (event) => (listeners[event] || []).length;
        window.triggerEvent = (event, args) => {
          storedEvents.push({ eventType: event, args, elapsedTime: Date.now() });
          (listeners[event] || []).forEach((fn) => fn(args));
        };
      </script>
    </head>
    <body><h1>Mock Prebid Page</h1></body>
  </html>
`;

test.describe('Professor Prebid Extension', () => {
  test('injects its script, listens to Prebid events and stores what it detects', async ({ extension, liveSite }) => {
    const { page } = liveSite;
    await page.route('https://example.com/mock-prebid', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_PREBID_PAGE }));
    await page.goto('https://example.com/mock-prebid');

    // The injected script subscribes to Prebid's events.
    await page.waitForFunction(() => (window as any).listenerCount('auctionInit') > 0, null, { timeout: 10000 });
    await page.evaluate(() => (window as any).triggerEvent('auctionInit', { auctionId: 'test-auction' }));

    // The background stores the instance under the tab, with the page's version and config.
    const detected = await waitForDetectedPrebid(extension.serviceWorker, page.url(), 10000);
    expect(detected).not.toBeNull();
    expect(detected!.frameId).toBe('top-window');
    expect(detected!.namespace).toBe('pbjs');
    expect(detected!.details.version).toBe('1.0.0');
    expect(detected!.details.installedModules).toEqual(['appnexusBidAdapter']);
    expect(detected!.details.config).toEqual({ bidderTimeout: 1000 });

    await waitForMcpBridge(page);
    expect(await page.evaluate(() => (window as any).__PROFESSOR_PREBID_MCP__.bridgeVersion)).toBe('1.0.0');
  });
});
