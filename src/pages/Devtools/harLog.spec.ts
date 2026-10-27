import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isRecordableUrl, toLogEntry, collectHarLog, extractPrivacyFields } from './harLog';
import { preAuctionHarKey } from '../Shared/constants';

const TAB_ID = 42;
const HAR_KEY = preAuctionHarKey(TAB_ID);

describe('harLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    global.chrome = {
      storage: {
        session: {
          set: vi.fn().mockResolvedValue(undefined),
          remove: vi.fn().mockResolvedValue(undefined),
          get: vi.fn(),
        },
        local: {
          set: vi.fn(),
        },
        onChanged: {
          addListener: vi.fn(),
        },
      },
      devtools: {
        inspectedWindow: {
          tabId: TAB_ID,
        },
        network: {
          onRequestFinished: {
            addListener: vi.fn(),
          },
        },
      },
      tabs: {
        onUpdated: {
          addListener: vi.fn(),
        },
      },
    } as any;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isRecordableUrl', () => {
    it('returns true for http and https URLs', () => {
      expect(isRecordableUrl('http://example.com')).toBe(true);
      expect(isRecordableUrl('https://example.com/api/test')).toBe(true);
      expect(isRecordableUrl('HTTPS://EXAMPLE.COM')).toBe(true);
    });

    it('returns false for chrome-extension, data, ws, or empty URLs', () => {
      expect(isRecordableUrl('chrome-extension://abcdef/injected.js')).toBe(false);
      expect(isRecordableUrl('data:text/plain;base64,abc')).toBe(false);
      expect(isRecordableUrl('ws://example.com')).toBe(false);
      expect(isRecordableUrl('')).toBe(false);
      expect(isRecordableUrl(undefined as any)).toBe(false);
    });
  });

  describe('toLogEntry', () => {
    it('converts a standard harEntry to IHarLogEntry with rich fields', () => {
      const harEntry = {
        request: {
          url: 'https://prebid.example.com/auction?id=1&gdpr_consent=CP123',
          method: 'POST',
          headers: [{ name: 'Content-Type', value: 'application/json' }],
          postData: { text: '{"bids":[]}', mimeType: 'application/json' },
        },
        response: {
          status: 200,
          statusText: 'OK',
          headers: [{ name: 'Cache-Control', value: 'no-cache' }],
          content: { mimeType: 'application/json', size: 1024 },
        },
        startedDateTime: '2026-08-17T10:00:00.000Z',
        time: 123.456,
        _resourceType: 'fetch',
        timings: { wait: 50.2, receive: 10.1 },
      };

      const entry = toLogEntry(harEntry);
      expect(entry.url).toBe('https://prebid.example.com/auction?id=1&gdpr_consent=CP123');
      expect(entry.host).toBe('prebid.example.com');
      expect(entry.pathname).toBe('/auction');
      expect(entry.method).toBe('POST');
      expect(entry.status).toBe(200);
      expect(entry.statusText).toBe('OK');
      expect(entry.startedDateTime).toBe(new Date('2026-08-17T10:00:00.000Z').getTime());
      expect(entry.time).toBe(123.46);
      expect(entry.resourceType).toBe('fetch');
      expect(entry.queryString).toEqual([
        { name: 'id', value: '1' },
        { name: 'gdpr_consent', value: 'CP123' },
      ]);
      expect(entry.requestHeaders).toEqual([{ name: 'Content-Type', value: 'application/json' }]);
      expect(entry.postData?.text).toBe('{"bids":[]}');
      expect(entry.timings?.wait).toBe(50.2);
    });

    it('keeps only the initiator fields the panel reads, with capped call frames', () => {
      const frame = (i: number) => ({ functionName: `fn${i}`, url: `https://cdn.example.com/prebid.js`, lineNumber: i, columnNumber: 1, scriptId: '42' });
      const entry = toLogEntry({
        request: { url: 'https://bidder.example.com/bid' },
        _initiator: {
          type: 'script',
          url: 'https://publisher.example.com/',
          lineNumber: 3,
          stack: { callFrames: Array.from({ length: 50 }, (_, i) => frame(i)), parent: { description: 'Promise.then', callFrames: [frame(99)], parent: { callFrames: [frame(100)] } } },
        },
      });

      expect(entry.initiator?.type).toBe('script');
      expect(entry.initiator?.url).toBe('https://publisher.example.com/');
      expect(entry.initiator?.stack.callFrames).toHaveLength(20);
      expect(entry.initiator?.stack.callFrames[0]).toEqual({ functionName: 'fn0', url: 'https://cdn.example.com/prebid.js', lineNumber: 0, columnNumber: 1 });
      expect(entry.initiator?.stack.parent).toBeUndefined();
    });

    it('keeps only the privacy fields of a body too long to store whole', () => {
      const body = { imp: 'x'.repeat(20000), regs: { ext: { gdpr: 1 } }, user: { id: 'u1', eids: [{ source: 'id5' }], ext: { consent: 'CPabc' } } };
      expect(extractPrivacyFields(JSON.stringify(body))).toEqual({ regs: { ext: { gdpr: 1 } }, user: { consent: undefined, ext: { consent: 'CPabc' } } });
    });

    it('saves no privacy fields for short, non-JSON or privacy-free bodies', () => {
      expect(extractPrivacyFields('{"regs":{"ext":{"gdpr":1}}}')).toBeUndefined();
      expect(extractPrivacyFields('a='.repeat(10000))).toBeUndefined();
      expect(extractPrivacyFields(JSON.stringify({ imp: 'x'.repeat(20000) }))).toBeUndefined();
      expect(extractPrivacyFields(undefined)).toBeUndefined();
    });

    it('redacts credential headers and cookie values', () => {
      const entry = toLogEntry({
        request: {
          url: 'https://example.com/',
          headers: [
            { name: 'Cookie', value: 'session=abc' },
            { name: 'Authorization', value: 'Bearer secret' },
            { name: 'Sec-GPC', value: '1' },
          ],
          cookies: [{ name: 'session', value: 'abc' }],
        },
        response: {
          headers: [{ name: 'set-cookie', value: 'session=abc; Secure' }],
          cookies: [{ name: 'session', value: 'abc' }],
        },
      });
      expect(entry.requestHeaders).toEqual([
        { name: 'Cookie', value: '[redacted]' },
        { name: 'Authorization', value: '[redacted]' },
        { name: 'Sec-GPC', value: '1' },
      ]);
      expect(entry.responseHeaders).toEqual([{ name: 'set-cookie', value: '[redacted]' }]);
      expect(entry.requestCookies).toEqual([{ name: 'session', value: '[redacted]' }]);
      expect(entry.responseCookies).toEqual([{ name: 'session', value: '[redacted]' }]);
    });

    it('handles malformed URL and missing fields gracefully', () => {
      const harEntry = {
        request: {
          url: 'invalid-url',
        },
      };

      const entry = toLogEntry(harEntry);
      expect(entry.host).toBe('');
      expect(entry.method).toBe('GET');
      expect(entry.status).toBe(0);
      expect(entry.time).toBe(0);
      expect(entry.startedDateTime).toBe(0);
      expect(entry.resourceType).toBeUndefined();
    });

    it('handles undefined harEntry', () => {
      const entry = toLogEntry(undefined);
      expect(entry.url).toBe('');
      expect(entry.host).toBe('');
      expect(entry.method).toBe('GET');
      expect(entry.status).toBe(0);
      expect(entry.startedDateTime).toBe(0);
      expect(entry.time).toBe(0);
      expect(entry.resourceType).toBeUndefined();
    });
  });

  describe('collectHarLog', () => {
    const setup = () => {
      const listeners: { network: (entry: any) => void; tabs: (tabId: number, info: any) => void; storage: (changes: any, area: string) => void } = {
        network: () => {},
        tabs: () => {},
        storage: () => {},
      };
      (global.chrome.devtools.network.onRequestFinished.addListener as any).mockImplementation((fn: any) => (listeners.network = fn));
      (global.chrome.tabs.onUpdated.addListener as any).mockImplementation((fn: any) => (listeners.tabs = fn));
      (global.chrome.storage.onChanged.addListener as any).mockImplementation((fn: any) => (listeners.storage = fn));
      collectHarLog();
      return listeners;
    };
    const sessionSet = () => global.chrome.storage.session.set as any;
    const sessionRemove = () => global.chrome.storage.session.remove as any;
    const lastSaved = () => JSON.parse(sessionSet().mock.calls.slice(-1)[0][0][HAR_KEY]);
    const request = (url: string) => ({ request: { url, method: 'GET' }, response: { status: 200 }, startedDateTime: '2026-08-17T10:00:00.000Z', time: 10 });

    it('does nothing if chrome.devtools.network is unavailable', () => {
      global.chrome.devtools = {} as any;
      collectHarLog();
      expect(sessionSet()).not.toHaveBeenCalled();
    });

    it('stores the log per inspected tab in session storage, never in local storage', async () => {
      const listeners = setup();
      expect(sessionRemove()).toHaveBeenCalledWith(HAR_KEY);

      listeners.network(request('https://example.com/test'));
      expect(sessionSet()).toHaveBeenCalledTimes(0);

      await vi.advanceTimersByTimeAsync(300);
      expect(sessionSet()).toHaveBeenCalledTimes(1);
      expect(lastSaved().map((e: any) => e.url)).toEqual(['https://example.com/test']);

      listeners.network({ request: { url: 'chrome-extension://123/script.js' } });
      await vi.advanceTimersByTimeAsync(300);
      expect(sessionSet()).toHaveBeenCalledTimes(1);
      expect(global.chrome.storage.local.set).not.toHaveBeenCalled();
    });

    it('resets only when the inspected tab starts loading', async () => {
      const listeners = setup();
      listeners.network(request('https://example.com/a'));
      await vi.advanceTimersByTimeAsync(300);

      sessionRemove().mockClear();

      listeners.tabs(TAB_ID + 1, { status: 'loading' });
      listeners.tabs(TAB_ID, { status: 'complete' });
      expect(sessionRemove()).not.toHaveBeenCalled();

      listeners.tabs(TAB_ID, { status: 'loading' });
      expect(sessionRemove()).toHaveBeenCalledWith(HAR_KEY);

      listeners.network(request('https://example.com/b'));
      await vi.advanceTimersByTimeAsync(300);
      expect(lastSaved().map((e: any) => e.url)).toEqual(['https://example.com/b']);
    });

    it('keeps requests recorded right after a navigation reset when the reset itself is echoed back', async () => {
      const listeners = setup();
      listeners.network(request('https://example.com/old'));
      await vi.advanceTimersByTimeAsync(300);

      listeners.tabs(TAB_ID, { status: 'loading' });
      listeners.network(request('https://example.com/prebid.js'));
      // storage.onChanged for the reset arrives after the new page's first request finished.
      listeners.storage({ [HAR_KEY]: { oldValue: lastSaved(), newValue: undefined } }, 'session');
      await vi.advanceTimersByTimeAsync(300);

      expect(lastSaved().map((e: any) => e.url)).toEqual(['https://example.com/prebid.js']);
    });

    it('drops the in-memory log when the panel clears the stored log', async () => {
      const listeners = setup();
      listeners.network(request('https://example.com/a'));
      await vi.advanceTimersByTimeAsync(300);

      listeners.storage({ [HAR_KEY]: { newValue: '[]' } }, 'session');
      listeners.network(request('https://example.com/b'));
      await vi.advanceTimersByTimeAsync(300);
      expect(lastSaved().map((e: any) => e.url)).toEqual(['https://example.com/b']);
    });

    it('ignores clears for other tabs or storage areas', async () => {
      const listeners = setup();
      listeners.network(request('https://example.com/a'));
      await vi.advanceTimersByTimeAsync(300);

      listeners.storage({ [preAuctionHarKey(TAB_ID + 1)]: { newValue: '[]' } }, 'session');
      listeners.storage({ [HAR_KEY]: { newValue: '[]' } }, 'local');
      listeners.network(request('https://example.com/b'));
      await vi.advanceTimersByTimeAsync(300);
      expect(lastSaved()).toHaveLength(2);
    });

    it('keeps the newest half and retries once when the session quota is exceeded', async () => {
      const listeners = setup();
      for (let i = 0; i < 10; i++) listeners.network(request(`https://example.com/req_${i}`));
      sessionSet().mockRejectedValueOnce(new Error('QUOTA_BYTES quota exceeded'));

      await vi.advanceTimersByTimeAsync(300);
      expect(lastSaved().map((e: any) => e.url)).toEqual([5, 6, 7, 8, 9].map((i) => `https://example.com/req_${i}`));
    });

    it('caps entries at MAX_ENTRIES (1000)', async () => {
      const listeners = setup();
      for (let i = 0; i < 1050; i++) listeners.network(request(`https://example.com/req_${i}`));

      await vi.advanceTimersByTimeAsync(300);
      const saved = lastSaved();
      expect(saved.length).toBe(1000);
      expect(saved[saved.length - 1].url).toBe('https://example.com/req_1049');
    });
  });
});
