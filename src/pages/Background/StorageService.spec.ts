import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from './StorageService';

const mockGet = vi.fn();
const mockSet = vi.fn();
const mockRemove = vi.fn();

global.chrome = {
  storage: {
    local: {
      get: mockGet,
      set: mockSet,
      remove: mockRemove,
    },
  },
} as any;

describe('StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadTabInfo', () => {
    it('returns tabInfo from storage', async () => {
      mockGet.mockResolvedValue({ tab_info_1: { f: {} } });
      const result = await StorageService.loadTabInfo(1);
      expect(result).toEqual({ f: {} });
      expect(mockGet).toHaveBeenCalledWith(['tab_info_1']);
    });

    it('returns empty object when no tabInfo', async () => {
      mockGet.mockResolvedValue({});
      const result = await StorageService.loadTabInfo(1);
      expect(result).toEqual({});
    });
  });

  describe('saveTabInfo', () => {
    it('saves tabInfo to storage', async () => {
      mockSet.mockResolvedValue(undefined);
      const data = { top: {} };
      await StorageService.saveTabInfo(1, data);
      expect(mockSet).toHaveBeenCalledWith({ tab_info_1: data });
    });
  });

  describe('deleteTabInfo', () => {
    it('removes tab from storage', async () => {
      mockRemove.mockResolvedValue(undefined);
      await StorageService.deleteTabInfo(1);
      expect(mockRemove).toHaveBeenCalledWith(['tab_info_1']);
    });
  });
});
