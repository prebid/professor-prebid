import { BadgeService } from './BadgeService';
import { MessageHandler } from './MessageHandler';
import { TabContextService } from './TabContextService';
import { PRE_AUCTION_HAR, preAuctionHarKey } from '../Shared/constants';

class BackgroundService {
  constructor(private tabContextService: TabContextService, private updateBadge: (tabId: number | undefined) => void) {}

  async start(): Promise<void> {
    const handler = new MessageHandler(this.tabContextService, this.updateBadge);
    chrome.runtime.onMessage.addListener(handler.handle);
    chrome.webNavigation?.onCommitted.addListener(this.handleWebNavigationOnCommitted);
    chrome.tabs.onRemoved.addListener(this.handleOnTabRemoved);
    chrome.tabs.onActivated.addListener(this.handleOnTabActivated);
    chrome.alarms?.onAlarm.addListener(this.handleOnAlarm);
    chrome.alarms?.get('cleanUpTabInfo', (alarm) => {
      if (!alarm) {
        chrome.alarms?.create('cleanUpTabInfo', { periodInMinutes: 15 });
      }
    });

    await this.tabContextService.load();
    await this.cleanStorage();
  }

  handleOnTabActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
    this.updateBadge(activeInfo.tabId);
  };

  // Reset on commit (not on onBeforeNavigate) so navigations that never replace the document (downloads, 204s, cancelled loads) keep the current page's data.
  handleWebNavigationOnCommitted = async (web_navigation: chrome.webNavigation.WebNavigationTransitionCallbackDetails) => {
    const { frameId, tabId, url } = web_navigation;
    if ((web_navigation as { documentLifecycle?: string }).documentLifecycle === 'prerender') return;
    if (frameId === 0) {
      await this.tabContextService.saveTabInfo(tabId, { 'top-window': { url } });
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
    for (const key of Object.keys(allStorage || {})) {
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
    if (chrome.storage.session?.get) {
      // Only the key names are needed; getKeys (Chrome 130+) avoids loading every tab's multi-MB HAR log.
      const session = chrome.storage.session as typeof chrome.storage.session & { getKeys?: () => Promise<string[]> };
      const sessionKeys = typeof session.getKeys === 'function' ? await session.getKeys() : Object.keys(((await session.get(null)) as any) || {});
      const sessionKeysToRemove: string[] = [];
      for (const key of sessionKeys) {
        if (key.startsWith(`${PRE_AUCTION_HAR}_`)) {
          const tabId = parseInt(key.slice(PRE_AUCTION_HAR.length + 1), 10);
          if (!activeTabIds.includes(tabId)) {
            sessionKeysToRemove.push(key);
          }
        }
      }
      if (sessionKeysToRemove.length > 0) {
        await chrome.storage.session.remove(sessionKeysToRemove);
      }
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
