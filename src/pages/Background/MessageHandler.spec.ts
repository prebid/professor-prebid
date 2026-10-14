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

  it('handles SEND_TCF_DETAILS_TO_BACKGROUND', async () => {
    const payload = { tcf: { cmpId: 10, cmpVersion: 2 } };
    mockTabContextService.getTabInfo.mockResolvedValue({});

    await handler.handle({ type: EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND, payload: payload as any }, { tab: { id: 3 } } as any);

    expect(mockTabContextService.saveTabInfo).toHaveBeenCalledWith(3, {
      tcf: payload,
    });
    expect(mockUpdateBadge).toHaveBeenCalledWith(3);
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
