import React, { createContext, useEffect, useState, useCallback } from 'react';
import { ITabInfo, ITabInfos } from '../../Background/background';
import { getTabId } from '../../Popup/utils';

const InspectedPageContext = createContext<ITabInfo | undefined>(undefined);

interface ChromeStorageProviderProps {
  children: React.ReactNode;
}

export const InspectedPageContextProvider = ({ children }: ChromeStorageProviderProps) => {
  const [pageContext, setPageContext] = useState<ITabInfo>({});
  const [downloading, setDownloading] = useState<'true' | 'false' | 'error'>('false');
  const [syncState, setSyncState] = useState<string>('');

  const fetchEvents = useCallback(async (tabInfos: ITabInfos) => {
    const tabId = await getTabId();
    const prebids = tabInfos[tabId]?.prebids;
    if (prebids) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [_namespace, prebid] of Object.entries(prebids)) {
        setSyncState(`try to download Events from ${prebid.eventsUrl}`);
        try {
          setDownloading('true');

          setSyncState(`downloading ${prebid.eventsUrl}`);
          const response = await fetch(prebid.eventsUrl);

          setSyncState(`get JSON from response stream`);
          prebid.events = await response.json();

          setDownloading('false');
          setSyncState(null);
        } catch (error) {
          setSyncState(`error during download of ${prebid.eventsUrl}`);
          setDownloading('error');
          // write error to chrome.storage.local in order to trigger a rerun of the fetch
          chrome.storage.local.set({ error: prebid.eventsUrl });
          prebid.events = [];
        }
      }
    }
    return { ...tabInfos[tabId] };
  }, []);

  useEffect(() => {
    // Read initial value from chrome.storage.local
    chrome.storage.local.get(['tabInfos'], async ({ tabInfos }) => {
      if (!tabInfos) return;
      const tabInfoWithEvents = await fetchEvents(tabInfos);
      setPageContext(tabInfoWithEvents);
    });
  }, [fetchEvents]);

  useEffect(() => {
    // Subscribe to changes in local storage
    const handler = async (changes: any, areaName: 'sync' | 'local' | 'managed') => {
      if (areaName === 'local' && changes.tabInfos && changes) {
        const tabInfoWithEvents = await fetchEvents({ ...changes.tabInfos.newValue });
        setPageContext(tabInfoWithEvents);
      }
      if (areaName === 'local' && changes.newValue?.error !== undefined) {
        const url = changes.newValue.error;
        console.log('error', url);
        console.log('delete error', changes.newValue);
        delete changes.newValue.error;
        console.log('new value', changes.newValue);
        chrome.storage.local.set(changes.newValue);
      }
    };
    chrome.storage.onChanged.addListener(handler);

    // Unsubscribe when component unmounts
    return () => {
      chrome.storage.onChanged.removeListener(handler);
    };
  }, [fetchEvents]);

  const contextValue: ITabInfo = { ...pageContext, downloading, syncState };

  return <InspectedPageContext.Provider value={contextValue}>{children}</InspectedPageContext.Provider>;
};

export default InspectedPageContext;
