import constants from '../../constants.json';
import logger from '../../logger';
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import { IPrebidDetails } from '../../inject/scripts/prebid';
import { ITcfDetails } from '../../inject/scripts/tcf';

class Background {
  tabInfos: ITabInfos = {};
  updateRateMs: number = 1000;
  constructor() {
    chrome.runtime.onMessage.addListener(this.handleMessages);
    chrome.webNavigation?.onBeforeNavigate.addListener(this.handleOnBeforeNavigate);
    chrome.tabs.onRemoved.addListener(this.handleOnRemoved);
    chrome.tabs.onActivated.addListener(this.handleOnActivated);
    chrome.alarms?.onAlarm.addListener(this.handleOnAlarm);

    // read state from storage
    chrome.storage.local.get(['tabInfos'], (res) => (this.tabInfos = res.tabInfos || this.tabInfos));

    //  setup alarms
    chrome.alarms?.create('cleanUpTabInfo', { periodInMinutes: 5 });

    logger.log('[Background] addEventListeners');
  }

  handleMessages = async (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    const { type, payload } = message;
    const tabId = sender.tab?.id;
    logger.log('[Background] handleMessages', { tabId });
    switch (type) {
      case constants.EVENTS.OPEN_DATA_TAB:
        console.log('[Background] Open data tab');
        sendResponse();
        chrome.tabs.create({ url: `./app.html` }, (tab) => {
          logger.log('[Background] created tab with tabId: ', tab.id);
        });
        break;
      case constants.EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND:
        sendResponse();
        await this.updateTabInfos(payload, tabId, 'googleAdManager');
        logger.log('[Background] received gam details data:', payload);
        break;
      case constants.EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND:
        sendResponse();
        await this.updateTabInfos(payload, tabId, 'prebids', payload.namespace);
        this.updateBadge(tabId);
        logger.log('[Background] received prebid details data:', payload);
        break;
      case constants.EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND:
        sendResponse();
        await this.updateTabInfos(payload, tabId, 'tcf');
        logger.log('[Background] received tcf details data:', payload);
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
      this.tabInfos = this.tabInfos || {};
      this.tabInfos[tabId] = { url };
    }
  };

  handleOnRemoved = (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => {
    logger.log('[Background]', tabId, 'is removed', removeInfo);
    this.deleteTabInfo(tabId);
  };

  handleOnAlarm = (input: any) => {
    logger.log('[Background] handleOnAlarm', input);
    chrome.tabs.query({}, (tabs) => {
      const activeTabIds = tabs.map((tab) => tab.id);
      for (const t in this.tabInfos) {
        if (activeTabIds.includes(parseInt(t))) {
          const size = new TextEncoder().encode(JSON.stringify(this.tabInfos[t])).length;
          const megaBytes = (size / 1024 / 1024).toFixed(2);
          logger.log(`[Background] Tab(${t}) is active' tabInfo has ~ ${megaBytes}mb`);
        } else {
          logger.log(`[Background] Tab(${t}) is not active. Removing info...`);
          this.deleteTabInfo(parseInt(t));
        }
      }
    });
  };

  deleteTabInfo = async (tabId: number) => {
    delete this.tabInfos[tabId];
    await this.updateTabInfos(this.tabInfos[tabId], tabId, null);
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

  updateTabInfos = async (payload: any, tabId: number | undefined, key: string, subkey?: string) => {
    logger.log('[Background] updateTabInfos', this.tabInfos);
    if (tabId && payload && JSON.stringify(payload) !== '{}') {
      this.tabInfos = this.tabInfos || {};
      this.tabInfos[tabId] = this.tabInfos[tabId] || {};
      this.tabInfos[tabId]['prebids'] = this.tabInfos[tabId]['prebids'] || {};
      if (key === 'prebids' && subkey) {
        this.tabInfos[tabId]['prebids']![subkey] = payload;
      } else {
        this.tabInfos[tabId][key as keyof ITabInfo] = payload;
      }
      await chrome.storage?.local.set({ tabInfos: this.tabInfos });
      this.updatePopUp(tabId);
    }
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
