(function initDevtoolsMcpStandalone() {
  const win = typeof window !== 'undefined' ? (window as any) : {};
  if (win.__PREBID_DEVTOOLS_MCP_INITIALIZED__) {
    console.info('[Professor Prebid] DevTools MCP Standalone is already active on this page.');
    return;
  }
  win.__PREBID_DEVTOOLS_MCP_INITIALIZED__ = true;

  const pbjs = win.pbjs || (win._pbjsGlobals && win[win._pbjsGlobals[0]]);
  if (!pbjs) {
    console.warn('[Professor Prebid] No Prebid.js instance found on this page yet. Waiting for pbjs...');
  }

  const events: any[] = [];
  const auctionMap = new Map<string, any>();

  const recordEvent = (eventType: string, args: any) => {
    events.push({ eventType, args, timestamp: Date.now() });

    if (args) {
      const auctionId = args.auctionId || args.auction?.auctionId;
      if (auctionId) {
        if (!auctionMap.has(auctionId)) {
          auctionMap.set(auctionId, {
            auctionId,
            timestamp: Date.now(),
            timeout: args.timeout || null,
            bidsReceived: [],
            noBids: [],
            winningBids: [],
          });
        }
        const record = auctionMap.get(auctionId);
        if (eventType === 'bidResponse') {
          record.bidsReceived.push(args);
        } else if (eventType === 'noBid') {
          record.noBids.push(args);
        } else if (eventType === 'bidWon') {
          record.winningBids.push(args);
        }
      }
    }

    try {
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(`prebid:${eventType}`);
      }
    } catch (e) {
      // Ignored
    }
  };

  const attachPbjs = (instance: any) => {
    if (!instance || typeof instance.onEvent !== 'function') return;

    ['auctionInit', 'auctionEnd', 'bidRequested', 'bidResponse', 'noBid', 'bidWon', 'bidTimeout', 'setTargeting'].forEach((evt) => {
      try {
        instance.onEvent(evt, (data: any) => recordEvent(evt, data));
      } catch (e) {
        // Ignored
      }
    });

    // Register devtoolsMcp in installedModules if not present
    if (Array.isArray(instance.installedModules) && !instance.installedModules.includes('devtoolsMcp')) {
      instance.installedModules.push('devtoolsMcp');
    }
  };

  if (pbjs) {
    attachPbjs(pbjs);
  }

  // Intercept future pbjs globals
  if (win._pbjsGlobals && Array.isArray(win._pbjsGlobals)) {
    win._pbjsGlobals.forEach((g: string) => attachPbjs(win[g]));
  }

  win.__PREBID_DEVTOOLS_MCP__ = {
    version: '1.0.0',
    getEvents: () => [...events],
    getAuctions: () => Array.from(auctionMap.values()),
    getMetrics: () => ({
      totalEvents: events.length,
      totalAuctions: auctionMap.size,
      activeInstance: Boolean(win.pbjs),
    }),
  };

  console.info('[Professor Prebid] DevTools MCP Module successfully initialized and attached to Prebid.js.');
})();
