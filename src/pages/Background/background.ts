import constants from '../../constants.json';
import logger from '../../logger';
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import { IPrebidDetails } from '../../inject/scripts/prebid';
import { ITcfDetails } from '../../inject/scripts/tcf';

class Background {
  tabInfos: ITabInfos = {};
  constructor() {
    chrome.runtime.onMessage.addListener(this.handleMessages);
    chrome.webNavigation?.onBeforeNavigate.addListener(this.handleOnBeforeNavigate);
    chrome.tabs.onRemoved.addListener(this.handleOnRemoved);
    chrome.tabs.onActivated.addListener(this.handleOnActivated);
    chrome.alarms?.onAlarm.addListener(this.handleOnAlarm);
    chrome.alarms?.create('cleanUpTabInfo', { periodInMinutes: 1 });
    logger.log('[Background] addEventListeners');
    this.init();
  }

  init = async () => {
    // read state from storage
    const res = await chrome.storage.local.get(['tabInfos']);
    this.tabInfos = res.tabInfos || this.tabInfos;
    // // clean up storage
    await this.cleanStorage();
  };

  handleMessages = async (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    const { type, payload } = message;
    if (!type || !payload || JSON.stringify(payload) === '{}') return;
    const tabId = sender.tab?.id;
    this.tabInfos[tabId] = this.tabInfos[tabId] || {};
    logger.log('[Background] handleMessages', { tabId });
    switch (type) {
      case constants.EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND:
        sendResponse();
        this.tabInfos[tabId]['googleAdManager'] = payload;
        logger.log('[Background] received gam details data:', payload);
        break;
      case constants.EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND:
        sendResponse();
        this.tabInfos[tabId]['prebids'] = this.tabInfos[tabId]['prebids'] || {};
        this.tabInfos[tabId]['prebids']![payload.namespace] = payload;
        logger.log('[Background] received prebid details data:', payload);
        break;
      case constants.EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND:
        sendResponse();
        this.tabInfos[tabId]['tcf'] = payload;
        logger.log('[Background] received tcf details data:', payload);
        break;
    }
    await this.persistInStorage();
    this.updateBadge(tabId);
    this.updatePopUp(tabId);
  };

  handleOnActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
    this.updateBadge(activeInfo.tabId);
    this.updatePopUp(activeInfo.tabId);
  };

  handleOnBeforeNavigate = async (web_navigation: chrome.webNavigation.WebNavigationParentedCallbackDetails) => {
    const { frameId, tabId, url } = web_navigation;
    if (frameId == 0) {
      logger.warn('[Background]', tabId, 'RESET');
      this.tabInfos[tabId] = { url };
      await this.persistInStorage();
      this.updateBadge(tabId);
      this.updatePopUp(tabId);
    }
  };

  handleOnRemoved = async (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => {
    logger.log('[Background]', tabId, 'is removed', removeInfo);
    await this.deleteTabInfo(tabId);
  };

  handleOnAlarm = async (alarm: chrome.alarms.Alarm) => {
    console.log('[Background]', alarm.name, 'is triggered');
    await this.cleanStorage();
  };

  cleanStorage = async () => {
    const tabs = await chrome.tabs.query({});
    const activeTabIds = tabs.map((tab) => tab.id);
    logger.log('[Background] clean up storage', tabs, activeTabIds);
    for (const t in this.tabInfos) {
      if (activeTabIds.includes(parseInt(t))) {
        logger.log(`[Background] Tab(${t}) is active`);
      } else {
        logger.log(`[Background] Tab(${t}) is not active. Removing info...`);
        await this.deleteTabInfo(parseInt(t));
      }
    }
  };

  deleteTabInfo = async (tabId: number) => {
    delete this.tabInfos[tabId];
    await this.persistInStorage();
    logger.log('[Background] Removed info for tabId ' + tabId);
  };

  updateBadge = (tabId: number | undefined) => {
    logger.log('[Background] updateBadge', tabId);
    if (tabId && this.tabInfos[tabId]?.prebids) {
      chrome.action.setBadgeBackgroundColor({ color: '#1ba9e1' });
      chrome.action.setBadgeText({ text: `✓` });
    } else {
      chrome.action.setBadgeBackgroundColor({ color: '#ecf3f5' });
      chrome.action.setBadgeText({ text: `` });
    }
  };

  updatePopUp = (tabId: number) => {
    logger.log('[Background] updatePopUp', this.tabInfos[tabId]);
    chrome.runtime.sendMessage({
      type: constants.EVENTS.EVENT_SEND_AUCTION_DATA_TO_POPUP,
      payload: { tabId },
    });
  };

  persistInStorage = async () => {
    logger.log('[Background] updateTabInfos', this.tabInfos);
    await chrome.storage?.local.set({ tabInfos: this.tabInfos });
  };
}
// chrome.storage?.local.set({ tabInfos: null });
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
