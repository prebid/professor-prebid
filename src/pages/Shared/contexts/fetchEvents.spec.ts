import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchEvents } from './fetchEvents';
import { DOWNLOAD_FAILED } from '../constants';
import { sendChromeTabsMessage } from '../../Shared/utils';

vi.mock('../../Shared/utils', () => ({
  getTabId: vi.fn(),
  sendChromeTabsMessage: vi.fn(),
}));

describe('fetchEvents', () => {
  const setDownloading = vi.fn();
  const setSyncInfo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.chrome = {
      tabs: {
        query: vi.fn((queryInfo, cb) => cb([{ url: 'https://example.com/page' }])),
      },
      windows: {
        WINDOW_ID_CURRENT: 1,
      },
    } as any;
  });

  it('returns empty object when tabInfo is null or undefined', async () => {
    expect(await fetchEvents(null as any, setDownloading, setSyncInfo, [])).toEqual({});
    expect(await fetchEvents(undefined as any, setDownloading, setSyncInfo, [])).toEqual({});
  });

  it('skips frame if frame has no prebids', async () => {
    const tabInfo: any = {
      'top-window': {},
    };
    const result = await fetchEvents(tabInfo, setDownloading, setSyncInfo, []);
    expect(result).toEqual({ 'top-window': {} });
    expect(setDownloading).not.toHaveBeenCalled();
  });

  it('keeps a Prebid instance without an eventsUrl and does not fetch', async () => {
    (global.chrome.tabs.query as any).mockImplementation((queryInfo: any, cb: any) => cb([{}]));
    global.fetch = vi.fn();
    const tabInfo: any = {
      'top-window': {
        prebids: {
          pbjs: { eventsUrl: '', events: [], version: '11.29.0' },
        },
      },
    };

    const result = await fetchEvents(tabInfo, setDownloading, setSyncInfo, []);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result['top-window'].prebids.pbjs).toEqual({ eventsUrl: '', events: [], version: '11.29.0' });
  });

  it('successfully fetches events for top-window', async () => {
    const tabInfo: any = {
      'top-window': {
        prebids: {
          pbjs: {
            eventsUrl: 'https://example.com/events.json',
          },
        },
      },
    };

    const mockEvents = [{ eventName: 'bidResponse' }];
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockEvents),
    });

    const result = await fetchEvents(tabInfo, setDownloading, setSyncInfo, []);
    expect(result['top-window'].prebids.pbjs.events).toEqual(mockEvents);
    expect(setDownloading).toHaveBeenCalledWith('true');
    expect(setDownloading).toHaveBeenCalledWith('false');
    expect(setSyncInfo).toHaveBeenCalledWith(null);
  });

  it('handles non-top-window frameId domain matching', async () => {
    const tabInfo: any = {
      'https://sub.example.com/iframe.html': {
        prebids: {
          pbjs: {
            eventsUrl: 'https://sub.example.com/events.json',
          },
        },
      },
    };

    const mockEvents = [{ eventName: 'bidWon' }];
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockEvents),
    });

    const result = await fetchEvents(tabInfo, setDownloading, setSyncInfo, []);
    expect(result['https://sub.example.com/iframe.html'].prebids.pbjs.events).toEqual(mockEvents);
  });

  it('skips when hostname does not match current tab URL host', async () => {
    const tabInfo: any = {
      'top-window': {
        prebids: {
          pbjs: {
            eventsUrl: 'https://otherdomain.com/events.json',
          },
        },
      },
    };

    await fetchEvents(tabInfo, setDownloading, setSyncInfo, []);
    expect(setDownloading).not.toHaveBeenCalled();
  });

  it('skips download if url is already in downloadingUrls array', async () => {
    const eventsUrl = 'https://example.com/events.json';
    const tabInfo: any = {
      'top-window': {
        prebids: {
          pbjs: {
            eventsUrl,
          },
        },
      },
    };

    const downloadingUrls: any = [eventsUrl];
    downloadingUrls[eventsUrl] = true;

    await fetchEvents(tabInfo, setDownloading, setSyncInfo, downloadingUrls);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handles download failure gracefully and removes frame when no prebids remain', async () => {
    const tabInfo: any = {
      'top-window': {
        prebids: {
          pbjs: {
            eventsUrl: 'https://example.com/events.json',
          },
        },
      },
    };

    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await fetchEvents(tabInfo, setDownloading, setSyncInfo, []);
    expect(sendChromeTabsMessage).toHaveBeenCalledWith(DOWNLOAD_FAILED, { eventsUrl: 'https://example.com/events.json' });
    expect(setDownloading).toHaveBeenCalledWith('error');
    expect(result['top-window']).toBeUndefined();
  });

  it('keeps frame if other prebid namespaces remain after download error', async () => {
    const tabInfo: any = {
      'top-window': {
        prebids: {
          failingPbjs: {
            eventsUrl: 'https://example.com/failing.json',
          },
          workingPbjs: {
            eventsUrl: 'https://otherdomain.com/working.json',
          },
        },
      },
    };

    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await fetchEvents(tabInfo, setDownloading, setSyncInfo, []);
    expect(result['top-window']).toBeDefined();
    expect(result['top-window'].prebids.failingPbjs).toBeUndefined();
    expect(result['top-window'].prebids.workingPbjs).toBeDefined();
  });

  it('handles invalid URLs safely in safelyConstructURL and getCurrentTabURL', async () => {
    global.chrome = {
      tabs: {
        query: vi.fn((queryInfo, cb) => cb([{}])),
      },
      windows: {
        WINDOW_ID_CURRENT: 1,
      },
    } as any;

    const tabInfo: any = {
      'top-window': {
        prebids: {
          pbjs: {
            eventsUrl: 'invalid-url-string',
          },
        },
      },
    };

    global.fetch = vi.fn().mockRejectedValue(new Error('Invalid URL'));

    await fetchEvents(tabInfo, setDownloading, setSyncInfo, []);
    expect(setDownloading).toHaveBeenCalledWith('true');
    expect(setDownloading).toHaveBeenCalledWith('error');
  });
});
