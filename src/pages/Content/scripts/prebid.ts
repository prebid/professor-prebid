import { sendToContentScript } from '../../Shared/utils';
import { EVENTS } from '../../Shared/constants';

class Prebid {
  globalPbjs: IGlobalPbjs = window.pbjs;
  namespace: string;
  debug: IPrebidDebugConfig;
  lastTimeUpdateSentToContentScript: number;
  updateTimeout: ReturnType<typeof setTimeout>;
  updateRateInterval: number = 3000;
  sendToContentScriptPending: boolean = false;
  lastEventsObjectUrl: { url: string; size: number }[] = [];
  events: any[] = [];
  eventsApi: boolean = typeof this.globalPbjs?.getEvents === 'function' || false;
  constructor(namespace: string) {
    this.namespace = namespace;
    this.globalPbjs = window[namespace as keyof Window];
    this.globalPbjs.que.push(() => this.addEventListeners());
    this.globalPbjs.que.push(() => this.throttle(this.sendDetailsToContentScript));
  }

  addEventListeners = (): void => {
    this.globalPbjs.onEvent('auctionInit', (auctionInitData: IPrebidAuctionInitEventData) => {
      if (!this.eventsApi) {
        this.events.push({ eventType: 'auctionInit', args: auctionInitData });
      }
      this.throttle(this.sendDetailsToContentScript);
    });

    this.globalPbjs.onEvent('auctionEnd', (auctionEndData: IPrebidAuctionEndEventData) => {
      if (!this.eventsApi) {
        this.events.push({ eventType: 'auctionEnd', args: auctionEndData });
      }
      this.throttle(this.sendDetailsToContentScript);
    });

    this.globalPbjs.onEvent('bidRequested', (bidRequestedData: IPrebidBidRequestedEventData) => {
      if (!this.eventsApi) {
        this.events.push({ eventType: 'bidRequested', args: bidRequestedData });
      }
      this.throttle(this.sendDetailsToContentScript);
    });

    this.globalPbjs.onEvent('bidResponse', (bidResponseData: IPrebidBidResponseEventData) => {
      if (!this.eventsApi) {
        this.events.push({ eventType: 'bidResponse', args: bidResponseData });
      }
      this.throttle(this.sendDetailsToContentScript);
    });

    this.globalPbjs.onEvent('noBid', (noBidData: IPrebidNoBidEventData) => {
      if (!this.eventsApi) {
        this.events.push({ eventType: 'noBid', args: noBidData });
      }
      this.throttle(this.sendDetailsToContentScript);
    });

    this.globalPbjs.onEvent('bidWon', (bidWonData: IPrebidBidWonEventData) => {
      if (!this.eventsApi) {
        this.events.push({ eventType: 'bidWon', args: bidWonData });
      }
      this.throttle(this.sendDetailsToContentScript);
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

  decylce = (obj: any) => {
    const cache = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        if (value['location']) {
          // document object found, discard key  
          return;
        }
        // Store value in our set
        cache.add(value);
      }
      return value;
    });
  };

  getEventsObjUrl = () => {
    const events = this.globalPbjs?.getEvents ? this.globalPbjs.getEvents() : this.events;
    const string = this.decylce(events);
    const blob = new Blob([string], { type: 'application/json' });
    const objectURL = URL.createObjectURL(blob);
    // memory management
    this.lastEventsObjectUrl.push({ url: objectURL, size: blob.size });
    const numberOfCachedUrls = 5;
    const totalWeight = this.lastEventsObjectUrl.reduce((acc, cur) => acc + cur.size, 0);
    if ((this.lastEventsObjectUrl.length > numberOfCachedUrls && totalWeight > 5e6) || totalWeight > 25e6) {
      // 5MB / 25MB
      const count = this.lastEventsObjectUrl.length - numberOfCachedUrls;
      const toRevoke = this.lastEventsObjectUrl.splice(0, count);
      for (const url of toRevoke) {
        URL.revokeObjectURL(url.url);
      }
    }
    return objectURL;
  };

  sendDetailsToContentScript = (): void => {
    const config = this.globalPbjs.getConfig();
    const eids = this.globalPbjs.getUserIdsAsEids ? this.globalPbjs.getUserIdsAsEids() : [];
    const timeout = window.PREBID_TIMEOUT || null;
    const prebidDetail: IPrebidDetails = {
      config,
      debug: this.getDebugConfig(),
      eids,
      eventsUrl: this.getEventsObjUrl(),
      namespace: this.namespace,
      timeout,
      version: this.globalPbjs.version,
      bidderSettings: this.globalPbjs.bidderSettings,
    };

    sendToContentScript(EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND, prebidDetail);
    this.sendToContentScriptPending = false;
  };

  throttle = async (fn: Function) => {
    if (
      !this.sendToContentScriptPending &&
      (!this.lastTimeUpdateSentToContentScript || this.lastTimeUpdateSentToContentScript < Date.now() - this.updateRateInterval)
    ) {
      this.sendToContentScriptPending = true;
      this.lastTimeUpdateSentToContentScript = Date.now();
      this.globalPbjs.que.push(async () => {
        this.sendDetailsToContentScript();
      });
    } else {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = setTimeout(() => this.throttle(fn), this.updateRateInterval);
    }
  };
}

export const addEventListenersForPrebid = () => {
  const allreadyInjectedPrebid: string[] = [];
  let stopLoop = false;
  setTimeout(() => {
    stopLoop = true;
  }, 8000);
  const isPrebidInPage = () => {
    const pbjsGlobals = window._pbjsGlobals || [];
    if (pbjsGlobals.length > 0) {
      pbjsGlobals.forEach((global: string) => {
        if (!allreadyInjectedPrebid.includes(global)) {
          new Prebid(global);
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
}

export interface IPrebidBid {
  ad?: string;
  adId: string;
  adUnitCode: string;
  adUrl: string;
  adserverTargeting: any;
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
    rules: {
      purpose: string;
      enforcePurpose: boolean;
      enforceVendor: boolean;
      vendorExceptions: string[];
    }[];
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
  s2sConfig: IPrebidConfigS2SConfig;
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
  events?: (
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
