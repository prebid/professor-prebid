import logger from '../../logger';
import { sendToContentScript } from '../../utils';
import constants from '../../constants.json';

declare global {
    interface Window {
        pbjs: any;
        _pbjsGlobals: string[];
        PREBID_TIMEOUT: number;
    }
}
class Prebid {
    globalPbjs: any = window.pbjs;
    bids: IPrebidBid[];
    config: IPrebidConfig;
    eids: IPrebidEids[];
    stopLoop: boolean = false;

    init(): void {
        setTimeout(() => { this.stopLoop = true }, 8000);
        this.loop();
    }

    loop(): void {
        if (this.globalPbjs) {
            this.globalPbjs.que.push(() => this.addEventListeners());
            // this.globalPbjs.que.push(() => setInterval(() => this.sendDetailsToContentScript(), 1000));
        } else if (!this.stopLoop) {
            this.globalPbjs = this.isPrebidInPage();
            requestIdleCallback(() => this.loop());
            // setTimeout(() => this.loop(), 1000);
        }
    }

    addEventListeners(): void {
        this.globalPbjs.onEvent('auctionInit', (auctionInitData: IPrebidAuctionInitEventData) => {
            logger.log('[Injected] auctionInit', { auctionInitData });
            this.sendDetailsToContentScript()
        });

        this.globalPbjs.onEvent('auctionEnd', (auctionEndData: IPrebidAuctionEndEventData) => {
            logger.log('[Injected] auctionEnd', { auctionEndData });
            this.sendDetailsToContentScript()
        });

        this.globalPbjs.onEvent('bidRequested', (bidRequested: IPrebidBidRequestedEventData) => {
            logger.log('[Injected] bidRequested', { bidRequested });
            this.sendDetailsToContentScript()
        });

        this.globalPbjs.onEvent('bidResponse', (bidRequested: IPrebidBidResponseEventData) => {
            logger.log('[Injected] bidResponse', { bidRequested });
            this.sendDetailsToContentScript()
        });

        this.globalPbjs.onEvent('noBid', (noBid: IPrebidNoBidEventData) => {
            logger.log('[Injected] noBid', { noBid });
            this.sendDetailsToContentScript()
        });

        this.globalPbjs.onEvent('bidWon', (bidWon: IPrebidBidWonEventData) => {
            logger.log('[Injected] bidWon', { bidWon });
            this.sendDetailsToContentScript()
        });
        logger.log('[Injected] event listeners added')
    }

    isPrebidInPage() {
        const pbjsGlobals = window._pbjsGlobals;
        if (pbjsGlobals && pbjsGlobals.length > 0) {
            const pbjsGlobal = window[pbjsGlobals[0] as keyof Window];

            const libLoaded = pbjsGlobal.libLoaded;
            if (libLoaded) {
                return pbjsGlobal;
            }
        }
    }

    getPbjsDebugConfig() {
        const pbjsDebugString = window.sessionStorage.getItem('pbjs:debugging');
        try {
            return JSON.parse(pbjsDebugString);
        } catch (e) {
            // return pbjsDebugString;
        }
    }

    sendDetailsToContentScript(): void {
        const filterEvent = (event: (IPrebidAuctionInitEventData | IPrebidAuctionEndEventData | IPrebidBidRequestedEventData | IPrebidNoBidEventData | IPrebidBidWonEventData)) => {
            return (
                event.eventType === 'bidRequested'
                || event.eventType === 'bidResponse'
                || event.eventType === 'noBid'
                || event.eventType === 'auctionEnd'
                || event.eventType === 'auctionInit'
                || event.eventType === 'bidWon'
            )
        };
        this.config = this.globalPbjs.getConfig();
        this.eids = this.globalPbjs.getUserIdsAsEids ? this.globalPbjs.getUserIdsAsEids() : [];
        const prebidDetail: IPrebidDetails = {
            version: this.globalPbjs.version,
            timeout: window.PREBID_TIMEOUT || null,
            events: this.globalPbjs?.getEvents ? this.globalPbjs.getEvents().filter((event: (IPrebidAuctionInitEventData | IPrebidAuctionEndEventData | IPrebidBidRequestedEventData | IPrebidNoBidEventData | IPrebidBidWonEventData)) => filterEvent(event)) : [],
            config: this.config,
            eids: this.eids,
            debug: this.getPbjsDebugConfig()
        };
        sendToContentScript(constants.EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND, prebidDetail);
    }
}

export const prebid = new Prebid();

