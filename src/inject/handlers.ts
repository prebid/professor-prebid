import moment from 'moment';
import DataFrame from '../js/dataframejs/dataframe';
import '../logger';
import { sendToContentScript } from '../utils';
import constants from '../constants.json';
import logger from '../logger';
import { displayTable } from '../debugging';
import { IAuction, IAuctionData, IBid, IBidderDoneData, IBidResponseObj, IBidTimeoutData, IBidWonData, IDoneBid, ISlot } from '..';

import { AuctionsDfRow, BidsDfRow, SlotsDfRow } from '../pages/Content/index'
import Row from '../js/dataframejs/row';
const DEBUG = 1;

export interface BidderDoneDfRow {
  auction: string;
  adUnitPath: string;
  bidder: string;
  responseTime: number;
  type: string;
}

// Globals
let allBidsDf = new DataFrame([], constants.DATAFRAME_COLUMNS.bidColumns);
let auctionDf: AuctionsDfRow[] = [];
let bidderDoneDf = new DataFrame([], constants.DATAFRAME_COLUMNS.bidderDoneColumns);
let slotDf: SlotsDfRow[] = [];
const visibleSlots = new Set();
const slotBidsBySlotElementId: { [key: string]: any } = {};

// Prebid Events

class PrebidHandler {
  enabled = false;
  globalPbjs: any = null;
  domFoundTime: number;

  init(globalPbjs: any, domFoundTime: number): void {
    this.enabled = true;
    this.globalPbjs = globalPbjs;
    this.domFoundTime = domFoundTime;
    this.handleEvents();

    this._sendConfigToContentScript();

    // TODO -> notify popup that prebid exists in page
  }

