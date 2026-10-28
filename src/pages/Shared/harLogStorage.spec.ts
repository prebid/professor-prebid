import { describe, it, expect, vi, beforeEach } from 'vitest';
import { harChunkIdFromKey, harChunkKey, parseStoredArray, removeStoredHarLog, sessionStorageKeys } from './harLogStorage';
import { preAuctionHarKey } from './constants';

describe('harLogStorage', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    global.chrome = {
      storage: {
        session: {
          get: vi.fn(async () => ({ ...store })),
          remove: vi.fn(async (keys: string[]) => keys.forEach((key) => delete store[key])),
        },
      },
    } as any;
  });

  it('reads the chunk id only from the chunk keys of the given tab', () => {
    expect(harChunkIdFromKey(12, harChunkKey(12, 3))).toBe(3);
    expect(harChunkIdFromKey(12, preAuctionHarKey(12))).toBeNull();
    // Tab 123's keys share the "preAuctionHar_12" prefix but are not tab 12's.
    expect(harChunkIdFromKey(12, preAuctionHarKey(123))).toBeNull();
    expect(harChunkIdFromKey(12, harChunkKey(123, 3))).toBeNull();
    expect(harChunkIdFromKey(12, `${preAuctionHarKey(12)}_x`)).toBeNull();
  });

  it('parses stored arrays and falls back to [] for anything else', () => {
    expect(parseStoredArray('[1,2]')).toEqual([1, 2]);
    expect(parseStoredArray(undefined)).toEqual([]);
    expect(parseStoredArray('not-json')).toEqual([]);
    expect(parseStoredArray('{"a":1}')).toEqual([]);
  });

  it('lists session keys with getKeys when the browser has it, without loading the values', async () => {
    store = { a: '1', b: '2' };
    (chrome.storage.session as any).getKeys = vi.fn(async () => Object.keys(store));

    expect(await sessionStorageKeys()).toEqual(['a', 'b']);
    expect(chrome.storage.session.get).not.toHaveBeenCalled();
  });

  it("removes the index and every chunk of one tab's log, and nothing else", async () => {
    store = {
      [preAuctionHarKey(12)]: '[0,1]',
      [harChunkKey(12, 0)]: '[]',
      [harChunkKey(12, 1)]: '[]',
      [preAuctionHarKey(123)]: '[0]',
      [harChunkKey(123, 0)]: '[]',
      other: 'keep',
    };

    await removeStoredHarLog(12);

    expect(Object.keys(store).sort()).toEqual([harChunkKey(123, 0), preAuctionHarKey(123), 'other'].sort());
  });
});
