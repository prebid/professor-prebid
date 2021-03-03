import moment from 'moment';
import DataFrame from '../js/dataframejs/dataframe';
import '../logger';
import { sendToContentScript } from '../utils';
import constants from '../constants.json';
import logger from '../logger';
import { displayTable } from '../debugging';

const DEBUG = 0;

const bidColumns = [
  'auction',
  'adUnitPath',
  'adId',
  'bidder',
  'time',
  'cpm',
  'slotSize',
  'netRevenue',
  'dealId',
  'creativeId',
  'msg',
  'nonRenderedHighestCpm',
  'rendered',
  'bidRequestTime',
  'bidResponseTime',
  'created',
  'modified',
  'type',
  'slotElementId',
];

// Globals
let allBidsDf = new DataFrame([], bidColumns);
let auctionDf = new DataFrame([], ['auction', 'slotElementId', 'adUnitPath', 'preAuctionStartTime', 'startTime', 'endTime']);
let bidderDoneDf = new DataFrame([], ['auction', 'adUnitPath', 'bidder', 'type', 'responseTime']);
let slotDf = new DataFrame([], ['slotElementId', 'adUnitPath', 'adId', 'slotRenderedTs', 'slotLoadTs']);
const visibleSlots = new Set();
const slotBidsBySlotElementId = {};

// Prebid Events

class PrebidHandler {
  enabled = false;
  globalPbjs = null;
  domFoundTime;

  init(globalPbjs, domFoundTime) {
    this.enabled = true;
    this.globalPbjs = globalPbjs;
    this.domFoundTime = domFoundTime;

    this.handleEvents();
    // this._sendConfigToContentScript();

    // TODO -> notify popup that prebid exists in page
  }

