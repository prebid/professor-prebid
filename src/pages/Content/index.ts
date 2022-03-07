// Extension content.js script, listens for (window) messages from
// injected script, build auction data structure. Also listens for
// (chrome) messages from Popup.js when it runs and responds to it
// with the auction data it collected so far
import logger from '../../logger';
import constants from '../../constants.json';
import { IPrebidDetails } from '../../inject/scripts/prebid';

class Content {
  pbjsNamespace: string = null;
  constructor() {
    logger.log('[Content] init()');
    this.listenToInjectedScript();
    this.listenToPopupScript();
  }

  listenToInjectedScript = () => {
    window.addEventListener('message', this.processMessageFromInjected, false);
    logger.log('[Content] listenToInjectedScript()');
  };

  listenToPopupScript = () => {
    chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
      if (request.type === constants.CONSOLE_TOGGLE) {
        document.dispatchEvent(new CustomEvent(constants.CONSOLE_TOGGLE, { detail: request.consoleState }));
      }
      if (request.type === constants.PBJS_NAMESPACE_CHANGE) {
        this.pbjsNamespace = request.pbjsNamespace;
        document.dispatchEvent(new CustomEvent(constants.SAVE_MASKS, { detail: request.pbjsNamespace }));
      }
      sendResponse();
    });
    logger.log('[Content] listenToPopupScript()');
  };

  processMessageFromInjected = (event: MessageEvent<{type: string; payload: object}>) => {
    if (event.source != window) {
      return;
    }
    const { type, payload } = event.data;
    if (type === constants.EVENTS.REQUEST_CONSOLE_STATE) {
      this.sendConsoleStateToInjected();
    }
    if (type === constants.EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND) {
      this.pbjsNamespace = (payload as IPrebidDetails).namespace;
    }
    this.updateBackgroundPage(type, payload);
    this.updateMasks();
    logger.log('[Content] processMessageFromInjected()', { type, payload });
  };

  sendConsoleStateToInjected = async () => {
    const result = await chrome.storage.local.get(constants.CONSOLE_TOGGLE);
    const checked = result[constants.CONSOLE_TOGGLE];
    document.dispatchEvent(new CustomEvent(constants.CONSOLE_TOGGLE, { detail: !!checked }));
    logger.log('[Content] sendConsoleStateToInjected()');
  };

  updateBackgroundPage = (type: string, payload: object) => {
    if (!type || !payload) return;
    logger.log('[Content] updateBackgroundPage', type, payload);
    chrome.runtime.sendMessage({ type, payload });
  };

  updateMasks = () => {
    logger.log('[Content] updateMasks', this.pbjsNamespace);
    if (this.pbjsNamespace) {
      document.dispatchEvent(new CustomEvent(constants.SAVE_MASKS, { detail: this.pbjsNamespace }));
    }
    logger.log('[Content] updateMasks()');
  };
}

new Content();
