import constants from '../constants.json';
import logger from '../logger';
import { IGoogleAdManagerDetails } from '../inject/scripts/googleAdManager';
import { IPrebidDetails } from '../inject/scripts/prebid';
import { ITcfDetails } from '../inject/scripts/tcf';

let mainTabId: number;
let appData: any;
let gamDetails: IGoogleAdManagerDetails;
let prebidDetails: IPrebidDetails;
let tcfDetails: ITcfDetails;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const msgType = message && message.type;
  const payload = message && message.payload;
  switch (msgType) {
    case constants.EVENTS.OPEN_DATA_TAB:
      if (mainTabId) {
        chrome.tabs.update(mainTabId, { active: true, url: `./app.html` }, (tab) => {
          mainTabId = tab?.id;
          logger.log('[Background] update tab with tabId: ', mainTabId);
          sendResponse();
        });
      } else {
        chrome.tabs.create({ url: `./app.html` }, (tab) => {
          mainTabId = tab.id;
          logger.log('[Background] created tab with tabId: ', mainTabId);
          sendResponse();
        });
      }

      return true;
      break;
    case constants.EVENTS.SEND_DATA_TO_BACKGROUND:
      logger.log('[Background] received data: ', payload)
      appData = { ...payload };
      sendResponse();
      break;
    case constants.EVENTS.REQUEST_DATA_FROM_BACKGROUND:
      logger.log('[Background] send data: ', appData)
      sendResponse(appData);
      break;
    case constants.EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND:
      logger.log('[Background] received gam details data:', payload)
      gamDetails = { ...payload };
      sendResponse();
      break;
    case constants.EVENTS.REQUEST_GAM_DETAILS_FROM_BACKGROUND:
      logger.log('[Background] send gam details data:', payload)
      sendResponse(gamDetails);
      break;
    case constants.EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND:
      logger.log('[Background] received prebid details data:', payload)
      prebidDetails = { ...payload };
      sendResponse();
      break;
    case constants.EVENTS.REQUEST_PREBID_DETAILS_FROM_BACKGROUND:
      logger.log('[Background] send prebid details data:', payload)
      sendResponse(prebidDetails);
      break;
    case constants.EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND:
      logger.log('[Background] received tcf details data:', payload)
      tcfDetails = { ...payload };
      sendResponse();
      break;
    case constants.EVENTS.REQUEST_TCF_DETAILS_FROM_BACKGROUND:
      logger.log('[Background] send tcf details data:', payload)
      sendResponse(tcfDetails);
      break;
    default:
      sendResponse();
  }
});
