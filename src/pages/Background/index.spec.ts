

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IPrebidDetails } from '../Injected/prebid';
import { IGoogleAdManagerDetails } from '../Injected/googleAdManager';
import { ITcfDetails } from '../Injected/tcf';
import { EVENTS } from '../Shared/constants';
import { BadgeService } from './BadgeService';
import { MessageHandler } from './MessageHandler';
import { TabContextService } from './TabContextService';


vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn(async () => ({})),
      set: vi.fn(),
    },
  },
  action: {
    setBadgeBackgroundColor: vi.fn(),
    setBadgeText: vi.fn(),
  },
  runtime: { onMessage: { addListener: vi.fn() } },
  webNavigation: { onBeforeNavigate: { addListener: vi.fn() } },
  tabs: {
    onRemoved: { addListener: vi.fn() },
    onActivated: { addListener: vi.fn() },
    query: vi.fn(() => Promise.resolve([{ id: 123 }])),
  },
  alarms: {
    onAlarm: { addListener: vi.fn() },
    create: vi.fn(),
  },
});

vi.mock('../Shared/utils', () => ({
  getTabId: vi.fn(() => Promise.resolve(123)),
}));

describe('TabContextService', () => {
  let service: TabContextService;

  beforeEach(() => {
    service = new TabContextService();
  });

  it('returns and stores tab info', () => {
    const info = service.getOrCreateTabInfo(1);
    expect(info).toEqual({});
    expect(service.getTabInfos()[1]).toBe(info);
  });

  it('persists via chrome.storage', async () => {
    service.getOrCreateTabInfo(1);
    await service.persist();
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ tabInfos: service.getTabInfos() });
  });
});

describe('MessageHandler', () => {
  let handler: MessageHandler;
  let context: TabContextService;
  const updateBadge = vi.fn();

  beforeEach(() => {
    context = new TabContextService();
    handler = new MessageHandler(context, updateBadge);
  });

  it('handles GAM payload', async () => {
    const payload: IGoogleAdManagerDetails = { slots: [] } as IGoogleAdManagerDetails;
    await handler.handle({ type: EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND, payload }, { tab: { id: 1 } as chrome.tabs.Tab });
    expect(context.getTabInfos()[1]['top-window']?.googleAdManager).toEqual(payload);
  });

  it('handles Prebid payload', async () => {
    const payload: IPrebidDetails = { frameId: 'f1', namespace: 'pbjs' } as any;
    await handler.handle({ type: EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND, payload }, { tab: { id: 2 } as chrome.tabs.Tab });
    expect(context.getTabInfos()[2].f1.prebids?.pbjs).toEqual(payload);
  });

  it('handles TCF payload', async () => {
    const payload: ITcfDetails = { tcf: {} } as any;
    await handler.handle({ type: EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND, payload }, { tab: { id: 3 } as chrome.tabs.Tab });
    expect(context.getTabInfos()[3].tcf).toEqual(payload);
  });
});

describe('BadgeService', () => {
  it('shows ✓ when prebid count > 0', async () => {
    const tabInfos = {
      123: {
        main: {
          prebids: { a: {}, b: {} },
        },
      },
    };
    await BadgeService.update(tabInfos, 123);
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '✓', tabId: 123 });
  });

  it('clears badge when no data', async () => {
    const tabInfos = { 123: { main: {} } };
    await BadgeService.update(tabInfos, 123);
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '', tabId: 123 });
  });
});