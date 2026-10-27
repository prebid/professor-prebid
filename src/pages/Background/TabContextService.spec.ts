import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TabContextService, debounce } from './TabContextService';
import { StorageService } from './StorageService';

describe('TabContextService', () => {
  let service: TabContextService;

  beforeEach(() => {
    vi.clearAllMocks();
    global.chrome = {
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn().mockResolvedValue(undefined),
          remove: vi.fn().mockResolvedValue(undefined),
        },
      },
    } as any;
    service = new TabContextService();
  });

  describe('getTabInfo', () => {
    it('returns tab info from storage', async () => {
      const mockData = { 'top-window': { url: 'https://example.com' } };
      vi.spyOn(StorageService, 'loadTabInfo').mockResolvedValue(mockData as any);

      const result = await service.getTabInfo(1);
      expect(result).toEqual(mockData);
      expect(StorageService.loadTabInfo).toHaveBeenCalledWith(1);
    });

    it('returns empty object when no data', async () => {
      vi.spyOn(StorageService, 'loadTabInfo').mockResolvedValue({});
      const result = await service.getTabInfo(1);
      expect(result).toEqual({});
    });
  });

  describe('getOrCreateTabInfo', () => {
    it('returns existing tab info', async () => {
      const existing = { 'top-window': { url: 'test' } };
      vi.spyOn(StorageService, 'loadTabInfo').mockResolvedValue(existing as any);

      const result = await service.getOrCreateTabInfo(1);
      expect(result).toEqual({ 'top-window': { url: 'test' } });
    });
  });

  describe('deleteTabInfo', () => {
    it('delegates to StorageService', async () => {
      const spy = vi.spyOn(StorageService, 'deleteTabInfo').mockResolvedValue(undefined);
      await service.deleteTabInfo(1);
      expect(spy).toHaveBeenCalledWith(1);
    });
  });

  describe('saveTabInfo', () => {
    it('delegates to StorageService', async () => {
      const spy = vi.spyOn(StorageService, 'saveTabInfo').mockResolvedValue(undefined);
      const data = { frame: {} };
      await service.saveTabInfo(1, data as any);
      expect(spy).toHaveBeenCalledWith(1, data);
    });
  });

  describe('updateTabInfo', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    // Async fake of chrome.storage.local so concurrent read-modify-writes actually interleave.
    const useAsyncStorage = () => {
      const store: Record<string, any> = {};
      global.chrome.storage.local.get = vi.fn(async (keys: string[]) => {
        await new Promise((r) => setTimeout(r, 0));
        return Object.fromEntries(keys.filter((k) => k in store).map((k) => [k, structuredClone(store[k])]));
      }) as any;
      global.chrome.storage.local.set = vi.fn(async (items: Record<string, any>) => {
        await new Promise((r) => setTimeout(r, 0));
        Object.assign(store, structuredClone(items));
      }) as any;
      return store;
    };

    it('keeps every change when updates for the same tab run concurrently', async () => {
      const store = useAsyncStorage();
      await Promise.all([
        service.updateTabInfo(1, (info) => {
          info['top-window'] = { ...info['top-window'], prebids: { pbjs: {} } } as any;
        }),
        service.updateTabInfo(1, (info) => {
          info['top-window'] = { ...info['top-window'], googleAdManager: { slots: [] } } as any;
        }),
        service.updateTabInfo(1, (info) => {
          info['tcf'] = { tcf: {} } as any;
        }),
      ]);
      expect(store['tab_info_1']).toEqual({ 'top-window': { prebids: { pbjs: {} }, googleAdManager: { slots: [] } }, tcf: { tcf: {} } });
    });

    it('applies an update queued after a reset on top of the reset', async () => {
      const store = useAsyncStorage();
      store['tab_info_1'] = { 'top-window': { url: 'https://old.example' }, tcf: { tcf: {} } };
      await Promise.all([
        service.saveTabInfo(1, { 'top-window': { url: 'https://new.example' } } as any),
        service.updateTabInfo(1, (info) => {
          info['top-window'] = { ...info['top-window'], googleAdManager: { slots: [] } } as any;
        }),
      ]);
      expect(store['tab_info_1']).toEqual({ 'top-window': { url: 'https://new.example', googleAdManager: { slots: [] } } });
    });

    it('keeps processing after a failed update', async () => {
      const store = useAsyncStorage();
      await expect(
        service.updateTabInfo(1, () => {
          throw new Error('boom');
        })
      ).rejects.toThrow('boom');
      await service.updateTabInfo(1, (info) => {
        info['tcf'] = { tcf: {} } as any;
      });
      expect(store['tab_info_1']).toEqual({ tcf: { tcf: {} } });
    });
  });

  describe('load', () => {
    it('is a no-op that resolves', async () => {
      await expect(service.load()).resolves.toBeUndefined();
    });
  });

  describe('persist', () => {
    it('is a no-op', async () => {
      const spy = vi.spyOn(StorageService, 'saveTabInfo');
      await service.persist();
      expect(spy).not.toHaveBeenCalled();
    });
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces function execution and clears existing timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('first');
    expect(fn).not.toHaveBeenCalled();

    debounced('second');
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('second');
  });
});
