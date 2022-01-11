// Extension content.js script, listens for (window) messages from
// injected script, build auction data structure. Also listens for
// (chrome) messages from Popup.js when it runs and responds to it
// with the auction data it collected so far
import logger from '../../logger';
import constants from '../../constants.json';
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import { IPrebidDetails, IPrebidBidWonEventData, IPrebidAuctionEndEventData } from '../../inject/scripts/prebid';
import { ITcfDetails } from '../../inject/scripts/tcf';

class Content {
  prebid: IPrebidDetails = {} as IPrebidDetails;
  googleAdManager: IGoogleAdManagerDetails;
  tcf: ITcfDetails;

  init() {
    logger.log('[Content] init()');
    this.listenToInjectedScript();
    this.listenToPopupScript();
  }

  listenToInjectedScript() {
    window.addEventListener('message', this.processMessageFromInjected, false);
  }

  listenToPopupScript() {
    chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
      if (request.type === constants.CONSOLE_TOGGLE) {
        document.dispatchEvent(new CustomEvent(constants.CONSOLE_TOGGLE, { detail: request.consoleState }));
      }
      sendResponse();
    });
  }

  prepareMaskObjects() {
    logger.log('[Content] preparing masks');
    const lastAuctionEndEvent = ((this.prebid.events || []) as IPrebidAuctionEndEventData[])
      .filter((event) => event.eventType === 'auctionEnd')
      .sort((a, b) => (a.args.timestamp > b.args.timestamp ? 1 : -1))
      .pop();
    const masks = lastAuctionEndEvent?.args?.adUnits.map((slot) => {
      const slotsBidWonEvent = <IPrebidBidWonEventData>(
        this.prebid?.events.find((event) => event.eventType === 'bidWon' && (event as IPrebidBidWonEventData).args.adUnitCode === slot.code)
      );
      return {
        elementId: slot.code,
        creativeRenderTime: Date.now(), // TODO - get creative render time from prebid
        winningCPM: slotsBidWonEvent?.args.cpm ? Math.round(slotsBidWonEvent?.args.cpm * 100) / 100 : undefined,
        winningBidder: slotsBidWonEvent?.args.bidder || slotsBidWonEvent?.args.bidderCode,
        currency: slotsBidWonEvent?.args.currency,
        timeToRespond: slotsBidWonEvent?.args.timeToRespond,
      };
    });
    logger.log('[Content] mask ready', masks);
    return masks;
  }

  processMessageFromInjected = (event: MessageEvent<any>) => {
    if (event.source != window) {
      return;
    }
    const { type, payload } = event.data;    
    console.log({ type, payload })
    this.updateBackgroundPage(type, payload);
    this.updateMasks();
  };

  sendConsoleStateToInjected() {
    chrome.storage.local.get(constants.CONSOLE_TOGGLE, (result) => {
      const checked = result ? result[constants.CONSOLE_TOGGLE] : false;
      document.dispatchEvent(new CustomEvent(constants.CONSOLE_TOGGLE, { detail: checked }));
    });
  }

  updateBackgroundPage(type: string, payload: any) {
    chrome.runtime.sendMessage({
      type,
      payload,
    });
  }

  updateMasks() {
    const masks = this.prepareMaskObjects();
    logger.log('[Content] update masks', masks);
    document.dispatchEvent(new CustomEvent(constants.SAVE_MASKS, { detail: masks }));
  }
}

const content = new Content();
content.init();
