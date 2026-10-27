import { Page, Worker } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { test, expect } from '../fixtures/extensionTest';
import { waitForDetectedPrebid } from '../helpers/extensionTestUtils';
import { reconcilePrebidSurface, formatAuditReportMarkdown, PrebidGroundTruth, ExtensionCapturedState } from '../../utils/audit/surfaceReconciler';

const REPORT_DIR = path.join(__dirname, '../../reports');

const writeReport = (name: string, content: string) => {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, name), content);
};

test.describe('Professor Prebid Data Surface Audit E2E', () => {
  /**
   * Helper: Extracts Page Truth directly from the window scope.
   */
  const extractPageTruth = async function (page: Page): Promise<PrebidGroundTruth> {
    return await page.evaluate(() => {
      const win = window as any;
      const pb = win.pbjs || (win._pbjsGlobals && win[win._pbjsGlobals[0]]);
      if (!pb) {
        throw new Error('Prebid.js not found on page');
      }
      const events = pb.getEvents ? pb.getEvents() : [];
      const config = pb.getConfig ? pb.getConfig() : {};
      const eids = pb.getUserIdsAsEids ? pb.getUserIdsAsEids() : [];
      const adUnits = pb.adUnits || [];
      const winningBids = pb.getAllWinningBids ? pb.getAllWinningBids() : [];
      const installedModules = pb.installedModules || [];
      const bidderSettings = pb.bidderSettings || {};
      return {
        namespace: pb.namespace || (win._pbjsGlobals && win._pbjsGlobals[0]) || 'pbjs',
        version: pb.version || null,
        installedModules,
        config,
        bidderSettings,
        eids,
        adUnits,
        events,
        winningBids,
        timeoutSetting: win.PREBID_TIMEOUT || null,
      };
    });
  };
  /**
   * Helper: Extracts Extension Captured State from chrome.storage.local & MCP bridge.
   */
  const extractExtensionCapturedState = async function (page: Page, serviceWorker: Worker): Promise<ExtensionCapturedState> {
    const detected = await waitForDetectedPrebid(serviceWorker, page.url(), 10000);
    const foundNamespace = detected?.namespace || 'pbjs';
    const prebidData = detected?.details;
    // Events are stored as an object URL to a blob in the page
    let parsedEvents: any[] = prebidData?.events || [];
    if (prebidData?.eventsUrl) {
      try {
        parsedEvents = await page.evaluate(async (url: string) => {
          const res = await fetch(url);
          return await res.json();
        }, prebidData.eventsUrl);
      } catch (e) {
        console.warn('Could not fetch eventsUrl blob from page:', e);
      }
    }
    // The MCP bridge snapshot, when the bridge is available
    const mcpSnapshot = await page
      .evaluate(() => {
        document.dispatchEvent(new CustomEvent('PP_MCP_BRIDGE_ENABLE'));
        const win = window as any;
        return win.__PROFESSOR_PREBID_MCP__?.getSnapshot ? win.__PROFESSOR_PREBID_MCP__.getSnapshot() : null;
      })
      .catch((): null => null);
    return {
      namespace: foundNamespace,
      version: prebidData?.version,
      installedModules: prebidData?.installedModules || [],
      config: prebidData?.config || {},
      bidderSettings: prebidData?.bidderSettings,
      eids: prebidData?.eids || [],
      events: parsedEvents,
      eventsCount: parsedEvents.length,
      eventsUrl: prebidData?.eventsUrl || null,
      mcpSnapshot,
    };
  };
  test('validates 100% surface capture on comprehensive Prebid scenario', async ({ extension, liveSite }) => {
    const { page } = liveSite;
    // Serve rich synthetic Prebid page with complex config, EIDs, RTD, multiple bidders, GAM targeting
    await page.route('https://example.com/synthetic-prebid-audit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Prebid Surface Audit Testbed</title>
              <script>
                window._pbjsGlobals = ['pbjs'];
                window.pbjs = window.pbjs || {};
                window.pbjs.que = [];
                window.pbjs.que.push = (fn) => {
                  if (typeof fn === 'function') fn();
                  return 1;
                };
                window.pbjs.version = '11.29.0';
                window.pbjs.installedModules = [
                  'appnexusBidAdapter',
                  'rubiconBidAdapter',
                  'criteoIdSystem',
                  'rtdModule',
                  'audigentRtdProvider'
                ];
                const _events = [];
                const _listeners = {};
                window.pbjs._eventListeners = _listeners;
                window.pbjs.onEvent = (evt, fn) => {
                  _listeners[evt] = _listeners[evt] || [];
                  _listeners[evt].push(fn);
                };
                const emitEvent = (eventType, args) => {
                  const ev = { eventType, args, elapsedTime: Date.now() };
                  _events.push(ev);
                  if (_listeners[eventType]) {
                    _listeners[eventType].forEach(fn => fn(args));
                  }
                };
                window.pbjs.getEvents = () => _events;
                const _config = {
                  debug: true,
                  bidderTimeout: 1500,
                  consentManagement: { gdpr: { cmpApi: 'iab', timeout: 1000 } },
                  userSync: { syncEnabled: true, filterSettings: { all: { bidders: '*', filter: 'include' } } },
                  realTimeData: { dataProviders: [{ name: 'audigent', waitForIt: true }] },
                };
                window.pbjs.getConfig = (k) => k ? _config[k] : _config;
                const _eids = [
                  { source: 'criteo.com', uids: [{ id: 'criteo-user-12345', atype: 1 }] },
                  { source: 'id5-sync.com', uids: [{ id: 'id5-test-uid', atype: 1 }] }
                ];
                window.pbjs.getUserIdsAsEids = () => _eids;
                window.pbjs.adUnits = [
                  {
                    code: 'div-gpt-ad-leaderboard',
                    mediaTypes: { banner: { sizes: [[728, 90], [970, 250]] } },
                    bids: [{ bidder: 'appnexus', params: { placementId: 10433394 } }]
                  },
                  {
                    code: 'div-gpt-ad-mrec',
                    mediaTypes: { banner: { sizes: [[300, 250]] } },
                    bids: [{ bidder: 'rubicon', params: { accountId: 14062 } }]
                  }
                ];
                const _winningBids = [
                  {
                    adUnitCode: 'div-gpt-ad-leaderboard',
                    bidder: 'appnexus',
                    bidderCode: 'appnexus',
                    cpm: 3.80,
                    currency: 'USD',
                    width: 728,
                    height: 90,
                    adId: 'ad-win-01'
                  }
                ];
                window.pbjs.getAllWinningBids = () => _winningBids;
                emitEvent('auctionInit', {
                  auctionId: 'audit-auc-101',
                  timestamp: Date.now(),
                  timeout: 1500,
                  adUnitCodes: ['div-gpt-ad-leaderboard', 'div-gpt-ad-mrec']
                });
                emitEvent('bidRequested', {
                  auctionId: 'audit-auc-101',
                  bidderCode: 'appnexus',
                  bids: [{ adUnitCode: 'div-gpt-ad-leaderboard', bidId: 'b1' }]
                });
                emitEvent('bidResponse', {
                  auctionId: 'audit-auc-101',
                  bidderCode: 'appnexus',
                  adUnitCode: 'div-gpt-ad-leaderboard',
                  cpm: 3.80,
                  currency: 'USD',
                  timeToRespond: 180,
                  adId: 'ad-win-01'
                });
                emitEvent('auctionEnd', {
                  auctionId: 'audit-auc-101',
                  bidderRequests: [
                    {
                      bidderCode: 'appnexus',
                      bids: [{ adUnitCode: 'div-gpt-ad-leaderboard', ortb2Imp: { ext: { data: { audigent: ['seg1'] } } } }]
                    }
                  ]
                });
                emitEvent('bidWon', _winningBids[0]);
              </script>
            </head>
            <body>
              <div id="div-gpt-ad-leaderboard"></div>
              <div id="div-gpt-ad-mrec"></div>
            </body>
          </html>
        `,
      });
    });
    await page.goto('https://example.com/synthetic-prebid-audit');
    await page.waitForLoadState('domcontentloaded');
    // 1. Extract Ground Truth directly from page runtime
    const groundTruth = await extractPageTruth(page);
    expect(groundTruth.installedModules.length).toBe(5);
    expect(groundTruth.events.length).toBe(5);
    // 2. Extract Extension Captured State
    const capturedState = await extractExtensionCapturedState(page, extension.serviceWorker);
    expect(capturedState.version).toBe('11.29.0');
    // 3. Reconcile & Audit
    const report = reconcilePrebidSurface(groundTruth, capturedState, 'https://example.com/synthetic-prebid-audit');
    const mdReport = formatAuditReportMarkdown(report);
    writeReport('surface-audit-report.md', mdReport);
    writeReport('surface-audit-report.json', JSON.stringify(report, null, 2));
    // 4. Assert 100% Surface Match
    expect(report.overallPassed, 'All Prebid data domains should match 100%').toBe(true);
    expect(report.domains.version.passed).toBe(true);
    expect(report.domains.modules.passed).toBe(true);
    expect(report.domains.config.passed).toBe(true);
    expect(report.domains.events.passed).toBe(true);
    expect(report.domains.userIds.passed).toBe(true);
  });
  test('validates live site Prebid surface when URL env is provided', async ({ extension, liveSite }) => {
    const targetUrl = process.env.AUDIT_URL || process.env.URL;
    test.skip(!targetUrl, 'Set AUDIT_URL (or run npm run audit:surface -- --url <url>) to audit a live page.');
    test.setTimeout(90000);
    await liveSite.open(targetUrl!);
    const { page } = liveSite;
    expect(await liveSite.waitForAuctionEnd(), `Prebid.js should run an auction on ${targetUrl}`).toBe(true);

    const groundTruth = await extractPageTruth(page);
    const capturedState = await extractExtensionCapturedState(page, extension.serviceWorker);
    const report = reconcilePrebidSurface(groundTruth, capturedState, targetUrl!);
    writeReport('live-surface-audit.md', formatAuditReportMarkdown(report));

    expect(report.domains.version.passed).toBe(true);
    expect(report.domains.modules.passed).toBe(true);
    expect(report.domains.config.passed).toBe(true);
  });
});
