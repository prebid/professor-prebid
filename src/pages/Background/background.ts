import { EVENTS } from '../Shared/constants';
import { IGoogleAdManagerDetails } from '../Content/scripts/googleAdManager';
import { IPrebidDetails } from '../Content/scripts/prebid';
import { ITcfDetails } from '../Content/scripts/tcf';
import { getTabId } from '../Shared/utils';
import { Paapi } from './paapi';

class Background {
  tabInfos: ITabInfos = {};
  timeoutId: NodeJS.Timeout | null = null;

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
        this.tabInfos[tabId]['googleAdManager'] = payload as IGoogleAdManagerDetails;
        break;
      case EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND:
        const typedPayload = payload as IPrebidDetails;
        this.tabInfos[tabId]['prebids'] = this.tabInfos[tabId]['prebids'] || {};
        if (typedPayload?.iframeId) {
          this.tabInfos[tabId]['prebids'][typedPayload?.namespace]['iframes'] =
            this.tabInfos[tabId]['prebids'][typedPayload?.namespace]['iframes'] || {};
          this.tabInfos[tabId]['prebids'][typedPayload?.namespace]['iframes'][String(typedPayload?.iframeId)] = typedPayload;
        } else {
          this.tabInfos[tabId]['prebids'][typedPayload?.namespace] = typedPayload;
        }
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
      this.tabInfos[tabId] = { url };
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
    if (tabId && this.tabInfos[tabId]?.prebids) {
      chrome.action.setBadgeBackgroundColor({ color: '#1ba9e1', tabId: activeTabId });
      chrome.action.setBadgeText({ text: `✓`, tabId: activeTabId });
    } else {
      chrome.action.setBadgeBackgroundColor({ color: '#ecf3f5' });
      chrome.action.setBadgeText({ text: `` });
    }
  };

  persistInStorage = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(async () => {
      await chrome.storage?.local.set({ tabInfos: this.tabInfos });
      this.timeoutId = null;
    }, 1500);
  };
}
new Background();
new Paapi();
export interface IPrebids {
  [key: string]: IPrebidDetails;
}

export interface ITabInfo {
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

export interface ITabInfos {
  [key: number]: ITabInfo;
}

export interface initReqChainResult {
  [key: string]: any;
}
