import { test, expect, chromium, BrowserContext, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { autoAcceptConsent } from '../fixtures/cmpConsentHandlers';
import { reconcilePrebidSurface, formatAuditReportMarkdown, PrebidGroundTruth, ExtensionCapturedState } from '../../utils/audit/surfaceReconciler';
test.describe('Professor Prebid Data Surface Audit E2E', () => {
  let browserContext: BrowserContext;
  let serviceWorker: any;
  test.beforeAll(async () => {
    const pathToExtension = path.join(__dirname, '../../build');
    const userDataDir = path.join(__dirname, '../../test-results/audit_user_data_dir_' + Date.now());
    const isHeadless = process.env.HEADED !== 'true' && process.env.HEADLESS !== 'false';
    const args = [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`, '--no-sandbox', '--disable-web-security'];
    if (isHeadless) {
      args.push('--headless=new');
    }
    browserContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      bypassCSP: true,
      args,
    });
    let retries = 15;
    while (retries > 0) {
      const workers = browserContext.serviceWorkers();
      if (workers.length > 0) {
        serviceWorker = workers[0];
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
      retries--;
    }
    if (!serviceWorker) {
      serviceWorker = await browserContext.waitForEvent('serviceworker', { timeout: 8000 }).catch(() => null);
    }
    if (!serviceWorker) {
      throw new Error('Service worker could not be loaded.');
    }
  });
  test.afterAll(async () => {
    if (browserContext) {
      await browserContext.close();
    }
  });
  /**
   * Helper: Extracts Page Truth directly from the window scope.
   */
  const extractPageTruth = async function(page: Page): Promise<PrebidGroundTruth> {
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
  }
  /**
   * Helper: Extracts Extension Captured State from chrome.storage.local & MCP bridge.
   */
  const extractExtensionCapturedState = async function(page: Page): Promise<ExtensionCapturedState> {
    // 1. Poll chrome.storage.local for tab_info to settle
    let prebidData: any = null;
    let foundNamespace = 'pbjs';
    let retries = 15;
    while (retries > 0 && !prebidData) {
      await page.waitForTimeout(400);
      const storageData = await serviceWorker.evaluate(async () => {
        return await chrome.storage.local.get(null);
      });
      const tabKeys = Object.keys(storageData).filter((k) => k.startsWith('tab_info_'));
      for (const key of tabKeys) {
        const frames = storageData[key] || {};
        for (const frameId of Object.keys(frames)) {
          const frame = frames[frameId];
          if (frame.prebids && Object.keys(frame.prebids).length > 0) {
            foundNamespace = Object.keys(frame.prebids)[0];
            prebidData = frame.prebids[foundNamespace];
            break;
          }
        }
        if (prebidData) break;
      }
      retries--;
    }
    // 4. Fetch events if stored as object URL blob
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
    // 5. Read MCP Snapshot if bridge is available
    const mcpSnapshot = await page
      .evaluate(() => {
        document.dispatchEvent(new CustomEvent('PP_MCP_BRIDGE_ENABLE'));
        const win = window as any;
        return win.__PROFESSOR_PREBID_MCP__?.getSnapshot ? win.__PROFESSOR_PREBID_MCP__.getSnapshot() : null;
      })
      .catch(() => null);
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
  }
  test('validates 100% surface capture on comprehensive Prebid scenario', async () => {
    const page = await browserContext.newPage();
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
    const capturedState = await extractExtensionCapturedState(page);
    expect(capturedState.version).toBe('11.29.0');
    // 3. Reconcile & Audit
    const report = reconcilePrebidSurface(groundTruth, capturedState, 'https://example.com/synthetic-prebid-audit');
    const mdReport = formatAuditReportMarkdown(report);
    // Write artifact report to reports/
    const reportDir = path.join(__dirname, '../../reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    fs.writeFileSync(path.join(reportDir, 'surface-audit-report.md'), mdReport);
    fs.writeFileSync(path.join(reportDir, 'surface-audit-report.json'), JSON.stringify(report, null, 2));
    // 4. Assert 100% Surface Match
    expect(report.overallPassed, 'All Prebid data domains should match 100%').toBe(true);
    expect(report.domains.version.passed).toBe(true);
    expect(report.domains.modules.passed).toBe(true);
    expect(report.domains.config.passed).toBe(true);
    expect(report.domains.events.passed).toBe(true);
    expect(report.domains.userIds.passed).toBe(true);
    await page.close();
  });
  test('validates live site Prebid surface when URL env is provided', async () => {
    const targetUrl = process.env.AUDIT_URL || process.env.URL;
    if (!targetUrl) {
      test.skip();
      return;
    }
    test.setTimeout(60000);
    const page = await browserContext.newPage();
    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    } catch {}
    await page.waitForTimeout(2000);
    await autoAcceptConsent(page);
    await page.waitForTimeout(6000);
    const hasPrebid = await page.evaluate(() => {
      const win = window as any;
      return !!(win.pbjs || (win._pbjsGlobals && win[win._pbjsGlobals[0]]));
    });
    if (!hasPrebid) {
      await page.close();
      return;
    }
    const groundTruth = await extractPageTruth(page);
    const capturedState = await extractExtensionCapturedState(page);
    const report = reconcilePrebidSurface(groundTruth, capturedState, targetUrl);
    const mdReport = formatAuditReportMarkdown(report);
    const reportDir = path.join(__dirname, '../../reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    fs.writeFileSync(path.join(reportDir, 'live-surface-audit.md'), mdReport);
    expect(report.domains.version.passed).toBe(true);
    expect(report.domains.modules.passed).toBe(true);
    expect(report.domains.config.passed).toBe(true);
    await page.close();
  });
});
