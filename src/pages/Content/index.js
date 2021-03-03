// Extension content.js script, listens for (window) messages from
// injected script, build auction data structure. Also listens for
// (chrome) messages from Popup.js when it runs and responds to it
// with the auction data it collected so far
import DataFrame from '../../js/dataframejs/dataframe';
import logger from '../../logger';
import constants from '../../constants.json';
import { safelyParseJSON } from '../../utils';

const EVENT_SEND_AUCTION_DATA_TO_POPUP = 'PROFESSOR_PREBID_AUCTION_DATA_FROM_CONTENT';

var prebidConfig = {},
  bidRequestedObj = {},
  allBidsDf = new DataFrame([]),
  allAuctionsDf = new DataFrame([]),
  allSlotsDf = new DataFrame([]);

class Content {
  init() {
    this.listenToInjectedScript();
    this.listenToPopupScript();
  }

  listenToInjectedScript() {
    window.addEventListener(
      'message',
      (event) => {
        if (event.source != window) {
          return;
        }

        const { type, payload } = event.data;

        if (type === constants.EVENTS.CONFIG_AVAILABLE) {
          const payloadJson = safelyParseJSON(payload);
          logger.log(`[Content] received a ${type} event`, payloadJson);

          prebidConfig = payloadJson.prebidConfig;
        } else if (type === constants.EVENTS.AUCTION_END) {
          const payloadJson = safelyParseJSON(payload);
          logger.log(`[Content] received a ${type} event`, payloadJson);

          // When we get AUCTION_END from injected script build data structure
          // to be sent to the POPUP script when it activates
          if (payloadJson['dfs']) {
            const { allBids, auction, slots } = payloadJson.dfs;
            allBidsDf = new DataFrame(allBids);
            allAuctionsDf = new DataFrame(auction);
            allSlotsDf = new DataFrame(slots);
          }

          // TODO use this info
          const bidderRequests = payloadJson['bidderRequests'];
          bidderRequests.forEach((bidderRequest) => {
            bidRequestedObj[bidderRequest.auctionId + '_' + bidderRequest.bidderCode] = bidderRequest;
          });
        } else if (type === constants.EVENTS.GPT_SLOTRENDERED) {
          const payloadJson = safelyParseJSON(payload);
          logger.log(`[Content] received a ${type} event`, payloadJson);

          const auctionDf = new DataFrame(payloadJson['auctionDf']);

          if (auctionDf.count() > 0) {
            const auctionRow = auctionDf.getRow(0);
            const auctionId = auctionRow.get('auction');
            const adunit = auctionRow.get('adUnitPath');
            const slotElementId = auctionRow.get('slotElementId');
            const auction = allAuctionsDf.findWithIndex((row) => row.get('auction') == auctionId && row.get('adUnitPath') == adunit);

            if (auction) {
              allAuctionsDf.setRowInPlace(auction.index, (row) => row.set('slotElementId', slotElementId));
            } else {
              logger.warn("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX This shouldn't happen !");
            }
          }
        } else if (type === constants.EVENTS.GPT_SLOTLOADED) {
          const payloadJson = safelyParseJSON(payload);
          logger.log(`[Content] received a ${type} event`, payloadJson);

          const slotLoadedDf = new DataFrame(payloadJson['slotDf']);
          const auctionDf = new DataFrame(payloadJson['auctionDf']);
          const slotBidsDf = new DataFrame(payloadJson['bidsDf']);

          allSlotsDf = allSlotsDf ? allSlotsDf.join(slotLoadedDf, ['slotElementId', 'adUnitPath'], 'outer') : slotLoadedDf;
          allBidsDf = allBidsDf
            ? allBidsDf
                .diff(slotBidsDf, ['auction', 'adUnitPath', 'adId', 'bidder'])
                .join(slotBidsDf, ['auction', 'adUnitPath', 'adId', 'bidder'], 'outer')
            : slotBidsDf;

          if (auctionDf.count() === 0) return;

          const auctionId = auctionDf.getRow(0).get('auction');
          const adunit = auctionDf.getRow(0).get('adUnitPath');
          const slotElementId = slotLoadedDf.getRow(0).get('slotElementId');
          const auction = allAuctionsDf.findWithIndex((row) => row.get('auction') == auctionId && row.get('adUnitPath') == adunit);

          if (auction) {
            allAuctionsDf.setRowInPlace(auction.index, (row) => row.set('slotElementId', slotElementId));
          } else {
            logger.warn("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX This shouldn't happen !");
          }

          // update injected
          const mask = this.prepareMaskObject(slotLoadedDf.getRow(0), slotBidsDf, auctionDf.getRow(0));
          document.dispatchEvent(new CustomEvent(constants.SAVE_MASK, { detail: mask }));

          // update popup
          chrome.runtime.sendMessage({
            type: EVENT_SEND_AUCTION_DATA_TO_POPUP,
            payload: this.getAuctionData(),
          });
        } else if (type === constants.EVENTS.REQUEST_CONSOLE_STATE) {
          this.sendConsoleStateToInjected();
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

  prepareMaskObject(slotRow, slotBidsDf, auctionRow) {
    logger.log('preparing mask', { slotRow, slotBidsDf, auctionRow });
    const targetId = slotRow.get('slotElementId');
    const creativeRenderTime = slotRow.get('slotLoadTs') - slotRow.get('slotRenderedTs');
    const auctionTime = auctionRow.get('endTime') - auctionRow.get('startTime');
    // do we have a prebid winner?
    const sortedSlotBidsDf = slotBidsDf.sortBy('rendered', true); // rendered = true will be first
    const winner = sortedSlotBidsDf.filter((row) => row.get('rendered') == true);
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

    logger.log('mask ready', mask);

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
}

const content = new Content();
content.init();
