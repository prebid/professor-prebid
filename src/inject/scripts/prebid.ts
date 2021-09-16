import logger from '../../logger';
import { sendToContentScript } from '../../utils';
import constants from '../../constants.json';

class Prebid {
    globalPbjs: any;
    events: IPrebidEvents;
    bids: IPrebidBid[];
    slots: IPrebidSlot[];
    config: IPrebidConfig;

    init(globalPbjs: any): void {
        this.globalPbjs = globalPbjs;
        // send prebid details to content script 
        globalPbjs.que.push(() => setInterval(() => this.sendDetailsToContentScript(), 1000));
    }
    addEventListeners(): void {
        this.globalPbjs.onEvent('auctionInit', (auctionInitData: any) => {
            logger.log('[Injected] auctionInit', { auctionInitData });
        });
        this.globalPbjs.onEvent('auctionEnd', (auctionEndData: any) => {
            logger.log('[Injected] auctionEnd', { auctionEndData });
            this.events.auctionEndTimestamp = Date.now();
        });
    }
    getPrebidBids(): IPrebidBid[] {
        const allBidResponses: { [key: string]: IPrebidBid[]; } = this.globalPbjs.getBidResponses();
        const prebidSlots = this.getPrebidSlots();
        let prebidBids: IPrebidBid[] = [];

        // _bidsReceived deprecated since prebid 1.0
        if (!prebidBids[0] && this.globalPbjs._bidsReceived) {
            prebidBids = this.globalPbjs._bidsReceived;
        }

        if (!prebidBids[0] && prebidSlots[0]) {
            prebidSlots.forEach(prebidSlot => {
                const bid_responses: { bids: IPrebidBid[]; } = this.globalPbjs.getBidResponsesForAdUnitCode(prebidSlot.code);
                bid_responses.bids.forEach(bid => {
                    prebidBids.push(bid);
                });
            });
        }

        if (!prebidBids[0] && Object.keys(allBidResponses)[0]) {
            Object.keys(allBidResponses).forEach(key => {
                allBidResponses[key].forEach(bid => {
                    prebidBids.push(bid);
                });
            })
        }

        return prebidBids;

    }

    getPrebidSlots(): IPrebidAdUnit[] {
        //  copy array
        return this.globalPbjs?.adUnits.slice() || [];
    }

    processBids(): void {
        // Process bids
        this.bids.every((bid) => {
            if (!bid.bidderCode) {
                // no bidderCode in bid => stop loop 
                return false;
            };

            // consolidating CPMs into pbjs.adUnits
            this.slots.forEach(slot => {
                if (slot.code == bid.adUnitCode) {
                    slot.bids.every((slotBid) => {
                        if (slotBid.adId === bid.adId) {
                            // allready has an adId => stop loop 
                            return false;
                        };
                        if (slotBid.bidder == bid.bidder && typeof slotBid.cpm == 'undefined') {
                            slotBid.adId = bid.adId
                            slotBid.cpm = bid.cpm;
                            // slotBid updated => stop loop 
                            return false;
                        }
                        // continue loop
                        return true;
                    });
                }
            });


            this.events.bidders[bid.bidderCode] = this.events.bidders[bid.bidderCode] || { requestTimestamp: bid.requestTimestamp };

            if (bid.responseTimestamp) {
                this.events.bidders[bid.bidderCode].responseTimestamp = this.events.bidders[bid.bidderCode].responseTimestamp || bid.responseTimestamp;
                if (this.events.bidders[bid.bidderCode].responseTimestamp > bid.responseTimestamp) {
                    this.events.bidders[bid.bidderCode].responseTimestamp = bid.responseTimestamp;
                }
            }

            this.events.bidders[bid.bidderCode].responseTime = this.events.bidders[bid.bidderCode].responseTimestamp - this.events.bidders[bid.bidderCode].requestTimestamp;

            if (bid.requestTimestamp) {
                this.events.auctionStartTimestamp = this.events.auctionStartTimestamp || bid.requestTimestamp;
                // lowest bidrequest Timestamp as auctionStartTimestamp
                if (bid.requestTimestamp < this.events.auctionStartTimestamp) {
                    this.events.auctionStartTimestamp = bid.requestTimestamp;
                }
            }
            if (bid.responseTimestamp) {
                this.events.auctionEndTimestamp = this.events.auctionEndTimestamp || bid.responseTimestamp;
                // highest bidresponse Timestamp as auctionEndTimestamp
                if (bid.responseTimestamp > this.events.auctionEndTimestamp) {
                    this.events.auctionEndTimestamp = bid.responseTimestamp;
                }
            }

            return true
        });

        Object.keys(this.events.bidders).forEach(key => {
            this.events.bidders[key].requestTimestamp = this.events.bidders[key].requestTimestamp || this.events.auctionStartTimestamp;
        });

        // sort bidders by requestTimestamp
        const bidderOrders: { [key: string]: number } = {};
        Object.keys(this.events.bidders).forEach(key => {
            const bidder = this.events.bidders[key];
            bidderOrders[key] = bidder.requestTimestamp;
        });
        const biddersSorted = Object.keys(bidderOrders).sort((a, b) => (bidderOrders[a] - bidderOrders[b]));
        const biddersBackup = this.events.bidders;
        this.events.bidders = {};
        for (const bidder in biddersSorted) {
            const tmp = biddersSorted[bidder]
            this.events.bidders[tmp] = biddersBackup[tmp];
        }
    }

