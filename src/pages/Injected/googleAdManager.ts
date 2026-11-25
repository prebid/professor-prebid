import { EventBus } from '../Shared/utils';
import { EVENTS } from '../Shared/constants';
import { getSlotTargeting } from '../Shared/gptTargeting';

declare global {
  interface Window {
    googletag: typeof googletag;
  }
}
const MAX_EVENTS_PER_SLOT = 60;

class GoogleAdManager {
  lastMessage: string;
  slotEvents: ISlotEvents = {};
  postAuctionStartTimestamp: number = null;
  postAuctionEndTimestamp: number = null;
  googletag: typeof googletag;
  private hooked = new WeakSet<object>();
  private listening = new WeakSet<object>();

  init() {
    if (window.googletag) this.hook(window.googletag);
    // No stub is left on pages that have not defined googletag themselves: sites test for the global to detect GPT.
    // Watch for the page or gpt.js defining it instead.
    let current = window.googletag;
    try {
      Object.defineProperty(window, 'googletag', {
        configurable: true,
        enumerable: true,
        get: () => current,
        set: (value: typeof googletag) => {
          current = value;
          if (value && typeof value === 'object') this.hook(value);
        },
      });
    } catch (e) {
      // The page made the global non-configurable: only an existing googletag can be hooked.
    }
  }

  private hook(gpt: typeof googletag) {
    this.googletag = gpt;
    if (this.hooked.has(gpt)) return;
    this.hooked.add(gpt);
    // Once gpt.js has loaded, cmd is GPT's own queue object rather than an array. Replacing it would drop every later push by the page.
    if (typeof gpt.cmd?.push !== 'function') {
      (gpt as any).cmd = [];
    }
    gpt.cmd.push(() => this.addEventListeners());
  }

  private pushSlotEvent(slotElementId: string, type: string, timestamp: number) {
    const events = this.slotEvents[slotElementId] || (this.slotEvents[slotElementId] = []);
    events.push({ type, timestamp });
    // Refreshing slots add events for as long as the page lives.
    if (events.length > MAX_EVENTS_PER_SLOT) events.splice(0, events.length - MAX_EVENTS_PER_SLOT);
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
    // The page may assign googletag more than once; listen on each pubads service only once.
    const pubads = this.googletag?.pubads?.();
    if (!pubads || this.listening.has(pubads)) return;
    this.listening.add(pubads);
    this.googletag.pubads().addEventListener('slotRequested', (event) => {
      const slotElementId = event.slot.getSlotElementId();
      const timestamp = Date.now();
      this.updatePostAuctionTimestamps(timestamp);
      this.pushSlotEvent(slotElementId, 'slotRequested', timestamp);
    });

    this.googletag.pubads().addEventListener('slotResponseReceived', (event) => {
      const slotElementId = event.slot.getSlotElementId();
      const timestamp = Date.now();
      this.updatePostAuctionTimestamps(timestamp);
      this.pushSlotEvent(slotElementId, 'slotResponseReceived', timestamp);
      this.sendDetailsToContentScript();
    });

    this.googletag.pubads().addEventListener('slotRenderEnded', (event) => {
      const slotElementId = event.slot.getSlotElementId();
      const timestamp = Date.now();
      this.pushSlotEvent(slotElementId, 'slotRenderEnded', timestamp);
    });

    this.googletag.pubads().addEventListener('slotOnload', (event) => {
      const slotElementId = event.slot.getSlotElementId();
      const timestamp = Date.now();
      this.pushSlotEvent(slotElementId, 'slotOnload', timestamp);
    });

    this.googletag.pubads().addEventListener('slotVisibilityChanged', (event) => {
      const slotElementId = event.slot.getSlotElementId();
      const timestamp = Date.now();
      this.pushSlotEvent(slotElementId, 'slotVisibilityChanged', timestamp);
    });

    this.googletag.pubads().addEventListener('impressionViewable', (event) => {
      const slotElementId = event.slot.getSlotElementId();
      const timestamp = Date.now();
      this.pushSlotEvent(slotElementId, 'impressionViewable', timestamp);
      this.sendDetailsToContentScript();
    });
  }

  getFetchBeforeRefresh(): boolean {
    const gpt = this.googletag as any;
    const events = gpt?.getEventLog?.()?.getAllEvents?.() || [];
    let isFetchBeforeRefresh = false;
    let refreshIndex = null;
    let fetchslotIndex = null;

    for (const e in events) {
      const event = events[e];
      const message = typeof event?.getMessage === 'function' ? event?.getMessage() : null;
      const messageId = typeof message?.getMessageId === 'function' ? message?.getMessageId() : null;

      if (messageId == 70) {
        if (refreshIndex == null) refreshIndex = e;
      } else if (messageId == 3) {
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
    const events = gpt?.getEventLog?.()?.getAllEvents?.() || [];

    let isFetchBeforeKeyvalue = false;
    let fetchslotIndex = null;
    let keyvalueIndex = null;

    for (const e in events) {
      const event = events[e];
      const message = typeof event?.getMessage === 'function' ? event?.getMessage() : null;
      const messageId = typeof message?.getMessageId === 'function' ? message?.getMessageId() : null;

      if (messageId == 3) {
        if (fetchslotIndex == null) {
          fetchslotIndex = e;
        }
      } else if (messageId == 17) {
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
    const events = gpt?.getEventLog?.()?.getAllEvents?.() || [];
    let asyncRendermode = true;
    for (const event of events) {
      const message = event?.getMessage ? event.getMessage() : null;
      const messageId = typeof message?.getMessageId === 'function' ? message.getMessageId() : null;
      const messageArgs = typeof message?.getMessageArgs === 'function' ? message.getMessageArgs() : null;
      if (messageId == 63 && messageArgs?.[0] == 'synchronous rendering') {
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
    return gpt?.pubads?.()?.isSRA?.() || false;
  }

  getSlots(): IGoogleAdManagerSlot[] {
    const gpt = this.googletag as any;
    const googletagSlots: IGoogleAdManagerSlot[] = [];
    const slots = gpt?.pubads?.()?.getSlots?.() || [];
    const viewportWidth = window?.innerWidth || document?.documentElement?.clientWidth || document?.body?.clientWidth;
    const viewportHeight = window?.innerHeight || document?.documentElement?.clientHeight || document?.body?.clientHeight;

    for (const slot of slots) {
      const slotTargeting = Object.entries(getSlotTargeting(slot)).map(([key, values]) => ({
        key,
        value: values.join(','),
      }));

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
      EventBus.emit(EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND, detail);
      this.lastMessage = JSON.stringify(detail);
    }
  }
}

export const googleAdManager = new GoogleAdManager();

export interface IGoogleAdManagerSlot {
  elementId: string;
  name: string;
  sizes: string[];
  targeting: { key: string; value: unknown }[];
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
