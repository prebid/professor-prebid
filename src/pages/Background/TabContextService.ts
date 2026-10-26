import { StorageService } from './StorageService';

export class TabContextService {
  // Per-tab chain of pending storage operations. Every write goes through it so a read-modify-write never interleaves with another one for the same tab.
  private queues = new Map<number, Promise<unknown>>();

  private enqueue<T>(tabId: number, op: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(tabId) || Promise.resolve();
    const next = previous.catch(() => {}).then(op);
    this.queues.set(tabId, next);
    next
      .finally(() => {
        if (this.queues.get(tabId) === next) this.queues.delete(tabId);
      })
      .catch(() => {});
    return next;
  }

  async load(): Promise<void> {}

  async getTabInfo(tabId: number): Promise<IFrameInfos> {
    return await StorageService.loadTabInfo(tabId);
  }

  async getOrCreateTabInfo(tabId: number): Promise<IFrameInfos> {
    return await StorageService.loadTabInfo(tabId);
  }

  async deleteTabInfo(tabId: number): Promise<void> {
    await this.enqueue(tabId, () => StorageService.deleteTabInfo(tabId));
  }

  async saveTabInfo(tabId: number, tabInfo: IFrameInfos): Promise<void> {
    await this.enqueue(tabId, () => StorageService.saveTabInfo(tabId, tabInfo));
  }

  async updateTabInfo(tabId: number, mutate: (tabInfo: IFrameInfos) => void): Promise<void> {
    await this.enqueue(tabId, async () => {
      const tabInfo = await StorageService.loadTabInfo(tabId);
      mutate(tabInfo);
      await StorageService.saveTabInfo(tabId, tabInfo);
    });
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
