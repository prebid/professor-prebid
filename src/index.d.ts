export interface IBidder {
  slotElementId: string;
  adId: string;
  dealId: string | null;
  auction: string;
  adUnitPath: string;
  bidder: string;
  time: number;
  cpm: number;
  slotSize: string;
  netRevenue: boolean;
  creativeId: string | number;
  msg: string;
  nonRenderedHighestCpm: boolean;
  rendered: boolean;
  bidRequestTime: number;
  bidResponseTime: number;
  created: number;
  modified: number;
  type: string;
}

export interface IMask {
  targetId: string;
  creativeRenderTime: number;
  auctionTime: number;
  bidders: IBidder[];
  winningBidder: string;
  winningCPM: number;

}

export interface IAdMaskPortalProps {
  container: HTMLElement;
  mask: IMask;
}

export interface IAuction {
  adUnitPath: string;
  auction: string;
  endTime: number;
  preAuctionStartTime: number;
  slotElementId: string;
  startTime: number;
}

export interface IBid {
  adId: string;
  adUnitPath: string;
  auction: string;
  bidRequestTime: number;
  bidResponseTime: number;
  bidder: string;
  cpm: number;
  created: number;
  creativeId: string;
  dealId: string;
  modified: number;
  msg: string;
  netRevenue: boolean;
  nonRenderedHighestCpm: boolean;
  rendered: boolean;
  slotElementId: string;
  slotSize: string;
  time: number;
  type: string;
}

export interface ISlot {
  dId: string[];
  adUnitPath: string;
  slotElementId: string;
  slotLoadTs: number;
  slotRenderedTs: number
}

export interface IAuctionData {
  dfs: {
    auction: Auction[];
    slots: Slot[];
    allBids: Bid[];
  },
  prebidConfig: string;
}

export interface IContentScriptData {
  adsDetected: number;
  numOfBidders: number;
  numOfNoBids: number;
  numOfAvailableBids: number;
  timings: {
    preAuction: number;
    auction: number;
    adServer: number;
  };
}

export interface IBidderRequest {
  auctionId: string;
  auctionStart: number;
  bidderCode: string;
  bidderRequestId: string;
  bids: IBid[];
  ceh: any;
  publisherExt: any;
  refererInfo: {
    referer: string;
    reachedTop: boolean;
    isAmp: boolean;
    numIframes: number;
    stack: string[];
    start: number;
    timeout: number;
    userExt: any;
  }
}

export interface IBidRequest {
  [key: string]: IBidderRequest;
}

export interface IBidResponse {
  bids: IBid[];
}

export interface IBidResponseObj {
  [key: string]: IBidResponse;
}

export interface IBidRequestObj {
  [key: string]: IBidRequest;
}

export interface IBidWonData {
  ad: string;
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
  getSize: any
  getStatusCode: any
  height: number;
  mediaType: string;
  meta: {
    networkId: number;
    buyerId: number;
    advertiserDomains: string[],
    clickUrl: string;
  }
  netRevenue: true
  originalCpm: string;
  originalCurrency: string;
  params: {
    publisherId: string;
    adSlot: string;
    [key: string]: string | number;
  }[]
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

export interface IAdUnit {
  bids: { bidder: string; params: { [key: string]: string } }[];
  code: string;
  mediaTypes: {
    banner: {
      sizes: number[][];
    }
  }
  sizes: number[][];
}

export interface IDoneBid {
  adUnitCode: string;
  auctionId: string;
  bidId: string;
  bidRequestsCount: number;
  bidder: string;
  bidderRequestId: string;
  bidderRequestsCount: number;
  bidderWinsCount: number;
  mediaTypes: {
    [key: string | number]: {
      [key: string | number]: string | number;
    }
  }
  params: {
    [key: string | number]: string | number;
  }
  sizes: number[][];
  src: string;
  transactionId: string;
  advertiserId: string;
}

export interface IAuctionData {
  adUnitCodes: string[];
  adUnits: IAdUnit[];
  auctionEnd: number;
  auctionId: string
  auctionStatus: string
  bidderRequests: IBidderRequest[];
  bidsReceived: any[];
  labels: string;
  noBids: []
  timeout: number
  timestamp: number
  winningBids: []
}

export interface IReferrerInfo {
  canonicalUrl: string;
  isAmp: boolean;
  numIframes: number
  reachedTop: true
  referer: string;
  stack: string[];
}

export interface IBidderDoneData {
  auctionId: string;
  auctionStart: number;
  bidderCode: string;
  bidderRequestId: string;
  bids: IDoneBid[];
  ceh: any;
  publisherExt: any;
  refererInfo: IReferrerInfo;
  start: number;
  timeout: number;
}

export interface IBidTimeoutData {
  bids: any[]
}