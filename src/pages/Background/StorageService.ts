export class StorageService {
    static async loadTabInfos(): Promise<ITabInfos> {
        const res = await chrome.storage.local.get(['tabInfos']);
        return res.tabInfos || {};
    }

    static async saveTabInfos(tabInfos: ITabInfos): Promise<void> {
        await chrome.storage.local.set({ tabInfos });
    }

    static async deleteTabInfo(tabInfos: ITabInfos, tabId: number): Promise<void> {
        delete tabInfos[tabId];
        await this.saveTabInfos(tabInfos);
    }
}
