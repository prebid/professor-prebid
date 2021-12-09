import constants from '../constants.json';
import logger from '../logger';
import { IGoogleAdManagerDetails } from '../inject/scripts/googleAdManager';
import { IPrebidDetails } from '../inject/scripts/prebid';
import { ITcfDetails } from '../inject/scripts/tcf';

class Background {
  tabInfo: ITabInfo = {};
  currentActiveTabId: number;

  init() {
    this.addEventListeners();
    setInterval(() => {
      chrome.tabs.query({}, (tabs) => {
        let activeTabIds = tabs.map((tab) => tab.id);
        for (let t in this.tabInfo) {
          if (activeTabIds.includes(parseInt(t))) {
            logger.log(`[Background] Tab(${t}) is active' tabInfo has ~ ${Math.round(JSON.stringify(this.tabInfo[t]).length / (1000 * 1000))}mb`);
          } else {
            logger.log(`[Background] Tab(${t}) is not active. Removing info...`);
            this.removeInfoForTabId(parseInt(t));
          }
        }
      });
    }, 3000);
  }

  updateBadge() {
    if (this.tabInfo[this.currentActiveTabId]?.prebid) {
      chrome.browserAction.setBadgeBackgroundColor({ color: '#F99B0C' });
      chrome.browserAction.setBadgeText({ text: `✓` });
    } else {
      chrome.browserAction.setBadgeBackgroundColor({ color: '#ecf3f5' });
      chrome.browserAction.setBadgeText({ text: `` });
    }
  }

  updatePopUp(currentActiveTabId: number) {
    chrome.runtime.sendMessage({
      type: constants.EVENTS.EVENT_SEND_AUCTION_DATA_TO_POPUP,
      payload: this.tabInfo[currentActiveTabId] || {},
    });
  }

  addEventListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const msgType = message && message.type;
      const payload = message && message.payload;

      const tabId = sender.tab?.id;
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const currTab = tabs[0];
        if (currTab) {
          this.currentActiveTabId = currTab.id;
        }
      });

      this.tabInfo[tabId] = this.tabInfo[tabId] || {};

      switch (msgType) {
        case constants.EVENTS.OPEN_DATA_TAB:
          if (this.currentActiveTabId) {
            chrome.tabs.update(this.currentActiveTabId, { active: true, url: `./app.html` }, (tab) => {
              this.currentActiveTabId = tab?.id;
              logger.log('[Background] update tab with tabId: ', this.currentActiveTabId);
              sendResponse();
            });
          } else {
            chrome.tabs.create({ url: `./app.html` }, (tab) => {
              this.currentActiveTabId = tab.id;
              logger.log('[Background] created tab with tabId: ', this.currentActiveTabId);
              sendResponse();
            });
          }
          break;
        case constants.EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND:
          logger.log('[Background] received gam details data:', payload);
          this.tabInfo[tabId].googleAdManager = { ...payload };
          this.updateBadge();
          sendResponse();
          break;
        case constants.EVENTS.REQUEST_GAM_DETAILS_FROM_BACKGROUND:
          logger.log('[Background] send gam details data:', this.tabInfo, this.currentActiveTabId);
          this.updateBadge();
          sendResponse(this.tabInfo[this.currentActiveTabId]?.googleAdManager);
          break;
        case constants.EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND:
          logger.log('[Background] received prebid details data:', payload);
          payload.events.forEach((event: any) => {
            delete event.args.ad;
            delete event.args.gdprConsent;
            delete event.args.vastXml;
            delete event.args.userIdAsEids;
            event.args.bids?.forEach((bid: any) => {
              delete bid.userId;
              delete bid.userIdsEids;
            });
            event.args.bidsReceived?.forEach((bid: any) => {
              delete bid.ad;
              delete bid.content;
            });
            event.args.bidderRequests?.forEach((bidderRequest: any) => {
              delete bidderRequest.gdprConsent;
              delete bidderRequest.userId;
            });
          });
          this.tabInfo[tabId].prebid = { ...payload };
          this.updateBadge();
          this.updatePopUp(this.currentActiveTabId);
          sendResponse();
          break;
        case constants.EVENTS.REQUEST_PREBID_DETAILS_FROM_BACKGROUND:
          logger.log('[Background] send prebid details data:', this.tabInfo, this.currentActiveTabId);
          sendResponse(this.tabInfo[this.currentActiveTabId]?.prebid);
          break;
        case constants.EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND:
          logger.log('[Background] received tcf details data:', payload);
          this.tabInfo[tabId].tcf = { ...payload };
          sendResponse();
          break;
        case constants.EVENTS.REQUEST_TCF_DETAILS_FROM_BACKGROUND:
          logger.log('[Background] send tcf details data:', this.tabInfo, this.currentActiveTabId);
          sendResponse(this.tabInfo[this.currentActiveTabId]?.tcf);
          break;
        case constants.EVENTS.REQUEST_DEBUG_DETAILS_FROM_BACKGROUND:
          logger.log('[Background] send debug details data:', this.tabInfo, this.currentActiveTabId);
          sendResponse(this.tabInfo);
          break;
        default:
          sendResponse();
      }
    });

    chrome.webNavigation.onBeforeNavigate.addListener((web_navigation) => {
      const tabId = web_navigation.tabId;
      const frameId = web_navigation.frameId;
      if (frameId == 0) {
        logger.warn('[Background]', tabId, 'RESET');
        this.tabInfo[tabId] = { googleAdManager: null, prebid: null, tcf: null, url: null };
        this.tabInfo[tabId]['url'] = web_navigation.url;
      }
    });

    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      logger.log('[Background]', tabId, 'is removed', removeInfo);
      this.removeInfoForTabId(tabId);
    });

    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.currentActiveTabId = activeInfo.tabId;
      this.updateBadge();
      // this.updatePopUp(this.currentActiveTabId);
    });
  }

  removeInfoForTabId(tabId: number) {
    logger.log('[Background] Removing info for tabId ' + tabId);
    if (this.tabInfo[tabId]) delete this.tabInfo[tabId];
  }
}

export interface ITabInfo {
  [key: number]: {
    googleAdManager?: IGoogleAdManagerDetails;
    prebid?: IPrebidDetails;
    tcf?: ITcfDetails;
    url?: string;
  };
  [key: string]: any;
}

const background = new Background();
background.init();