  handleEvents() {
    this.globalPbjs.onEvent('auctionInit', (data) => {
      logger.log('auctionInit', moment().format('YYYY-MM-DD HH:mm:ss.SSS', data.timestamp));

      const existingRows = auctionDf.find((r) => r.get('auction') == data.auctionId);
      if (existingRows) {
        logger.error('XXXXXXXXXXXXXXXXXXXX Should not happen!!! XXXXXXXXXXXXXXXXXX');
      } else {
        // pre-auction is only relevant for an initial page load where we don't get an auction init, only the auction end. then we can use domloadedtime as the time between the dom being ready and the auction start. For auctions that occur when a user scrolls down for example, then the first event is the auction init so there is no relevant pre-auction activty.
        data.adUnitCodes.forEach((aup) => updateAuctionDf(data.auctionId, aup, data.timestamp, data.timestamp));
      }
    });

    this.globalPbjs.onEvent('auctionEnd', (data) => {
      const auctionStartTime = data.timestamp;
      const auctionEndTime = Date.now();
      // get the new data and merge with existing
      const new_allBidsDf = new DataFrame(this._getAllBids(auctionEndTime), bidColumns);
      const highestCpmBids = new DataFrame(this._getHighestCpmBids(auctionEndTime), bidColumns);
      const allWinningBids = new DataFrame(this._getAllWinningBids(auctionEndTime), bidColumns);

      const auction = auctionDf.findWithIndex((row) => row.get('auction') == data.auctionId);
      if (auction) {
        auctionDf.setRowInPlace(auction.index, (row) => row.set('startTime', auctionStartTime).set('endTime', auctionEndTime));
      } else {
        data.adUnitCodes.forEach((aup) => updateAuctionDf(data.auctionId, aup, this.domFoundTime, auctionStartTime, auctionEndTime));
      }
      displayTable(auctionDf.toCollection());

      function createOrUpdateDf(a, b) {
        return a ? a.union(b) : b;
      }
      allBidsDf = createOrUpdateDf(allBidsDf, new_allBidsDf);
      // TODO need to extract this update into a general df func
      // Let's mark the highest cpm bids - these can change if a bidder is selected as a winner
      allBidsDf = allBidsDf.join(
        highestCpmBids.select('auction', 'adUnitPath', 'adId', 'bidder', 'nonRenderedHighestCpm', 'modified').rename({
          nonRenderedHighestCpm: 'nonRenderedHighestCpm_2',
          modified: 'modified_2',
        }),
        ['auction', 'adUnitPath', 'adId', 'bidder'],
        'outer'
      );
      allBidsDf = allBidsDf
        .map((row) => row.set('nonRenderedHighestCpm', row.get('nonRenderedHighestCpm_2') ? true : false))
        .drop(['nonRenderedHighestCpm_2', 'modified_2']);
      // Let's mark the ad winners
      allBidsDf = allBidsDf.join(
        allWinningBids.select('auction', 'adUnitPath', 'adId', 'bidder', 'nonRenderedHighestCpm', 'rendered', 'modified').rename({
          nonRenderedHighestCpm: 'nonRenderedHighestCpm_2',
          rendered: 'rendered_2',
          modified: 'modified_2',
        }),
        ['auction', 'adUnitPath', 'adId', 'bidder'],
        'left'
      );
      allBidsDf = allBidsDf
        .map(
          (row) =>
            row.set('nonRenderedHighestCpm', row.get('nonRenderedHighestCpm_2') ? true : false) &&
            row.set('rendered', row.get('rendered_2') ? true : false)
        )
        .drop(['nonRenderedHighestCpm_2', 'rendered_2', 'modified_2']);

      // merge in any bidder done data that comes in
      try {
        allBidsDf = allBidsDf.join(bidderDoneDf, ['auction', 'adUnitPath', 'bidder'], 'left');
        allBidsDf = allBidsDf
          .map((row) => row.set('time', row.get('time') == undefined ? row.get('responseTime') - auctionStartTime : row.get('time')))
          .drop(['responseTime']);
      } catch (e) {
        logger.log(e);
      }

      displayTable(allBidsDf.toCollection(), 'No all bids');

      // On auctionEnd, let the content script know it happened
      const dfs = {
        allBids: allBidsDf.toCollection(),
        auction: auctionDf.toCollection(),
        slots: slotDf.toCollection(),
      };

      const response = {
        auctionTimestamp: Date.now(),
        bidderRequests: data.bidderRequests,
        dfs,
      };

      sendToContentScript(constants.EVENTS.AUCTION_END, response);
    });

    // won the adserver auction
    // capture state change
    this.globalPbjs.onEvent('bidWon', (data) => {
      logger.log('bidWon', {
        time: moment().format('YYYY-MM-DD HH:mm:ss.SSS', Date.now()),
        data,
      });

      const ts = Date.now();
      const bid = allBidsDf.findWithIndex(
        (row) => row.get('auction') === data.auctionId && row.get('adId') === data.adId && row.get('bidder') === data.bidderCode
      );
      if (bid) {
        allBidsDf.setRowInPlace(bid.index, (row) => row.set('rendered', true).set('nonRenderedHighestCpm', false).set('modified', ts));
      }
    });

    this.globalPbjs.onEvent('addAdUnits', () => {
      // log when ad units are added to prebid
      logger.log('Ad units were added to Prebid.');
      logger.log(this.globalPbjs.adUnits);
    });

    this.globalPbjs.onEvent('bidderDone', (data) => {
      logger.log('Bidder Done ' + JSON.stringify(data.bidderCode));
      // update bidderDone with done
      data.bids.forEach((doneBid) => updateBidderDoneDf(doneBid));
    });

    this.globalPbjs.onEvent('bidTimeout', (data) => {
      // update bidderDone with timeout
      data.bids.forEach((doneBid) => updateBidderDoneDf(doneBid));

      data.forEach((nobid) => {
        logger.log('bidTimeout', JSON.stringify(nobid));
      });
    });
  }

