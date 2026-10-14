import { BadgeService } from './BadgeService';
import { MessageHandler } from './MessageHandler';
import { TabContextService } from './TabContextService';
import { preAuctionHarKey } from '../Shared/constants';

class BackgroundService {
  constructor(private tabContextService: TabContextService, private updateBadge: (tabId: number | undefined) => void) {}

  async start(): Promise<void> {
    await this.tabContextService.load();
    await this.cleanStorage();

    const handler = new MessageHandler(this.tabContextService, this.updateBadge);
    chrome.runtime.onMessage.addListener(handler.handle);
    chrome.webNavigation?.onBeforeNavigate.addListener(this.handleWebNavigationOnBeforeNavigate);
    chrome.tabs.onRemoved.addListener(this.handleOnTabRemoved);
    chrome.tabs.onActivated.addListener(this.handleOnTabActivated);
    chrome.alarms?.onAlarm.addListener(this.handleOnAlarm);
    chrome.alarms?.get('cleanUpTabInfo', (alarm) => {
      if (!alarm) {
        chrome.alarms?.create('cleanUpTabInfo', { periodInMinutes: 15 });
      }
    });
  }

  handleOnTabActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
    this.updateBadge(activeInfo.tabId);
  };

  handleWebNavigationOnBeforeNavigate = async (web_navigation: chrome.webNavigation.WebNavigationParentedCallbackDetails) => {
    const { frameId, tabId, url } = web_navigation;
    if (frameId === 0) {
      const tabInfo = await this.tabContextService.getTabInfo(tabId);
      tabInfo['top-window'] = { url };
      await this.tabContextService.saveTabInfo(tabId, tabInfo);
      this.updateBadge(tabId);
    }
  };

  handleOnTabRemoved = async (tabId: number, _info: chrome.tabs.TabRemoveInfo) => {
    await this.tabContextService.deleteTabInfo(tabId);
    await chrome.storage.session?.remove(preAuctionHarKey(tabId));
  };

  handleOnAlarm = async (_alarm: chrome.alarms.Alarm) => {
    await this.cleanStorage();
  };

  private cleanStorage = async () => {
    const tabs = await chrome.tabs.query({});
    const activeTabIds = tabs.map((tab) => tab.id);
    const allStorage = (await chrome.storage.local.get(null)) as any;
    const keysToRemove: string[] = [];
    for (const key of Object.keys(allStorage)) {
      if (key.startsWith('tab_info_')) {
        const tabId = parseInt(key.replace('tab_info_', ''), 10);
        if (!activeTabIds.includes(tabId)) {
          keysToRemove.push(key);
        }
      }
    }
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
    }
  };
}

class Background {
  updateBadge = async (tabId: number | undefined) => {
    if (tabId === undefined) return;
    const tabInfo = await this.tabContextService.getTabInfo(tabId);
    BadgeService.update(tabInfo, tabId);
  };
  private tabContextService = new TabContextService();
  private backgroundService = new BackgroundService(this.tabContextService, this.updateBadge);

  constructor() {
    this.backgroundService.start();
  }
}
new Background();
