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
}

export const appHandler = new AppHandler();
