import { Page } from '@playwright/test';
import { test, expect } from './fixtures/extensionTest';
import { waitForMcpBridge, simulatePrebidAuction } from './helpers/mcpTestHelpers';

test.describe('Professor Prebid DevTools MCP Bridge E2E', () => {
  const setupMockPage = async (page: Page) => {
    await page.route('https://example.com/mcp-test-page', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Prebid MCP E2E Test</title>
              <script>
                window.pbjs = window.pbjs || {};
                window.pbjs.que = window.pbjs.que || [];
                window.pbjs.version = '11.29.0';
                window.pbjs.installedModules = ['appnexusBidAdapter', 'rubiconBidAdapter'];
                window._pbjsGlobals = ['pbjs'];

                const _events = [];
                const _listeners = {};
                window.pbjs._eventListeners = _listeners;

                window.pbjs.onEvent = (evt, fn) => {
                  _listeners[evt] = _listeners[evt] || [];
                  _listeners[evt].push(fn);
                };

                window.pbjs.getEvents = () => _events;
                window.pbjs.getConfig = () => ({ debug: true });
                window.pbjs.getUserIdsAsEids = () => [{ source: 'criteo.com', uids: [{ id: 'uid-123' }] }];
                window.pbjs.adUnits = [{ code: 'div-gpt-ad-leaderboard' }, { code: 'div-gpt-ad-sidebar' }];
                window.pbjs.getAllWinningBids = () => [];

                // Mock Google Publisher Tag
                window.googletag = window.googletag || {};
                window.googletag.cmd = window.googletag.cmd || [];
                const _slots = [];
                window.googletag.pubads = () => ({
                  getSlots: () => _slots,
                  addEventListener: () => {},
                });
              </script>
            </head>
            <body>
              <div id="div-gpt-ad-leaderboard"></div>
              <div id="div-gpt-ad-sidebar"></div>
            </body>
          </html>
        `,
      });
    });

    await page.goto('https://example.com/mcp-test-page');
  };

  test('initializes window.__PROFESSOR_PREBID_MCP__ and provides state getters', async ({ liveSite }) => {
    const { page } = liveSite;
    await setupMockPage(page);

    await waitForMcpBridge(page);

    const versionInfo = await page.evaluate(() => {
      const win = window as any;
      return win.__PROFESSOR_PREBID_MCP__.getVersion();
    });

    expect(versionInfo.bridgeVersion).toBe('1.0.0');
    expect(versionInfo.prebidVersion).toBe('11.29.0');

    const installedModules = await page.evaluate(() => {
      const win = window as any;
      return win.__PROFESSOR_PREBID_MCP__.getInstalledModules();
    });
    expect(installedModules).toContain('appnexusBidAdapter');
    expect(installedModules).toContain('rubiconBidAdapter');
  });

  test('captures auctions, calculates latencies, and detects timeouts', async ({ liveSite }) => {
    const { page } = liveSite;
    await setupMockPage(page);
    await waitForMcpBridge(page);

    // Simulate multi-bidder auction: 1 winner ($3.50), 1 low bid ($1.20), 1 timeout, 1 no-bid
    await simulatePrebidAuction(page, {
      auctionId: 'auction-e2e-001',
      adUnitCode: 'div-gpt-ad-leaderboard',
      timeout: 1000,
      bidders: [
        { bidderCode: 'appnexus', cpm: 3.5, timeToRespond: 150, size: [728, 90] },
        { bidderCode: 'rubicon', cpm: 1.2, timeToRespond: 280, size: [728, 90] },
        { bidderCode: 'criteo', timedOut: true },
        { bidderCode: 'openx', noBid: true },
      ],
      winningBidder: 'appnexus',
      gamSlotId: 'div-gpt-ad-leaderboard',
    });

    const auctions = await page.evaluate(() => {
      const win = window as any;
      return win.__PROFESSOR_PREBID_MCP__.getAuctions();
    });

    expect(auctions.length).toBe(1);
    expect(auctions[0].auctionId).toBe('auction-e2e-001');
    expect(auctions[0].bidsReceived.length).toBe(2);
    expect(auctions[0].noBids.length).toBe(1);
    expect(auctions[0].winningBids.length).toBe(1);
    expect(auctions[0].winningBids[0].bidder).toBe('appnexus');

    const latencySummary = await page.evaluate(() => {
      const win = window as any;
      return win.__PROFESSOR_PREBID_MCP__.getLatencySummary();
    });

    expect(latencySummary.averageLatencyMs).toBe(215); // (150 + 280) / 2
    expect(latencySummary.minLatencyMs).toBe(150);
    expect(latencySummary.maxLatencyMs).toBe(280);
    expect(latencySummary.timeouts).toContain('criteo');
    expect(latencySummary.totalNoBids).toBe(1);

    const gamTargeting = await page.evaluate(() => {
      const win = window as any;
      return win.__PROFESSOR_PREBID_MCP__.getGamTargeting();
    });

    expect(gamTargeting['div-gpt-ad-leaderboard']).toBeDefined();
    expect(gamTargeting['div-gpt-ad-leaderboard']['hb_bidder']).toEqual(['appnexus']);
    expect(gamTargeting['div-gpt-ad-leaderboard']['hb_pb']).toEqual(['3.50']);
  });

  test('reports DevTools MCP as active once the standalone module is on the page', async ({ liveSite }) => {
    const { page } = liveSite;
    await setupMockPage(page);
    await waitForMcpBridge(page);
    const hasDevtoolsMcp = () => page.evaluate(() => (window as any).__PROFESSOR_PREBID_MCP__.hasDevtoolsMcp());

    expect(await hasDevtoolsMcp()).toBe(false);

    // The Tools tab injects the standalone module with chrome.scripting, which Playwright cannot drive;
    // the bridge only sees the global that module defines.
    await page.evaluate(() => ((window as any).__PREBID_DEVTOOLS_MCP__ = { version: '1.0.0', getEvents: (): unknown[] => [], getAuctions: (): unknown[] => [] }));
    expect(await hasDevtoolsMcp()).toBe(true);
  });

  test('reports DevTools MCP as active when Prebid.js is built with the devtoolsMcp module', async ({ liveSite }) => {
    const { page } = liveSite;
    await setupMockPage(page);
    await waitForMcpBridge(page);

    await page.evaluate(() => (window as any).pbjs.installedModules.push('devtoolsMcp'));
    expect(await page.evaluate(() => (window as any).__PROFESSOR_PREBID_MCP__.hasDevtoolsMcp())).toBe(true);
  });

  test('generates comprehensive diagnostic snapshot and AI prompt', async ({ liveSite }) => {
    const { page } = liveSite;
    await setupMockPage(page);
    await waitForMcpBridge(page);

    await simulatePrebidAuction(page, {
      auctionId: 'auction-ai-test',
      adUnitCode: 'div-gpt-ad-leaderboard',
      timeout: 1000,
      bidders: [
        { bidderCode: 'appnexus', cpm: 4.25, timeToRespond: 120 },
        { bidderCode: 'pubmatic', timedOut: true },
      ],
      winningBidder: 'appnexus',
      gamSlotId: 'div-gpt-ad-leaderboard',
    });

    const snapshot = await page.evaluate(() => {
      const win = window as any;
      return win.__PROFESSOR_PREBID_MCP__.getSnapshot();
    });

    expect(snapshot.prebidVersion).toBe('11.29.0');
    expect(snapshot.auctionCount).toBe(1);
    expect(snapshot.latencySummary.timeouts).toContain('pubmatic');

    const prompt = await page.evaluate(() => {
      const win = window as any;
      return win.__PROFESSOR_PREBID_MCP__.generateAiPrompt();
    });

    expect(prompt).toContain('Prebid.js & AdTech Diagnostic Snapshot');
    expect(prompt).toContain('11.29.0');
    expect(prompt).toContain('pubmatic');
    expect(prompt).toContain('hb_bidder=appnexus');
  });
});
