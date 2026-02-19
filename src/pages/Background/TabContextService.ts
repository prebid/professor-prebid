import { StorageService } from './StorageService';

export class TabContextService {
    private tabInfos: ITabInfos = {};

    async load(): Promise<void> {
        this.tabInfos = await StorageService.loadTabInfos();
    }

    getTabInfos(): ITabInfos {
        return this.tabInfos;
    }

    getOrCreateTabInfo(tabId: number): IFrameInfos {
        if (!this.tabInfos[tabId]) this.tabInfos[tabId] = {};
        return this.tabInfos[tabId];
    }

    async deleteTabInfo(tabId: number): Promise<void> {
        await StorageService.deleteTabInfo(this.tabInfos, tabId);
    }

    async persist(): Promise<void> {
        await StorageService.saveTabInfos(this.tabInfos);
    }
}
// Debounce utility function
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return ((...args: any[]) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
}
