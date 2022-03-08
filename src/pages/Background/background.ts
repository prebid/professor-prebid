import constants from '../../constants.json';
import logger from '../../logger';
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import { IPrebidDetails } from '../../inject/scripts/prebid';
import { ITcfDetails } from '../../inject/scripts/tcf';

class Background {
  tabInfos: ITabInfos = {};
  constructor() {
    chrome.runtime.onMessage.addListener(this.handleMessagesFromInjected);
    chrome.webNavigation?.onBeforeNavigate.addListener(this.handleWebNavigationOnBeforeNavigate);
    chrome.tabs.onRemoved.addListener(this.handleOnTabRemoved);
    chrome.tabs.onActivated.addListener(this.handleOnTabActivated);
    chrome.alarms?.onAlarm.addListener(this.handleOnAlarm);
    chrome.alarms?.create('cleanUpTabInfo', { periodInMinutes: 15 });
    logger.log('[Background] addEventListeners');
    this.init();
  }

  init = async () => {
    // read state from storage
    const res = await chrome.storage.local.get(['tabInfos']);
    logger.log('[Background] init', res.tabInfos, this.tabInfos);
    this.tabInfos = res.tabInfos || this.tabInfos;
    // // clean up storage
    await this.cleanStorage();
  };

  handleMessagesFromInjected = async (message: { type: string; payload: IGoogleAdManagerDetails | IPrebidDetails | ITcfDetails }, sender: chrome.runtime.MessageSender, sendResponse: (response?: undefined) => void) => {
    const { type, payload } = message;
    const tabId = sender.tab?.id;
    if (!tabId || !type || !payload || JSON.stringify(payload) === '{}') return;
    this.tabInfos[tabId] = this.tabInfos[tabId] || {};
    logger.log('[Background] handleMessages', { tabId });
    switch (type) {
      case constants.EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND:
        sendResponse();
        this.tabInfos[tabId]['googleAdManager'] = payload as IGoogleAdManagerDetails;
        logger.log('[Background] received gam details data:', payload);
        break;
      case constants.EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND:
        sendResponse();
        const typedPayload = payload as IPrebidDetails;
        this.tabInfos[tabId]['prebids'] = this.tabInfos[tabId]['prebids'] || {};
        this.tabInfos[tabId]['prebids']![typedPayload.namespace] = typedPayload;
        logger.log('[Background] received prebid details data:', payload);
        break;
      case constants.EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND:
        sendResponse();
        this.tabInfos[tabId]['tcf'] = payload as ITcfDetails;
        logger.log('[Background] received tcf details data:', payload);
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
      logger.warn('[Background]', tabId, 'RESET');
      this.tabInfos[tabId] = { url };
      await this.persistInStorage();
      this.updateBadge(tabId);
    }
  };

  handleOnTabRemoved = async (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => {
    logger.log('[Background]', tabId, 'is removed', removeInfo);
    await this.deleteTabInfo(tabId);
  };

  handleOnAlarm = async (alarm: chrome.alarms.Alarm) => {
    logger.log('[Background]', alarm.name, 'is triggered');
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
    logger.log('[Background] updateBadge', tabId, this.tabInfos[tabId]?.prebids);
  };
  
  persistInStorage = async () => {
    logger.log('[Background] updateTabInfos', this.tabInfos);
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
