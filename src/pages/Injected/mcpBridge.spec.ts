import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfessorPrebidMcpBridge, initProfessorPrebidMcpBridge } from './mcpBridge';

describe('ProfessorPrebidMcpBridge', () => {
  let bridge: ProfessorPrebidMcpBridge;

  beforeEach(() => {
    delete (window as any).__PROFESSOR_PREBID_MCP__;
    delete (window as any).pbjs;
    delete (window as any).googletag;
    delete (window as any).__tcfapi;
    delete (window as any).__gpp;
    bridge = new ProfessorPrebidMcpBridge();
  });

  it('initializes and reports bridge version', () => {
    expect(bridge.bridgeVersion).toBe('1.0.0');
    const version = bridge.getVersion();
    expect(version.bridgeVersion).toBe('1.0.0');
    expect(version.prebidVersion).toBe('not_detected');
  });

  it('detects devtoolsMcp module when present in pbjs.installedModules', () => {
    (window as any).pbjs = {
      version: '11.29.0',
      installedModules: ['appnexusBidAdapter', 'devtoolsMcp'],
    };
    expect(bridge.hasDevtoolsMcp()).toBe(true);
    expect(bridge.getVersion().prebidVersion).toBe('11.29.0');
    expect(bridge.getInstalledModules()).toEqual(['appnexusBidAdapter', 'devtoolsMcp']);
  });

  it('detects devtoolsMcp when standalone flag is present on window', () => {
    (window as any).pbjs = {
      version: '8.50.0',
      installedModules: ['rubiconBidAdapter'],
    };
    (window as any).__PREBID_DEVTOOLS_MCP__ = { version: '1.0.0' };
    expect(bridge.hasDevtoolsMcp()).toBe(true);
  });

  it('returns winning bids correctly', () => {
    const mockWinningBids = [{ adUnitCode: 'slot-1', bidder: 'appnexus', cpm: 2.5, currency: 'USD' }];
    (window as any).pbjs = {
      getAllWinningBids: vi.fn().mockReturnValue(mockWinningBids),
    };
    expect(bridge.getWinningBids()).toEqual(mockWinningBids);
  });

  it('aggregates auctions and events with filtering', () => {
    const mockEvents = [
      {
        eventType: 'bidRequested',
        args: {
          auctionId: 'auction-123',
          bidderCode: 'appnexus',
          bids: [{ adUnitCode: 'banner-1', bidId: 'b1' }],
        },
      },
      {
        eventType: 'bidResponse',
        args: {
          auctionId: 'auction-123',
          bidderCode: 'appnexus',
          adUnitCode: 'banner-1',
          cpm: 3.2,
          currency: 'USD',
          timeToRespond: 180,
        },
      },
      {
        eventType: 'noBid',
        args: {
          auctionId: 'auction-123',
          bidderCode: 'rubicon',
          adUnitCode: 'banner-1',
        },
      },
      {
        eventType: 'bidWon',
        args: {
          auctionId: 'auction-123',
          bidderCode: 'appnexus',
          adUnitCode: 'banner-1',
          cpm: 3.2,
          currency: 'USD',
        },
      },
    ];

    (window as any).pbjs = {
      getEvents: vi.fn().mockReturnValue(mockEvents),
    };

    const auctions = bridge.getAuctions();
    expect(auctions.length).toBe(1);
    expect(auctions[0].auctionId).toBe('auction-123');
    expect(auctions[0].bidsReceived.length).toBe(1);
    expect(auctions[0].bidsReceived[0].cpm).toBe(3.2);
    expect(auctions[0].noBids.length).toBe(1);
    expect(auctions[0].winningBids.length).toBe(1);

    const filteredAuctions = bridge.getAuctions({ adUnitCode: 'non-existent' });
    expect(filteredAuctions[0].bidsReceived.length).toBe(0);
  });

  it('computes latency summary and identifies timeouts', () => {
    (window as any).PREBID_TIMEOUT = 1000;
    const mockEvents = [
      {
        eventType: 'bidRequested',
        args: { bids: [{}, {}] },
      },
      {
        eventType: 'bidResponse',
        args: { bidderCode: 'appnexus', timeToRespond: 200, cpm: 1.5 },
      },
      {
        eventType: 'bidResponse',
        args: { bidderCode: 'rubicon', timeToRespond: 400, cpm: 2.0 },
      },
      {
        eventType: 'bidTimeout',
        args: ['criteo'],
      },
      {
        eventType: 'noBid',
        args: {},
      },
    ];

    (window as any).pbjs = {
      getEvents: vi.fn().mockReturnValue(mockEvents),
    };

    const summary = bridge.getLatencySummary();
    expect(summary.averageLatencyMs).toBe(300);
    expect(summary.minLatencyMs).toBe(200);
    expect(summary.maxLatencyMs).toBe(400);
    expect(summary.timeoutSettingMs).toBe(1000);
    expect(summary.timeouts).toContain('criteo');
    expect(summary.totalBidsReceived).toBe(2);
    expect(summary.totalNoBids).toBe(1);
  });

  it('queries Google Ad Manager targeting key-values', () => {
    (window as any).googletag = {
      pubads: () => ({
        getSlots: () => [
          {
            getSlotElementId: () => 'ad-slot-1',
            getTargetingKeys: () => ['hb_pb', 'hb_bidder'],
            getTargeting: (key: string) => (key === 'hb_pb' ? ['2.50'] : ['appnexus']),
          },
        ],
      }),
    };

    const targeting = bridge.getGamTargeting();
    expect(targeting['ad-slot-1']).toBeDefined();
    expect(targeting['ad-slot-1']['hb_pb']).toEqual(['2.50']);
    expect(targeting['ad-slot-1']['hb_bidder']).toEqual(['appnexus']);
  });

  it('reads GAM targeting through the current GPT API without deprecated getters', () => {
    const deprecated = vi.fn(() => {
      throw new Error('deprecated GPT method called');
    });
    (window as any).googletag = {
      pubads: () => ({
        getSlots: () => [
          {
            getSlotElementId: () => 'ad-slot-1',
            getConfig: () => ({ targeting: { hb_pb: '2.50', hb_bidder: ['appnexus'] } }),
            getTargetingKeys: deprecated,
            getTargeting: deprecated,
          },
          { getSlotElementId: () => 'ad-slot-no-api' },
        ],
      }),
    };

    const targeting = bridge.getGamTargeting();
    expect(targeting['ad-slot-1']).toEqual({ hb_pb: ['2.50'], hb_bidder: ['appnexus'] });
    expect(targeting['ad-slot-no-api']).toEqual({});
    expect(deprecated).not.toHaveBeenCalled();
  });

  it('queries TCF consent status via __tcfapi', () => {
    (window as any).__tcfapi = vi.fn((cmd, version, cb) => {
      cb({ gdprApplies: true, tcString: 'CP12345EXAMPLE', tcfPolicyVersion: 2, cmpLoaded: true }, true);
    });

    const consent = bridge.getConsentStatus();
    expect(consent.gdprApplies).toBe(true);
    expect(consent.tcString).toBe('CP12345EXAMPLE');
  });

  it('queries GPP consent status via __gpp', () => {
    (window as any).__gpp = vi.fn((cmd, cb) => {
      cb({ gppString: 'DBABMA~CP12345EXAMPLE' }, true);
    });

    const consent = bridge.getConsentStatus();
    expect(consent.gppString).toBe('DBABMA~CP12345EXAMPLE');
  });

  it('handles errors gracefully in getWinningBids, getGamTargeting, and getConsentStatus', () => {
    (window as any).pbjs = {
      getAllWinningBids: () => {
        throw new Error('getAllWinningBids error');
      },
    };
    expect(bridge.getWinningBids()).toEqual([]);

    (window as any).googletag = {
      pubads: () => {
        throw new Error('pubads error');
      },
    };
    expect(bridge.getGamTargeting()).toEqual({});

    (window as any).__tcfapi = () => {
      throw new Error('tcfapi error');
    };
    expect(bridge.getConsentStatus()).toEqual({});
  });

  it('generates a full diagnostic snapshot and AI prompt with timeouts and GAM slots', () => {
    (window as any).googletag = {
      pubads: () => ({
        getSlots: () => [
          {
            getSlotElementId: () => 'ad-slot-header',
            getTargetingKeys: () => ['hb_pb', 'hb_bidder'],
            getTargeting: (key: string) => (key === 'hb_pb' ? ['3.50'] : ['appnexus']),
          },
        ],
      }),
    };

    (window as any).pbjs = {
      version: '11.29.0',
      installedModules: ['appnexusBidAdapter', 'devtoolsMcp'],
      adUnits: [{ code: 'slot-top' }],
      getAllWinningBids: () => [{ adUnitCode: 'slot-top', bidder: 'appnexus', cpm: 3.5, currency: 'USD' }],
      getEvents: () => [{ eventType: 'bidTimeout', args: ['criteo'] }],
      getUserIdsAsEids: () => [{ source: 'criteo.com', uids: [{ id: '123' }] }],
    };

    const prompt = bridge.generateAiPrompt();
    expect(prompt).toContain('Prebid.js & AdTech Diagnostic Snapshot');
    expect(prompt).toContain('11.29.0');
    expect(prompt).toContain('Timed Out Bidders:** criteo');
    expect(prompt).toContain('ad-slot-header');
    expect(prompt).toContain('hb_bidder=appnexus');
    expect(prompt).toContain('hb_pb=3.50');
  });

  it('initProfessorPrebidMcpBridge creates singleton on window', () => {
    const b1 = initProfessorPrebidMcpBridge();
    const b2 = initProfessorPrebidMcpBridge();
    expect(b1).toBe(b2);
    expect((window as any).__PROFESSOR_PREBID_MCP__).toBe(b1);
  });
});
