import { IGoogleAdManagerDetails } from '../Injected/googleAdManager';
import { IPrebidDetails } from '../Injected/prebid';
import { ITcfDetails } from '../Injected/tcf';
import { EVENTS } from '../Shared/constants';
import { isUnsafeKey } from '../Shared/utils';
import { TabContextService } from './TabContextService';

// Frame ids are unique per document load, so an iframe that keeps reloading would add entries for as long as the tab lives.
const MAX_SUBFRAMES = 30;

const originOf = (url: unknown): string | undefined => {
  try {
    return new URL(url as string).origin;
  } catch {
    return undefined;
  }
};

const senderOrigin = (sender: chrome.runtime.MessageSender): string | undefined => sender.origin ?? originOf(sender.url);

export class MessageHandler {
  constructor(private tabContextService: TabContextService, private updateBadge: (tabId: number | undefined) => void) {}

  handle = async (message: { type: string; payload: IGoogleAdManagerDetails | IPrebidDetails | ITcfDetails }, sender: chrome.runtime.MessageSender) => {
    const { type, payload } = message;
    const tabId = sender.tab?.id;
    if (!tabId || !type || !payload || Object.keys(payload).length === 0) return;
    // GAM and TCF details carry no frame id and are stored on the top window, so a subframe's
    // (e.g. a cross-origin widget running its own GPT or CMP) must not overwrite the page's.
    const fromSubframe = (sender.frameId ?? 0) !== 0;
    if (fromSubframe && (type === EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND || type === EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND)) return;

    await this.tabContextService.updateTabInfo(tabId, (tabInfo) => {
      if (type === EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND && this.isGoogleAdManagerDetails(payload)) {
        tabInfo['top-window'] = tabInfo['top-window'] || {};
        tabInfo['top-window']['googleAdManager'] = payload;
      } else if (type === EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND && this.isPrebidDetails(payload) && this.isTrustworthyPrebidDetails(payload, sender, fromSubframe)) {
        const { frameId, namespace } = payload;
        tabInfo[frameId] = tabInfo[frameId] || {};
        tabInfo[frameId]['prebids'] = tabInfo[frameId]['prebids'] || {};
        (tabInfo[frameId]['prebids'] as Record<string, IPrebidDetails>)[namespace] = payload;
        const subframes = Object.keys(tabInfo).filter((key) => key !== 'top-window' && key !== frameId);
        subframes.slice(0, Math.max(0, subframes.length + 1 - MAX_SUBFRAMES)).forEach((key) => delete tabInfo[key]);
      } else if (type === EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND && this.isTcfDetails(payload)) {
        // Like GAM details, TCF details carry no frame id; the panel reads them from the frame's info.
        tabInfo['top-window'] = tabInfo['top-window'] || {};
        tabInfo['top-window']['tcf'] = payload;
      }
    });

    this.updateBadge(tabId);
  };

  private isPrebidDetails(payload: any): payload is IPrebidDetails {
    return payload && typeof payload === 'object' && 'frameId' in payload && 'namespace' in payload;
  }

  // The payload is relayed from the page through DOM events, so any script in the frame can forge it.
  // Check what it claims against what Chrome reports about the sender.
  private isTrustworthyPrebidDetails(payload: IPrebidDetails, sender: chrome.runtime.MessageSender, fromSubframe: boolean): boolean {
    const { frameId, namespace, eventsUrl } = payload;
    if (typeof frameId !== 'string' || !frameId || isUnsafeKey(frameId)) return false;
    if (typeof namespace !== 'string' || !namespace || isUnsafeKey(namespace)) return false;
    const origin = senderOrigin(sender);
    // A subframe's content script only speaks for its own frame, whose id starts with that frame's URL.
    // The top frame also relays its same-origin iframes, so its ids are not restricted.
    if (fromSubframe && (frameId === 'top-window' || !origin || originOf(frameId) !== origin)) return false;
    // The events log is a blob created by the sending document; anything else would have the popup fetch a URL of the page's choosing.
    if (eventsUrl) {
      if (typeof eventsUrl !== 'string' || !eventsUrl.startsWith('blob:') || !origin || originOf(eventsUrl) !== origin) return false;
    }
    return true;
  }

  private isGoogleAdManagerDetails(payload: any): payload is IGoogleAdManagerDetails {
    return payload && typeof payload === 'object' && 'slots' in payload;
  }

  private isTcfDetails(payload: any): payload is ITcfDetails {
    // tcf.ts sends { v1: {...} } or { v2: {...} }.
    return payload && typeof payload === 'object' && ('v1' in payload || 'v2' in payload);
  }
}
