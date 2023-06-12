import { CONSOLE_TOGGLE, PBJS_NAMESPACE_CHANGE, EVENTS, SAVE_MASKS, DOWNLOAD_FAILED } from '../Shared/constants';
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
      if (request.type === CONSOLE_TOGGLE) {
        document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: request.consoleState }));
      }
      if (request.type === PBJS_NAMESPACE_CHANGE) {
        pbjsNamespace = request.pbjsNamespace;
        document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: request.pbjsNamespace }));
      }
      if (request.type === DOWNLOAD_FAILED) {
        document.dispatchEvent(new CustomEvent(DOWNLOAD_FAILED, { detail: request.url }));
      }
      sendResponse();
    });
  };

  const processWindowMessages = async (event: MessageEvent<{ type: string; payload: object; profPrebid: boolean }>) => {
    if (!event.data.profPrebid || !event?.data || !event?.data?.type) return;
    const { type, payload } = event.data;
    if (type === EVENTS.REQUEST_CONSOLE_STATE) {
      const result = await chrome.storage.local.get(CONSOLE_TOGGLE);
      const checked = result[CONSOLE_TOGGLE];
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: !!checked }));
    }
    if (type === EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND) {
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
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: pbjsNamespace }));
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
