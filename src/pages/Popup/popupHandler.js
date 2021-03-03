import { safelyParseJSON } from '../../utils';
import constants from '../../constants.json';
import logger from '../../logger';

class PopupHandler {
  handleDataFromContentScript(cb) {
    try {
      chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
        const { type, payload } = safelyParseJSON(request);

        if (type === constants.EVENTS.DATA_READY_FROM_CONTENT) {
          cb(payload);
        }

        sendResponse();
      });
    } catch (e) {}
  }

  onConsoleToggle(checked) {
    try {
      chrome.storage.local.set({ [constants.CONSOLE_TOGGLE]: checked }, () => {
        chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
          const tab = tabs[0];
          chrome.tabs.sendMessage(tab.id, { type: constants.CONSOLE_TOGGLE, consoleState: checked });
        });
      });
    } catch (e) {
      logger.error('onConsoleToggle', e);
    }
  }

  getToggleStateFromStorage(cb) {
    try {
      chrome.storage.local.get(constants.CONSOLE_TOGGLE, (result) => {
        const checked = result ? result[constants.CONSOLE_TOGGLE] : false;

        cb(checked);
      });
    } catch (e) {
      logger.error('getToggleStateFromStorage', e);
    }
  }

  openMainTab() {
    chrome.runtime.sendMessage({
      type: constants.EVENTS.OPEN_DATA_TAB,
      payload: '',
    });
  }
}

export const popupHandler = new PopupHandler();
