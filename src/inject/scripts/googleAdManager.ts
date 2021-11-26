import { sendToContentScript } from '../../utils';
import constants from '../../constants.json';
import logger from '../../logger';

declare global {
  interface Window {
    googletag: googletag.Googletag;
  }
}
class GoogleAdManager {
  lastMessage: string;
  slotEvents: ISlotEvents = {};
  postAuctionStartTimestamp: number = null;
  postAuctionEndTimestamp: number = null;
  googletag: googletag.Googletag;
  init() {
    this.googletag = window.googletag || ({} as googletag.Googletag);
    this.googletag.cmd = this.googletag.cmd || [];
    this.googletag.cmd.push(() => this.addEventListeners());
    // send google ad manager details to content script
    // this.googletag.cmd.push(() => setInterval(() => this.sendDetailsToContentScript(), 1000));
  }

  updatePostAuctionTimestamps(input: number) {
    if (input < this.postAuctionStartTimestamp || this.postAuctionStartTimestamp === null) {
      this.postAuctionStartTimestamp = input;
    }
    if (input > this.postAuctionEndTimestamp || this.postAuctionEndTimestamp === null) {
      this.postAuctionEndTimestamp = input;
    }
  }

  addEventListeners(): void {
    // 1. Adding an event listener for the PubAdsService

    this.googletag.pubads().addEventListener('slotRequested', (event) => {
      const slotElementId = event.slot.getSlotElementId();
      const timestamp = Date.now();
      this.updatePostAuctionTimestamps(timestamp);
      this.slotEvents[slotElementId as keyof ISlotEvents] = [...(this.slotEvents[slotElementId] || []), { type: 'slotRequested', timestamp }];
      logger.log('GPT EVENT: slotRequested', { slotElementId, event });
      // this.sendDetailsToContentScript()
    });

    this.googletag.pubads().addEventListener('slotResponseReceived', (event) => {
      const slotElementId = event.slot.getSlotElementId();
      const timestamp = Date.now();
      this.updatePostAuctionTimestamps(timestamp);
      this.slotEvents[slotElementId as keyof ISlotEvents] = [...(this.slotEvents[slotElementId] || []), { type: 'slotResponseReceived', timestamp }];
      logger.log('GPT EVENT: slotResponseReceived', { slotElementId, event });
      this.sendDetailsToContentScript();
    });

    this.googletag.pubads().addEventListener('slotRenderEnded', (event) => {
      const slotElementId = event.slot.getSlotElementId();
      const timestamp = Date.now();
      this.slotEvents[slotElementId as keyof ISlotEvents] = [...(this.slotEvents[slotElementId] || []), { type: 'slotRenderEnded', timestamp }];
      logger.log('GPT EVENT: slotRenderEnded', { slotElementId, event });
      // this.sendDetailsToContentScript()
    });

    this.googletag.pubads().addEventListener('slotOnload', (event) => {
      const slotElementId = event.slot.getSlotElementId();
      const timestamp = Date.now();
      this.slotEvents[slotElementId as keyof ISlotEvents] = [...(this.slotEvents[slotElementId] || []), { type: 'slotOnload', timestamp }];
      logger.log('GPT EVENT: slotOnload', { slotElementId, event });
      // this.sendDetailsToContentScript()
    });

    this.googletag.pubads().addEventListener('slotVisibilityChanged', (event) => {
      const slotElementId = event.slot.getSlotElementId();
      const timestamp = Date.now();
      this.slotEvents[slotElementId as keyof ISlotEvents] = [...(this.slotEvents[slotElementId] || []), { type: 'slotVisibilityChanged', timestamp }];
      logger.log('GPT EVENT: slotVisibilityChanged', { slotElementId, event });
      // this.sendDetailsToContentScript()
    });

    this.googletag.pubads().addEventListener('impressionViewable', (event) => {
      const slotElementId = event.slot.getSlotElementId();
      const timestamp = Date.now();
      this.slotEvents[slotElementId as keyof ISlotEvents] = [...(this.slotEvents[slotElementId] || []), { type: 'impressionViewable', timestamp }];
      logger.log('GPT EVENT: impressionViewable', { slotElementId, event });
      this.sendDetailsToContentScript();
    });
  }

  getFetchBeforeRefresh(): boolean {
    const gpt = this.googletag as any;
    const events = gpt?.getEventLog()?.getAllEvents() || [];
    let isFetchBeforeRefresh = false;
    let refreshIndex = null;
    let fetchslotIndex = null;

    for (const e in events) {
      const event = events[e];
      const message = event?.getMessage() || null;
      const messageId = message?.getMessageId() || null;

      if (messageId == 70) {
        // refreshing ads
        if (refreshIndex == null) refreshIndex = e;
      } else if (messageId == 3) {
        // fetching ad slot
        if (fetchslotIndex == null) fetchslotIndex = e;
      }
    }

    if (refreshIndex != null && fetchslotIndex != null && parseInt(fetchslotIndex) < parseInt(refreshIndex)) {
      isFetchBeforeRefresh = true;
    }
    return isFetchBeforeRefresh;
  }

