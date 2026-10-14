import { getSlotTargeting } from '../Shared/gptTargeting';

export interface McpAuctionFilter {
  auctionId?: string;
  adUnitCode?: string;
}

export interface McpBidderLatency {
  bidder: string;
  latencyMs: number;
  timedOut: boolean;
  cpm?: number;
  currency?: string;
  adUnitCode?: string;
}

export interface McpLatencySummary {
  averageLatencyMs: number;
  maxLatencyMs: number;
  minLatencyMs: number;
  timeoutSettingMs: number | null;
  totalBidsRequested: number;
  totalBidsReceived: number;
  totalNoBids: number;
  timeouts: string[];
  bidders: McpBidderLatency[];
}

export interface McpConsentStatus {
  gdprApplies?: boolean;
  tcString?: string;
  tcfVersion?: number;
  cmpLoaded?: boolean;
  uspString?: string;
  gppString?: string;
}

export interface McpSnapshot {
  timestamp: number;
  prebidVersion: string;
  hasDevtoolsMcp: boolean;
  installedModules: string[];
  timeoutSettingMs: number | null;
  auctionCount: number;
  adUnitsCount: number;
  winningBidsCount: number;
  winningBids: any[];
  latencySummary: McpLatencySummary;
  gamTargeting: Record<string, Record<string, string[]>>;
  consent: McpConsentStatus;
  userEids: any[];
}

export class ProfessorPrebidMcpBridge {
  readonly bridgeVersion: string = '1.0.0';

  private get pbjs(): any {
    const win = typeof window !== 'undefined' ? (window as any) : {};
    return win.pbjs || (win._pbjsGlobals && win[win._pbjsGlobals[0]]);
  }

  private get googletag(): any {
    const win = typeof window !== 'undefined' ? (window as any) : {};
    return win.googletag;
  }

  getVersion(): { bridgeVersion: string; prebidVersion: string } {
    return {
      bridgeVersion: this.bridgeVersion,
      prebidVersion: this.pbjs?.version || 'not_detected',
    };
  }

  hasDevtoolsMcp(): boolean {
    const win = typeof window !== 'undefined' ? (window as any) : {};
    const modules: string[] = this.pbjs?.installedModules || [];
    return modules.includes('devtoolsMcp') || Boolean(win.__PREBID_DEVTOOLS_MCP__);
  }

  getInstalledModules(): string[] {
    return this.pbjs?.installedModules || [];
  }

  getWinningBids(): any[] {
    try {
      if (typeof this.pbjs?.getAllWinningBids === 'function') {
        return this.pbjs.getAllWinningBids();
      }
    } catch (e) {}
    return [];
  }

  getAuctions(filter?: McpAuctionFilter): any[] {
    const events: any[] = typeof this.pbjs?.getEvents === 'function' ? this.pbjs.getEvents() : [];
    const auctionMap = new Map<string, any>();

    events.forEach((evt) => {
      const type = evt?.eventType;
      const args = evt?.args;
      if (!args) return;

      const auctionId = args.auctionId || args.auction?.auctionId;
      if (!auctionId) return;

      if (filter?.auctionId && filter.auctionId !== auctionId) return;

      if (!auctionMap.has(auctionId)) {
        auctionMap.set(auctionId, {
          auctionId,
          timestamp: args.timestamp || evt.elapsedTime,
          timeout: args.timeout || null,
          adUnitCodes: args.adUnitCodes || [],
          bidsReceived: [],
          noBids: [],
          winningBids: [],
          bidderRequests: [],
        });
      }

      const auction = auctionMap.get(auctionId);
      if (type === 'bidRequested') {
        auction.bidderRequests.push({
          bidder: args.bidderCode || args.bidder,
          bids: args.bids?.map((b: any) => ({
            adUnitCode: b.adUnitCode,
            bidId: b.bidId,
            mediaTypes: b.mediaTypes,
            sizes: b.sizes,
          })),
        });
      } else if (type === 'bidResponse') {
        if (!filter?.adUnitCode || filter.adUnitCode === args.adUnitCode) {
          auction.bidsReceived.push({
            bidder: args.bidderCode || args.bidder,
            adUnitCode: args.adUnitCode,
            cpm: args.cpm,
            currency: args.currency,
            timeToRespond: args.timeToRespond,
            size: args.size,
            mediaType: args.mediaType,
            creativeId: args.creativeId,
          });
        }
      } else if (type === 'noBid') {
        if (!filter?.adUnitCode || filter.adUnitCode === args.adUnitCode) {
          auction.noBids.push({
            bidder: args.bidderCode || args.bidder,
            adUnitCode: args.adUnitCode,
            bidId: args.bidId,
          });
        }
      } else if (type === 'bidWon') {
        if (!filter?.adUnitCode || filter.adUnitCode === args.adUnitCode) {
          auction.winningBids.push({
            bidder: args.bidderCode || args.bidder,
            adUnitCode: args.adUnitCode,
            cpm: args.cpm,
            currency: args.currency,
            size: args.size,
            adId: args.adId,
          });
        }
      }
    });

    return Array.from(auctionMap.values());
  }

