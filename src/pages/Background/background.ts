import constants from '../../constants.json';
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import { IPrebidDetails } from '../../inject/scripts/prebid';
import { ITcfDetails } from '../../inject/scripts/tcf';
import { getTabId } from '../Popup/utils';
class Background {
  tabInfos: ITabInfos = {};
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
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: undefined) => void
  ) => {
    const { type, payload } = message;
    const tabId = sender.tab?.id;
    if (!tabId || !type || !payload || JSON.stringify(payload) === '{}') return;
    this.tabInfos[tabId] = this.tabInfos[tabId] || {};
    switch (type) {
      case constants.EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND:
        sendResponse();
        this.tabInfos[tabId]['googleAdManager'] = payload as IGoogleAdManagerDetails;
        break;
      case constants.EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND:
        sendResponse();
        const typedPayload = payload as IPrebidDetails;
        this.tabInfos[tabId]['prebids'] = this.tabInfos[tabId]['prebids'] || {};
        this.tabInfos[tabId]['prebids']![typedPayload.namespace] = typedPayload;
        break;
      case constants.EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND:
        sendResponse();
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
      await this.persistInStorage();
      this.updateBadge(tabId);
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

  persistInStorage = async () => {
    await chrome.storage?.local.set({ tabInfos: this.tabInfos });
  };
}
new Background();
export interface IPrebids {
  [key: string]: IPrebidDetails;
}

export interface ITabInfo {
  googleAdManager?: IGoogleAdManagerDetails;
  prebids?: IPrebids;
  tcf?: ITcfDetails;
  url?: string;
}

export interface ITabInfos {
  [key: number]: ITabInfo;
}
