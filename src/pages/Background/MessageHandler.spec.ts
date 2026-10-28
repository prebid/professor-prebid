import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageHandler } from './MessageHandler';

import { EVENTS } from '../Shared/constants';

vi.mock('./TabContextService');

describe('MessageHandler', () => {
  let handler: MessageHandler;
  let mockTabContextService: any;
  let mockUpdateBadge: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTabContextService = {
      getTabInfo: vi.fn().mockResolvedValue({}),
      saveTabInfo: vi.fn().mockResolvedValue(undefined),
    };
    mockTabContextService.updateTabInfo = vi.fn(async (tabId: number, mutate: (tabInfo: any) => void) => {
      const tabInfo = await mockTabContextService.getTabInfo(tabId);
      mutate(tabInfo);
      await mockTabContextService.saveTabInfo(tabId, tabInfo);
    });
    mockUpdateBadge = vi.fn();
    handler = new MessageHandler(mockTabContextService, mockUpdateBadge);
  });

  it('ignores messages without tabId', async () => {
    await handler.handle({ type: EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND, payload: { frameId: 'f1', namespace: 'pbjs' } as any }, { tab: {} } as any);
    expect(mockTabContextService.getTabInfo).not.toHaveBeenCalled();
  });

  it('ignores messages without type', async () => {
    await handler.handle({ type: '', payload: { something: true } as any }, { tab: { id: 1 } } as any);
    expect(mockTabContextService.getTabInfo).not.toHaveBeenCalled();
  });

  it('ignores messages with empty payload', async () => {
    await handler.handle({ type: EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND, payload: {} as any }, { tab: { id: 1 } } as any);
    expect(mockTabContextService.getTabInfo).not.toHaveBeenCalled();
  });

  it('handles SEND_PREBID_DETAILS_TO_BACKGROUND', async () => {
    const payload = { frameId: 'top-window', namespace: 'pbjs', version: '8.0' };
    mockTabContextService.getTabInfo.mockResolvedValue({});

    await handler.handle({ type: EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND, payload: payload as any }, { tab: { id: 1 } } as any);

    expect(mockTabContextService.saveTabInfo).toHaveBeenCalledWith(1, {
      'top-window': {
        prebids: { pbjs: payload },
      },
    });
    expect(mockUpdateBadge).toHaveBeenCalledWith(1);
  });

  it('handles SEND_GAM_DETAILS_TO_BACKGROUND', async () => {
    const payload = { slots: [{ slotId: 'div-1' }] };
    mockTabContextService.getTabInfo.mockResolvedValue({});

    await handler.handle({ type: EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND, payload: payload as any }, { tab: { id: 2 } } as any);

    expect(mockTabContextService.saveTabInfo).toHaveBeenCalledWith(2, {
      'top-window': {
        googleAdManager: payload,
      },
    });
    expect(mockUpdateBadge).toHaveBeenCalledWith(2);
  });

  it('stores TCF v2 details, in the shape tcf.ts sends, on the top window', async () => {
    const payload = { v2: { cmpLoaded: true, gdprApplies: true, consentData: 'CPXxRfAPXxRfAAfKABENB-CgAAAAAAAAAAYgAAAAAAAA' } };
    mockTabContextService.getTabInfo.mockResolvedValue({ 'top-window': { url: 'https://example.com' } });

    await handler.handle({ type: EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND, payload: payload as any }, { tab: { id: 3 } } as any);

    expect(mockTabContextService.saveTabInfo).toHaveBeenCalledWith(3, {
      'top-window': { url: 'https://example.com', tcf: payload },
    });
    expect(mockUpdateBadge).toHaveBeenCalledWith(3);
  });

  it('stores TCF v1 details', async () => {
    const payload = { v1: { cmpLoaded: true, gdprApplies: false, consentData: 'BOxyz' } };

    await handler.handle({ type: EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND, payload: payload as any }, { tab: { id: 3 } } as any);

    expect(mockTabContextService.saveTabInfo.mock.calls[0][1]['top-window'].tcf).toEqual(payload);
  });

  it('ignores GAM and TCF details sent from a subframe', async () => {
    await handler.handle({ type: EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND, payload: { slots: [] } as any }, { tab: { id: 4 }, frameId: 7 } as any);
    await handler.handle({ type: EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND, payload: { v2: { cmpLoaded: true } } as any }, { tab: { id: 4 }, frameId: 7 } as any);

    expect(mockTabContextService.saveTabInfo).not.toHaveBeenCalled();
  });

  it('still stores Prebid details sent from a subframe under their own frame id', async () => {
    const payload = { frameId: 'https://widget.example/-abc', namespace: 'pbjs' };
    mockTabContextService.getTabInfo.mockResolvedValue({});

    await handler.handle({ type: EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND, payload: payload as any }, { tab: { id: 4 }, frameId: 7 } as any);

    expect(mockTabContextService.saveTabInfo).toHaveBeenCalledWith(4, { [payload.frameId]: { prebids: { pbjs: payload } } });
  });

  it('ignores TCF messages that have neither v1 nor v2 details', async () => {
    await handler.handle({ type: EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND, payload: { other: {} } as any }, { tab: { id: 3 } } as any);

    expect(mockTabContextService.saveTabInfo).toHaveBeenCalledWith(3, {});
  });

  it('preserves existing tab data when adding new data', async () => {
    const existingTabInfo = {
      'top-window': { url: 'https://example.com', prebids: { pbjs: {} } },
    };
    mockTabContextService.getTabInfo.mockResolvedValue(existingTabInfo);

    const gamPayload = { slots: [{ slotId: 'div-1' }] };
    await handler.handle({ type: EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND, payload: gamPayload as any }, { tab: { id: 1 } } as any);

    const savedData = mockTabContextService.saveTabInfo.mock.calls[0][1];

    expect(savedData['top-window'].prebids).toEqual({ pbjs: {} });

    expect(savedData['top-window'].googleAdManager).toEqual(gamPayload);
  });
});
