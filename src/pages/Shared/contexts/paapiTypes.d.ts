interface IPrebidPaapiBidEvent {
  eventType: string;
  args: {
    source: string;
    adId: string;
    width: number;
    height: number;
    adUnitCode: string;
    auctionId: string;
    urn: string;
    auctionConfig: IPrebidPaapiAuctionConfig;
    overriddenAdId: string;
    status: string;
    bidderCode: string;
  };
  elapsedTime: number;
}

interface IPrebidPaapiAuctionEvent {
  eventType: string;
  args: {
    auctionId: string;
    adUnitCode: string;
    auctionConfig: IPrebidPaapiAuctionConfig;
  };
  elapsedTime: number;
}

interface IPrebidPaapiNoBidEvent {
  eventType: string;
  args: {
    auctionId: string;
    adUnitCode: string;
    auctionConfig: IPrebidPaapiAuctionConfig;
  };
  elapsedTime: number;
}

interface IPrebidPaapiAuctionConfig {
  auctionSignals: IAuctionSignals;
  requestedSize: ISize;
  componentAuctions?: IPrebidComponentAuction[];
  resolveToConfig?: boolean;
  seller: string;
  decisionLogicURL: string;
}

interface IPrebidComponentAuction {
  auctionSignals: IAuctionSignals;
  requestedSize: ISize;
  seller: string;
  decisionLogicURL: string;
  decisionLogicUrl: string;
  interestGroupBuyers: Array<string>;
  sellerCurrency: string;
  perBuyerCurrencies: { [key: string]: string };
  perBuyerMultiBidLimits: { [key: string]: number };
  perBuyerSignals: { [key: string]: IPerBuyerSignals };
}

interface IOrtb2 {
  source?: IOrtb2Source;
  site?: IOrtb2Site;
  device?: IOrtb2Device;
  id?: string;
  imp?: unknown;
}

interface IOrtb2Source {
  fd?: number;
  tid?: string;
  pchain?: string;
  ext?: any;
}

interface IOrtb2Imp {
  ext: {
    ae: number;
    data: any;
    igs: {
      ae: number;
      biddable: number;
    };
    paapi: {
      requestedSize: ISize;
    };
  };
}

interface IPerBuyerSignals {
  prebid: {
    ortb2: IOrtb2;
    ortb2Imp: IOrtb2Imp;
  };
}

interface ISize {
  width: number;
  height: number;
}

interface IAuctionSignals {
  prebid?: {
    bidfloor: number;
    bidfloorcur: string;
    ortb2?: IOrtb2;
    ortb2Imp?: IOrtb2Imp;
  };
  ortb2?: IOrtb2;
}

interface IOrtb2Device {
  w: number;
  h: number;
  dnt: number;
  ua: string;
  language: string;
  sua: {
    source: number;
    platform: {
      brand: string;
    };
    browsers: Array<{
      brand: string;
      version: Array<string>;
    }>;
    mobile: number;
  };
  ext: {
    cdep: string;
  };
}

interface IOrtb2Site {
  id?: string;
  name?: string;
  domain?: string;
  cat?: string[];
  sectioncat?: string[];
  pagecat?: string[];
  page?: string;
  ref?: string;
  search?: string;
  mobile?: BooleanNumber;
  privacypolicy?: BooleanNumber;
  publisher?: Publisher;
  keywords?: string;
  ext?: any;
}

interface Publisher {
  id?: string;
  name?: string;
  cat?: string[];
  domain?: string;
  ext?: any;
}

interface IPrebidPaapiBidWonEventData {
  source: string;
  adId: string;
  width: number;
  height: number;
  adUnitCode: string;
  auctionId: string;
  urn: string;
  auctionConfig: AuctionConfig;
  overriddenAdId: string;
  status: string;
  bidderCode: string;
}

interface IPrebidPaapiBidWonEvent {
  eventType: string;
  args: IPrebidPaapiBidWonEventData;
  id: string;
  elapsedTime: number;
}
