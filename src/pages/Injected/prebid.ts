import type { AdUnit, AdUnitBid, Bid, BidderRequest, Config, EventRecord, EventPayload, PrebidJS } from 'prebid.js';
import { POPUP_LOADED, EVENTS} from '../Shared/constants';
import { EventBus} from '../Shared/utils';

export type { AdUnit, AdUnitBid, Bid, BidderRequest, Config, EventRecord, EventPayload, PrebidJS };

export class Prebid {
  globalPbjs: PrebidJS = window.pbjs;
  namespace: string;
  frameId: string | null;
  lastTimeUpdateSentToContentScript: number = 0;
  updateTimeout: ReturnType<typeof setTimeout> | null = null;
  updateRateInterval: number = 2500;
  sendToContentScriptPending: boolean = false;
  events: any[] = [];
  eventsApi: boolean = false;
  listenersAdded: boolean = false;
  hasQueuedListenerHook: boolean = false;
  lastEventsUrl: string | null = null;
  staleUrlRevokeDelay: number = 30000;

  constructor(namespace: string, iframeId: string | null) {
    this.namespace = namespace;
    this.frameId = iframeId;
    this.globalPbjs = window[namespace as keyof Window];
    this.eventsApi = typeof this.globalPbjs?.getEvents === 'function' || false;
    this.addEventListeners();
    this.throttle(this.sendDetailsToBackground);
  }

  addEventListeners = (): void => {
    this.globalPbjs = window[this.namespace as keyof Window] || this.globalPbjs;
    this.eventsApi = typeof this.globalPbjs?.getEvents === 'function' || false;

    const pushEvent = (eventType: string, args: any) => {
      if (this.events.length >= 500) {
        this.events.shift();
      }
      this.events.push({ eventType, args });
    };

    if (typeof this.globalPbjs?.onEvent !== 'function') {
      if (!this.hasQueuedListenerHook && this.globalPbjs?.que && Array.isArray(this.globalPbjs.que)) {
        this.hasQueuedListenerHook = true;
        this.globalPbjs.que.push(() => {
          this.addEventListeners();
          this.throttle(this.sendDetailsToBackground);
        });
      }
      return;
    }

    if (this.listenersAdded) return;
    this.listenersAdded = true;

    this.globalPbjs.onEvent('auctionInit', (auctionInitData) => {
      if (!this.eventsApi) {
        pushEvent('auctionInit', auctionInitData);
      }
      this.throttle(this.sendDetailsToBackground);
    });

    this.globalPbjs.onEvent('auctionEnd', (auctionEndData) => {
      if (!this.eventsApi) {
        pushEvent('auctionEnd', auctionEndData);
      }
      this.throttle(this.sendDetailsToBackground);
    });

    this.globalPbjs.onEvent('bidRequested', (bidRequestedData) => {
      if (!this.eventsApi) {
        pushEvent('bidRequested', bidRequestedData);
      }
      this.throttle(this.sendDetailsToBackground);
    });

    this.globalPbjs.onEvent('bidResponse', (bidResponseData) => {
      if (!this.eventsApi) {
        pushEvent('bidResponse', bidResponseData);
      }
      this.throttle(this.sendDetailsToBackground);
    });

    this.globalPbjs.onEvent('noBid', (noBidData) => {
      if (!this.eventsApi) {
        pushEvent('noBid', noBidData);
      }
      this.throttle(this.sendDetailsToBackground);
    });

    this.globalPbjs.onEvent('bidWon', (bidWonData) => {
      if (!this.eventsApi) {
        pushEvent('bidWon', bidWonData);
      }
      this.throttle(this.sendDetailsToBackground);
    });

    window.addEventListener(
      'message',
      (event) => {
        if (event.source !== window || event.origin !== window.origin) return;
        if (!event.data.profPrebid) return;
        if (event.data.type === POPUP_LOADED) {
          this.sendDetailsToBackground();
        }
      },
      false
    );
  };

  getDebugConfig = () => {
    const pbjsDebugString = window.sessionStorage.getItem('pbjs:debugging');
    try {
      return JSON.parse(pbjsDebugString);
    } catch (e) {
      console.error(e);
    }
  };

  getEventsObjUrl = () => {
    const events = this.globalPbjs?.getEvents ? this.globalPbjs.getEvents() : this.events;

    const safeStringify = (obj: any): string => {
      const ancestors: any[] = [];
      return JSON.stringify(obj, function (key, value) {
        if (value instanceof Window || value instanceof Node || value instanceof HTMLElement) {
          return '[DOM Node]';
        }
        if (typeof value !== 'object' || value === null) {
          return value;
        }

        while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) {
          ancestors.pop();
        }
        if (ancestors.includes(value)) {
          return '[Circular]';
        }
        ancestors.push(value);
        return value;
      });
    };

