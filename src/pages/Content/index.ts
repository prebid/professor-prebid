// Extension content.js script, listens for (window) messages from
// injected script, build auction data structure. Also listens for
// (chrome) messages from Popup.js when it runs and responds to it
// with the auction data it collected so far
import logger from '../../logger';
import constants from '../../constants.json';
import { safelyParseJSON } from '../../utils';
import { IBidRequest, IBidRequestObj } from '../..';
import { displayTable } from '../../debugging';

export interface AuctionsDfRow {
  adUnitPath: string;
  auction: string;
  endTime: number;
  preAuctionStartTime: number;
  slotElementId: string;
  startTime: number;
}

export interface BidsDfRow {
  adId: string;
  adUnitPath: string;
  auction: string;
  bidRequestTime: number;
  bidResponseTime: number;
  bidder: string;
  cpm: number;
  created: number;
  creativeId: string
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
  nonRenderedHighestCpm_2?: boolean;
  modified_2?: number;
  rendered_2?: boolean;
  slotElementId2?: string;
  responseTime?: number;
}

export interface SlotsDfRow {
  adId: string[];
  adUnitPath: string;
  slotElementId: string;
  slotLoadTs: number;
  slotRenderedTs: number;
}

let prebidConfig = {};
const bidRequestedObj: IBidRequestObj = {};

let allBidsDf: BidsDfRow[] = [];
let allAuctionsDf: AuctionsDfRow[] = [];
let allSlotsDf: SlotsDfRow[] = [];

class Content {
  init() {
    logger.log('[Content] init()');
    this.listenToInjectedScript();
    this.listenToPopupScript();
    // setInterval(() => {
    //   console.log({ allBidsDf, allAuctionsDf, allSlotsDf })
    // }, 1000)
  }

  listenToInjectedScript() {
    window.addEventListener('message', (event) => {
      if (event.source != window) {
        return;
      }

      const { type, payload } = event.data;
      switch (type) {
        case constants.EVENTS.CONFIG_AVAILABLE: {
          const payloadJson = safelyParseJSON(payload);
          logger.log(`[Content] received a ${type} event`, payloadJson);
          prebidConfig = payloadJson.prebidConfig;
          break;
        }

        case constants.EVENTS.AUCTION_END: {
          const payloadJson = safelyParseJSON(payload);
          logger.log(`[Content] received a ${type} event`, payloadJson);

          // When we get AUCTION_END from injected script build data structure
          // to be sent to the POPUP script when it activates
          if (payloadJson['dfs']) {
            const { allBids, auction, slots } = payloadJson.dfs;
            allBidsDf = allBids;
            allAuctionsDf = auction;
            allSlotsDf = slots;
          }

          // TODO use this info
          const bidderRequests = payloadJson['bidderRequests'];
          bidderRequests?.forEach((bidderRequest: IBidRequest) => {
            const key = bidderRequest.auctionId + '_' + bidderRequest.bidderCode;
            bidRequestedObj[key] = bidderRequest;
          });
          break;
        }

        case constants.EVENTS.GPT_SLOTRENDERED: {
          const payloadJson = safelyParseJSON(payload);
          logger.log(`[Content] received a ${type} event`, payloadJson);
          const auctionDf: AuctionsDfRow[] = payloadJson['auctionDf'];
          if (auctionDf.length > 0) {
            const auctionRow = auctionDf[0];
            const auctionId = auctionRow.auction;
            const adunit = auctionRow.adUnitPath;
            const slotElementId = auctionRow.slotElementId;
            const auction: any = allAuctionsDf.findIndex(auctionRow => auctionRow.auction == auctionId && auctionRow.adUnitPath == adunit);
            if (auction) {
              allAuctionsDf[auction].slotElementId = slotElementId;
            } else {
              logger.warn("[Content] slot rendered XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX This shouldn't happen !");
            }
          }
          break;
        }

        case constants.EVENTS.GPT_SLOTLOADED: {
          const payloadJson = safelyParseJSON(payload);
          logger.log(`[Content] received a ${type} event`, { payloadJson });
          const slotLoadedDf: SlotsDfRow[] = payloadJson['slotDf'];

          const auctionDf: AuctionsDfRow[] = payloadJson['auctionDf'];

          const slotBidsDf: BidsDfRow[] = payloadJson['bidsDf'];

          slotLoadedDf.forEach(slotLoaded => {
            const exisitingIndex = slotLoadedDf.findIndex(slot =>
              slot.slotElementId === slotLoaded.slotElementId
              && slot.adUnitPath === slotLoaded.adUnitPath
            );
            if (exisitingIndex !== -1) {
              allSlotsDf[exisitingIndex] = { ...slotLoaded };
            } else {
              allSlotsDf.push(slotLoaded);
            }
          })

          allBidsDf.forEach(slotBid => {
            const exisitingIndex = allBidsDf.findIndex(bid =>
              bid.auction === slotBid.auction
              && bid.adUnitPath === slotBid.adUnitPath
              && bid.adId === slotBid.adId
              && bid.bidder === slotBid.bidder
            );

            if (exisitingIndex !== -1) {
              allBidsDf[exisitingIndex] = { ...slotBid };
            } else {
              allBidsDf.push(slotBid);
            }
          });

          displayTable(allBidsDf, 'allBidsDf');


          if (auctionDf.length === 0) {
            return;
          }

          displayTable(slotLoadedDf, 'slotLoadedDf');

          const auctionId = auctionDf[0].auction;
          const adunit = auctionDf[0].adUnitPath;
          const slotElementId = slotLoadedDf[0].slotElementId;

          const auction: any = allAuctionsDf.findIndex(auctionRow => auctionRow.auction == auctionId && auctionRow.adUnitPath == adunit);

          if (auction) {
            allAuctionsDf[auction].slotElementId = slotElementId;
          } else {
            logger.warn("[Content] XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX This shouldn't happen !");
          }

          // update injected

          const mask = this.prepareMaskObject(slotLoadedDf[0], slotBidsDf, auctionDf[0]);
          document.dispatchEvent(new CustomEvent(constants.SAVE_MASK, { detail: mask }));

          // update popup
          chrome.runtime.sendMessage({
            type: constants.EVENTS.EVENT_SEND_AUCTION_DATA_TO_POPUP,
            payload: this.getAuctionData(),
          });
          break;
        }

        case constants.EVENTS.REQUEST_CONSOLE_STATE: {
          logger.log(`[Content] received a ${type} event`);
          this.sendConsoleStateToInjected();
          break;
        }
      }
    },
      false
    );
  }

