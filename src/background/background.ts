import constants from '../constants.json';
import logger from '../logger';
import { IGoogleAdManagerDetails } from '../inject/scripts/googleAdManager';
import { IPrebidDetails } from '../inject/scripts/prebid';
import { ITcfDetails } from '../inject/scripts/tcf';

class Background {
  mainTabId: number;
  appData: any;
  tabInfo: ITabInfo = {};
  currentActiveTabId: number;

  init() {
    this.addEventListeners();
    setInterval(() => {
      chrome.tabs.query({}, (tabs) => {
        let activeTabIds = tabs.map(tab => tab.id)


        for (let t in this.tabInfo) {
          if (activeTabIds.includes(parseInt(t))) {
          } else {
            this.removeInfoForTabId(t);
          }
        }
      });
    }, 30000);
  }

  updateBadge() {
    if (this.tabInfo[this.currentActiveTabId]?.prebidDetails) {
      chrome.browserAction.setBadgeBackgroundColor({ color: '#F99B0C' });
      chrome.browserAction.setBadgeText({ text: "pbJs" });
    } else {
      chrome.browserAction.setBadgeBackgroundColor({ color: '#ecf3f5' });
      chrome.browserAction.setBadgeText({ text: "" });
    }
  }

  addEventListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const msgType = message && message.type;
      const payload = message && message.payload;

      const tabId = sender.tab?.id
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
        const currTab = tabs[0];
        if (currTab) {
          this.currentActiveTabId = currTab.id;
        }
      });

      this.tabInfo[tabId] = this.tabInfo[tabId] || {};

      switch (msgType) {
        case constants.EVENTS.OPEN_DATA_TAB:
          if (this.mainTabId) {
            chrome.tabs.update(this.mainTabId, { active: true, url: `./app.html` }, tab => {
              this.mainTabId = tab?.id;
              logger.log('[Background] update tab with tabId: ', this.mainTabId);
              sendResponse();
            });
          } else {
            chrome.tabs.create({ url: `./app.html` }, tab => {
              this.mainTabId = tab.id;
              logger.log('[Background] created tab with tabId: ', this.mainTabId);
              sendResponse();
            });
          }
          break;
        case constants.EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND:
          logger.log('[Background] received gam details data:', payload);
          this.tabInfo[tabId].gamDetails = { ...payload };
          this.updateBadge();
          sendResponse();
          break;
        case constants.EVENTS.REQUEST_GAM_DETAILS_FROM_BACKGROUND:
          logger.log('[Background] send gam details data:', this.tabInfo, this.currentActiveTabId);
          this.updateBadge();
          sendResponse(this.tabInfo[this.currentActiveTabId].gamDetails);
          break;
        case constants.EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND:
          logger.log('[Background] received prebid details data:', payload);
          this.tabInfo[tabId].prebidDetails = { ...payload };
          this.updateBadge();
          sendResponse();
          break;
        case constants.EVENTS.REQUEST_PREBID_DETAILS_FROM_BACKGROUND:
          logger.log('[Background] send prebid details data:', this.tabInfo, this.currentActiveTabId);
          sendResponse(this.tabInfo[this.currentActiveTabId].prebidDetails);
          break;
        case constants.EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND:
          logger.log('[Background] received tcf details data:', payload);
          this.tabInfo[tabId].tcfDetails = { ...payload };
          sendResponse();
          break;
        case constants.EVENTS.REQUEST_TCF_DETAILS_FROM_BACKGROUND:
          logger.log('[Background] send tcf details data:', this.tabInfo, this.currentActiveTabId);
          sendResponse(this.tabInfo[this.currentActiveTabId].tcfDetails);
          break;
        case constants.EVENTS.REQUEST_DEBUG_DETAILS_FROM_BACKGROUND:
          logger.log('[Background] send debug details data:', this.tabInfo, this.currentActiveTabId);
          sendResponse(this.tabInfo);
          break;
        default:
          sendResponse();
      }
    });

    chrome.webNavigation.onBeforeNavigate.addListener(web_navigation => {
      const tabId = web_navigation.tabId;
      const frameId = web_navigation.frameId;

      if (frameId == 0) {
        logger.warn('[Background]', tabId, 'RESET');
        this.tabInfo[tabId] = { gamDetails: null, prebidDetails: null, tcfDetails: null, url: null };
        this.tabInfo[tabId]['url'] = web_navigation.url;
      }
    });

    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      logger.log('[Background]', tabId, 'is removed', removeInfo);
      this.removeInfoForTabId(tabId);
    });

    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.currentActiveTabId = activeInfo.tabId
      this.updateBadge();
    });

  }

  removeInfoForTabId(tabId: any) {
    logger.log('[Background] Removing info for tabId ' + tabId);
    if (this.tabInfo[tabId])
      delete this.tabInfo[tabId];
  }
}

interface ITabInfo {
  [key: number]: {
    gamDetails?: IGoogleAdManagerDetails;
    prebidDetails?: IPrebidDetails;
    tcfDetails?: ITcfDetails;
    url?: string;
  },
  [key: string]: any
};

const background = new Background();
(window as any).tabInfo = background.tabInfo;
background.init();