import React, { createContext, useEffect, useState } from 'react';
import { ITabInfo, initReqChainResult } from '../../Background/background';
import { getTabId } from '../../Shared/utils';
import { useDebounce } from '../hooks/useDebounce';
import { fetchEvents } from './fetchEvents';

const InspectedPageContext = createContext<ITabInfo | undefined>(undefined);

interface ChromeStorageProviderProps {
  children: React.ReactNode;
}

export const InspectedPageContextProvider = ({ children }: ChromeStorageProviderProps) => {
  const [pageContext, setPageContext] = useState<ITabInfo>({});
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
        setPageContext(tabInfoWithEvents);
      }
    });
  }, []);

  useEffect(() => {
    // Subscribe to changes in local storage
    const handler = async (changes: any, areaName: 'sync' | 'local' | 'managed') => {
      if (areaName === 'local' && changes?.tabInfos) {
        const tabId = await getTabId();
        if (JSON.stringify(changes.tabInfos.newValue[tabId]?.prebids) !== JSON.stringify(changes.tabInfos.oldValue[tabId]?.prebids)) {
          const tabInfoWithEvents = await fetchEvents(
            { ...changes.tabInfos.newValue, [tabId]: changes.tabInfos.newValue[tabId] },
            setDownloading,
            setSyncInfo,
            downloadingUrls
          );
          setPageContext(tabInfoWithEvents);
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

  const contextValue: ITabInfo = { ...pageContext, downloading, syncState: syncInfo, initReqChainResult };

  return <InspectedPageContext.Provider value={contextValue}>{children}</InspectedPageContext.Provider>;
};

export default InspectedPageContext;