  getFetchBeforeKeyValue(): boolean {
    const gpt = this.googletag as any;
    const events = gpt?.getEventLog()?.getAllEvents() || [];

    let isFetchBeforeKeyvalue = false;
    let refreshIndex = null;
    let fetchslotIndex = null;
    let keyvalueIndex = null;

    for (const e in events) {
      const event = events[e];
      const message = event?.getMessage() || null;
      const messageId = message?.getMessageId() || null;

      if (messageId == 70) {
        // refreshing ads
        if (refreshIndex == null) {
          refreshIndex = e;
        }
      } else if (messageId == 3) {
        // fetching ad slot
        if (fetchslotIndex == null) {
          fetchslotIndex = e;
        }
      } else if (messageId == 17) {
        // Setting targeting attribute for ad slot
        if (keyvalueIndex == null) {
          keyvalueIndex = e;
        }
      }
    }

    if (keyvalueIndex != null && fetchslotIndex != null && parseInt(fetchslotIndex) < parseInt(keyvalueIndex)) {
      isFetchBeforeKeyvalue = true;
    }

    return isFetchBeforeKeyvalue;
  }

  getRenderMode(): boolean {
    const gpt = this.googletag as any;
    const events = gpt?.getEventLog()?.getAllEvents() || [];
    let asyncRendermode = true;
    for (const event of events) {
      const message = event?.getMessage ? event.getMessage() : null;
      const messageId = message ? message.getMessageId() : null;
      const messageArgs = message ? message.getMessageArgs() : null;
      if (messageId == 63 && messageArgs[0] == 'synchronous rendering') {
        asyncRendermode = false;
      }
    }
    return asyncRendermode;
  }

  creativeRenderTime(slotElementId: string): number {
    const slotOnLoadEvent = this.slotEvents[slotElementId]?.find((event) => event.type === 'slotOnload');
    const slotRenderEndedEvent = this.slotEvents[slotElementId]?.find((event) => event.type === 'slotRenderEnded');
    if (slotOnLoadEvent && slotRenderEndedEvent) {
      return slotOnLoadEvent.timestamp - slotRenderEndedEvent.timestamp;
    }
  }

  getRequestMode(): boolean {
    const gpt = this.googletag as any;
    return gpt?.pubads()?.isSRA() || false;
  }

  getSlots(): IGoogleAdManagerSlot[] {
    const gpt = this.googletag as any;
    const googletagSlots: IGoogleAdManagerSlot[] = [];
    const slots = gpt?.pubads()?.getSlots() || [];
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    for (const slot of slots) {
      const targetingMap = slot.getTargetingMap();
      const slotTargeting = [];
      for (const targeting in targetingMap) {
        if (targetingMap.hasOwnProperty(targeting)) {
          slotTargeting.push({
            key: targeting,
            value: targetingMap[targeting]?.join(',') || '',
          });
        }
      }

      let sizes = slot.getSizes(viewportWidth, viewportHeight);
      if (!sizes) {
        sizes = slot.getSizes();
      }

      googletagSlots.push({
        elementId: slot.getSlotElementId(),
        name: slot.getAdUnitPath(),
        sizes: sizes ? sizes.map((size: any) => (typeof size == 'string' ? size : size.getWidth() + 'x' + size.getHeight())) : [],
        targeting: slotTargeting,
        creativeRenderTime: this.creativeRenderTime(slot.getSlotElementId()),
      });
    }
    return googletagSlots;
  }

  sendDetailsToContentScript() {
    const detail: IGoogleAdManagerDetails = {
      slots: this.getSlots(),
      sra: this.getRequestMode(),
      async: this.getRenderMode(),
      fetchBeforeRefresh: this.getFetchBeforeRefresh(),
      fetchBeforeKeyvalue: this.getFetchBeforeKeyValue(),
      slotEvents: this.slotEvents,
      postAuctionStartTimestamp: this.postAuctionStartTimestamp,
      postAuctionEndTimestamp: this.postAuctionEndTimestamp,
    };
    if (this.lastMessage !== JSON.stringify(detail)) {
      sendToContentScript(constants.EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND, detail);
      this.lastMessage = JSON.stringify(detail);
    }
  }
}

export const googleAdManager = new GoogleAdManager();

interface IGoogleAdManagerSlot {
  elementId: string;
  name: string;
  sizes: string[];
  targeting: { key: string; value: any }[];
  creativeRenderTime: number;
}

interface ISlotEvents {
  [key: string]: {
    type: string;
    timestamp: number;
  }[];
}

export interface IGoogleAdManagerDetails {
  slots: IGoogleAdManagerSlot[];
  sra: boolean;
  async: boolean;
  fetchBeforeRefresh: boolean;
  fetchBeforeKeyvalue: boolean;
  slotEvents: ISlotEvents;
  postAuctionStartTimestamp: number;
  postAuctionEndTimestamp: number;
}
