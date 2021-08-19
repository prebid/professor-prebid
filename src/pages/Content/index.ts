// Extension content.js script, listens for (window) messages from
// injected script, build auction data structure. Also listens for
// (chrome) messages from Popup.js when it runs and responds to it
// with the auction data it collected so far
import DataFrame from '../../js/dataframejs/dataframe';
import logger from '../../logger';
import constants from '../../constants.json';
import { safelyParseJSON } from '../../utils';
import { IBidRequest, IBidRequestObj } from '../..';
import Row from '../../js/dataframejs/row';
import { displayTable } from '../../debugging';


let prebidConfig = {};
const bidRequestedObj: IBidRequestObj = {};

let allBidsDf = new DataFrame([], constants.DATAFRAME_COLUMNS.bidColumns);

let allAuctionsDf = new DataFrame([], []);

let allSlotsDf = new DataFrame([], []);

class Content {
  init() {
    logger.log('[Content] init()');
    this.listenToInjectedScript();
    this.listenToPopupScript();
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

            allBidsDf = new DataFrame(allBids, constants.DATAFRAME_COLUMNS.bidColumns);
            allAuctionsDf = new DataFrame(auction, constants.DATAFRAME_COLUMNS.auctionColumns);
            allSlotsDf = new DataFrame(slots, constants.DATAFRAME_COLUMNS.slotColumns);
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
          const auctionDf = new DataFrame(payloadJson['auctionDf'], constants.DATAFRAME_COLUMNS.auctionColumns);
          if (auctionDf.count() > 0) {
            const auctionRow = auctionDf.getRow(0);
            const auctionId = auctionRow.get('auction');
            const adunit = auctionRow.get('adUnitPath');
            const slotElementId = auctionRow.get('slotElementId');
            const auction: any = allAuctionsDf.findWithIndex((auctionRow: Row) => auctionRow.get('auction') == auctionId && auctionRow.get('adUnitPath') == adunit);

            if (auction) {
              allAuctionsDf.setRowInPlace(auction.index, (row) => row?.set('slotElementId', slotElementId));
            } else {
              logger.warn("[Content] XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX This shouldn't happen !");
            }
          }
          break;
        }

        case constants.EVENTS.GPT_SLOTLOADED: {
          const payloadJson = safelyParseJSON(payload);
          logger.log(`[Content] received a ${type} event`, payloadJson);
          const slotLoadedDf = new DataFrame(payloadJson['slotDf'], constants.DATAFRAME_COLUMNS.slotColumns);
          //TBC always empty: 
          const auctionDf = new DataFrame(payloadJson['auctionDf'], constants.DATAFRAME_COLUMNS.auctionColumns);
          
          const slotBidsDf = new DataFrame(payloadJson['bidsDf'], constants.DATAFRAME_COLUMNS.bidColumns);

          allSlotsDf = allSlotsDf ? allSlotsDf.join(slotLoadedDf, ['slotElementId', 'adUnitPath'], 'outer') : slotLoadedDf;

          allBidsDf = allBidsDf
            ? allBidsDf
              .diff(slotBidsDf, ['auction', 'adUnitPath', 'adId', 'bidder'])
              .join(slotBidsDf, ['auction', 'adUnitPath', 'adId', 'bidder'], 'outer')
            : slotBidsDf;

          displayTable(allBidsDf.toCollection(), 'allBidsDf');
          
          
          if (auctionDf.count() === 0) {
            return;
          }
          
          displayTable(slotLoadedDf.toCollection(), 'slotLoadedDf');
          
          const auctionId = auctionDf.getRow(0).get('auction');
          const adunit = auctionDf.getRow(0).get('adUnitPath');
          const slotElementId = slotLoadedDf.getRow(0)?.get('slotElementId');
          
          const auction: any = allAuctionsDf.findWithIndex((auctionRow: Row) => auctionRow.get('auction') == auctionId && auctionRow.get('adUnitPath') == adunit);

          if (auction) {
            allAuctionsDf.setRowInPlace(auction.index, (row) => row?.set('slotElementId', slotElementId));
          } else {
            logger.warn("[Content] XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX This shouldn't happen !");
          }

          // update injected

          const mask = this.prepareMaskObject(slotLoadedDf?.getRow(0), slotBidsDf, auctionDf.getRow(0));
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

  prepareMaskObject(slotRow: Row, slotBidsDf: DataFrame, auctionRow: Row) {
    logger.log('[Content] preparing mask', { slotRow, slotBidsDf, auctionRow });
    const targetId = slotRow?.get('slotElementId');
    const creativeRenderTime = slotRow?.get('slotLoadTs') - slotRow?.get('slotRenderedTs');
    const auctionTime = auctionRow.get('endTime') - auctionRow?.get('startTime');
    // do we have a prebid winner?
    const sortedSlotBidsDf = slotBidsDf.sortBy('rendered', true); // rendered = true will be first
    const winner = sortedSlotBidsDf.filter((row: Row) => row.get('rendered') == true);
    const prebidRenderedAd = winner.dim()[0] ? true : false;

    let winningBidder;
    let winningCPM;
    if (prebidRenderedAd) {
      const winnerRow = winner.getRow(0);
      winningBidder = winnerRow.get('bidder');
      winningCPM = winnerRow.get('cpm');
    }

    const mask = {
      targetId,
      creativeRenderTime,
      auctionTime,
      winningBidder,
      winningCPM,
      bidders: sortedSlotBidsDf.toCollection(),
    };

    logger.log('[Content] mask ready', mask);

    return mask;
  }

  getAuctionData() {
    return {
      dfs: {
        auction: allAuctionsDf.toCollection(),
        slots: allSlotsDf.toCollection(),
        allBids: allBidsDf.toCollection(),
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
