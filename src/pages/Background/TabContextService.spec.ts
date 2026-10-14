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