    sendDetailsToContentScript(): void {
        this.bids = this.getPrebidBids();
        this.config = this.globalPbjs.getConfig();
        this.slots = this.getPrebidSlots();
        this.events = { auctionStartTimestamp: null, auctionEndTimestamp: null, bidders: {} };
        this.processBids();
        const prebidDetail: IPrebidDetails = {
            version: this.globalPbjs.version,
            slots: this.slots,
            timeout: window.PREBID_TIMEOUT || null,
            events: this.events,
            config: this.config,
            bids: this.bids
        };
        sendToContentScript(constants.EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND, prebidDetail);
    }
}
export const preBid = new Prebid();

export interface IPrebidBid {
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

interface IPrebidEventBidder {
    requestTimestamp?: number;
    responseTime?: number;
    responseTimestamp?: number;
}

interface IPrebidEvents {
    auctionStartTimestamp: number;
    auctionEndTimestamp: number;
    bidders: {
        [key: string]: IPrebidEventBidder;
    };
}

interface IPrebidSlotBid {
    adId: string;
    bidder: string;
    cpm: number;
    params: {
        [key: string]: any;
    }
}

interface IPrebidMediaType {
    banner: {
        sizes: number[][]
    };
    native: {
        type: string;
        adTemplate: string;
        image: {
            required: boolean;
            sizes: number[];
        }
        sendTargetingKeys: boolean;
        sponsoredBy: {
            required: boolean;
        }
        title: {
            required: boolean;
            len: number;
        }
    };
    video: {
        sizes: number[][];
        playerSize: number[][];
        context: string;
        mimes: string[];
        maxduration: number;
        api: number[];
        protocols: number[];
    }
}

interface IPrebidSlot {
    bids: IPrebidSlotBid[];
    code: string;
    mediaTypes: IPrebidMediaType[];
}

interface IPrebidAdUnit {
    bids: IPrebidSlotBid[];
    code: string;
    mediaTypes: IPrebidMediaType[];
}

interface IPrebidConfigPriceBucket {
    precision: number;
    min: number;
    max: number;
    increment: number;
}

interface IPrebidConfig {
    debug: boolean;
    bidderTimeout: number;
    publisherDomain: string;
    priceGranularity: string;
    customPriceBucket: {
        buckets: IPrebidConfigPriceBucket[];
    };
    mediaTypePriceGranularity: any;
    enableSendAllBids: boolean;
    useBidCache: false;
    deviceAccess: true;
    bidderSequence: string;
    timeoutBuffer: number;
    disableAjaxTimeout: false;
    maxNestedIframes: number;
    auctionOptions: any;
    userSync: {
        syncEnabled: boolean
        filterSettings: {
            image: {
                bidders: string;
                filter: string;
            }
        },
        syncsPerBidder: number;
        syncDelay: number;
        auctionDelay: number;
    },
    cache: {
        url: string;
    },
    [key: string]: any;
}

export interface IPrebidDetails {
    version: string;
    slots: IPrebidSlot[];
    timeout: number;
    events: IPrebidEvents;
    config: IPrebidConfig;
    bids: IPrebidBid[];
}