  getLatencySummary(): McpLatencySummary {
    const events: any[] = typeof this.pbjs?.getEvents === 'function' ? this.pbjs.getEvents() : [];
    const timeoutSetting = typeof window !== 'undefined' ? (window as any).PREBID_TIMEOUT || null : null;
    const bidders: McpBidderLatency[] = [];
    const timeoutsSet = new Set<string>();

    let totalLatency = 0;
    let maxLatency = 0;
    let minLatency = Infinity;
    let requestedCount = 0;
    let receivedCount = 0;
    let noBidCount = 0;

    events.forEach((evt) => {
      const type = evt?.eventType;
      const args = evt?.args;
      if (!args) return;

      if (type === 'bidRequested') {
        requestedCount += args.bids?.length || 1;
      } else if (type === 'bidResponse') {
        receivedCount += 1;
        const latency = Number(args.timeToRespond) || 0;
        totalLatency += latency;
        if (latency > maxLatency) maxLatency = latency;
        if (latency < minLatency) minLatency = latency;

        bidders.push({
          bidder: args.bidderCode || args.bidder || 'unknown',
          latencyMs: latency,
          timedOut: false,
          cpm: args.cpm,
          currency: args.currency,
          adUnitCode: args.adUnitCode,
        });
      } else if (type === 'bidTimeout') {
        const timedOutBidders = Array.isArray(args) ? args : [args];
        timedOutBidders.forEach((b: any) => {
          const bidderName = typeof b === 'string' ? b : b?.bidder || b?.bidderCode || 'unknown';
          timeoutsSet.add(bidderName);
          bidders.push({
            bidder: bidderName,
            latencyMs: timeoutSetting || 0,
            timedOut: true,
          });
        });
      } else if (type === 'noBid') {
        noBidCount += 1;
      }
    });

    return {
      averageLatencyMs: receivedCount > 0 ? Math.round(totalLatency / receivedCount) : 0,
      maxLatencyMs: maxLatency,
      minLatencyMs: minLatency === Infinity ? 0 : minLatency,
      timeoutSettingMs: timeoutSetting,
      totalBidsRequested: requestedCount,
      totalBidsReceived: receivedCount,
      totalNoBids: noBidCount,
      timeouts: Array.from(timeoutsSet),
      bidders,
    };
  }

  getGamTargeting(): Record<string, Record<string, string[]>> {
    const result: Record<string, Record<string, string[]>> = {};
    try {
      if (this.googletag?.pubads && typeof this.googletag.pubads === 'function') {
        const pubads = this.googletag.pubads();
        const slots = pubads.getSlots ? pubads.getSlots() : [];
        slots.forEach((slot: any) => {
          const slotId = slot.getSlotElementId ? slot.getSlotElementId() : slot.getAdUnitPath();
          result[slotId] = slot.getConfig || slot.getTargetingKeys ? getSlotTargeting(slot) : {};
        });
      }
    } catch (e) {}
    return result;
  }

  getConsentStatus(): McpConsentStatus {
    const status: McpConsentStatus = {};
    const win = typeof window !== 'undefined' ? (window as any) : {};

    try {
      if (typeof win.__tcfapi === 'function') {
        win.__tcfapi('getTCData', 2, (tcData: any, success: boolean) => {
          if (success && tcData) {
            status.gdprApplies = tcData.gdprApplies;
            status.tcString = tcData.tcString;
            status.tcfVersion = tcData.tcfPolicyVersion || 2;
            status.cmpLoaded = tcData.cmpLoaded;
          }
        });
      }
      if (typeof win.__gpp === 'function') {
        win.__gpp('ping', (gppData: any, success: boolean) => {
          if (success && gppData) {
            status.gppString = gppData.gppString;
          }
        });
      }
    } catch (e) {}

    return status;
  }

