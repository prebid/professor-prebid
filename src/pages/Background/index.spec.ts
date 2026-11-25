import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

let onCommittedCallback: any;
let onTabRemovedCallback: any;
let onTabActivatedCallback: any;
let onAlarmCallback: any;
let alarmsGetCallback: any;

const mockStorage: Record<string, any> = {};

const mockGet = vi.fn(async (key: any) => {
  if (key === null) return { ...mockStorage };
  if (Array.isArray(key)) {
    const res: Record<string, any> = {};
    for (const k of key) {
      if (mockStorage[k]) res[k] = mockStorage[k];
    }
    return res;
  }
  return { ...mockStorage };
});

const mockSet = vi.fn(async (data: Record<string, any>) => {
  Object.assign(mockStorage, data);
});

const mockRemove = vi.fn(async (keys: string[]) => {
  for (const k of keys) {
    delete mockStorage[k];
  }
});

const mockSessionStorage: Record<string, any> = {};
const mockSessionGet = vi.fn(async () => ({ ...mockSessionStorage }));
const mockSessionRemove = vi.fn(async (keys: string | string[]) => {
  for (const k of Array.isArray(keys) ? keys : [keys]) {
    delete mockSessionStorage[k];
  }
});

const mockQuery = vi.fn(async () => [{ id: 1 }, { id: 2 }]);
const mockCreateAlarm = vi.fn();
const mockGetAlarm = vi.fn((name: string, cb: Function) => {
  alarmsGetCallback = cb;
  if (cb) cb(null);
});

const mockSetBadgeText = vi.fn();
const mockSetBadgeBackgroundColor = vi.fn();

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: mockGet,
      set: mockSet,
      remove: mockRemove,
    },
    session: {
      get: mockSessionGet,
      remove: mockSessionRemove,
    },
  },
  action: {
    setBadgeBackgroundColor: mockSetBadgeBackgroundColor,
    setBadgeText: mockSetBadgeText,
  },
  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
  },
  webNavigation: {
    onCommitted: {
      addListener: vi.fn((cb) => {
        onCommittedCallback = cb;
      }),
    },
  },
  tabs: {
    onRemoved: {
      addListener: vi.fn((cb) => {
        onTabRemovedCallback = cb;
      }),
    },
    onActivated: {
      addListener: vi.fn((cb) => {
        onTabActivatedCallback = cb;
      }),
    },
    query: mockQuery,
  },
  alarms: {
    onAlarm: {
      addListener: vi.fn((cb) => {
        onAlarmCallback = cb;
      }),
    },
    create: mockCreateAlarm,
    get: mockGetAlarm,
  },
});

vi.mock('../Shared/utils', () => ({
  getTabId: vi.fn(() => Promise.resolve(1)),
}));

const flushPromises = async () => {
  await new Promise((resolve) => process.nextTick(resolve));
  await new Promise((resolve) => process.nextTick(resolve));
};

