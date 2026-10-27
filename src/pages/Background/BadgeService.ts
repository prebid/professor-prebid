import { getTabId } from '../Shared/utils';

export class BadgeService {
  static async update(tabInfo: IFrameInfos | undefined, tabId: number | undefined) {
    const activeTabId = await getTabId();
    if (!tabId || tabId !== activeTabId) return;

    let prebidCount = 0;
    if (tabInfo && typeof tabInfo === 'object') {
      Object.values(tabInfo).forEach((frameInfo) => {
        if (frameInfo?.prebids) {
          prebidCount += Object.keys(frameInfo.prebids).length;
        }
      });
    }

    if (prebidCount > 0) {
      chrome.action.setBadgeBackgroundColor({ color: '#1ba9e1', tabId: activeTabId });
      chrome.action.setBadgeText({ text: `✓`, tabId: activeTabId });
    } else {
      chrome.action.setBadgeBackgroundColor({ color: '#ecf3f5', tabId: activeTabId });
      chrome.action.setBadgeText({ text: ``, tabId: activeTabId });
    }
  }
}
