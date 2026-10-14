import { CONSOLE_TOGGLE, PBJS_NAMESPACE_CHANGE, EVENTS, SAVE_MASKS, POPUP_LOADED } from '../Shared/constants';
import { IPrebidDetails } from '../Injected/prebid';
import { detectIframe, EventBus } from '../Shared/utils';

const NamespaceStore = (() => {
  let ns: string | null = null;
  return {
    get: () => ns,
    set: (newNs: string) => (ns = newNs),
    has: () => !!ns,
  };
})();

const injectScript = () => {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('/injected.bundle.js');
  script.id = 'professor prebid injected bundle';
  const node = document.head || document.documentElement;
  if (node && !['challenges.cloudflare.com'].includes(window.location.host)) {
    node.appendChild(script);
    script.addEventListener('load', () => script.remove());
  } else {
    requestIdleCallback(injectScript);
  }
};

export const processEventBusMessages = async (type: string, payload: any) => {
  if (type === EVENTS.REQUEST_CONSOLE_STATE) {
    const result = await chrome.storage?.local.get(CONSOLE_TOGGLE);
    const checked = result?.[CONSOLE_TOGGLE];
    document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: !!checked }));
  }

  if (type === EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND) {
    NamespaceStore.set((payload as IPrebidDetails)?.namespace);
  }

  sendToServiceWorker(type, payload);
  updateOverlays(NamespaceStore.get());
};

const listenToEventBus = () => {
  EventBus.onAny(processEventBusMessages, [EVENTS.REQUEST_CONSOLE_STATE, EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND, EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND, EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND]);
};

const listenToChromeRuntimeMessages = () => {
  chrome.runtime?.onMessage.addListener(processChromeRuntimeMessages);
};

type ChromeMessage = { type: typeof CONSOLE_TOGGLE; consoleState: boolean } | { type: typeof PBJS_NAMESPACE_CHANGE; pbjsNamespace: string } | { type: typeof POPUP_LOADED; payload: object };

const processChromeRuntimeMessages = (request: ChromeMessage) => {
  switch (request.type) {
    case CONSOLE_TOGGLE:
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: request.consoleState }));
      EventBus.emit(request.type, { detail: request.consoleState });
      if (request.consoleState) {
        updateOverlays(NamespaceStore.get() || 'pbjs');
      }
      break;
    case PBJS_NAMESPACE_CHANGE:
      NamespaceStore.set(request.pbjsNamespace);
      EventBus.emit(request.type, { detail: request.pbjsNamespace });
      break;
    case POPUP_LOADED:
      EventBus.emit(request.type, request.payload);
      break;
  }
};

export const sendToServiceWorker = (type: string, payload: object) => {
  if (!type || !payload || !chrome.runtime?.id || !chrome.runtime?.sendMessage) return;
  chrome.runtime.sendMessage({ type, payload });
};

export const updateOverlays = (namespace: string | null) => {
  if (namespace) {
    document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: namespace }));
  }
};

const setUpListeners = () => {
  listenToEventBus();
  listenToChromeRuntimeMessages();
};
injectScript();

if (detectIframe() === false) {
  setUpListeners();
}
