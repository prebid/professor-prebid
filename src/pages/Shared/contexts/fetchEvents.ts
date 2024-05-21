import { getTabId, sendChromeTabsMessage } from '../../Shared/utils';
import { DOWNLOAD_FAILED } from '../constants';
import { ITabInfos } from '../../Background/background';
import { IPrebidDetails } from '../../Content/scripts/prebid';

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

export const fetchEvents = async (
  tabInfos: ITabInfos,
  setDownloading: React.Dispatch<React.SetStateAction<'true' | 'false' | 'error'>>,
  setSyncInfo: React.Dispatch<React.SetStateAction<string | null>>,
  downloadingUrls: string[]
) => {
  const tabId = await getTabId();
  const prebids = tabInfos[tabId]?.prebids;
  if (!prebids) return;
  for (const [namespace, prebid] of Object.entries(prebids)) {
    //  would be better if not written to ls from wrong domain in the first place
    const { hostname: eventsURLHost } = safelyConstructURL(prebid.eventsUrl);
    const { hostname: currentTabURLHost } = await getCurrentTabURL();
    if (eventsURLHost !== currentTabURLHost) continue;
    // END

    setSyncInfo(`try to download Events from ${prebid.eventsUrl}`);
    setDownloading('true');
    try {
      if (prebid && prebid.eventsUrl in downloadingUrls) {
        // skip download if already downloading or from another domain or prebid is undefined
      } else {
        setSyncInfo(`${namespace}: downloading ${prebid.eventsUrl}`);
        const response = await fetch(prebid.eventsUrl);

        setSyncInfo(`${namespace}: get JSON from response stream`);
        if (prebid.iframeId === null) {
          prebid.events = prebid.events || [];
          prebid.events = await response.json();
        } else {
          prebid.iframes = prebid.iframes || {};
          prebid.iframes[prebid.iframeId] = prebid.iframes[prebid.iframeId] || ({} as IPrebidDetails);
          prebid.iframes[prebid.iframeId].events = prebid.iframes[prebid.iframeId].events || [];
          prebid.iframes[prebid.iframeId].events = await response.json();
        }
        setDownloading('false');
        setSyncInfo(null);
      }
    } catch (error) {
      sendChromeTabsMessage(DOWNLOAD_FAILED, { eventsUrl: prebid.eventsUrl });
      setSyncInfo(`${namespace}: error during download of ${prebid.eventsUrl}`);
      setDownloading('error');
      // console.error(error);
    }
  }
  return { ...tabInfos[tabId] };
};
