import { Page, TestInfo } from '@playwright/test';

export interface SimulatedBidder {
  bidderCode: string;
  cpm?: number;
  currency?: string;
  timeToRespond?: number;
  timedOut?: boolean;
  noBid?: boolean;
  adUnitCode?: string;
  size?: number[];
}

export interface SimulatedAuctionOptions {
  auctionId?: string;
  adUnitCode?: string;
  timeout?: number;
  bidders: SimulatedBidder[];
  winningBidder?: string;
  gamSlotId?: string;
}

export const waitForMcpBridge = async function(page: Page, timeoutMs: number = 10000): Promise<void> {
  await page.waitForFunction(
    () => {
      const win = window as any;
      if (typeof win.__PROFESSOR_PREBID_MCP__ !== 'undefined') return true;
      document.dispatchEvent(new CustomEvent('PP_MCP_BRIDGE_ENABLE'));
      return false;
    },
    null,
    { timeout: timeoutMs }
  );
}

export const simulatePrebidAuction = async function(page: Page, options: SimulatedAuctionOptions): Promise<void> {
  const auctionId = options.auctionId || `auction-${Date.now()}`;
  const adUnitCode = options.adUnitCode || 'div-gpt-ad-leaderboard';
  const timeout = options.timeout || 1000;

  await page.evaluate(
    ({ auctionId, adUnitCode, timeout, bidders, winningBidder, gamSlotId }) => {
      const win = window as any;
      win.pbjs = win.pbjs || {};
      win.pbjs.que = win.pbjs.que || [];
      const storedEvents = win.pbjs.getEvents ? win.pbjs.getEvents() : [];

      const emit = (eventType: string, args: any) => {
        const eventObj = { eventType, args, elapsedTime: Date.now() };
        storedEvents.push(eventObj);
        if (win.pbjs._eventListeners && win.pbjs._eventListeners[eventType]) {
          win.pbjs._eventListeners[eventType].forEach((fn: any) => fn(args));
        }
      };

      // 1. auctionInit
      emit('auctionInit', {
        auctionId,
        timestamp: Date.now(),
        timeout,
        adUnitCodes: [adUnitCode],
      });

      // 2. bidRequested
      emit('bidRequested', {
        auctionId,
        bidderCode: 'header_bidding',
        bids: bidders.map((b, idx) => ({
          adUnitCode: b.adUnitCode || adUnitCode,
          bidId: `bid-${idx}`,
          sizes: [b.size || [300, 250]],
        })),
      });

      // 3. Bid responses / no-bids / timeouts
      const timedOutBidders: string[] = [];

      bidders.forEach((b, idx) => {
        const slotCode = b.adUnitCode || adUnitCode;
        if (b.timedOut) {
          timedOutBidders.push(b.bidderCode);
        } else if (b.noBid) {
          emit('noBid', {
            auctionId,
            bidderCode: b.bidderCode,
            adUnitCode: slotCode,
            bidId: `bid-${idx}`,
          });
        } else {
          emit('bidResponse', {
            auctionId,
            bidderCode: b.bidderCode,
            adUnitCode: slotCode,
            cpm: b.cpm ?? 2.5,
            currency: b.currency || 'USD',
            timeToRespond: b.timeToRespond || 220,
            size: b.size ? `${b.size[0]}x${b.size[1]}` : '300x250',
            creativeId: `cr-${idx}`,
            adId: `ad-${idx}`,
          });
        }
      });

      if (timedOutBidders.length > 0) {
        emit('bidTimeout', timedOutBidders);
      }

      // 4. auctionEnd
      emit('auctionEnd', { auctionId });

      // 5. Winning bid & GAM targeting
      if (winningBidder) {
        const winner = bidders.find((b) => b.bidderCode === winningBidder);
        const winCpm = winner?.cpm ?? 2.5;
        const winSize = winner?.size ? `${winner.size[0]}x${winner.size[1]}` : '300x250';

        emit('bidWon', {
          auctionId,
          bidderCode: winningBidder,
          adUnitCode,
          cpm: winCpm,
          currency: winner?.currency || 'USD',
          size: winSize,
          adId: 'ad-winner',
        });

        // Setup GAM slot mock targeting if googletag exists
        if (gamSlotId && win.googletag?.pubads) {
          const slots = win.googletag.pubads().getSlots ? win.googletag.pubads().getSlots() : [];
          let slot = slots.find((s: any) => s.getSlotElementId && s.getSlotElementId() === gamSlotId);
          if (!slot) {
            const targetingStore: Record<string, string[]> = {
              hb_bidder: [winningBidder],
              hb_pb: [winCpm.toFixed(2)],
              hb_size: [winSize],
              hb_adid: ['ad-winner'],
            };
            slot = {
              getSlotElementId: () => gamSlotId,
              getTargetingKeys: () => Object.keys(targetingStore),
              getTargeting: (k: string) => targetingStore[k] || [],
            };
            slots.push(slot);
          }
        }
      }
    },
    {
      auctionId,
      adUnitCode,
      timeout,
      bidders: options.bidders,
      winningBidder: options.winningBidder,
      gamSlotId: options.gamSlotId,
    }
  );
}

/**
 * Attaches AI diagnostic context to Playwright test report if a test failed.
 */
export const attachAiDiagnosticOnFailure = async function(testInfo: TestInfo, page: Page): Promise<void> {
  if (testInfo.status !== testInfo.expectedStatus) {
    try {
      const aiPrompt = await page.evaluate(() => {
        const win = window as any;
        return win.__PROFESSOR_PREBID_MCP__?.generateAiPrompt ? win.__PROFESSOR_PREBID_MCP__.generateAiPrompt() : null;
      });
      if (aiPrompt) {
        await testInfo.attach('ai-diagnostic-snapshot.md', {
          body: aiPrompt,
          contentType: 'text/markdown',
        });
      }
    } catch (e) {
      console.warn('Could not extract AI diagnostic context on test failure:', e);
    }
  }
}