  listenToPopupScript() {
    chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
      if (request.type === constants.CONSOLE_TOGGLE) {
        document.dispatchEvent(new CustomEvent(constants.CONSOLE_TOGGLE, { detail: request.consoleState }));
      }

      sendResponse();
    });
  }

  prepareMaskObject(slotRow: SlotsDfRow, slotBidsDf: BidsDfRow[], auctionRow: AuctionsDfRow) {
    logger.log('[Content] preparing mask', { slotRow, slotBidsDf, auctionRow });
    const targetId = slotRow.slotElementId;
    const creativeRenderTime = slotRow.slotLoadTs - slotRow.slotRenderedTs;
    const auctionTime = auctionRow.endTime - auctionRow.startTime;
    // do we have a prebid winner?
    const sortedSlotBidsDf = slotBidsDf.sort((x: BidsDfRow, y: BidsDfRow) => (x.rendered === y.rendered) ? 0 : x.rendered ? -1 : 1); // rendered = true will be first
    const winner = sortedSlotBidsDf.filter(row => row.rendered == true);
    const prebidRenderedAd = winner[0] ? true : false;

    let winningBidder;
    let winningCPM;
    if (prebidRenderedAd) {
      const winnerRow = winner[0];
      winningBidder = winnerRow.bidder;
      winningCPM = winnerRow.cpm;
    }

    const mask = {
      targetId,
      creativeRenderTime,
      auctionTime,
      winningBidder,
      winningCPM,
      bidders: sortedSlotBidsDf,
    };

    logger.log('[Content] mask ready', mask);

    return mask;
  }

  getAuctionData() {
    return {
      dfs: {
        auction: allAuctionsDf,
        slots: allSlotsDf,
        allBids: allBidsDf,
      },
      prebidConfig: JSON.stringify(prebidConfig),
    };
  }

  sendConsoleStateToInjected() {
    chrome.storage.local.get(constants.CONSOLE_TOGGLE, (result) => {
      const checked = result ? result[constants.CONSOLE_TOGGLE] : false;

      document.dispatchEvent(new CustomEvent(constants.CONSOLE_TOGGLE, { detail: checked }));
    });
  }

  sendBidRequestedObjToBackground() {
    logger.log('[Content] sendBidRequestedObjToBackground');
    document.dispatchEvent(new CustomEvent(constants.EVENTS.SEND_DATA_TO_BACKGROUND,));
  }
}

const content = new Content();
content.init();