import constants from '../constants.json';
import logger from '../logger';
import { IGoogleAdManagerDetails } from '../inject/scripts/googleAdManager';
import { IPrebidDetails } from '../inject/scripts/prebid';
import { ITcfDetails } from '../inject/scripts/tcf';
declare global {
  interface Window {
    tabInfos: ITabInfos;
  }
}
class Background {
  tabInfo: ITabInfos;
  lastActiveTabId: number;
  updateRateMs: number = 1000;

  constructor() {
    this.tabInfo = {};
    window.tabInfos = this.tabInfo;
    this.addEventListeners();
    this.cleanUpTabInfo();
  }

  handleMessages = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    const { type, payload } = message;
    const tabId = sender.tab?.id;
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => (this.lastActiveTabId = tabs[0]?.id));
    switch (type) {
      case constants.EVENTS.OPEN_DATA_TAB:
        logger.log('[Background] Open data tab');
        sendResponse();
        chrome.tabs.create({ url: `./app.html` }, (tab) => {
          logger.log('[Background] created tab with tabId: ', tab.id);
        });
        break;
      case constants.EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND:
        logger.log('[Background] received gam details data:', payload);
        sendResponse();
        this.updateTabInfo(payload, tabId, 'googleAdManager');
        break;
      case constants.EVENTS.REQUEST_GAM_DETAILS_FROM_BACKGROUND:
        logger.log('[Background] send gam details data:', this.tabInfo, this.lastActiveTabId);
        sendResponse(this.tabInfo[this.lastActiveTabId]?.googleAdManager);
        this.updateBadge(this.lastActiveTabId);
        break;
      case constants.EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND:
        logger.log('[Background] received prebid details data:', payload);
        sendResponse();
        this.updateTabInfo(payload, tabId, 'prebids', payload.namespace);
        this.updateBadge(tabId);
        break;
      case constants.EVENTS.REQUEST_PREBID_DETAILS_FROM_BACKGROUND:
        logger.log('[Background] send prebid details data:', this.tabInfo, this.lastActiveTabId);
        sendResponse(this.tabInfo[this.lastActiveTabId]?.prebids);
        break;
      case constants.EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND:
        logger.log('[Background] received tcf details data:', payload);
        sendResponse();
        this.updateTabInfo(payload, tabId, 'tcf');
        break;
      case constants.EVENTS.REQUEST_TCF_DETAILS_FROM_BACKGROUND:
        logger.log('[Background] send tcf details data:', this.tabInfo, this.lastActiveTabId);
        sendResponse(this.tabInfo[this.lastActiveTabId]?.tcf);
        break;
      case constants.EVENTS.REQUEST_DEBUG_DETAILS_FROM_BACKGROUND:
        logger.log('[Background] send debug details data:', this.tabInfo, this.lastActiveTabId);
        sendResponse(this.tabInfo);
        break;
    }
  };

  handleOnActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
    this.updateBadge(activeInfo.tabId);
  };

  handleOnBeforeNavigate = (web_navigation: chrome.webNavigation.WebNavigationParentedCallbackDetails) => {
    const { frameId, tabId, url } = web_navigation;
    if (frameId == 0) {
      logger.warn('[Background]', tabId, 'RESET');
      this.tabInfo = this.tabInfo || {};
      this.tabInfo[tabId] = { url };
    }
  };

  handleOnRemoved = (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => {
    logger.log('[Background]', tabId, 'is removed', removeInfo);
    this.deleteTabInfo(tabId);
  };

  addEventListeners = () => {
    chrome.runtime.onMessage.addListener(this.handleMessages);
    chrome.webNavigation.onBeforeNavigate.addListener(this.handleOnBeforeNavigate);
    chrome.tabs.onRemoved.addListener(this.handleOnRemoved);
    chrome.tabs.onActivated.addListener(this.handleOnActivated);
  };

  cleanUpTabInfo = () => {
    chrome.tabs.query({}, (tabs) => {
      const activeTabIds = tabs.map((tab) => tab.id);
      for (const t in this.tabInfo) {
        if (activeTabIds.includes(parseInt(t))) {
          const size = new TextEncoder().encode(JSON.stringify(this.tabInfo[t])).length;
          const megaBytes = (size / 1024 / 1024).toFixed(2);
          logger.log(`[Background] Tab(${t}) is active' tabInfo has ~ ${megaBytes}mb`);
        } else {
          logger.log(`[Background] Tab(${t}) is not active. Removing info...`);
          this.deleteTabInfo(parseInt(t));
        }
      }
      setTimeout(this.cleanUpTabInfo, 300000);
    });
  };

  deleteTabInfo = (tabId: number) => {
    logger.log('[Background] Removing info for tabId ' + tabId);
    delete this.tabInfo[tabId];
  };

  updateBadge = (tabId: number) => {
    if (this.tabInfo[tabId]?.prebids) {
      chrome.browserAction.setBadgeBackgroundColor({ color: '#F99B0C' });
      chrome.browserAction.setBadgeText({ text: `✓` });
    } else {
      chrome.browserAction.setBadgeBackgroundColor({ color: '#ecf3f5' });
      chrome.browserAction.setBadgeText({ text: `` });
    }
  };

  updateTabInfo = (payload: any, tabId: number, key: string, subkey?: string) => {
    if (tabId && payload && JSON.stringify(payload) !== '{}') {
      this.tabInfo[tabId] = this.tabInfo[tabId] || {};
      if (key === 'prebids' && subkey) {
        this.tabInfo[tabId]['prebids'] = this.tabInfo[tabId]['prebids'] || {};
        this.tabInfo[tabId]['prebids'][subkey as keyof IPrebids] = payload;
      } else {
        this.tabInfo[tabId][key as keyof ITabInfo] = payload;
      }
    }
  };
}

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

new Background();
