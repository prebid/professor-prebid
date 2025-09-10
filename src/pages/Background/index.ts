import { BadgeService } from './BadgeService';
import { MessageHandler } from './MessageHandler';
import { TabContextService, debounce } from './TabContextService';

class BackgroundService {
  constructor(
    private tabContextService: TabContextService,
    private updateBadge: (tabId: number | undefined) => void
  ) { }

  async start(): Promise<void> {
    await this.tabContextService.load();
    await this.cleanStorage();

    const handler = new MessageHandler(this.tabContextService, this.updateBadge);
    chrome.runtime.onMessage.addListener(handler.handle);
    chrome.webNavigation?.onBeforeNavigate.addListener(this.handleWebNavigationOnBeforeNavigate);
    chrome.tabs.onRemoved.addListener(this.handleOnTabRemoved);
    chrome.tabs.onActivated.addListener(this.handleOnTabActivated);
    chrome.alarms?.onAlarm.addListener(this.handleOnAlarm);
    chrome.alarms?.create('cleanUpTabInfo', { periodInMinutes: 15 });
  }

  handleOnTabActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
    this.updateBadge(activeInfo.tabId);
  };

  handleWebNavigationOnBeforeNavigate = async (web_navigation: chrome.webNavigation.WebNavigationParentedCallbackDetails) => {
    const { frameId, tabId, url } = web_navigation;
    if (frameId === 0) {
      const tabInfo = this.tabContextService.getOrCreateTabInfo(tabId);
      tabInfo['top-window'] = { url };
      this.updateBadge(tabId);
      await this.tabContextService.persist();
    }
  };

  handleOnTabRemoved = async (tabId: number, _info: chrome.tabs.TabRemoveInfo) => {
    await this.tabContextService.deleteTabInfo(tabId);
  };

  handleOnAlarm = async (_alarm: chrome.alarms.Alarm) => {
    await this.cleanStorage();
  };

  private cleanStorage = async () => {
    const tabs = await chrome.tabs.query({});
    const activeTabIds = tabs.map((tab) => tab.id);
    for (const tabIdStr of Object.keys(this.tabContextService.getTabInfos())) {
      const tabId = parseInt(tabIdStr, 10);
      if (!activeTabIds.includes(tabId)) {
        await this.tabContextService.deleteTabInfo(tabId);
      }
    }
  };
}

class Background {
  updateBadge = (tabId: number | undefined) => {
    return BadgeService.update(this.tabContextService.getTabInfos(), tabId);
  };
  private tabContextService = new TabContextService();
  private backgroundService = new BackgroundService(this.tabContextService, this.updateBadge);
  persistInStorageThrottled = debounce(() => this.tabContextService.persist(), 1500);

  constructor() {
    this.backgroundService.start();
  }

}
new Background();
