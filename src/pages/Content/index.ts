import constants from '../../constants.json';
import { IPrebidDetails } from './scripts/prebid';

const ContentScript = () => {
  let pbjsNamespace: string = null;

  const injectScript = () => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('/injected.bundle.js');
    script.id = 'professor prebid injected bundle';
    const node = document.head || document.documentElement;
    if (node) {
      node.appendChild(script);
      script.onload = () => {
        script.remove();
      };
    } else {
      requestIdleCallback(injectScript);
    }
  };

  const listenToWindowMessages = () => {
    window.addEventListener('message', processWindowMessages, false);
  };

  const listenToChromeRuntimeMessages = () => {
    chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
      if (request.type === constants.CONSOLE_TOGGLE) {
        document.dispatchEvent(new CustomEvent(constants.CONSOLE_TOGGLE, { detail: request.consoleState }));
      }
      if (request.type === constants.PBJS_NAMESPACE_CHANGE) {
        pbjsNamespace = request.pbjsNamespace;
        document.dispatchEvent(new CustomEvent(constants.SAVE_MASKS, { detail: request.pbjsNamespace }));
      }
      sendResponse();
    });
  };

  const processWindowMessages = async (event: MessageEvent<{ type: string; payload: object }>) => {
    if (event.source != window) {
      return;
    }
    const { type, payload } = event.data;
    if (type === constants.EVENTS.REQUEST_CONSOLE_STATE) {
      const result = await chrome.storage.local.get(constants.CONSOLE_TOGGLE);
      const checked = result[constants.CONSOLE_TOGGLE];
      document.dispatchEvent(new CustomEvent(constants.CONSOLE_TOGGLE, { detail: !!checked }));
    }
    if (type === constants.EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND) {
      pbjsNamespace = (payload as IPrebidDetails).namespace;
    }
    updateBackgroundPage(type, payload);
    updateOverlays();
  };

  const updateBackgroundPage = (type: string, payload: object) => {
    if (!type || !payload || !chrome.runtime?.id) return;
    chrome.runtime.sendMessage({ type, payload });
  };

  const updateOverlays = () => {
    if (pbjsNamespace) {
      document.dispatchEvent(new CustomEvent(constants.SAVE_MASKS, { detail: pbjsNamespace }));
    }
  };

  const init = () => {
    listenToWindowMessages();
    listenToChromeRuntimeMessages();
    injectScript();
  };
  init();
};

ContentScript();
