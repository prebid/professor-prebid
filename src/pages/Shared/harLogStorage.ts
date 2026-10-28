import { preAuctionHarKey } from './constants';

/**
 * A tab's network log lives in chrome.storage.session in chunks, so a write touches only the chunks that changed
 * rather than the whole log:
 * - preAuctionHarKey(tabId) holds the JSON array of chunk ids in log order. '[]' means the panel cleared the log;
 *   a missing key means it was reset for a new page.
 * - harChunkKey(tabId, id) holds the JSON array of that chunk's entries.
 */
export const HAR_CHUNK_SIZE = 50;

export const harChunkKey = (tabId: number, chunkId: number) => `${preAuctionHarKey(tabId)}_${chunkId}`;

/** The chunk id in `key` when it is one of tabId's chunk keys, otherwise null. */
export const harChunkIdFromKey = (tabId: number, key: string): number | null => {
  const prefix = `${preAuctionHarKey(tabId)}_`;
  if (!key.startsWith(prefix)) return null;
  const id = Number(key.slice(prefix.length));
  return Number.isInteger(id) ? id : null;
};

/** A stored JSON array, or [] when the value is missing or not a JSON array. */
export const parseStoredArray = <T>(raw: unknown): T[] => {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

/** All key names in chrome.storage.session, without loading their values where getKeys (Chrome 130+) exists. */
export const sessionStorageKeys = async (): Promise<string[]> => {
  const session = chrome.storage.session as typeof chrome.storage.session & { getKeys?: () => Promise<string[]> };
  if (typeof session.getKeys === 'function') return session.getKeys();
  return Object.keys((await session.get()) || {});
};

/** Removes tabId's whole log: the index and every chunk. */
export const removeStoredHarLog = async (tabId: number): Promise<void> => {
  if (!chrome.storage?.session) return;
  const indexKey = preAuctionHarKey(tabId);
  const keys = (await sessionStorageKeys()).filter((key) => key === indexKey || harChunkIdFromKey(tabId, key) !== null);
  if (keys.length > 0) await chrome.storage.session.remove(keys);
};
