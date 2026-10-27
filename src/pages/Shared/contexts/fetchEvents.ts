import { sendChromeTabsMessage } from '../../Shared/utils';
import { DOWNLOAD_FAILED } from '../constants';

const safelyConstructURL = (url: string) => {
  try {
    const urlObj = new URL(url.replace('blob:', ''));
    return urlObj;
  } catch (error) {
    return {} as URL;
  }
};

const getCurrentTabURL = async (): Promise<URL> => {
  return new Promise((resolve) => {
    chrome.tabs.query(
      {
        active: true,
        windowId: chrome.windows.WINDOW_ID_CURRENT,
      },
      (tabs) => {
        const activeTab = tabs[0];
        const urlObj = safelyConstructURL(activeTab?.url);
        resolve(urlObj);
      }
    );
  });
};

export const fetchEvents = async (tabInfo: IFrameInfos, setDownloading: React.Dispatch<React.SetStateAction<'true' | 'false' | 'error'>>, setSyncInfo: React.Dispatch<React.SetStateAction<string | null>>, downloadingUrls: string[]) => {
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
        if (prebid && (downloadingUrls.includes(prebid.eventsUrl) || prebid.eventsUrl in downloadingUrls)) {
          // skip download if already downloading or from another domain or prebid is undefined
        } else {
          setSyncInfo(`${namespace}: downloading ${prebid.eventsUrl}`);
          const response = await fetch(prebid.eventsUrl);
          setSyncInfo(`${namespace}: get JSON from response stream`);
          prebid.events = prebid.events || [];
          prebid.events = await response.json();
          setDownloading('false');
          setSyncInfo(null);
        }
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
