import { POPUP_LOADED, EVENTS, PREBID_DETECTION_TIMEOUT_IFRAME, PREBID_DETECTION_TIMEOUT } from '../Shared/constants';
import { sendWindowPostMessage, detectIframe } from '../Shared/utils';

class Prebid {
  globalPbjs: IGlobalPbjs = window.pbjs;
  namespace: string;
  frameId: string | null;
  lastTimeUpdateSentToContentScript: number;
  updateTimeout: ReturnType<typeof setTimeout>;
  updateRateInterval: number = 1000;
  sendToContentScriptPending: boolean = false;
  events: any[] = [];
  eventsApi: boolean = typeof this.globalPbjs?.getEvents === 'function' || false;

  constructor(namespace: string, iframeId: string | null) {
    console.log('Prebid constructor', namespace, iframeId);
    this.namespace = namespace;
    this.frameId = iframeId;
    this.globalPbjs = window[namespace as keyof Window];
    this.addEventListeners();
  }

  addEventListeners = (): void => {
    this.globalPbjs.onEvent('auctionInit', (auctionInitData: IPrebidAuctionInitEventData) => {
      if (!this.eventsApi) {
        this.events.push({ eventType: 'auctionInit', args: auctionInitData });
      }
      this.throttle(this.sendDetailsToBackground);
    });

    this.globalPbjs.onEvent('auctionEnd', (auctionEndData: IPrebidAuctionEndEventData) => {
      if (!this.eventsApi) {
        this.events.push({ eventType: 'auctionEnd', args: auctionEndData });
      }
      this.throttle(this.sendDetailsToBackground);
    });

    this.globalPbjs.onEvent('bidRequested', (bidRequestedData: IPrebidBidRequestedEventData) => {
      if (!this.eventsApi) {
        this.events.push({ eventType: 'bidRequested', args: bidRequestedData });
      }
      this.throttle(this.sendDetailsToBackground);
    });

    this.globalPbjs.onEvent('bidResponse', (bidResponseData: IPrebidBidResponseEventData) => {
      if (!this.eventsApi) {
        this.events.push({ eventType: 'bidResponse', args: bidResponseData });
      }
      this.throttle(this.sendDetailsToBackground);
    });

    this.globalPbjs.onEvent('noBid', (noBidData: IPrebidNoBidEventData) => {
      if (!this.eventsApi) {
        this.events.push({ eventType: 'noBid', args: noBidData });
      }
      this.throttle(this.sendDetailsToBackground);
    });

    this.globalPbjs.onEvent('bidWon', (bidWonData: IPrebidBidWonEventData) => {
      if (!this.eventsApi) {
        this.events.push({ eventType: 'bidWon', args: bidWonData });
      }
      this.throttle(this.sendDetailsToBackground);
    });

    window.addEventListener(
      'message',
      (event) => {
        // console.log('prebid.ts message event', event);
        // if (!event.data.profPrebid) return;
        if (event.data.type === POPUP_LOADED) {
          console.log('prebid.ts POPUP LOADED, send');
          this.sendDetailsToBackground();
        }
      },
      false
    );

    window.addEventListener('message', (event) => {
      // We only accept messages from ourselves
      // if (event.source != window) return;

      if (event.data.type && event.data.type == 'FROM_CONTENT_SCRIPT') {
        console.log('Content script has received a message: ' + event.data.text);
      }
    });
  };

  getDebugConfig = () => {
    const pbjsDebugString = window.sessionStorage.getItem('pbjs:debugging');
    try {
      return JSON.parse(pbjsDebugString);
    } catch (e) {
      console.error(e);
    }
  };

  removeWindowFields = (obj: { [key: string]: any }): void => {
    if (obj.eventType === 'adRenderSucceeded' && obj.args.doc) {
      obj.args.doc = 'pruned by Prof. Prebid';
    } else {
      const visitedObjects: Set<Object> = new Set();
      const traverseObject = (obj: { [key: string]: any }) => {
        for (const key in obj) {
          if (typeof obj.hasOwnProperty === 'function' && obj.hasOwnProperty(key)) {
            const propertyValue = obj[key];
            if (propertyValue instanceof Window || propertyValue instanceof Node || propertyValue instanceof HTMLElement) {
              try {
                delete obj[key];
              } catch (error) {
                // some properties are not deletable
              }
            } else if (typeof propertyValue === 'object' && !visitedObjects.has(propertyValue)) {
              visitedObjects.add(propertyValue);
              traverseObject(propertyValue);
            }
          }
        }
      };
      traverseObject(obj);
    }
  };