  _getAllBids(ts) {
    const highestCPMBids = this.globalPbjs.getHighestCpmBids();
    const winners = this.globalPbjs.getAllWinningBids();
    const pwinners = this.globalPbjs.getAllPrebidWinningBids();

    if (DEBUG) {
      logger.log('num winners at ' + moment().format() + ' = ' + winners.length);
      logger.log('num pwinners at ' + moment().format() + ' = ' + pwinners.length);
    }

    const output = [];
    this._forEachBidResponse(this.globalPbjs.getBidResponses(), function (code, bid) {
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
        nonRenderedHighestCpm: !!highestCPMBids.find(function (winner) {
          return winner.adId == bid.adId;
        }),
        rendered: !!winners.find(function (winner) {
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
    this._forEachBidResponse((this.globalPbjs.getNoBids && this.globalPbjs.getNoBids()) || {}, function (code, bid) {
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
  _getHighestCpmBids(ts) {
    const output = [];
    this.globalPbjs.getHighestCpmBids().forEach((bid) => {
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
  _getAllWinningBids(ts) {
    const output = [];
    this.globalPbjs.getAllWinningBids().forEach((bid) => {
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

  _forEachBidResponse(responses, cb) {
    Object.keys(responses).forEach(function (adUnitCode) {
      var response = responses[adUnitCode];
      response.bids.forEach(function (bid) {
        cb(adUnitCode, bid);
      });
    });
  }

  _sendConfigToContentScript() {
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
    // fires when a creative is injected into a slot. It will occur before the creative's resources are fetched.
    // we can get these before we have fully initialised
    googletag.pubads().addEventListener('slotRenderEnded', function (event) {
      const ts = Date.now();
      const slotElementId = event.slot.getSlotElementId();
      const adUnitPath = event.slot.getAdUnitPath();
      const targetingMap = event.slot.getTargetingMap();
      const hbAdId = targetingMap['hb_adid'];

      logger.log('slotRenderEnded', {
        slotElementId,
        slotId: event.slot.getSlotId().getId(),
        adUnitPath,
        targetingMap,
      });

      // add it to our slots dataframe
      const existingRow = slotDf.find((r) => r.get('slotElementId') === slotElementId && r.get('adUnitPath') === adUnitPath);
      if (!existingRow) {
        slotDf = slotDf.push([slotElementId, adUnitPath, hbAdId, ts, null]);
      }

      // update the auction with the slotId
      const bid = allBidsDf.find((r) => r.get('adId') == hbAdId);

      if (bid) {
        const auction = auctionDf.findWithIndex((r) => r.get('auction') === bid.get('auction') && r.get('adUnitPath') === bid.get('adUnitPath'));

        if (auction) {
          auctionDf.setRowInPlace(auction.index, (row) => row.set('slotElementId', slotElementId));
        }
      }

      const response = {
        gptTimestamp: Date.now(),
        gptTargeting: targetingMap,
        adUnitPath,
        slotElementId,
        auctionDf: auctionDf.filter((row) => row.get('slotElementId') == event.slot.getSlotElementId()).toCollection(),
      };

      sendToContentScript(constants.EVENTS.GPT_SLOTRENDERED, response);
    });

    googletag.pubads().addEventListener('slotOnload', (event) => {
      // Is this how GAM computed creative render time?
      // Fires when the slot is actually loaded and available in the browser
      const ts = Date.now();
      const slotElementId = event.slot.getSlotElementId();
      const adUnitPath = event.slot.getAdUnitPath();
      const targetingMap = event.slot.getTargetingMap();

      logger.log('slotOnload', {
        slotElementId,
        slotId: event.slot.getSlotId().getId(),
        adUnitPath,
        targetingMap,
      });

      // update the slot dataframe with the load timestamp
      slotDf = slotDf.map((row) =>
        row.set('slotLoadTs', row.get('slotElementId') == slotElementId && row.get('adUnitPath') == adUnitPath ? ts : row.get('slotLoadTs'))
      );
      displayTable(slotDf.toCollection());

      // we now want to link the bids to this slot.
      // There is no auction id in the slot event. We could use the adUnitPath but multiple auctions can run
      // on the same adUnit which means it can be difficult to link correctly.
      // If it is available we can use the hb_adid to link to the adid.
      // Also some sites have the slot element id in the bidder adunitpath!

      let slotBidsDf = allBidsDf.filter(
        (row) =>
          (row.get('adUnitPath') == adUnitPath || row.get('adUnitPath') == slotElementId) &&
          row.get('cpm') != undefined &&
          row.get('slotElementId') == undefined
      );

      if (slotBidsDf.count() > 0) {
        // multiple slots with same adunitpath?
        const adUnitSlots = slotDf.filter((row) => row.get('adUnitPath') === adUnitPath);
        if (adUnitSlots.count() > 1) {
          // mult auctions for this adUnitPath. find the auction we are looking at from the highest prebid bidder which will have its hb_adid set. We can then identify the slotElementId for these bids
          const thisSlotBids = this.matchBids(allBidsDf, slotBidsDf, adUnitSlots, event.slot);
          slotBidsBySlotElementId[slotElementId] = thisSlotBids;
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
          slotBidsDf.select('auction', 'adUnitPath', 'adId', 'bidder', 'slotElementId').rename({ slotElementId: 'slotElementId2' }),
          ['auction', 'adUnitPath', 'adId', 'bidder'],
          'left'
        );
        allBidsDf = allBidsDf
          .map((row) => row.set('slotElementId', row.get('slotElementId2') ? row.get('slotElementId2') : row.get('slotElementId')))
          .drop('slotElementId2');

        auctionDf = auctionDf.map((row) =>
          row.set(
            'slotElementId',
            row.get('auction') == slotBidsDf.getRow(0).get('auction') && row.get('adUnitPath') == slotBidsDf.getRow(0).get('adUnitPath')
              ? slotElementId
              : row.get('slotElementId')
          )
        );

        displayTable(auctionDf.toCollection(), 'no auctions');
        displayTable(allBidsDf.toCollection(), 'no bids');
      }

      // pull out this slot's data and send the response
      const thisSlotDf = slotDf.filter((row) => row.get('slotElementId') === slotElementId && row.get('adUnitPath') === adUnitPath);
      const response = {
        slotDf: thisSlotDf.toCollection(),
        bidsDf: slotBidsDf.toCollection(),
        auctionDf: auctionDf.filter((row) => row.get('slotElementId') === slotElementId).toCollection(),
      };

      sendToContentScript(constants.EVENTS.GPT_SLOTLOADED, response);
    });

    googletag.pubads().addEventListener('slotVisibilityChanged', function (event) {
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
  matchBids(allBidsDf, slotBidsDf, adUnitSlots, slot) {
    const slotElementId = slot.getSlotElementId();
    const targeting = slot.getTargetingMap();
    const hbAdId = targeting['hb_adid'];

    if (hbAdId !== undefined) {
      const bidderWithMatchingTargeting = allBidsDf.filter((row) => row.get('adId') === hbAdId);

      if (bidderWithMatchingTargeting.count() < 1) {
        logger.error('bidderWithMatchingTargeting without rows!');
      } else {
        const matchingAuction = bidderWithMatchingTargeting.getRow(0).get('auction');
        return slotBidsDf.filter((row) => row.get('auction') == matchingAuction);
      }
    }

    const biddersUseSlotIdForAUP = slotBidsDf.filter((bid) => bid.get('adUnitPath') === slotElementId);
    return biddersUseSlotIdForAUP.count() > 0 ? biddersUseSlotIdForAUP : this.bidSlotFallbackLinker(adUnitSlots, slotBidsDf, slotElementId);
  }

  bidSlotFallbackLinker(adUnitSlots, slotBidsDf, slotElementId) {
    // should never happen now that we are using hb_adid
    console.warn('Uh oh, hb_adid is empty. Trying to link using time...');
    // sort by time and for each find the bids that have a response time earlier
    // these are these slots bids. remove them from the total and continue
    adUnitSlots = adUnitSlots.sortBy('slotRenderedTs');

    function extractSlotBids(slot) {
      const thisSlotBids = slotBidsDf.filter((row) => row.get('bidResponseTime') < slot.get('slotRenderedTs'));
      const thisSlotAuction = thisSlotBids.distinct('auction');
      if (thisSlotAuction.count() > 1) {
        console.error('XXXXXXXXXXXXXXXXXXX Multiple Auctions for same slot with interleaving times?');
      }
      if (slot.get('slotElementId') == slotElementId) {
        return slotBidsDf;
      } else {
        slotBidsDf = slotBidsDf.diff(thisSlotBids, ['auction']);
      }
    }
    adUnitSlots.map((slot) => extractSlotBids(slot));
  }
}

////////////////////////////////////
// Dataframe utility functions - TODO move
////////////////////////////////////

function updateAuctionDf(auctionId, aup, preAuctionStartTime, auctionStartTime, auctionEndTime = undefined) {
  try {
    auctionDf = auctionDf.push([auctionId, undefined, aup, preAuctionStartTime, auctionStartTime, auctionEndTime]);
  } catch (e) {
    logger.log('updateAuctionDf failed', e);
  }
}

function updateBidderDoneDf(doneBid) {
  const ts = Date.now();
  try {
    bidderDoneDf = bidderDoneDf.push([doneBid.auctionId, doneBid.adUnitCode, doneBid.advertiserId, doneBid.bidder, 'timeout', ts]);
  } catch (e) {
    logger.log(e);
  }
}

export const gptHandler = new GPTHandler();
export const prebidHandler = new PrebidHandler();