describe('Background Index Module', () => {
  beforeAll(async () => {
    await import('./index');
  });

  beforeEach(() => {
    mockSet.mockClear();
    mockRemove.mockClear();
    mockGet.mockClear();
    mockCreateAlarm.mockClear();
    mockSetBadgeText.mockClear();
    mockSetBadgeBackgroundColor.mockClear();
    mockQuery.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
    for (const key of Object.keys(mockSessionStorage)) {
      delete mockSessionStorage[key];
    }
    mockSessionRemove.mockClear();
  });

  it('initializes Background and registers all event listeners', () => {
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    expect(chrome.webNavigation.onCommitted.addListener).toHaveBeenCalled();
    expect(chrome.tabs.onRemoved.addListener).toHaveBeenCalled();
    expect(chrome.tabs.onActivated.addListener).toHaveBeenCalled();
    expect(chrome.alarms.onAlarm.addListener).toHaveBeenCalled();
    expect(chrome.alarms.get).toHaveBeenCalledWith('cleanUpTabInfo', expect.any(Function));
  });

  it('creates alarm if cleanup alarm does not exist', () => {
    alarmsGetCallback(null);
    expect(mockCreateAlarm).toHaveBeenCalledWith('cleanUpTabInfo', { periodInMinutes: 15 });
  });

  it('does not create alarm if cleanup alarm already exists', () => {
    mockCreateAlarm.mockClear();
    alarmsGetCallback({ name: 'cleanUpTabInfo' });
    expect(mockCreateAlarm).not.toHaveBeenCalled();
  });

  it('handles webNavigation onCommitted for frameId 0', async () => {
    await onCommittedCallback({ frameId: 0, tabId: 1, url: 'https://example.com' });
    await flushPromises();

    expect(mockStorage['tab_info_1']).toEqual({
      'top-window': { url: 'https://example.com' },
    });
    expect(mockSetBadgeText).toHaveBeenCalledWith({ text: '', tabId: 1 });
  });

  it('ignores webNavigation onCommitted for prerendered documents', async () => {
    mockStorage['tab_info_1'] = { 'top-window': { url: 'https://current.example' } };
    await onCommittedCallback({ frameId: 0, tabId: 1, url: 'https://prerender.example', documentLifecycle: 'prerender' });
    await flushPromises();

    expect(mockStorage['tab_info_1']).toEqual({ 'top-window': { url: 'https://current.example' } });
    expect(mockSetBadgeText).not.toHaveBeenCalled();
  });

  it('ignores webNavigation onCommitted for non-zero frameId', async () => {
    await onCommittedCallback({ frameId: 1, tabId: 1, url: 'https://example.com/iframe' });
    await flushPromises();

    expect(mockSetBadgeText).not.toHaveBeenCalled();
  });

  it('handles tab activated', async () => {
    mockStorage['tab_info_1'] = { 'top-window': { url: 'https://example.com' } };

    await onTabActivatedCallback({ tabId: 1 });
    await flushPromises();

    expect(mockSetBadgeText).toHaveBeenCalledWith({ text: '', tabId: 1 });
  });

  it('handles tab activated with prebids and updates badge to checkmark', async () => {
    mockStorage['tab_info_1'] = { 'top-window': { url: 'https://example.com', prebids: { pbjs: {} as any } } };

    await onTabActivatedCallback({ tabId: 1 });
    await flushPromises();

    expect(mockSetBadgeText).toHaveBeenCalledWith({ text: '✓', tabId: 1 });
  });

  it('handles tab activated with undefined tabId', async () => {
    await onTabActivatedCallback({ tabId: undefined });
    await flushPromises();

    expect(mockSetBadgeText).not.toHaveBeenCalled();
  });

  it('handles tab removed', async () => {
    mockStorage['tab_info_1'] = { 'top-window': {} };

    await onTabRemovedCallback(1, {} as any);
    await flushPromises();

    expect(mockStorage['tab_info_1']).toBeUndefined();
  });

  it('handles alarm event and cleans up inactive tab storage', async () => {
    mockQuery.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    mockStorage['tab_info_1'] = { 'top-window': {} };
    mockStorage['tab_info_99'] = { 'top-window': {} };
    mockStorage['other_key'] = 'keep';

    await onAlarmCallback({ name: 'cleanUpTabInfo' });
    await flushPromises();

    expect(mockStorage['tab_info_1']).toBeDefined();
    expect(mockStorage['tab_info_99']).toBeUndefined();
    expect(mockStorage['other_key']).toEqual('keep');
  });

  it('does not call remove if no inactive tabs found in cleanStorage', async () => {
    mockQuery.mockResolvedValue([{ id: 1 }]);
    mockStorage['tab_info_1'] = { 'top-window': {} };

    mockRemove.mockClear();

    await onAlarmCallback({ name: 'cleanUpTabInfo' });
    await flushPromises();

    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('removes pre-auction HAR session entries, index and chunks, for closed tabs only', async () => {
    mockQuery.mockResolvedValue([{ id: 1 }]);
    mockSessionStorage['preAuctionHar_1'] = '[0]';
    mockSessionStorage['preAuctionHar_1_0'] = '[]';
    mockSessionStorage['preAuctionHar_42'] = '[0]';
    mockSessionStorage['preAuctionHar_42_0'] = '[]';
    mockSessionStorage['unrelated'] = 'keep';

    await onAlarmCallback({ name: 'cleanUpTabInfo' });
    await flushPromises();

    expect(mockSessionStorage['preAuctionHar_1']).toBeDefined();
    expect(mockSessionStorage['preAuctionHar_1_0']).toBeDefined();
    expect(mockSessionStorage['preAuctionHar_42']).toBeUndefined();
    expect(mockSessionStorage['preAuctionHar_42_0']).toBeUndefined();
    expect(mockSessionStorage['unrelated']).toEqual('keep');
  });

  it("removes a closed tab's whole network log", async () => {
    mockSessionStorage['preAuctionHar_7'] = '[3]';
    mockSessionStorage['preAuctionHar_7_3'] = '[]';
    mockSessionStorage['preAuctionHar_77'] = '[0]';

    await onTabRemovedCallback(7, {});
    await flushPromises();

    expect(mockSessionStorage['preAuctionHar_7']).toBeUndefined();
    expect(mockSessionStorage['preAuctionHar_7_3']).toBeUndefined();
    expect(mockSessionStorage['preAuctionHar_77']).toEqual('[0]');
    delete mockSessionStorage['preAuctionHar_77'];
  });

  it('reads only the session key names when getKeys is available', async () => {
    const session = chrome.storage.session as any;
    session.getKeys = vi.fn(async () => Object.keys(mockSessionStorage));
    try {
      mockQuery.mockResolvedValue([{ id: 1 }]);
      mockSessionStorage['preAuctionHar_42'] = { entries: [] };
      mockSessionGet.mockClear();

      await onAlarmCallback({ name: 'cleanUpTabInfo' });
      await flushPromises();

      expect(session.getKeys).toHaveBeenCalled();
      expect(mockSessionGet).not.toHaveBeenCalled();
      expect(mockSessionStorage['preAuctionHar_42']).toBeUndefined();
    } finally {
      delete session.getKeys;
    }
  });
});
