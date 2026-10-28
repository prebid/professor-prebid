import { CONSOLE_TOGGLE, DOWNLOAD_FAILED, PBJS_NAMESPACE_CHANGE, EVENTS, SAVE_MASKS, POPUP_LOADED } from '../Shared/constants';
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
  if (['challenges.cloudflare.com'].includes(window.location.host)) return;
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('/injected.bundle.js');
  script.id = 'professor prebid injected bundle';
  const node = document.head || document.documentElement;
  if (node) {
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

// Shape produced by sendChromeTabsMessage: every message carries its value under `payload`.
type ChromeMessage = { type: typeof CONSOLE_TOGGLE; payload: { consoleState: boolean } } | { type: typeof PBJS_NAMESPACE_CHANGE; payload: string } | { type: typeof POPUP_LOADED; payload: object } | { type: typeof DOWNLOAD_FAILED; payload: object };

const processChromeRuntimeMessages = (request: ChromeMessage) => {
  switch (request.type) {
    case CONSOLE_TOGGLE: {
      const consoleState = !!request.payload?.consoleState;
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: consoleState }));
      EventBus.emit(request.type, { detail: consoleState });
      if (consoleState) {
        updateOverlays(NamespaceStore.get() || 'pbjs');
      }
      break;
    }
    case PBJS_NAMESPACE_CHANGE:
      if (typeof request.payload !== 'string' || !request.payload) break;
      NamespaceStore.set(request.payload);
      EventBus.emit(request.type, { detail: request.payload });
      break;
    case POPUP_LOADED:
    case DOWNLOAD_FAILED:
      EventBus.emit(request.type, request.payload);
      break;
  }
};

export const sendToServiceWorker = (type: string, payload: object) => {
  if (!type || !payload || !chrome.runtime?.id || !chrome.runtime?.sendMessage) return;
  chrome.runtime.sendMessage({ type, payload })?.catch(() => {});
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

const isSameOriginIframe = (): boolean => {
  if (!detectIframe()) return false;
  try {
    return Boolean(window.top?.document);
  } catch {
    return false;
  }
};

if (!isSameOriginIframe()) {
  setUpListeners();
}
