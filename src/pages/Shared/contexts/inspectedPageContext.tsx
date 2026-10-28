import React, { createContext, useEffect, useState } from 'react';
import { getTabId } from '../utils';
import { useDebounce } from '../hooks/useDebounce';
import { fetchEvents } from './fetchEvents';
import { preAuctionHarKey } from '../constants';
import { harChunkIdFromKey, harChunkKey, parseStoredArray } from '../harLogStorage';
import { IHarEntry } from '../components/preAuction/harCorrelation';

const InspectedPageContext = createContext<IPageContext | undefined>(undefined);

interface ChromeStorageProviderProps {
  children: React.ReactNode;
}
export const InspectedPageContextProvider = ({ children }: ChromeStorageProviderProps) => {
  const [frames, setFrames] = useState<{ [key: string]: IFrameInfo }>({});
  const [downloading, setDownloading] = useState<'true' | 'false' | 'error'>('false');
  const [syncInfo, setSyncInfo] = useState<string>('');

  const [harLogData, setHarLogData] = useState<IHarEntry[]>([]);
  const harLog = useDebounce(harLogData, 1000);

  useEffect(() => {
    getTabId().then((tabId) => {
      const key = `tab_info_${tabId}`;
      chrome.storage.local.get([key], async (res) => {
        const tabInfo = res[key];
        if (tabInfo) {
          const tabInfoWithEvents = await fetchEvents(tabInfo, setDownloading, setSyncInfo);
          setFrames(tabInfoWithEvents);
        }
      });
    });
  }, []);

  useEffect(() => {
    // Subscribe to changes in local storage
    const handler = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: 'local' | 'sync' | 'managed' | 'session') => {
      if (areaName === 'local') {
        getTabId().then((tabId) => {
          const key = `tab_info_${tabId}`;
          if (changes[key]) {
            if (JSON.stringify(changes[key].newValue) !== JSON.stringify(changes[key].oldValue)) {
              fetchEvents(changes[key].newValue || {}, setDownloading, setSyncInfo).then(setFrames);
            }
          }
        });
      }
    };
    chrome.storage.onChanged.addListener(handler);

    // Unsubscribe when component unmounts
    return () => {
      chrome.storage.onChanged.removeListener(handler);
    };
  }, []);

  useEffect(() => {
    // The log is stored in chunks (see harLogStorage); keep each parsed chunk and re-parse only those that change.
    let tabId: number | undefined;
    let chunkIds: number[] = [];
    let indexChanged = false; // once a change arrived, the initial read is stale
    const chunkEntries = new Map<number, IHarEntry[]>();
    const publish = () => setHarLogData(chunkIds.flatMap((id) => chunkEntries.get(id) || []));
    const readChunkIds = (raw: unknown) => parseStoredArray<number>(raw).filter(Number.isInteger);

    getTabId().then((id) => {
      if (id === undefined) return;
      tabId = id;
      const indexKey = preAuctionHarKey(id);
      chrome.storage?.session?.get(indexKey, (index) => {
        const ids = readChunkIds(index?.[indexKey]);
        if (ids.length === 0) return;
        chrome.storage.session.get(
          ids.map((chunkId) => harChunkKey(id, chunkId)),
          (stored) => {
            if (indexChanged) return;
            ids.forEach((chunkId) => chunkEntries.set(chunkId, parseStoredArray<IHarEntry>(stored?.[harChunkKey(id, chunkId)])));
            chunkIds = ids;
            publish();
          }
        );
      });
    });

    const handler = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: 'local' | 'sync' | 'managed' | 'session') => {
      if (areaName !== 'session' || tabId === undefined) return;
      let changed = false;
      Object.entries(changes).forEach(([key, change]) => {
        if (key === preAuctionHarKey(tabId)) {
          // A removed index means the log was reset for a new page, '[]' that the panel cleared it.
          chunkIds = readChunkIds(change.newValue);
          indexChanged = true;
          changed = true;
          return;
        }
        const chunkId = harChunkIdFromKey(tabId, key);
        if (chunkId === null) return;
        if (change.newValue === undefined) chunkEntries.delete(chunkId);
        else chunkEntries.set(chunkId, parseStoredArray<IHarEntry>(change.newValue));
        changed = true;
      });
      if (changed) publish();
    };
    chrome.storage.onChanged.addListener(handler);

    return () => {
      chrome.storage.onChanged.removeListener(handler);
    };
  }, []);

  const contextValue: IPageContext = {
    frames,
    downloading,
    syncState: syncInfo,
    harLog,
  };

  return <InspectedPageContext.Provider value={contextValue}>{children}</InspectedPageContext.Provider>;
};

export default InspectedPageContext;

export interface IPageContext {
  frames: { [key: string]: IFrameInfo };
  downloading: string;
  syncState: string;
  harLog: IHarEntry[];
}
