import constants from '../constants.json';
import logger from '../logger';

let mainTabId: number;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const msgType = message && message.type;
  const payload = message && message.payload;

  switch (msgType) {
    case constants.EVENTS.OPEN_DATA_TAB:
      if (mainTabId) {
        chrome.tabs.update(mainTabId, { active: true, url: `./app.html` }, (tab) => {
          mainTabId = tab.id;
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
    case constants.EVENTS.SEND_DATA_TO_BACKGROUND:
      chrome.storage.local.set({ [constants.LOCAL_DATA]: message.payload });
      sendResponse();
      break;
    case constants.EVENTS.REQUEST_DATA_FROM_BACKGROUND:
      chrome.storage.local.get(constants.LOCAL_DATA, (result) => {
        const data = result ? result[constants.LOCAL_DATA] : null;
        sendResponse(data);
      });

      break;
    default:
      sendResponse();
  }
});
