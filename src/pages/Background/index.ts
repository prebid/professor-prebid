import { IGoogleAdManagerDetails } from '../Injected/googleAdManager';
import { IPrebidDetails } from '../Injected/prebid';
import { ITcfDetails } from '../Injected/tcf';
import { EVENTS } from '../Shared/constants';
import { getTabId } from '../Shared/utils';

class Background {
  tabInfos: ITabInfos = {};
  timeoutId: NodeJS.Timeout | null = null;
  lastWriteToStorage: number | null = null;
  writeTimeoutId: number | null = null;

  constructor() {
    chrome.runtime.onMessage.addListener(this.handleMessagesFromInjected);
    chrome.webNavigation?.onBeforeNavigate.addListener(this.handleWebNavigationOnBeforeNavigate);
    chrome.tabs.onRemoved.addListener(this.handleOnTabRemoved);
    chrome.tabs.onActivated.addListener(this.handleOnTabActivated);
    chrome.alarms?.onAlarm.addListener(this.handleOnAlarm);
    chrome.alarms?.create('cleanUpTabInfo', { periodInMinutes: 15 });
    this.init();
  }

  init = async () => {
    // read state from storage
    const res = await chrome.storage.local.get(['tabInfos']);
    this.tabInfos = res.tabInfos || this.tabInfos;
    // // clean up storage
    await this.cleanStorage();
  };

  handleMessagesFromInjected = async (
    message: { type: string; payload: IGoogleAdManagerDetails | IPrebidDetails | ITcfDetails },
    sender: chrome.runtime.MessageSender
  ) => {
    const { type, payload } = message;
    const tabId = sender.tab?.id;
    if (!tabId || !type || !payload || JSON.stringify(payload) === '{}') return;
    this.tabInfos[tabId] = this.tabInfos[tabId] || {};
    switch (type) {
      case EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND:
        this.tabInfos[tabId]['top-window'] = this.tabInfos[tabId]['top-window'] || {};
        this.tabInfos[tabId]['top-window']['googleAdManager'] = payload as IGoogleAdManagerDetails;
        break;
      case EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND:
        const { frameId, namespace } = payload as IPrebidDetails;
        this.tabInfos[tabId][frameId] = this.tabInfos[tabId][frameId] || {};
        this.tabInfos[tabId][frameId]['prebids'] = this.tabInfos[tabId][frameId]['prebids'] || {};
        this.tabInfos[tabId][frameId]['prebids'][namespace as keyof IPrebids] = payload as IPrebidDetails;
        break;
      case EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND:
        this.tabInfos[tabId]['tcf'] = payload as ITcfDetails;
        break;
    }
    await this.persistInStorage();
    this.updateBadge(tabId);
  };

  handleOnTabActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
    this.updateBadge(activeInfo.tabId);
  };

  handleWebNavigationOnBeforeNavigate = async (web_navigation: chrome.webNavigation.WebNavigationParentedCallbackDetails) => {
    const { frameId, tabId, url } = web_navigation;
    if (frameId == 0) {
      this.tabInfos[tabId] = this.tabInfos[tabId] || {};
      this.tabInfos[tabId]['top-window'] = this.tabInfos[tabId]['top-window'] || {};
      this.tabInfos[tabId]['top-window'] = { url };
      this.updateBadge(tabId);
      await this.persistInStorage();
    }
  };

  handleOnTabRemoved = async (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => {
    await this.deleteTabInfo(tabId);
  };

  handleOnAlarm = async (alarm: chrome.alarms.Alarm) => {
    await this.cleanStorage();
  };

  cleanStorage = async () => {
    const tabs = await chrome.tabs.query({});
    const activeTabIds = tabs.map((tab) => tab.id);
    for (const t in this.tabInfos) {
      if (activeTabIds.includes(parseInt(t))) {
      } else {
        await this.deleteTabInfo(parseInt(t));
      }
    }
  };

  deleteTabInfo = async (tabId: number) => {
    delete this.tabInfos[tabId];
    await this.persistInStorage();
  };

  updateBadge = async (tabId: number | undefined) => {
    const activeTabId = await getTabId();
    if (!tabId || tabId !== activeTabId) return;
    let prebidCount = 0;
    for (const [_frameId, frameInfo] of Object.entries(this.tabInfos[tabId])) {
      if (frameInfo.prebids) {
        prebidCount += Object.keys(frameInfo.prebids).length;
      }
    }
    if (tabId && prebidCount > 0) {
      chrome.action.setBadgeBackgroundColor({ color: '#1ba9e1', tabId: activeTabId });
      chrome.action.setBadgeText({ text: `✓`, tabId: activeTabId });
    } else {
      chrome.action.setBadgeBackgroundColor({ color: '#ecf3f5' });
      chrome.action.setBadgeText({ text: `` });
    }
  };

  persistInStorageThrottled = () => {
    const delay = 1500;
    const now = Date.now();

    if (this.writeTimeoutId) {
      clearTimeout(this.writeTimeoutId);
    }

    this.writeTimeoutId = window.setTimeout(() => {
      this.persistInStorage();
      this.lastWriteToStorage = now;
      this.writeTimeoutId = null;
    }, delay);
  };

  persistInStorage = async () => {
    await chrome.storage?.local.set({ tabInfos: this.tabInfos });
  };
}
new Background();

export interface IPrebids {
  [key: string]: IPrebidDetails;
}

export interface IFrameInfo {
  googleAdManager?: IGoogleAdManagerDetails;
  prebids?: IPrebids;
  tcf?: ITcfDetails;
  url?: string;
  downloading?: 'true' | 'false' | 'error';
  namespace?: string;
  updateNamespace?: (namespace: string) => void;
  syncState?: string;
  initReqChainResult?: initReqChainResult;
}

interface IFrameInfos {
  [key: string]: IFrameInfo;
}
export interface ITabInfos {
  [key: number]: IFrameInfos;
}

export interface initReqChainResult {
  [key: string]: any;
}