  handleEvents(): void {

    this.globalPbjs.onEvent('auctionInit', (auctionInitData: IAuctionData) => {
      logger.log('[Injected] auctionInit', moment(auctionInitData.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS'));

      const existingRows = auctionDf.find(row => row.auction == auctionInitData.auctionId);
      if (existingRows) {
        logger.error('[Injected] XXXXXXXXXXXXXXXXXXXX Should not happen!!! XXXXXXXXXXXXXXXXXX');
      } else {
        // pre-auction is only relevant for an initial page load where we don't get an auction init, only the auction end. 
        // then we can use domloadedtime as the time between the dom being ready and the auction start.
        // For auctions that occur when a user scrolls down for example, then the first event is the auction init so there is no relevant pre-auction activty.
        auctionInitData.adUnitCodes.forEach((aup) => updateAuctionDf(auctionInitData.auctionId, aup, auctionInitData.timestamp, auctionInitData.timestamp));
      }
    });

    this.globalPbjs.onEvent('auctionEnd', (auctionEndData: IAuctionData) => {
      const auctionStartTime = auctionEndData.timestamp;
      const auctionEndTime = Date.now();
      // get the new data and merge with existing
      const new_allBidsDf = new DataFrame(this._getAllBids(auctionEndTime), constants.DATAFRAME_COLUMNS.bidColumns);
      const highestCpmBids = new DataFrame(this._getHighestCpmBids(auctionEndTime), constants.DATAFRAME_COLUMNS.bidColumns);
      const allWinningBids = new DataFrame(this._getAllWinningBids(auctionEndTime), constants.DATAFRAME_COLUMNS.bidColumns);

      const auctionIndex = auctionDf.findIndex(row => row.auction == auctionEndData.auctionId);
      if (auctionIndex !== -1) {
        auctionDf[auctionIndex] = { ...auctionDf[auctionIndex], endTime: auctionEndTime }
      } else {
        auctionEndData.adUnitCodes.forEach(adUnitPath => updateAuctionDf(auctionEndData.auctionId, adUnitPath, this.domFoundTime, auctionStartTime, auctionEndTime));
      }
      displayTable(auctionDf, 'auctionDf');

      const createOrUpdateDf = (a: DataFrame, b: DataFrame): DataFrame => { return a ? a.union(b) : b; }

      allBidsDf = createOrUpdateDf(allBidsDf, new_allBidsDf);
      // TODO need to extract this update into a general df func
      // Let's mark the highest cpm bids - these can change if a bidder is selected as a winner

      allBidsDf = allBidsDf.join(highestCpmBids
        .select('auction', 'adUnitPath', 'adId', 'bidder', 'nonRenderedHighestCpm', 'modified')
        .rename('nonRenderedHighestCpm', 'nonRenderedHighestCpm_2')
        .rename('modified', 'modified_2'),
        ['auction', 'adUnitPath', 'adId', 'bidder'],
        'outer'
      );

      allBidsDf = allBidsDf
        .map((row: Row) => row.set('nonRenderedHighestCpm', row.get('nonRenderedHighestCpm_2') ? true : false))
        .drop(['nonRenderedHighestCpm_2', 'modified_2']);

      // Let's mark the ad winners
      allBidsDf = allBidsDf.join(allWinningBids
        .select('auction', 'adUnitPath', 'adId', 'bidder', 'nonRenderedHighestCpm', 'rendered', 'modified')
        .rename('nonRenderedHighestCpm', 'nonRenderedHighestCpm_2')
        .rename('rendered', 'rendered_2')
        .rename('modified', 'modified_2'),
        ['auction', 'adUnitPath', 'adId', 'bidder'],
        'left'
      );

      allBidsDf = allBidsDf
        .map((row: Row) =>
          row.set('nonRenderedHighestCpm', row.get('nonRenderedHighestCpm_2') ? true : false) &&
          row.set('rendered', row.get('rendered_2') ? true : false)
        )
        .drop(['nonRenderedHighestCpm_2', 'rendered_2', 'modified_2']);

      // merge in any bidder done data that comes in
      try {
        allBidsDf = allBidsDf.join(bidderDoneDf, ['auction', 'adUnitPath', 'bidder'], 'left');
        allBidsDf = allBidsDf
          .map((row: Row) => row.set('time', row.get('time') == undefined ? row.get('responseTime') - auctionStartTime : row.get('time')))
          .drop(['responseTime']);
      } catch (e) {
        logger.log(e);
      }

      displayTable(allBidsDf.toCollection(), 'No all bids');

      // On auctionEnd, let the content script know it happened
      const dfs = {
        allBids: allBidsDf.toCollection(),
        auction: auctionDf,
        slots: slotDf,
      };

      const response = {
        auctionTimestamp: Date.now(),
        bidderRequests: auctionEndData.bidderRequests,
        dfs,
      };

      sendToContentScript(constants.EVENTS.AUCTION_END, response);
    });

    // won the adserver auction
    // capture state change
    this.globalPbjs.onEvent('bidWon', (bidWonData: IBidWonData) => {
      logger.log('[Injected] bidWon', { time: moment().format('YYYY-MM-DD HH:mm:ss.SSS'), bidWonData });

      const ts = Date.now();

      const bid: any = allBidsDf.findWithIndex((row: Row) =>
        row.get('auction') === bidWonData.auctionId &&
        row.get('adId') === bidWonData.adId &&
        row.get('bidder') === bidWonData.bidderCode
      );

      if (bid) {
        allBidsDf.setRowInPlace(bid.index, (row) => row.set('rendered', true).set('nonRenderedHighestCpm', false).set('modified', ts));
      }
    });

    this.globalPbjs.onEvent('addAdUnits', () => {
      // log when ad units are added to prebid
      logger.log('[Injected] Ad units were added to Prebid.');
    });

    this.globalPbjs.onEvent('bidderDone', (bidderDoneData: IBidderDoneData) => {
      logger.log('[Injected] Bidder Done ' + JSON.stringify(bidderDoneData.bidderCode));
      // update bidderDone with done
      bidderDoneData.bids.forEach((doneBid: IDoneBid) => updateBidderDoneDf(doneBid));
    });

    this.globalPbjs.onEvent('bidTimeout', (bidTimeoutData: IBidTimeoutData) => {
      // update bidderDone with timeout
      bidTimeoutData.bids.forEach((timeoutBid: any) => updateBidderDoneDf(timeoutBid));

      bidTimeoutData.bids.forEach((timeoutBid: any) => {
        logger.log('[Injected] bidTimeout', JSON.stringify(timeoutBid));
      });
    });
  }

  _getAllBids(ts: number) {
    const highestCPMBids = this.globalPbjs.getHighestCpmBids();
    const winners = this.globalPbjs.getAllWinningBids();
    const pwinners = this.globalPbjs.getAllPrebidWinningBids();

    if (DEBUG) {
      logger.log('[Injected] num winners at ' + moment().format() + ' = ' + winners.length);
      logger.log('[Injected] num pwinners at ' + moment().format() + ' = ' + pwinners.length);
    }

    const output: any = [];

    this._forEachBidResponse(this.globalPbjs.getBidResponses(), (code: any, bid: any) => {
      output.push({
        auction: bid.auctionId,
        adUnitPath: code,
        adId: bid.adId,
        bidder: bid.bidder,
        time: bid.timeToRespond,
        cpm: bid.cpm,
        slotSize: bid.size,
        netRevenue: bid.netRevenue,
        dealId: bid.dealId,
        creativeId: bid.creativeId,
        msg: bid.statusMessage,
        nonRenderedHighestCpm: !!highestCPMBids.find((winner: any) => {
          return winner.adId == bid.adId;
        }),
        rendered: !!winners.find((winner: any) => {
          return winner.adId == bid.adId;
        }),
        bidRequestTime: bid.requestTimestamp,
        bidResponseTime: bid.responseTimestamp,
        created: ts,
        modified: ts,
        type: 'bid',
        slotElementId: undefined,
      });
    });

    this._forEachBidResponse((this.globalPbjs.getNoBids && this.globalPbjs.getNoBids()) || {}, (code: string, bid: any) => {
      output.push({
        auction: bid.auctionId,
        adUnitPath: code,
        adId: bid.adId,
        bidder: bid.bidder,
        slotSize: bid.size,
        msg: 'no bid',
        nonRenderedHighestCpm: false,
        rendered: false,
        bidRequestTime: bid.requestTimestamp,
        bidResponseTime: bid.responseTimestamp,
        created: ts,
        modified: ts,
        type: 'noBid',
        slotElementId: undefined,
      });
    });
    return output;
  }

  // For Debugging
  _getHighestCpmBids(ts: number) {
    const output: any = [];
    this.globalPbjs.getHighestCpmBids().forEach((bid: IBidResponseObj) => {
      output.push({
        auction: bid.auctionId,
        adUnitPath: bid.adUnitCode,
        adId: bid.adId,
        bidder: bid.bidder,
        time: bid.timeToRespond,
        cpm: bid.cpm,
        slotSize: bid.size,
        netRevenue: bid.netRevenue,
        dealId: bid.dealId,
        creativeId: bid.creativeId,
        nonRenderedHighestCpm: true,
        rendered: false,
        bidRequestTime: bid.requestTimestamp,
        bidResponseTime: bid.responseTimestamp,
        created: ts,
        modified: ts,
        slotElementId: undefined,
      });
    });
    return output;
  }

  // For Debugging
  _getAllWinningBids(ts: number): any[] {
    const output: any = [];
    this.globalPbjs.getAllWinningBids().forEach((bid: IBidResponseObj) => {
      output.push({
        auction: bid.auctionId,
        adUnitPath: bid.adUnitCode,
        adId: bid.adId,
        bidder: bid.bidder,
        time: bid.timeToRespond,
        cpm: bid.cpm,
        slotSize: bid.size,
        netRevenue: bid.netRevenue,
        dealId: bid.dealId,
        creativeId: bid.creativeId,
        nonRenderedHighestCpm: false,
        rendered: true,
        bidRequestTime: bid.requestTimestamp,
        bidResponseTime: bid.responseTimestamp,
        created: ts,
        modified: ts,
        slotElementId: undefined,
      });
    });
    return output;
  }

  _forEachBidResponse(responses: IBidResponseObj, cb: any) {
    Object.keys(responses).forEach((adUnitCode) => {
      const response = responses[adUnitCode];
      response.bids.forEach((bid) => {
        cb(adUnitCode, bid);
      });
    });
  }

  _sendConfigToContentScript(): void {
    const response = {
      prebidConfig: this.globalPbjs.getConfig(),
    };
    sendToContentScript(constants.EVENTS.CONFIG_AVAILABLE, response);
  }
}

class GPTHandler {
  init() {
    this.handleEvents();

    // TODO -> notify popup that gpt exists in page
  }

  handleEvents() {
    // fires when a creative is injected into a slot. 
    // It will occur before the creative's resources are fetched.
    // we can get these before we have fully initialised
    googletag.pubads().addEventListener('slotRenderEnded', (event: any) => {
      const ts = Date.now();
      const slotElementId = event.slot.getSlotElementId();
      const adUnitPath = event.slot.getAdUnitPath();
      const targetingMap = event.slot.getTargetingMap();
      const hbAdId = targetingMap['hb_adid'];

      logger.log('[Injected] slotRenderEnded', { slotElementId, slotId: event.slot.getSlotId().getId(), adUnitPath, targetingMap, });

      // add it to our slots dataframe
      const existingRow = slotDf.find(slotRow => slotRow.slotElementId === slotElementId && slotRow.adUnitPath === adUnitPath);
      if (!existingRow) {
        slotDf.push({
          adId: hbAdId,                     // adId
          adUnitPath: adUnitPath,           // adUnitPath
          slotElementId: slotElementId,     // slotElementId
          slotLoadTs: null,                 // slotLoadTs
          slotRenderedTs: ts                // slotRenderedTs
        });
      }

      // update the auction with the slotId
      const bid = allBidsDf.find((bidRow: Row) => bidRow.get('adId') == hbAdId);
      if (bid) {
        const auctionIndex = auctionDf.findIndex(auctionRow =>
          auctionRow.auction === bid.get('auction')
          && auctionRow.adUnitPath === bid.get('adUnitPath')
        );

        if (auctionIndex !== -1) {
          auctionDf[auctionIndex] = { ...auctionDf[auctionIndex], slotElementId }
        }
      }

      const response = {
        gptTimestamp: Date.now(),
        gptTargeting: targetingMap,
        adUnitPath,
        slotElementId,
        auctionDf: auctionDf.filter(row => row.slotElementId == event.slot.getSlotElementId()),
      };

      sendToContentScript(constants.EVENTS.GPT_SLOTRENDERED, response);
    });

    googletag.pubads().addEventListener('slotOnload', (event: any) => {
      // Is this how GAM computed creative render time?
      // Fires when the slot is actually loaded and available in the browser
      const ts = Date.now();
      const slotElementId = event.slot.getSlotElementId();
      const adUnitPath = event.slot.getAdUnitPath();
      const targetingMap = event.slot.getTargetingMap();

      logger.log('[Injected] slotOnload', {
        slotElementId,
        slotId: event.slot.getSlotId().getId(),
        adUnitPath,
        targetingMap,
      });

      // update the slot dataframe with the load timestamp
      slotDf = slotDf.map(row => ({ ...row, slotLoadTs: row.slotElementId == slotElementId && row.adUnitPath == adUnitPath ? ts : row.slotLoadTs }));

      displayTable(slotDf, 'slotDf');

      // we now want to link the bids to this slot.
      // There is no auction id in the slot event. We could use the adUnitPath but multiple auctions can run
      // on the same adUnit which means it can be difficult to link correctly.
      // If it is available we can use the hb_adid to link to the adid.
      // Also some sites have the slot element id in the bidder adunitpath!

      let slotBidsDf = allBidsDf.filter(
        (row: Row) =>
          (row.get('adUnitPath') == adUnitPath || row.get('adUnitPath') == slotElementId) &&
          row.get('cpm') != undefined &&
          row.get('slotElementId') == undefined
      );

      if (slotBidsDf.count() > 0) {
        // multiple slots with same adunitpath?
        const adUnitSlotsDf = slotDf.filter(row => row.adUnitPath === adUnitPath);
        if (adUnitSlotsDf.length > 1) {
          // mult auctions for this adUnitPath. 
          // find the auction we are looking at from the highest prebid bidder which will have its hb_adid set. 
          // We can then identify the slotElementId for these bids
          const thisSlotBids = this.matchBids(allBidsDf, slotBidsDf, adUnitSlotsDf, event.slot);
          slotBidsBySlotElementId[slotElementId] = thisSlotBids;
          // @ts-ignore
          slotBidsDf = thisSlotBids;
        } else {
          // we only have one slot for this adUnitPath
          slotBidsBySlotElementId[slotElementId] = slotBidsDf;
        }

        // We now have the correct set of bids for this slot
        slotBidsDf = slotBidsDf.replace(undefined, slotElementId, ['slotElementId']);
      }

      displayTable(slotBidsDf.toCollection(), 'no slot bids');

      if (slotBidsDf.count() > 0) {
        // lets update the main dataframes - TODO need a nice utiliy func for this
        allBidsDf = allBidsDf.join(
          slotBidsDf
            .select('auction', 'adUnitPath', 'adId', 'bidder', 'slotElementId')
            .rename('slotElementId', 'slotElementId2'),
          ['auction', 'adUnitPath', 'adId', 'bidder'],
          'left'
        );

        allBidsDf = allBidsDf
          .map((row: Row) => row.set('slotElementId', row.get('slotElementId2') ? row.get('slotElementId2') : row.get('slotElementId')))
          .drop('slotElementId2');

        auctionDf = auctionDf.map(row => ({
          ...row,
          slotElementId: (
            row.auction == slotBidsDf.getRow(0).get('auction')
            && row.adUnitPath == slotBidsDf.getRow(0).get('adUnitPath')
          ) ? slotElementId : row.slotElementId
        }));

        displayTable(auctionDf, 'no auctions');
        displayTable(allBidsDf.toCollection(), 'no bids');
      }

      // pull out this slot's data and send the response

      const thisSlotDf = slotDf.filter(row => row.slotElementId === slotElementId && row.adUnitPath === adUnitPath);

      const response = {
        slotDf: thisSlotDf,
        bidsDf: slotBidsDf.toCollection(),
        auctionDf: auctionDf.filter(row => row.slotElementId === slotElementId),
      };
      sendToContentScript(constants.EVENTS.GPT_SLOTLOADED, response);
    });

    googletag.pubads().addEventListener('slotVisibilityChanged', (event) => {
      if (event.inViewPercentage > 0) {
        visibleSlots.add(event.slot.getSlotElementId());
      } else {
        visibleSlots.delete(event.slot.getSlotElementId());
      }

      sendToContentScript('GPT_VISIBILITY_EVENT', Array.from(visibleSlots));
    });
  }

  // if hb_adid exists then we'll use that, otherwise we'll check if the bids adunitpaths are actually slotelementdids.
  // finally we'll attempt to use time for the case where we have mult auctions on the same adunitpath and diff slot ids
  matchBids(allBidsDf: DataFrame, slotBidsDf: DataFrame, adUnitSlotsDf: SlotsDfRow[], slot: any): DataFrame | any[] {
    const slotElementId = slot.getSlotElementId();
    const targeting = slot.getTargetingMap();
    const hbAdId = targeting['hb_adid'];

    if (hbAdId !== undefined) {
      const bidderWithMatchingTargeting = allBidsDf.filter((row: Row) => row.get('adId') === hbAdId);
      if (bidderWithMatchingTargeting.count() < 1) {
        logger.error('[Injected] bidderWithMatchingTargeting without rows!');
      } else {
        const matchingAuction = bidderWithMatchingTargeting.getRow(0).get('auction');
        return slotBidsDf.filter((row: Row) => row.get('auction') == matchingAuction);
      }
    }

    const biddersUseSlotIdForAUP = slotBidsDf.filter((bid: Row) => bid.get('adUnitPath') === slotElementId);
    return biddersUseSlotIdForAUP.count() > 0 ? biddersUseSlotIdForAUP : this.bidSlotFallbackLinker(adUnitSlotsDf, slotBidsDf, slotElementId);
  }

  bidSlotFallbackLinker(adUnitSlotsDf: SlotsDfRow[], slotBidsDf: DataFrame, slotElementId: string): any[] {
    // should never happen now that we are using hb_adid
    logger.warn('[Injected] Uh oh, hb_adid is empty. Trying to link using time...');
    // sort by time and for each find the bids that have a response time earlier
    // these are these slots bids. remove them from the total and continue
    // adUnitSlotsDf = adUnitSlotsDf.sortBy('slotRenderedTs');
    adUnitSlotsDf = adUnitSlotsDf.sort((x, y) => x.slotRenderedTs - y.slotRenderedTs);

    const extractSlotBids = (slot: SlotsDfRow) => {
      const thisSlotBids = slotBidsDf.filter((row: Row) => row.get('bidResponseTime') < slot.slotRenderedTs);
      const thisSlotAuction = thisSlotBids.distinct('auction');
      if (thisSlotAuction.count() > 1) {
        logger.error('[Injected] XXXXXXXXXXXXXXXXXXX Multiple Auctions for same slot with interleaving times?');
      }
      if (slot.slotElementId == slotElementId) {
        return slotBidsDf;
      } else {
        slotBidsDf = slotBidsDf.diff(thisSlotBids, ['auction']);
      }
    }
    return adUnitSlotsDf.map(slotDf => extractSlotBids(slotDf));
  }
}

////////////////////////////////////
// Dataframe utility functions - TODO move
////////////////////////////////////

const updateAuctionDf = (auctionId: string, aup: string, preAuctionStartTime: number, auctionStartTime: number, auctionEndTime: number = undefined) => {
  try {
    auctionDf.push({
      auction: auctionId,                       // auction
      adUnitPath: aup,                          // adUnitPath
      endTime: auctionEndTime,                  // endTime
      preAuctionStartTime: preAuctionStartTime, // preAuctionStartTime
      slotElementId: undefined,                 // slotElementId
      startTime: auctionStartTime,              // startTime
    });
  } catch (e) {
    logger.log('[Injected] updateAuctionDf failed', e);
  }
}

const updateBidderDoneDf = (doneBid: IDoneBid) => {
  const ts = Date.now();
  try {
    bidderDoneDf = bidderDoneDf.push([
      doneBid.auctionId,      // auction
      doneBid.adUnitCode,     // adUnitPath
      doneBid.advertiserId,   // bidder
      ts,                     // responseTime
      // 'timeout',           // responseTime?
      doneBid.bidder,         // type
    ]);
  } catch (e) {
    logger.log(e);
  }
}

export const gptHandler = new GPTHandler();
export const prebidHandler = new PrebidHandler();
