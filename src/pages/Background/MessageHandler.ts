import { IGoogleAdManagerDetails } from '../Injected/googleAdManager';
import { IPrebidDetails } from '../Injected/prebid';
import { ITcfDetails } from '../Injected/tcf';
import { EVENTS } from '../Shared/constants';
import { TabContextService } from './TabContextService';

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
      } else if (type === EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND && this.isPrebidDetails(payload)) {
        const { frameId, namespace } = payload;
        tabInfo[frameId] = tabInfo[frameId] || {};
        tabInfo[frameId]['prebids'] = tabInfo[frameId]['prebids'] || {};
        (tabInfo[frameId]['prebids'] as Record<string, IPrebidDetails>)[namespace] = payload;
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

  private isGoogleAdManagerDetails(payload: any): payload is IGoogleAdManagerDetails {
    return payload && typeof payload === 'object' && 'slots' in payload;
  }

  private isTcfDetails(payload: any): payload is ITcfDetails {
    // tcf.ts sends { v1: {...} } or { v2: {...} }.
    return payload && typeof payload === 'object' && ('v1' in payload || 'v2' in payload);
  }
}
