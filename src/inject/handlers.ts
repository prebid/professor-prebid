import moment from 'moment';
import '../logger';
import { sendToContentScript } from '../utils';
import constants from '../constants.json';
import logger from '../logger';
import { displayTable } from '../debugging';
import { IAuctionData, IBidderDoneData, IBidResponseObj, IBidTimeoutData, IBidWonData, IDoneBid, } from '..';

import { AuctionsDfRow, BidsDfRow, SlotsDfRow } from '../pages/Content/index'

const DEBUG = 1;

export interface BidderDoneDfRow {
  auction: string;
  adUnitPath: string;
  bidder: string;
  responseTime: number;
  type: string;
}

interface SlotBidsBySlotElementId {
  [key: string]: BidsDfRow[]
}
// Globals
let allBidsDf: BidsDfRow[];
let auctionDf: AuctionsDfRow[] = [];
let bidderDoneDf: BidderDoneDfRow[] = [];
let slotDf: SlotsDfRow[] = [];
const visibleSlots = new Set();
const slotBidsBySlotElementId: SlotBidsBySlotElementId = {};

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
      const new_allBidsDf: BidsDfRow[] = this._getAllBids(auctionEndTime);
      const highestCpmBids: BidsDfRow[] = this._getHighestCpmBids(auctionEndTime);
      const allWinningBids: BidsDfRow[] = this._getAllWinningBids(auctionEndTime);

      const auctionIndex = auctionDf.findIndex(row => row.auction == auctionEndData.auctionId);
      if (auctionIndex !== -1) {
        auctionDf[auctionIndex] = { ...auctionDf[auctionIndex], endTime: auctionEndTime }
      } else {
        auctionEndData.adUnitCodes.forEach(adUnitPath => updateAuctionDf(auctionEndData.auctionId, adUnitPath, this.domFoundTime, auctionStartTime, auctionEndTime));
      }
      displayTable(auctionDf, 'auctionDf');

      const createOrUpdateDf = (a: BidsDfRow[], b: BidsDfRow[]): BidsDfRow[] => { return a ? a.concat(b) : b; }

      allBidsDf = createOrUpdateDf(allBidsDf, new_allBidsDf);
      // TODO need to extract this update into a general df func
      // Let's mark the highest cpm bids - these can change if a bidder is selected as a winner
      allBidsDf = allBidsDf.map(allBidsDfRow => {
        const select = highestCpmBids.map(
          ({ auction, adUnitPath, adId, bidder, nonRenderedHighestCpm, modified }) => ({
            auction,
            adUnitPath,
            adId,
            bidder,
            nonRenderedHighestCpm,
            modified,
            nonRenderedHighestCpm_2: nonRenderedHighestCpm,
            modified_2: modified
          }));
        const index = select.findIndex(highestCpmBid =>
          highestCpmBid.auction === allBidsDfRow.auction
          && highestCpmBid.adUnitPath === allBidsDfRow.adUnitPath
          && highestCpmBid.adId === allBidsDfRow.adId
          && highestCpmBid.bidder === allBidsDfRow.bidder)
        if (index !== -1) {
          return {
            ...allBidsDfRow,
            ...select[index]
          }
        } else {
          return {
            ...allBidsDfRow
          }
        }
      })

      allBidsDf = allBidsDf
        .map(row => {
          const output = {
            ...row,
            nonRenderedHighestCpm: row.nonRenderedHighestCpm_2 ? true : false
          }
          delete output.nonRenderedHighestCpm_2;
          delete output.modified_2;
          return output
        })

      // Let's mark the ad winners
      allBidsDf = allBidsDf.map(allBidsDfRow => {
        const select = allWinningBids
          .map(({ auction, adUnitPath, adId, bidder, nonRenderedHighestCpm, rendered, modified }) => ({
            auction,
            adUnitPath,
            adId,
            bidder,
            nonRenderedHighestCpm,
            rendered,
            modified,
            nonRenderedHighestCpm_2: nonRenderedHighestCpm,
            rendered_2: rendered,
            modified_2: modified
          }));
        const index = select.findIndex(allWinningBidsRow =>
          allWinningBidsRow.auction === allBidsDfRow.auction
          && allWinningBidsRow.adUnitPath === allBidsDfRow.adUnitPath
          && allWinningBidsRow.adId === allBidsDfRow.adId
          && allWinningBidsRow.bidder === allBidsDfRow.bidder)
        if (index !== -1) {
          return {
            ...allBidsDfRow,
            ...select[index]
          }
        } else {
          return {
            ...allBidsDfRow
          }
        }
      })


      allBidsDf = allBidsDf
        .map(row => {
          const output = {
            ...row,
            nonRenderedHighestCpm: row.nonRenderedHighestCpm_2 ? true : false,
            rendered: row.rendered_2 ? true : false
          }
          delete output.nonRenderedHighestCpm_2;
          delete output.rendered_2;
          delete output.modified_2;
          return output;
        })

      // merge in any bidder done data that comes in
      try {
        allBidsDf = allBidsDf.map(allBidsDfRow => {
          const index = bidderDoneDf.findIndex(bidderDoneDfRow =>
            bidderDoneDfRow.auction === allBidsDfRow.auction
            && bidderDoneDfRow.adUnitPath === allBidsDfRow.adUnitPath
            && bidderDoneDfRow.bidder === allBidsDfRow.bidder
          )
          let output;
          if (index !== -1) {
            output = {
              ...allBidsDfRow,
              ...bidderDoneDf[index],
              time: allBidsDfRow.time == undefined ? allBidsDfRow.responseTime - auctionStartTime : allBidsDfRow.time
            }
          } else {
            output = {
              ...allBidsDfRow,
              time: allBidsDfRow.time == undefined ? allBidsDfRow.responseTime - auctionStartTime : allBidsDfRow.time
            }
          }
          delete output.responseTime;
          return output;
        })
      } catch (e) {
        logger.log(e);
      }

      displayTable(allBidsDf, 'No all bids');

      // On auctionEnd, let the content script know it happened
      const dfs = {
        allBids: allBidsDf,
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

      const bidIndex = allBidsDf.findIndex(row =>
        row.auction === bidWonData.auctionId &&
        row.adId === bidWonData.adId &&
        row.bidder === bidWonData.bidderCode
      );

      if (bidIndex !== -1) {
        allBidsDf[bidIndex] = {
          ...allBidsDf[bidIndex],
          rendered: true,
          nonRenderedHighestCpm: false,
          modified: ts
        }
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

    const output: BidsDfRow[] = [];

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
        slotElementId: undefined
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
        cpm: undefined,
        creativeId: undefined,
        dealId: undefined,
        netRevenue: undefined,
        time: undefined
      });
    });
    return output;
  }

  // For Debugging
  _getHighestCpmBids(ts: number): BidsDfRow[] {
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
  _getAllWinningBids(ts: number): BidsDfRow[] {
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
      const bid = allBidsDf.find(bidRow => bidRow.adId == hbAdId);
      if (bid) {
        const auctionIndex = auctionDf.findIndex(auctionRow =>
          auctionRow.auction === bid.auction
          && auctionRow.adUnitPath === bid.adUnitPath
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
        auctionDf: auctionDf.filter(auctionDfRow => auctionDfRow.slotElementId == event.slot.getSlotElementId()),
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
      slotDf = slotDf.map(slotDfRow => ({
        ...slotDfRow,
        slotLoadTs: slotDfRow.slotElementId === slotElementId && slotDfRow.adUnitPath === adUnitPath ? ts : slotDfRow.slotLoadTs
      }));

      displayTable(slotDf, 'slotDf');

      // we now want to link the bids to this slot.
      // There is no auction id in the slot event. We could use the adUnitPath but multiple auctions can run
      // on the same adUnit which means it can be difficult to link correctly.
      // If it is available we can use the hb_adid to link to the adid.
      // Also some sites have the slot element id in the bidder adunitpath!

      let slotBidsDf = allBidsDf.filter(
        allBidsDfRow =>
          (allBidsDfRow.adUnitPath === adUnitPath || allBidsDfRow.adUnitPath === slotElementId)
          && allBidsDfRow.cpm !== undefined &&
          allBidsDfRow.slotElementId === undefined
      );

      if (slotBidsDf.length > 0) {
        // multiple slots with same adunitpath?
        const adUnitSlotsDf = slotDf.filter(row => row.adUnitPath === adUnitPath);
        if (adUnitSlotsDf.length > 1) {
          // mult auctions for this adUnitPath. 
          // find the auction we are looking at from the highest prebid bidder which will have its hb_adid set. 
          // We can then identify the slotElementId for these bids
          const thisSlotBids = this.matchBids(allBidsDf, slotBidsDf, adUnitSlotsDf, event.slot);
          slotBidsBySlotElementId[slotElementId] = thisSlotBids;
          slotBidsDf = thisSlotBids;
        } else {
          // we only have one slot for this adUnitPath
          slotBidsBySlotElementId[slotElementId] = slotBidsDf;
        }

        // We now have the correct set of bids for this slot
        slotBidsDf = slotBidsDf.map(slottbid => {
          const output = {
            ...slottbid
          }
          if (output.slotElementId === undefined) {
            output.slotElementId = slotElementId
          }
          return output
        });
      }

      displayTable(slotBidsDf, 'no slot bids');

      if (slotBidsDf.length > 0) {
        // lets update the main dataframes - TODO need a nice utiliy func for this
        allBidsDf = allBidsDf.map(allBidsDfRow => {
          const select = slotBidsDf
            .map(({ auction, adUnitPath, adId, bidder, slotElementId }) => ({
              auction,
              adUnitPath,
              adId,
              bidder,
              slotElementId,
              slotElementId2: slotElementId
            }));
          const index = select.findIndex(slotBidsDfRow =>
            slotBidsDfRow.auction === allBidsDfRow.auction
            && slotBidsDfRow.adUnitPath === allBidsDfRow.adUnitPath
            && slotBidsDfRow.adId === allBidsDfRow.adId
            && allBidsDfRow.bidder === allBidsDfRow.bidder)
          if (index !== -1) {
            return {
              ...allBidsDfRow,
              ...select[index]
            }
          } else {
            return {
              ...allBidsDfRow
            }
          }
        })

        allBidsDf = allBidsDf
          .map(row => {
            const output = {
              ...row,
              slotElementId: row.slotElementId2 ? row.slotElementId2 : row.slotElementId
            }
            delete output.slotElementId2;
            return output;
          })

        auctionDf = auctionDf.map(row => ({
          ...row,
          slotElementId: row.auction == slotBidsDf[0].auction && row.adUnitPath == slotBidsDf[0].adUnitPath ? slotElementId : row.slotElementId
        }));

        displayTable(auctionDf, 'no auctions');
        displayTable(allBidsDf, 'no bids');
      }

      // pull out this slot's data and send the response

      const thisSlotDf = slotDf.filter(row => row.slotElementId === slotElementId && row.adUnitPath === adUnitPath);

      const response = {
        slotDf: thisSlotDf,
        bidsDf: slotBidsDf,
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
  matchBids(allBidsDf: BidsDfRow[], slotBidsDf: BidsDfRow[], adUnitSlotsDf: SlotsDfRow[], slot: any): BidsDfRow[] {
    const slotElementId = slot.getSlotElementId();
    const targeting = slot.getTargetingMap();
    const hbAdId = targeting['hb_adid'];

    if (hbAdId !== undefined) {
      const bidderWithMatchingTargeting = allBidsDf.filter(row => row.adId === hbAdId);
      if (bidderWithMatchingTargeting.length < 1) {
        logger.error('[Injected] bidderWithMatchingTargeting without rows!');
      } else {
        const matchingAuction = bidderWithMatchingTargeting[0].auction;
        return slotBidsDf.filter(row => row.auction == matchingAuction);
      }
    }

    const biddersUseSlotIdForAUP = slotBidsDf.filter(bid => bid.adUnitPath === slotElementId);
    return biddersUseSlotIdForAUP.length > 0 ? biddersUseSlotIdForAUP : this.bidSlotFallbackLinker(adUnitSlotsDf, slotBidsDf, slotElementId);
  }

  bidSlotFallbackLinker(adUnitSlotsDf: SlotsDfRow[], slotBidsDf: BidsDfRow[], slotElementId: string): BidsDfRow[] {
    // should never happen now that we are using hb_adid
    logger.warn('[Injected] Uh oh, hb_adid is empty. Trying to link using time...');
    // sort by time and for each find the bids that have a response time earlier
    // these are these slots bids. remove them from the total and continue
    adUnitSlotsDf = adUnitSlotsDf.sort((x, y) => x.slotRenderedTs - y.slotRenderedTs);

    const extractSlotBids = (slot: SlotsDfRow) => {
      const thisSlotBids = slotBidsDf.filter(row => row.bidResponseTime < slot.slotRenderedTs);
      const thisSlotAuction = Array.from(new Set(thisSlotBids.map(({ auction }) => auction)));

      if (thisSlotAuction.length > 1) {
        logger.error('[Injected] XXXXXXXXXXXXXXXXXXX Multiple Auctions for same slot with interleaving times?');
      }
      if (slot.slotElementId == slotElementId) {
        return slotBidsDf;
      } else {
        // slotBidsDf = slotBidsDf.diff(thisSlotBids, ['auction']);
        slotBidsDf = slotBidsDf.filter(slotBidsDfRow => thisSlotBids.find(thisSlotBidsRow => thisSlotBidsRow.auction !== slotBidsDfRow.auction))
      }
    }
    return adUnitSlotsDf.map(slotDf => extractSlotBids(slotDf)).flat();
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
    bidderDoneDf.push({
      auction: doneBid.auctionId,               // auction
      adUnitPath: doneBid.adUnitCode,           // adUnitPath
      bidder: doneBid.advertiserId,             // bidder
      responseTime: ts,                         // responseTime
      //responseTime: 'timeout',                // responseTime?
      type: doneBid.bidder,                     // type
    });
  } catch (e) {
    logger.log(e);
  }
}

export const gptHandler = new GPTHandler();
export const prebidHandler = new PrebidHandler();
