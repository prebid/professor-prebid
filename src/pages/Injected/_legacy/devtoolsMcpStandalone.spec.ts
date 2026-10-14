import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('devtoolsMcpStandalone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).__PREBID_DEVTOOLS_MCP_INITIALIZED__;
    delete (window as any).__PREBID_DEVTOOLS_MCP__;
    delete (window as any).pbjs;
    delete (window as any)._pbjsGlobals;
  });

  it('initializes and attaches to existing pbjs instance', async () => {
    const registeredHandlers: { [evt: string]: Function } = {};
    const mockPbjs: any = {
      installedModules: ['dfp', 'appnexusBidAdapter'],
      onEvent: vi.fn((evt: string, cb: Function) => {
        registeredHandlers[evt] = cb;
      }),
    };
    (window as any).pbjs = mockPbjs;

    await import('./devtoolsMcpStandalone');

    expect((window as any).__PREBID_DEVTOOLS_MCP_INITIALIZED__).toBe(true);
    expect((window as any).__PREBID_DEVTOOLS_MCP__).toBeDefined();
    expect(mockPbjs.installedModules).toContain('devtoolsMcp');

    registeredHandlers['auctionInit']?.({ auctionId: 'auc-1', timeout: 3000 });
    registeredHandlers['bidResponse']?.({ auctionId: 'auc-1', cpm: 2.5, bidder: 'appnexus' });
    registeredHandlers['noBid']?.({ auctionId: 'auc-1', bidder: 'rubicon' });
    registeredHandlers['bidWon']?.({ auction: { auctionId: 'auc-1' }, cpm: 2.5, bidder: 'appnexus' });

    const mcp = (window as any).__PREBID_DEVTOOLS_MCP__;
    expect(mcp.version).toBe('1.0.0');
    expect(mcp.getEvents().length).toBe(4);
    expect(mcp.getAuctions().length).toBe(1);
    expect(mcp.getAuctions()[0].bidsReceived.length).toBe(1);
    expect(mcp.getAuctions()[0].noBids.length).toBe(1);
    expect(mcp.getAuctions()[0].winningBids.length).toBe(1);

    const metrics = mcp.getMetrics();
    expect(metrics.totalEvents).toBe(4);
    expect(metrics.totalAuctions).toBe(1);
    expect(metrics.activeInstance).toBe(true);
  });

  it('handles custom _pbjsGlobals and avoids double initialization', async () => {
    const customHandlers: { [evt: string]: Function } = {};
    const customPbjs: any = {
      installedModules: [],
      onEvent: vi.fn((evt: string, cb: Function) => {
        customHandlers[evt] = cb;
      }),
    };
    (window as any)._pbjsGlobals = ['myCustomPbjs'];
    (window as any).myCustomPbjs = customPbjs;

    vi.resetModules();
    await import('./devtoolsMcpStandalone');

    expect((window as any).__PREBID_DEVTOOLS_MCP_INITIALIZED__).toBe(true);
    expect(customPbjs.installedModules).toContain('devtoolsMcp');

    vi.resetModules();
    await import('./devtoolsMcpStandalone');
    expect((window as any).__PREBID_DEVTOOLS_MCP_INITIALIZED__).toBe(true);
  });

  it('handles missing pbjs and records events without auctionId', async () => {
    vi.resetModules();
    await import('./devtoolsMcpStandalone');

    const mcp = (window as any).__PREBID_DEVTOOLS_MCP__;
    expect(mcp.getMetrics().activeInstance).toBe(false);
  });

  it('handles performance.mark errors and onEvent exceptions gracefully', async () => {
    const originalMark = (window as any).performance?.mark;
    (window as any).performance = {
      mark: vi.fn(() => {
        throw new Error('Performance mark restricted');
      }),
    };

    const mockPbjs: any = {
      installedModules: [],
      onEvent: vi.fn(() => {
        throw new Error('onEvent error');
      }),
    };
    (window as any).pbjs = mockPbjs;

    vi.resetModules();
    await import('./devtoolsMcpStandalone');

    if (originalMark) (window as any).performance.mark = originalMark;
  });
});
