import { describe, it, expect } from 'vitest';
import { reconcilePrebidSurface, formatAuditReportMarkdown, PrebidGroundTruth, ExtensionCapturedState } from './surfaceReconciler';

describe('surfaceReconciler', () => {
  it('passes 100% when ground truth matches captured state perfectly', () => {
    const truth: PrebidGroundTruth = {
      namespace: 'pbjs',
      version: '11.29.0',
      installedModules: ['appnexusBidAdapter', 'rubiconBidAdapter', 'criteoIdSystem'],
      config: {
        debug: true,
        bidderTimeout: 1500,
        userSync: { syncEnabled: true },
      },
      bidderSettings: { standard: { adserverTargeting: [] } },
      eids: [{ source: 'criteo.com', uids: [{ id: 'uid-123' }] }],
      adUnits: [{ code: 'leaderboard', mediaTypes: { banner: { sizes: [[728, 90]] } } }],
      events: [
        { eventType: 'auctionInit', args: { auctionId: 'a1' } },
        { eventType: 'bidRequested', args: { bidderCode: 'appnexus' } },
        { eventType: 'bidResponse', args: { bidderCode: 'appnexus', cpm: 2.5 } },
        { eventType: 'auctionEnd', args: { auctionId: 'a1' } },
        { eventType: 'bidWon', args: { bidderCode: 'appnexus' } },
      ],
      winningBids: [{ bidder: 'appnexus', cpm: 2.5 }],
    };

    const captured: ExtensionCapturedState = {
      namespace: 'pbjs',
      version: '11.29.0',
      installedModules: ['appnexusBidAdapter', 'rubiconBidAdapter', 'criteoIdSystem'],
      config: {
        debug: true,
        bidderTimeout: 1500,
        userSync: { syncEnabled: true },
      },
      bidderSettings: { standard: { adserverTargeting: [] } },
      eids: [{ source: 'criteo.com', uids: [{ id: 'uid-123' }] }],
      events: [
        { eventType: 'auctionInit', args: { auctionId: 'a1' } },
        { eventType: 'bidRequested', args: { bidderCode: 'appnexus' } },
        { eventType: 'bidResponse', args: { bidderCode: 'appnexus', cpm: 2.5 } },
        { eventType: 'auctionEnd', args: { auctionId: 'a1' } },
        { eventType: 'bidWon', args: { bidderCode: 'appnexus' } },
      ],
      mcpSnapshot: {
        adUnitsCount: 1,
        winningBids: [{ bidder: 'appnexus', cpm: 2.5 }],
      },
    };

    const report = reconcilePrebidSurface(truth, captured, 'https://test-site.com');
    expect(report.overallPassed).toBe(true);
    expect(report.domains.version.passed).toBe(true);
    expect(report.domains.modules.passed).toBe(true);
    expect(report.domains.config.passed).toBe(true);
    expect(report.domains.events.passed).toBe(true);
    expect(report.domains.userIds.passed).toBe(true);
    expect(report.domains.bids.passed).toBe(true);

    const md = formatAuditReportMarkdown(report);
    expect(md).toContain('PASS (100% Surface Match)');
    expect(md).toContain('11.29.0');
  });

  it('detects missing config keys, missing modules, and dropped events', () => {
    const truth: PrebidGroundTruth = {
      namespace: 'pbjs',
      version: '11.29.0',
      installedModules: ['appnexusBidAdapter', 'rubiconBidAdapter', 'rtdModule'],
      config: {
        debug: true,
        realTimeData: { dataProviders: [{ name: 'audigent' }] },
      },
      eids: [{ source: 'criteo.com', uids: [{ id: 'uid-1' }] }],
      adUnits: [{ code: 'banner-top' }],
      events: [
        { eventType: 'auctionInit', args: {} },
        { eventType: 'bidResponse', args: {} },
        { eventType: 'bidWon', args: {} },
      ],
      winningBids: [{ bidder: 'appnexus' }],
    };

    const captured: ExtensionCapturedState = {
      namespace: 'pbjs',
      version: '11.29.0',
      installedModules: ['appnexusBidAdapter'],
      config: {
        debug: true,
      },
      eids: [],
      events: [{ eventType: 'auctionInit', args: {} }],
      mcpSnapshot: {
        adUnitsCount: 0,
        winningBids: [],
      },
    };

    const report = reconcilePrebidSurface(truth, captured, 'https://broken-test.com');
    expect(report.overallPassed).toBe(false);
    expect(report.domains.modules.passed).toBe(false);
    expect(report.domains.modules.details.missing).toContain('rubiconBidAdapter');
    expect(report.domains.config.passed).toBe(false);
    expect(report.domains.config.details.missing).toContain('realTimeData');
    expect(report.domains.events.passed).toBe(false);
    expect(report.domains.events.details.missing).toContain('bidResponse');
    expect(report.domains.userIds.passed).toBe(false);

    const md = formatAuditReportMarkdown(report);
    expect(md).toContain('FAIL (Discrepancies Found)');
    expect(md).toContain('Discrepancy in Configuration');
  });
});