  getEventsObjUrl = () => {
    const events = this.globalPbjs?.getEvents ? this.globalPbjs.getEvents() : this.events;
    const string = `[${events
      .map((event) => {
        this.removeWindowFields(event);
        try {
          return JSON.stringify(event);
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
    return objectURL;
  };

  sendDetailsToBackground = (): void => {
    console.log('SEND_PREBID_DETAILS_TO_BACKGROUND');
    this.globalPbjs.que.push(async () => {
      const eventsUrl = this.getEventsObjUrl();
      if (!eventsUrl) return;
      const config = this.globalPbjs.getConfig();
      const eids = this.globalPbjs.getUserIdsAsEids ? this.globalPbjs.getUserIdsAsEids() : [];
      const timeout = window.PREBID_TIMEOUT || null;
      const prebidDetail: IPrebidDetails = {
        config,
        debug: this.getDebugConfig(),
        eids,
        events: [],
        eventsUrl,
        namespace: this.namespace,
        frameId: this.frameId,
        installedModules: this.globalPbjs.installedModules,
        timeout,
        version: this.globalPbjs.version,
        bidderSettings: this.globalPbjs.bidderSettings,
      };
      sendWindowPostMessage(EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND, prebidDetail);
      this.sendToContentScriptPending = false;
    });
  };

  throttle = (fn: Function) => {
    const now = Date.now();
    if (
      !this.sendToContentScriptPending &&
      (!this.lastTimeUpdateSentToContentScript || now - this.lastTimeUpdateSentToContentScript >= this.updateRateInterval)
    ) {
      this.sendToContentScriptPending = true;
      this.lastTimeUpdateSentToContentScript = now;
      fn();
    }
    if (!this.updateTimeout) {
      this.updateTimeout = setTimeout(() => {
        this.sendToContentScriptPending = false;
        this.throttle(fn);
      }, this.updateRateInterval - (now - this.lastTimeUpdateSentToContentScript));
    }
  };
}

export const addEventListenersForPrebid = (frameId: string) => {
  const allreadyInjectedPrebid: string[] = [];
  let stopLoop = false;
  setTimeout(
    () => {
      stopLoop = true;
    },
    detectIframe() ? PREBID_DETECTION_TIMEOUT_IFRAME : PREBID_DETECTION_TIMEOUT
  );
  const isPrebidInPage = () => {
    const pbjsGlobals = window._pbjsGlobals || [];

    if (pbjsGlobals?.length > 0) {
      pbjsGlobals.forEach((global: string) => {
        if (!allreadyInjectedPrebid.includes(global)) {
          new Prebid(global, frameId);
          allreadyInjectedPrebid.push(global);
        }
      });
    }
    if (!stopLoop) {
      setTimeout(() => isPrebidInPage(), 1000);
    }
  };
  isPrebidInPage();
};

export interface IPrebidBidParams {
  publisherId: string;
  adSlot: string;
  [key: string]: string | number;
}

export interface IGlobalPbjs {
  bidderSettings: IPrebidBidderSettings;
  getEvents: () => IPrebidDetails['events'];
  onEvent: Function;
  que: Function[];
  getConfig: () => IPrebidDetails['config'];
  getUserIdsAsEids: () => IPrebidDetails['eids'];
  setConfig: (args: Object) => void;
  version: string;
  adUnits: IPrebidAdUnit[];
  getBidResponsesForAdUnitCode: (elementId: string) => { bids: IPrebidBid[] };
  getAllWinningBids: () => IPrebidBid[];
  installedModules: string[];
}

export interface IPrebidBid {
  ad?: string;
  adId: string;
  adUnitCode: string;
  adUrl: string;
  adserverTargeting: any;
  bidId: string;
  hb_adid: string;
  hb_adomain: string;
  hb_bidder: string;
  hb_format: string;
  hb_pb: string;
  hb_size: string;
  hb_source: string;
  auctionId: string;
  bidder: string;
  bidderCode: string;
  cpm: number;
  creativeId: string;
  currency: string;
  dealId: string;
  getSize: { (): boolean };
  getStatusCode: { (): boolean };
  height: number;
  mediaType: string;
  meta: {
    networkId: number;
    buyerId: number;
    advertiserDomains: string[];
    clickUrl: string;
  };
  native: object;
  netRevenue: true;
  originalCpm: number;
  originalCurrency: string;
  params: IPrebidBidParams;
  partnerImpId: string;
  pbAg: string;
  pbCg: string;
  pbDg: string;
  pbHg: string;
  pbLg: string;
  pbMg: string;
  pm_dspid: number;
  pm_seat: string;
  referrer: string;
  requestId: string;
  requestTimestamp: number;
  responseTimestamp: number;
  size: string;
  source: string;
  status: string;
  statusMessage: string;
  timeToRespond: number;
  ttl: number;
  width: number;
}

export interface IPrebidAdUnitMediaTypes {
  banner: {
    sizes?: number[][];
    sizeConfig?: { minViewPort: number[]; sizes: number[][] }[];
  };
  native: {
    type: string;
    adTemplate: string;
    image: {
      required: boolean;
      sizes: number[];
    };
    sendTargetingKeys: boolean;
    sponsoredBy: {
      required: boolean;
    };
    title: {
      required: boolean;
      len: number;
    };
    body: {
      required: boolean;
    };
  };
  video: {
    pos: number;
    context: string;
    placement: number;
    playerSize: number[][];
    api: number[];
    mimes: string[];
    protocols: number[];
    playbackmethod: number[];
    minduration: number;
    maxduration: number;
    w: number;
    h: number;
    startdelay: number;
    linearity: number;
    skip: number;
    skipmin: number;
    skipafter: number;
    minbitrate: number;
    maxbitrate: number;
    delivery: number[];
    playbackend: number;
    adPodDurationSec: number;
    durationRangeSec: number[];
    requireExactDuration: boolean;
    tvSeriesName: string;
    tvEpisodeName: string;
    tvSeasonNumber: number;
    tvEpisodeNumber: number;
    contentLengthSec: number;
    contentMode: string;
  };
}

export interface IPrebidAdUnit {
  bids: IPrebidBid[];
  code: string;
  mediaTypes: IPrebidAdUnitMediaTypes;
  sizes: number[][];
  transactionId: string;
  ortb2Imp: {
    [key: string]: any;
  };
}

export interface IPrebidConfigPriceBucket {
  precision: number;
  min: number;
  max: number;
  increment: number;
}

export interface IPrebidConfigUserId {
  name: string;
  storage: {
    type: string;
    name: string;
    expires: number;
  };
  params: {
    [key: string]: string;
  };
}

export interface IPrebidConfigUserSync {
  syncEnabled: boolean;
  filterSettings: {
    image: {
      bidders: string;
      filter: string;
    };
  };
  syncsPerBidder: number;
  syncDelay: number;
  auctionDelay: number;
  userIds: IPrebidConfigUserId[];
}

export interface IPrebidConfigS2SConfig {
  accountId: string;
  adapter: string;
  adapterOptions: object;
  app: {
    bundle: string;
    id: string;
    name: string;
    paid: number;
    privacypolicy: number;
    publisher: {
      domain: string;
      id: string;
      name: string;
    };
    storeurl: string;
  };
  bidders: string[];
  defaultTtl: number;
  device: {
    ifa: string;
    ifa_type: string;
    lmt: string;
    os: string;
  };
  enabled: boolean;
  endpoint:
    | string
    | {
        [key: string]: string;
      };
  maxBids: number;
  syncEndpoint:
    | string
    | {
        [key: string]: string;
      };
  syncUrlModifier: object;
  timeout: number;
}

export interface IPrebidConfigConsentManagementRule {
  purpose: string;
  enforcePurpose: boolean;
  enforceVendor: boolean;
  vendorExceptions: string[];
}

export interface IPrebidConfigConsentManagement {
  allowAuctionWithoutConsent: boolean;
  defaultGdprScope: string;
  cmpApi: string;
  timeout: number;
  coppa: boolean;
  gdpr: {
    cmpApi: string;
    defaultGdprScope: boolean;
    timeout: number;
    allowAuctionWithoutConsent: boolean;
    consentData: {
      tcString: string;
      addtlConsent: string;
      gdprApplies: boolean;
    };
    rules: IPrebidConfigConsentManagementRule[];
  };
  usp: {
    cmpApi: string;
    getUSPData: {
      uspString: string;
    };
    timeout: number;
  };
}

export interface IPrebidConfig {
  debug: boolean;
  bidderTimeout: number;
  publisherDomain: string;
  priceGranularity: string;
  consentManagement: IPrebidConfigConsentManagement;
  customPriceBucket: {
    buckets: IPrebidConfigPriceBucket[];
  };
  mediaTypePriceGranularity: {
    banner: { buckets: { precision: number; min: number; max: number; increment: number }[] };
    native: { buckets: { precision: number; min: number; max: number; increment: number }[] };
    video: { buckets: { precision: number; min: number; max: number; increment: number }[] };
    'video-outstream': { buckets: { precision: number; min: number; max: number; increment: number }[] };
    priceGranularity: string;
    publisherDomain: string;
  };
  s2sConfig: IPrebidConfigS2SConfig | IPrebidConfigS2SConfig[];
  targetingControls: {
    allowTargetingKeys: string[];
    alwaysIncludeDeals: boolean;
  };
  enableSendAllBids: boolean;
  useBidCache: boolean;
  deviceAccess: boolean;
  bidderSequence: string;
  timeoutBuffer: number;
  disableAjaxTimeout: boolean;
  maxNestedIframes: number;
  auctionOptions: unknown;
  userSync: IPrebidConfigUserSync;
  cache: {
    url: string;
  };
  gptPreAuction: { mcmEnabled: boolean };
  fledgeForGpt: {
    enabled: boolean;
    bidders: string[];
    defaultForSlots: number;
  };
  paapi: {
    enabled: boolean;
    bidders: string[];
    defaultForSlots: number;
    gpt: {
      autoconfig: boolean;
    };
  };
  floors: {
    auctionDelay: number;
    data: {
      currency: string;
      floorProvider: string;
      floorsSchemaVersion: string;
      modelGroups: {
        default: number;
        modelVersion: string;
        modelWeight: number;
        schema: {
          delimiter: string;
          fields: string[];
        };
        values: { [key: string]: unknown };
      }[];
      modelTimestamp: number;
      modelWeightSum: number;
      skipRate: number;
    };
    endpoint: { url: string };
    enforcement: {
      floorDeals: boolean;
    };
    floorProvider: string;
  };

  [key: string]: unknown;
}

export interface IPrebidDebugConfigBid {
  cpm?: number;
  bidder?: string;
  adUnitCode?: string;
  currency?: string;
}

export interface IPrebidDebugConfig {
  enabled?: boolean;
  bids?: IPrebidDebugConfigBid[];
  bidders?: string[];
}

export interface IPrebidDebugModuleConfig {
  enabled?: boolean;
  intercept?: IPrebidDebugModuleConfigRule[];
}

export interface IPrebidDebugModuleConfigRule {
  when: { [key: string]: string | number };
  then: {
    [key: string]: string | number | INativeRules;
    native?: INativeRules;
    video?: IVideoRules;
  };
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

export interface IPrebidDetails {
  version: string;
  timeout: number;
  eventsUrl: string;
  events: (
    | IPrebidAuctionInitEventData
    | IPrebidAuctionEndEventData
    | IPrebidBidRequestedEventData
    | IPrebidNoBidEventData
    | IPrebidBidWonEventData
    | IPrebidBidResponseEventData
    | IPrebidAdRenderSucceededEventData
    | IPrebidAuctionDebugEventData
  )[];
  config: IPrebidConfig;
  eids: IPrebidEids[];
  debug: IPrebidDebugConfig;
  namespace: string;
  frameId: string | null;
  installedModules: string[];
  bidderSettings: IPrebidBidderSettings;
}

export interface IPrebidBidderSettings {
  [key: string]: {
    [key: string]: string | number | boolean;
  };
}

export interface IPrebidNoEventsApiEventData {
  args: {
    adUnitCodes: string[];
    adUnits: IPrebidAdUnit[];
    auctionEnd: undefined;
    auctionId: string;
    auctionStatus: string;
    bidderRequests: IPrebidBidderRequest[];
    bidsReceived: IPrebidBid[];
    labels: [];
    noBids: IPrebidBid[];
    timeout: number;
    timestamp: number;
    winningBids: [];
  };
  elapsedTime: number;
  eventType: string;
  id: string;
}

export interface IPrebidAuctionDebugEventData {
  eventType: 'auctionDebug';
  args: {
    type: 'ERROR' | 'WARNING';
    arguments: {
      [key: string]: string | number;
    };
  };
  elapsedTime: 7272;
}

export interface IPrebidAuctionInitEventData {
  args: {
    adUnitCodes: string[];
    adUnits: IPrebidAdUnit[];
    auctionEnd: undefined;
    auctionId: string;
    auctionStatus: string;
    bidderRequests: IPrebidBidderRequest[];
    bidsReceived: IPrebidBid[];
    labels: [];
    noBids: IPrebidBid[];
    timeout: number;
    timestamp: number;
    winningBids: [];
  };
  elapsedTime: number;
  eventType: string;
  id: string;
}

export interface IPrebidAuctionEndEventData {
  args: {
    adUnitCodes: string[];
    adUnits: IPrebidAdUnit[];
    auctionEnd: number;
    auctionId: string;
    auctionStatus: string;
    bidderRequests: IPrebidBidderRequest[];
    bidsReceived: IPrebidBid[];
    labels: unknown;
    noBids: IPrebidBid[];
    timeout: number;
    timestamp: number;
    winningBids: IPrebidBid[];
  };
  elapsedTime: number;
  eventType: string;
  id: string;
}

export interface IPrebidBidRequestedEventData {
  args: IPrebidBidderRequest;
  elapsedTime: number;
  eventType: string;
  id: string;
}

export interface IPrebidBidResponseEventData {
  args: IPrebidBid;
  elapsedTime: number;
  eventType: string;
  id: string;
}

export interface IPrebidNoBidEventData {
  args: {
    adUnitCode: string;
    auctionId: string;
    bidId: string;
    bidRequestsCount: number;
    bidder: string;
    bidderCode: string;
    bidderRequestId: string;
    bidderRequestsCount: number;
    bidderWinsCount: number;
    mediaTypes: IPrebidAdUnitMediaTypes;
    params: { [key: string]: string };
    sizes: number[][];
    src: string;
    transactionId: string;
  };
  elapsedTime: number;
  eventType: string;
  id: string;
}

export interface IPrebidAdRenderSucceededEventData {
  args: {
    adId: string;
    bid: IPrebidBid;
  };
  elapsedTime: number;
  eventType: string;
  id: string;
}

export interface IPrebidBidWonEventData {
  args: IPrebidBid;
  elapsedTime: number;
  eventType: string;
  id: string;
}

interface IPrebidGdprConsent {
  consentString: string;
  vendorData: {
    addtlConsent: string;
    cmpId: number;
    cmpStatus: string;
    cmpVersion: number;
    eventStatus: string;
    gdprApplies: boolean;
    isServiceSpecific: boolean;
    listenerId: number;
    outOfBand: {
      allowedVendors: unknown;
      disclosedVendors: unknown;
    };
    publisher: {
      consents: {
        [key: number]: boolean;
      };
      legitimateInterests: {
        [key: number]: boolean;
      };
      customPurpose: unknown;
      restrictions: unknown;
    };
    publisherCC: string;
    purpose: {
      consents: {
        [key: number]: boolean;
      };
      legitimateInterests: {
        [key: number]: boolean;
      };
    };
    purposeOneTreatment: boolean;
    specialFeatureOptins: {
      [key: number]: boolean;
    };
    tcString: string;
    tcfPolicyVersion: number;
    useNonStandardStacks: boolean;
    vendor: {
      consents: {
        [key: number]: boolean;
      };
      legitimateInterests: {
        [key: number]: boolean;
      };
    };
  };
  gdprApplies: boolean;
  addtlConsent: string;
  apiVersion: number;
}

export interface IPrebidBidderRequest {
  auctionId: string;
  auctionStart: number;
  bidder: string;
  bidderCode: string;
  bidderRequestId: string;
  bids: IPrebidBid[];
  ceh: unknown;
  gdprConsent: IPrebidGdprConsent;
  publisherExt: unknown;
  refererInfo: {
    referer: string;
    reachedTop: boolean;
    isAmp: boolean;
    numIframes: number;
    stack: string[];
  };
  start: number;
  endTimestamp: number;
  elapsedTime: number;
  timeout: number;
  userExt: unknown;
}

interface IPrebidEids {
  source: string;
  uids: IUuids[];
}

interface IUuids {
  atype: number;
  id: string;
  ext: {
    [key: string]: string;
  };
}