  getSnapshot(): McpSnapshot {
    const auctions = this.getAuctions();
    const winningBids = this.getWinningBids();
    const latencySummary = this.getLatencySummary();
    const userEids = typeof this.pbjs?.getUserIdsAsEids === 'function' ? this.pbjs.getUserIdsAsEids() : [];
    const adUnitsCount = Array.isArray(this.pbjs?.adUnits) ? this.pbjs.adUnits.length : 0;

    return {
      timestamp: Date.now(),
      prebidVersion: this.pbjs?.version || 'not_detected',
      hasDevtoolsMcp: this.hasDevtoolsMcp(),
      installedModules: this.getInstalledModules(),
      timeoutSettingMs: latencySummary.timeoutSettingMs,
      auctionCount: auctions.length,
      adUnitsCount,
      winningBidsCount: winningBids.length,
      winningBids,
      latencySummary,
      gamTargeting: this.getGamTargeting(),
      consent: this.getConsentStatus(),
      userEids,
    };
  }

  generateAiPrompt(): string {
    const snapshot = this.getSnapshot();
    const url = typeof window !== 'undefined' ? window.location.href : 'unknown';

    let prompt = `## Prebid.js & AdTech Diagnostic Snapshot\n`;
    prompt += `**Page URL:** ${url}\n`;
    prompt += `**Prebid.js Version:** \`${snapshot.prebidVersion}\` | **DevTools MCP Active:** \`${snapshot.hasDevtoolsMcp ? 'Yes' : 'No'}\`\n`;
    prompt += `**Installed Modules (${snapshot.installedModules.length}):** ${snapshot.installedModules.slice(0, 10).join(', ')}${snapshot.installedModules.length > 10 ? '...' : ''}\n\n`;

    prompt += `### Auction Summary\n`;
    prompt += `- **Total Auctions:** ${snapshot.auctionCount}\n`;
    prompt += `- **AdUnits Configured:** ${snapshot.adUnitsCount}\n`;
    prompt += `- **Winning Bids:** ${snapshot.winningBidsCount}\n`;
    prompt += `- **Avg Latency:** ${snapshot.latencySummary.averageLatencyMs}ms (Max: ${snapshot.latencySummary.maxLatencyMs}ms)\n`;
    if (snapshot.latencySummary.timeouts.length > 0) {
      prompt += `- ⚠️ **Timed Out Bidders:** ${snapshot.latencySummary.timeouts.join(', ')}\n`;
    }

    if (snapshot.winningBids.length > 0) {
      prompt += `\n### Winning Bids\n`;
      snapshot.winningBids.forEach((bid: any) => {
        prompt += `- **${bid.adUnitCode || 'Slot'}**: \`${bid.bidderCode || bid.bidder}\` @ **$${bid.cpm} ${bid.currency || 'USD'}** (${bid.size || 'size'})\n`;
      });
    }

    const gamSlots = Object.keys(snapshot.gamTargeting);
    if (gamSlots.length > 0) {
      prompt += `\n### GAM Slots Detected (${gamSlots.length})\n`;
      gamSlots.slice(0, 5).forEach((slotId) => {
        const keys = snapshot.gamTargeting[slotId];
        const pb = keys['hb_pb'] ? keys['hb_pb'].join(',') : 'none';
        const bidder = keys['hb_bidder'] ? keys['hb_bidder'].join(',') : 'none';
        prompt += `- **${slotId}**: \`hb_bidder=${bidder}\`, \`hb_pb=${pb}\`\n`;
      });
    }

    prompt += `\n### Diagnostic Question\n`;
    prompt += `Please analyze the auction performance, bidder latencies, targeting parameters, and check for any configuration anomalies or revenue loss risks.`;

    return prompt;
  }
}

export const initProfessorPrebidMcpBridge = (): ProfessorPrebidMcpBridge => {
  const win = typeof window !== 'undefined' ? (window as any) : {};
  if (!win.__PROFESSOR_PREBID_MCP__) {
    win.__PROFESSOR_PREBID_MCP__ = new ProfessorPrebidMcpBridge();
  }
  return win.__PROFESSOR_PREBID_MCP__;
};
