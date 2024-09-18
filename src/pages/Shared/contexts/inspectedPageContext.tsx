import React, { createContext, useEffect, useState } from 'react';
import { IFrameInfo, initReqChainResult } from '../../Background';
import { getTabId } from '../utils';
import { useDebounce } from '../hooks/useDebounce';
import { fetchEvents } from './fetchEvents';

const InspectedPageContext = createContext<IPageContext | undefined>(undefined);

interface ChromeStorageProviderProps {
  children: React.ReactNode;
}
export const InspectedPageContextProvider = ({ children }: ChromeStorageProviderProps) => {
  const [frames, setFrames] = useState<{ [key: string]: IFrameInfo }>({});
  const [downloading, setDownloading] = useState<'true' | 'false' | 'error'>('false');
  const [syncInfo, setSyncInfo] = useState<string>('');
  const [initReqChainData, setInitReqChainData] = useState<initReqChainResult>({});
  const initReqChainResult = useDebounce(initReqChainData, 2000);
  const [downloadingUrls, setDownloadingUrls] = useState<string[]>([]);

  useEffect(() => {
    // Read initial value from chrome.storage.local
    chrome.storage.local.get(['tabInfos'], async ({ tabInfos, url }) => {
      if (tabInfos && url) {
        const tabInfoWithEvents = await fetchEvents(tabInfos, setDownloading, setSyncInfo, []);
        setFrames(tabInfoWithEvents);
      }
    });
  }, []);

  useEffect(() => {
    // Subscribe to changes in local storage
    const handler = async (changes: any, areaName: 'sync' | 'local' | 'managed') => {
      if (areaName === 'local' && changes?.tabInfos) {
        const tabId = await getTabId();
        if (JSON.stringify(changes.tabInfos.newValue[tabId]) !== JSON.stringify(changes.tabInfos.oldValue[tabId])) {
          const tabInfoWithEvents = await fetchEvents(
            { ...changes.tabInfos.newValue, [tabId]: changes.tabInfos.newValue[tabId] },
            setDownloading,
            setSyncInfo,
            downloadingUrls
          );
          setFrames(tabInfoWithEvents);
        }
      }
    };
    chrome.storage.onChanged.addListener(handler);

    // keep only the last 100 urls
    if (downloadingUrls.length > 100) {
      setDownloadingUrls(downloadingUrls.slice(1));
    }

    // Unsubscribe when component unmounts
    return () => {
      chrome.storage.onChanged.removeListener(handler);
    };
  }, [downloadingUrls]);

  useEffect(() => {
    // Subscribe to changes in local storage
    const handler = async (changes: any, areaName: 'sync' | 'local' | 'managed') => {
      if (areaName === 'local' && changes.initReqChain && changes) {
        setInitReqChainData(JSON.parse(changes.initReqChain.newValue));
      }
    };
    chrome.storage.onChanged.addListener(handler);

    // Unsubscribe when component unmounts
    return () => {
      chrome.storage.onChanged.removeListener(handler);
    };
  }, []);

  const contextValue: IPageContext = {
    frames,
    downloading,
    syncState: syncInfo,
    initReqChainResult,
  };

  return <InspectedPageContext.Provider value={contextValue}>{children}</InspectedPageContext.Provider>;
};

export default InspectedPageContext;

export interface IPageContext {
  frames: { [key: string]: IFrameInfo };
  downloading: string;
  syncState: string;
  initReqChainResult: any;
}