    const string = `[${events
      .map((event) => {
        let processedEvent = event;
        if (event?.eventType === 'adRenderSucceeded' && event?.args?.doc) {
          processedEvent = {
            ...event,
            args: {
              ...event.args,
              doc: 'pruned by Prof. Prebid',
            },
          };
        }
        try {
          return safeStringify(processedEvent);
        } catch (error) {
          return JSON.stringify({
            eventType: event.eventType,
            args: { error: 'Prof. Prebid could not stringify this event.' },
            elapsedTime: event.elapsedTime,
          });
        }
      })
      .join()}]`;

    if (string === '[]') return null;
    const blob = new Blob([string], { type: 'application/json' });
    const objectURL = URL.createObjectURL(blob);
    if (this.lastEventsUrl) {
      // The popup/panel may still be downloading the previous URL, so free it only after a grace period.
      const staleUrl = this.lastEventsUrl;
      setTimeout(() => URL.revokeObjectURL(staleUrl), this.staleUrlRevokeDelay);
    }
    this.lastEventsUrl = objectURL;
    return objectURL;
  };

  sendDetailsToBackground = (): void => {
    const run = () => {
      this.globalPbjs = window[this.namespace as keyof Window] || this.globalPbjs;
      // Empty logs produce no URL but are still reported, so Prebid is detected before its first auction.
      const eventsUrl = this.getEventsObjUrl() || '';
      const config = typeof this.globalPbjs?.getConfig === 'function' ? this.globalPbjs.getConfig() : ({} as Config);
      const eids = typeof this.globalPbjs?.getUserIdsAsEids === 'function' ? this.globalPbjs.getUserIdsAsEids() : [];
      const timeout = window.PREBID_TIMEOUT || null;
      const prebidDetail: IPrebidDetails = {
        config,
        debug: this.getDebugConfig(),
        eids,
        events: [],
        eventsUrl,
        namespace: this.namespace,
        frameId: this.frameId,
        installedModules: this.globalPbjs?.installedModules || [],
        timeout,
        version: this.globalPbjs?.version || '',
        bidderSettings: this.globalPbjs?.bidderSettings,
      };
      EventBus.emit(EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND, prebidDetail);
      this.sendToContentScriptPending = false;
    };

    if (this.globalPbjs?.que && typeof this.globalPbjs.que.push === 'function') {
      this.globalPbjs.que.push(run);
    } else {
      run();
    }
  };

  throttle = (fn: () => void) => {
    const now = Date.now();

    // First call: fire immediately
    if (!this.lastTimeUpdateSentToContentScript) {
      this.lastTimeUpdateSentToContentScript = now;
      fn();
      return;
    }

    const elapsed = now - this.lastTimeUpdateSentToContentScript;
    const remaining = this.updateRateInterval - elapsed;

    if (remaining <= 0) {
      // Window passed: run immediately and clear any pending trailing call
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = null;
      }
      this.lastTimeUpdateSentToContentScript = now;
      fn();
    } else if (!this.updateTimeout) {
      // Schedule a trailing call if not already scheduled
      this.updateTimeout = setTimeout(() => {
        this.lastTimeUpdateSentToContentScript = Date.now();
        this.updateTimeout = null;
        fn();
      }, remaining);
    }
  };
}

export const addEventListenersForPrebid = (frameId: string) => {
  const instances: Map<string, Prebid> = new Map();

  const inject = (global: string) => {
    if (!instances.has(global)) {
      instances.set(global, new Prebid(global, frameId));
    }
  };

  const checkGlobals = (globals: string[]) => {
    if (globals && Array.isArray(globals)) {
      globals.forEach(inject);
    }
  };

  const observeGlobals = (arr: string[]): string[] => {
    if (!Array.isArray(arr)) return arr;
    return new Proxy(arr, {
      set(target, prop, value, receiver) {
        const res = Reflect.set(target, prop, value, receiver);
        if (typeof value === 'string' && value) {
          inject(value);
        }
        return res;
      },
    });
  };

  // Check immediately
  if (window._pbjsGlobals) {
    checkGlobals(window._pbjsGlobals);
  }
  if ((window as any).pbjs) {
    inject('pbjs');
  }

  // Intercept future assignments
  let _pbjsGlobals: string[] = observeGlobals(window._pbjsGlobals || []);
  try {
    Object.defineProperty(window, '_pbjsGlobals', {
      get: () => _pbjsGlobals,
      set: (val: string[]) => {
        _pbjsGlobals = Array.isArray(val) ? observeGlobals(val) : val;
        checkGlobals(val);
      },
      configurable: true,
      enumerable: true,
    });
  } catch (e) {
    // Fallback if defineProperty fails
  }

  // Continuous polling check for delayed / consent-gated Prebid loading
  const pollInterval = setInterval(() => {
    if (window._pbjsGlobals) {
      checkGlobals(window._pbjsGlobals);
    }
    if ((window as any).pbjs) {
      inject('pbjs');
    }
    instances.forEach((inst, ns) => {
      if (!inst.listenersAdded && typeof (window as any)[ns]?.onEvent === 'function') {
        inst.addEventListeners();
        inst.throttle(inst.sendDetailsToBackground);
      }
    });
  }, 1000);
  setTimeout(() => clearInterval(pollInterval), 30000);
};

