import { StorageService } from './StorageService';

export class TabContextService {
  async load(): Promise<void> {}

  async getTabInfo(tabId: number): Promise<IFrameInfos> {
    return await StorageService.loadTabInfo(tabId);
  }

  async getOrCreateTabInfo(tabId: number): Promise<IFrameInfos> {
    return await StorageService.loadTabInfo(tabId);
  }

  async deleteTabInfo(tabId: number): Promise<void> {
    await StorageService.deleteTabInfo(tabId);
  }

  async saveTabInfo(tabId: number, tabInfo: IFrameInfos): Promise<void> {
    await StorageService.saveTabInfo(tabId, tabInfo);
  }

  async persist(): Promise<void> {}
}

export const debounce = function <T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return ((...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}
