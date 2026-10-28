import { getTabId, sendChromeTabsMessage } from '../../Shared/utils';
import { DOWNLOAD_FAILED } from '../constants';

const safelyConstructURL = (url: string) => {
  try {
    const urlObj = new URL(url.replace('blob:', ''));
    return urlObj;
  } catch (error) {
    return {} as URL;
  }
};

// The inspected tab in the DevTools panel, the active tab in the popup. In the panel the active tab of the
// current window may be another tab, or none when DevTools is undocked.
const getCurrentTabURL = async (): Promise<URL> => {
  const tabId = await getTabId();
  return new Promise((resolve) => {
    chrome.tabs.get(tabId, (tab) => resolve(safelyConstructURL(tab?.url)));
  });
};

export const fetchEvents = async (tabInfo: IFrameInfos, setDownloading: React.Dispatch<React.SetStateAction<'true' | 'false' | 'error'>>, setSyncInfo: React.Dispatch<React.SetStateAction<string | null>>) => {
  if (!tabInfo) return {};

  for (const frameId of Object.keys(tabInfo)) {
    const { prebids } = tabInfo[frameId];
    if (!prebids) continue;
    for (const [namespace, prebid] of Object.entries(prebids)) {
      if (!prebid?.eventsUrl) continue;
      const { hostname: eventsURLHost } = safelyConstructURL(prebid.eventsUrl);
      const { hostname: currentTabURLHost } = frameId === 'top-window' ? await getCurrentTabURL() : safelyConstructURL(frameId);
      if (eventsURLHost !== currentTabURLHost) continue;

      setSyncInfo(`try to download Events from ${prebid.eventsUrl}`);
      setDownloading('true');
      try {
        setSyncInfo(`${namespace}: downloading ${prebid.eventsUrl}`);
        const response = await fetch(prebid.eventsUrl);
        setSyncInfo(`${namespace}: get JSON from response stream`);
        prebid.events = await response.json();
        setDownloading('false');
        setSyncInfo(null);
      } catch (error) {
        sendChromeTabsMessage(DOWNLOAD_FAILED, { eventsUrl: prebid.eventsUrl });
        setSyncInfo(`${namespace}: error during download of ${prebid.eventsUrl}`);
        setDownloading('error');
        delete tabInfo[frameId].prebids[namespace];
        if (Object.keys(tabInfo[frameId].prebids).length === 0) {
          delete tabInfo[frameId];
        }
      }
    }
  }
  return { ...tabInfo };
};