export interface IPrebidBidParams {
    publisherId: string;
    adSlot: string;
    [key: string]: string | number;
};

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
    getSize: { (): boolean; };
    getStatusCode: { (): boolean; };
    height: number;
    mediaType: string;
    meta: {
        networkId: number;
        buyerId: number;
        advertiserDomains: string[],
        clickUrl: string;
    }
    netRevenue: true
    originalCpm: number;
    originalCurrency: string;
    params: IPrebidBidParams
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
        body: {
            required: boolean
        }
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
    }
}
interface IPrebidAdUnit {
    bids: IPrebidBid[];
    code: string;
    mediaTypes: IPrebidAdUnitMediaTypes;
    sizes: number[][];
    transactionId: string
}

interface IPrebidConfigPriceBucket {
    precision: number;
    min: number;
    max: number;
    increment: number;
}

interface IPrebidConfigUserSync {
    name: string;
    storage: {
        type: string;
        name: string;
        expires: number
    };
    params: {
        [key: string]: string
    }
}

interface IPrebidConfigUserSync {
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
    userIds: IPrebidConfigUserSync[];
}
interface IPrebidConfig {
    debug: boolean;
    bidderTimeout: number;
    publisherDomain: string;
    priceGranularity: string;
    consentManagement: {
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
            }[]
        };
        usp: {
            cmpApi: string;
            getUSPData: {
                uspString: string;
            }
            timeout: number;
        };
    };
    customPriceBucket: {
        buckets: IPrebidConfigPriceBucket[];
    };
    mediaTypePriceGranularity: {
        banner: { buckets: { precision: number, min: number, max: number, increment: number }[] };
        native: { buckets: { precision: number, min: number, max: number, increment: number }[] };
        video: { buckets: { precision: number, min: number, max: number, increment: number }[] };
        'video-outstream': { buckets: { precision: number, min: number, max: number, increment: number }[] };
        priceGranularity: string;
        publisherDomain: string;
    };
    s2sConfig: {
        accountId: string;
        adapter: string;
        adapterOptions: any;
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
        device: {
            ifa: string;
            ifa_type: string;
            lmt: string;
            os: string;
        }
        enabled: boolean;
        endpoint: string;
        syncEndpoint: string;
        maxBids: number;
        syncUrlModifier: any;
        timeout: number;
    };
    targetingControls: {
        allowTargetingKeys: string[];
        alwaysIncludeDeals: boolean;
    }
    enableSendAllBids: boolean;
    useBidCache: boolean;
    deviceAccess: boolean;
    bidderSequence: string;
    timeoutBuffer: number;
    disableAjaxTimeout: boolean;
    maxNestedIframes: number;
    auctionOptions: any;
    userSync: IPrebidConfigUserSync;
    cache: {
        url: string;
    },
    [key: string]: any;
}

export interface IPrebidDebugConfigBid {
    cpm?: number; bidder?: string; adUnitCode?: string;
}

export interface IPrebidDebugConfig {
    enabled?: boolean;
    bids?: IPrebidDebugConfigBid[];
    bidders?: string[];
}
export interface IPrebidDetails {
    version: string;
    timeout: number;
    events: Array<IPrebidAuctionInitEventData | IPrebidAuctionEndEventData | IPrebidBidRequestedEventData | IPrebidNoBidEventData | IPrebidBidWonEventData>;
    config: IPrebidConfig;
    eids: IPrebidEids[];
    debug: IPrebidDebugConfig;
}

export interface IPrebidAuctionInitEventData {
    args: {
        adUnitCodes: string[];
        adUnits: IPrebidAdUnit[];
        auctionEnd: undefined;
        auctionId: string;
        auctionStatus: string
        bidderRequests: IPrebidBidderRequest[];
        bidsReceived: IPrebidBid[]
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
        labels: any;
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
            allowedVendors: any;
            disclosedVendors: any;
        }
        publisher: {
            consents: {
                [key: number]: boolean;
            },
            legitimateInterests: {
                [key: number]: boolean;
            },
            customPurpose: any;
            restrictions: any;
        }
        publisherCC: string;
        purpose: {
            consents: {
                [key: number]: boolean;
            },
            legitimateInterests: {
                [key: number]: boolean;
            }
        }
        purposeOneTreatment: boolean;
        specialFeatureOptins: {
            [key: number]: boolean;
        }
        tcString: string;
        tcfPolicyVersion: number;
        useNonStandardStacks: boolean;
        vendor: {
            consents: {
                [key: number]: boolean;
            }, legitimateInterests: {
                [key: number]: boolean;
            }
        }

    },
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
    ceh: any;
    gdprConsent: IPrebidGdprConsent;
    publisherExt: any;
    refererInfo: {
        referer: string;
        reachedTop: boolean;
        isAmp: boolean;
        numIframes: number;
        stack: string[];
    }
    start: number;
    endTimestamp: number;
    elapsedTime: number;
    timeout: number;
    userExt: any;

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
    }
}