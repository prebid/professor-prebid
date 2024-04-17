export const formatTime = (auctionInfo: IAuctionInfo, message: IMessage) => {
  const timeVal = messageTime(message);
  return auctionInfo?.startTime ? `${((timeVal - auctionInfo.startTime) * 1000).toFixed(2)}ms` : new Date(timeVal * 1000);
};

export const messageTime = (message: IMessage) => {
  if (message.method === 'Storage.interestGroupAuctionEventOccurred') {
    return message.params.eventTime;
  }
  return message.params.accessTime;
};

export const eventRowFromMessage = (message: IMessage, state: IAuctionInfo): IEventRow => {
  const eventRow: IEventRow = {
    Event: message.params.type,
    messageTime: messageTime(message),
    Time: formatTime(state, message),
    requestId: message.params.requestId,
  };

  if (message.params.ownerOrigin) {
    eventRow.IGOrigin = message.params.ownerOrigin;
  }

  if (message.params.name) {
    eventRow.IGName = message.params.name;
  }

  if (!message.params.uniqueAuctionId && message.params.componentSellerOrigin) {
    eventRow.ComponentSeller = message.params.componentSellerOrigin;
  }

  if (message.params.uniqueAuctionId && message.params.bid) {
    eventRow.Bid = message.params.bid;
  }

  if (message.params.uniqueAuctionId && message.params.bidCurrency) {
    eventRow.BidCurrency = message.params.bidCurrency;
  }

  return eventRow;
};

export interface IAuctionInfo {
  auctionId: string;
  childAuctionsBox?: IAuctionInfo[];
  config?: IAuctionConfig;
  eventTable?: IEventRow[];
  header: string;
  startTime?: number;
  endTime?: number;
  parentAuctionId?: string;
}

export interface IEventRow {
  Time: string | Date;
  messageTime: number;
  Event: string;
  IGOrigin?: string;
  IGName?: string;
  ComponentSeller?: string;
  Bid?: string;
  BidCurrency?: string;
  requestId: string;
}

export interface IMessage {
  method: string;
  eventTime?: number;
  params: Params;
  time?: number;
  timeInfo: ITimeInfoForRequestId;
}

export interface Params {
  accessTime: number;
  type: string;
  auctions?: string[];
  auctionConfig?: IAuctionConfig;
  bid?: any;
  bidCurrency?: string;
  componentSellerOrigin?: string;
  eventTime?: number;
  name?: string;
  ownerOrigin?: string;
  parentAuctionId?: string;
  uniqueAuctionId?: string;
  requestId?: string;
  timestamp?: number;
  wallTime?: number;
  seller?: string;
}

export interface IAuctionConfig {
  auctionSignals: AuctionSignals;
  componentAuctions: string[];
  decisionLogicURL: string;
  deprecatedRenderURLReplacements: DeprecatedRenderUrlreplacements;
  expectsAdditionalBids: boolean;
  expectsDirectFromSellerSignalsHeaderAdSlot: boolean;
  interestGroupBuyers: string[];
  maxTrustedScoringSignalsURLLength: number;
  perBuyerCumulativeTimeouts: PerBuyerCumulativeTimeouts;
  perBuyerCurrencies: PerBuyerCurrencies;
  perBuyerExperimentGroupIds: PerBuyerExperimentGroupIds;
  perBuyerGroupLimits: PerBuyerGroupLimits;
  perBuyerMultiBidLimit: PerBuyerMultiBidLimit;
  perBuyerPrioritySignals: PerBuyerPrioritySignals;
  perBuyerSignals: PerBuyerSignals;
  perBuyerTimeouts: PerBuyerTimeouts;
  requiredSellerCapabilities: any[];
  seller: string;
  sellerSignals: SellerSignals;
  trustedScoringSignalsURL: string;
}

export interface AuctionSignals {
  pending: boolean;
}

export interface DeprecatedRenderUrlreplacements {
  pending: boolean;
  value: any[];
}

export interface PerBuyerCumulativeTimeouts {
  pending: boolean;
  value: {};
}

export interface PerBuyerCurrencies {
  pending: boolean;
  value: {};
}

export interface PerBuyerExperimentGroupIds {}

export interface PerBuyerGroupLimits {
  '*': number;
}

export interface PerBuyerMultiBidLimit {
  '*': number;
}

export interface PerBuyerPrioritySignals {}

export interface PerBuyerSignals {
  pending: boolean;
}

export interface PerBuyerTimeouts {
  pending: boolean;
  value: {};
}

export interface SellerSignals {
  pending: boolean;
}

export interface IAuctionsForRequestIdValue {
  auctions: any;
  type: any;
}

export interface ITimeInfoForRequestId {
  wallTime: any;
  timestamp: any;
}

export interface IAuctions {
  headline: string; // 'Auction by ... at ...';
}