export interface IPrebidBidParams {
  publisherId?: string;
  adSlot?: string;
  [key: string]: string | number | undefined;
}

export type IGlobalPbjs = PrebidJS;

export type IPrebidBid = Bid & {
  ad?: string;
  adId?: string;
  adUnitCode?: string;
  adUrl?: string;
  adserverTargeting?: any;
  bidId?: string;
  hb_adid?: string;
  hb_adomain?: string;
  hb_bidder?: string;
  hb_format?: string;
  hb_pb?: string;
  hb_size?: string;
  hb_source?: string;
  auctionId?: string;
  bidder?: string;
  bidderCode?: string;
  cpm?: number;
  creativeId?: string;
  currency?: string;
  dealId?: string;
  height?: number;
  mediaType?: string;
  originalCpm?: number;
  originalCurrency?: string;
  params?: IPrebidBidParams;
  partnerImpId?: string;
  pbAg?: string;
  pbCg?: string;
  pbDg?: string;
  pbHg?: string;
  pbLg?: string;
  pbMg?: string;
  pm_dspid?: number;
  pm_seat?: string;
  referrer?: string;
  requestId?: string;
  requestTimestamp?: number;
  responseTimestamp?: number;
  size?: string;
  source?: string;
  status?: string;
  statusMessage?: string;
  timeToRespond?: number;
  ttl?: number;
  width?: number;
  [key: string]: any;
};

export type IPrebidAdUnitMediaTypes = NonNullable<AdUnit['mediaTypes']>;
export type IPrebidAdUnit = AdUnit;

export interface IPrebidConfigPriceBucket {
  precision?: number;
  min?: number;
  max: number;
  increment: number;
}

export type IPrebidConfig = Config;

export interface IPrebidDebugConfigBid {
  bidder?: string;
  cpm?: number;
  currency?: string;
  mediaType?: string;
  height?: number;
  width?: number;
  adUrl?: string;
  dealId?: string;
  native?: INativeRules;
  video?: IVideoRules;
  [key: string]: any;
}

export interface IPrebidDebugConfig {
  enabled?: boolean;
  bids?: IPrebidDebugConfigBid[];
  bidders?: string[];
}

export interface IPrebidDebugModuleConfigRule {
  when: { [key: string]: string | number };
  then: {
    [key: string]: string | number | INativeRules | IVideoRules | undefined;
    native?: INativeRules;
    video?: IVideoRules;
  };
  options?: {
    delay?: number;
    [key: string]: any;
  };
}

export interface IPrebidDebugModuleConfig {
  enabled?: boolean;
  intercept?: IPrebidDebugModuleConfigRule[];
}

export interface INativeRules {
  cta?: string;
  image?: string;
  clickUrl?: string;
  title?: string;
}

export interface IVideoRules {
  cta?: string;
  image?: string;
  clickUrl?: string;
  title?: string;
}

export type IPrebidEvent = EventRecord<any>;

export interface IPrebidDetails {
  version: string;
  timeout: number | null;
  eventsUrl: string;
  events: EventRecord<any>[];
  config: Config;
  eids: any[];
  debug: IPrebidDebugConfig;
  namespace: string;
  frameId: string | null;
  installedModules: string[];
  bidderSettings: PrebidJS['bidderSettings'];
}

export interface IPrebidBidderSettings {
  [key: string]: {
    [key: string]: string | number | boolean;
  };
}

export type IPrebidAuctionInitEventData = EventRecord<'auctionInit'> & { args?: any };
export type IPrebidAuctionEndEventData = EventRecord<'auctionEnd'> & { args?: any };
export type IPrebidBidRequestedEventData = EventRecord<'bidRequested'> & { args?: any };
export type IPrebidBidResponseEventData = EventRecord<'bidResponse'> & { args?: any };
export type IPrebidBidWonEventData = EventRecord<'bidWon'> & { args?: any };
export type IPrebidNoBidEventData = EventRecord<'noBid'> & { args?: any };
export type IPrebidBidderDoneEventData = EventRecord<'bidderDone'> & { args?: any };
export type IPrebidAdRenderSucceededEventData = EventRecord<'adRenderSucceeded'> & { args?: any };
export type IPrebidAuctionDebugEventData = EventRecord<'auctionDebug'> & { args?: any };

export type IPrebidBidderRequest = BidderRequest<any> & {
  start?: number;
  startTime?: number;
  timestamp?: number;
  elapsedTime?: number;
  timeout?: number;
  bids?: IPrebidBid[];
  [key: string]: any;
};
