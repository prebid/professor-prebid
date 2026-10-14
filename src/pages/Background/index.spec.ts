import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

let onMessageCallback: any;
let onBeforeNavigateCallback: any;
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
  },
  action: {
    setBadgeBackgroundColor: mockSetBadgeBackgroundColor,
    setBadgeText: mockSetBadgeText,
  },
  runtime: {
    onMessage: {
      addListener: vi.fn((cb) => {
        onMessageCallback = cb;
      }),
    },
  },
  webNavigation: {
    onBeforeNavigate: {
      addListener: vi.fn((cb) => {
        onBeforeNavigateCallback = cb;
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
  });

  it('initializes Background and registers all event listeners', () => {
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    expect(chrome.webNavigation.onBeforeNavigate.addListener).toHaveBeenCalled();
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

  it('handles webNavigation onBeforeNavigate for frameId 0', async () => {
    await onBeforeNavigateCallback({ frameId: 0, tabId: 1, url: 'https://example.com' });
    await flushPromises();

    expect(mockStorage['tab_info_1']).toEqual({
      'top-window': { url: 'https://example.com' },
    });
    expect(mockSetBadgeText).toHaveBeenCalledWith({ text: '', tabId: 1 });
  });

  it('ignores webNavigation onBeforeNavigate for non-zero frameId', async () => {
    await onBeforeNavigateCallback({ frameId: 1, tabId: 1, url: 'https://example.com/iframe' });
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
});
