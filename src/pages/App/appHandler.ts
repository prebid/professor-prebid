import constants from '../../constants.json';

class AppHandler {
  getDataFromBackground(cb: any): void {
    chrome.runtime.sendMessage({ type: constants.EVENTS.REQUEST_DATA_FROM_BACKGROUND }, cb);
  }
  getGamDetailsFromBackground(cb: any): void {
    chrome.runtime.sendMessage({ type: constants.EVENTS.REQUEST_GAM_DETAILS_FROM_BACKGROUND }, cb);
  }

  getPrebidDetailsFromBackground(cb: any): void {
    chrome.runtime.sendMessage({ type: constants.EVENTS.REQUEST_PREBID_DETAILS_FROM_BACKGROUND }, cb);
  }

  getTcfDetailsFromBackground(cb: any): void {
    chrome.runtime.sendMessage({ type: constants.EVENTS.REQUEST_TCF_DETAILS_FROM_BACKGROUND }, cb);
  }

  getDebugDetailsFromBackground(cb: any): void {
    chrome.runtime.sendMessage({ type: constants.EVENTS.REQUEST_DEBUG_DETAILS_FROM_BACKGROUND }, cb);
  }

  handlePopUpUpdate(cb: any): void {
    chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
      console.log('update popup',   request);
      if (request.type === constants.EVENTS.EVENT_SEND_AUCTION_DATA_TO_POPUP) {
        cb(request.data);
      }
    });
  }
}

export const appHandler = new AppHandler();
