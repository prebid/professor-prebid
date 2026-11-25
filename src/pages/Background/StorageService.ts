export class StorageService {
  static async loadTabInfo(tabId: number): Promise<IFrameInfos> {
    const res = await chrome.storage.local.get([`tab_info_${tabId}`]);
    return res[`tab_info_${tabId}`] || {};
  }

  static async saveTabInfo(tabId: number, tabInfo: IFrameInfos): Promise<void> {
    await chrome.storage.local.set({ [`tab_info_${tabId}`]: tabInfo });
  }

  static async deleteTabInfo(tabId: number): Promise<void> {
    await chrome.storage.local.remove([`tab_info_${tabId}`]);
  }
}
