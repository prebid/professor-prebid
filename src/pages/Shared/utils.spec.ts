import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decycle, getTabId, conditionalPluralization, detectIframe, generateUniqueId, createRangeArray, getMinAndMaxNumber, EventBus, sendChromeTabsMessage, reloadPage, download } from './utils';

describe('Shared Utils', () => {
  describe('decycle', () => {
    it('handles simple objects', () => {
      const obj = { a: 1, b: 'test' };
      const result = JSON.parse(decycle(obj));
      expect(result).toEqual(obj);
    });

    it('handles circular references', () => {
      const obj: any = { a: 1 };
      obj.self = obj;
      const result = JSON.parse(decycle(obj));
      expect(result.a).toBe(1);
      expect(result.self).toBeUndefined();
    });

    it('removes DOM elements (location/document)', () => {
      const obj = { a: 1, dom: { location: 'some-location' } };
      const result = JSON.parse(decycle(obj));
      expect(result.a).toBe(1);
      expect(result.dom).toBeUndefined();
    });

    it('handles nested objects', () => {
      const obj = { a: { b: { c: 42 } } };
      const result = JSON.parse(decycle(obj));
      expect(result.a.b.c).toBe(42);
    });

    it('handles arrays', () => {
      const obj = { items: [1, 2, 3] };
      const result = JSON.parse(decycle(obj));
      expect(result.items).toEqual([1, 2, 3]);
    });

    it('handles null and non-object values', () => {
      const obj = { a: null, b: 1, c: 'str', d: true };
      const result = JSON.parse(decycle(obj));
      expect(result.a).toBeNull();
      expect(result.b).toBe(1);
      expect(result.c).toBe('str');
      expect(result.d).toBe(true);
    });
  });

  describe('conditionalPluralization', () => {
    it('returns empty string for empty array', () => {
      expect(conditionalPluralization([])).toBe('');
    });
    it('returns empty string for single item', () => {
      expect(conditionalPluralization([1])).toBe('');
    });
    it('returns "s" for multiple items', () => {
      expect(conditionalPluralization([1, 2])).toBe('s');
    });
    it('returns "s" for 3+ items', () => {
      expect(conditionalPluralization([1, 2, 3])).toBe('s');
    });
    it('returns empty string for null or undefined input', () => {
      expect(conditionalPluralization(null as any)).toBe('');
      expect(conditionalPluralization(undefined as any)).toBe('');
    });
  });

  describe('detectIframe', () => {
    it('returns false when window.self === window.top', () => {
      expect(detectIframe()).toBe(false);
    });

    it('returns true when window.self !== window.top', () => {
      const originalTop = window.top;
      Object.defineProperty(window, 'top', { value: {}, writable: true, configurable: true });
      expect(detectIframe()).toBe(true);
      Object.defineProperty(window, 'top', { value: originalTop, writable: true, configurable: true });
    });

    it('returns true when accessing window.top throws error', () => {
      const originalTop = window.top;
      Object.defineProperty(window, 'top', {
        get: () => {
          throw new Error('Cross-origin frame error');
        },
        configurable: true,
      });
      expect(detectIframe()).toBe(true);
      Object.defineProperty(window, 'top', { value: originalTop, writable: true, configurable: true });
    });
  });

  describe('generateUniqueId', () => {
    it('returns unique strings', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });
    it('contains a dash separator', () => {
      expect(generateUniqueId()).toContain('-');
    });
  });

  describe('createRangeArray', () => {
    it('creates a range from 0 to 10 with step 2', () => {
      const result = createRangeArray(0, 10, 2, 0);
      expect(result).toContain(0);
      expect(result).toContain(2);
      expect(result).toContain(4);
      expect(result).toContain(6);
      expect(result).toContain(8);
      expect(result).toContain(10);
    });

    it('includes end value even if not on step boundary', () => {
      const result = createRangeArray(0, 5, 3, 0);
      expect(result).toContain(5);
    });

    it('returns correct number of elements with offsetRight', () => {
      const result = createRangeArray(0, 10, 3, 2);
      expect(result).toContain(0);
      expect(result).toContain(3);
      expect(result).toContain(6);
      expect(result).toContain(9);
      expect(result).toContain(10);
    });
  });

  describe('getMinAndMaxNumber', () => {
    it('returns min and max of array with positive numbers', () => {
      const result = getMinAndMaxNumber([5, 2, 8, 1, 9]);
      expect(result.min).toBe(1);
      expect(result.max).toBe(9);
    });

    it('handles single element', () => {
      const result = getMinAndMaxNumber([42]);
      expect(result.min).toBe(42);
      expect(result.max).toBe(42);
    });

    it('returns 0,0 for empty array', () => {
      const result = getMinAndMaxNumber([]);
      expect(result.min).toBe(0);
      expect(result.max).toBe(0);
    });

    it('handles negative numbers', () => {
      const result = getMinAndMaxNumber([-10, -5, -20]);
      expect(result.min).toBe(-20);
      expect(result.max).toBe(-5);
    });
  });

  describe('getTabId', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      global.chrome = {
        devtools: { inspectedWindow: { tabId: undefined } },
        tabs: { query: vi.fn() },
      } as any;
    });

    it('returns devtools tabId if available', async () => {
      global.chrome.devtools.inspectedWindow.tabId = 123;
      const id = await getTabId();
      expect(id).toBe(123);
    });

    it('queries tabs if devtools ID missing', async () => {
      global.chrome.devtools.inspectedWindow.tabId = undefined;
      (global.chrome.tabs.query as any).mockImplementation((_query: any, cb: any) => {
        cb([{ id: 456 }]);
      });
      const id = await getTabId();
      expect(id).toBe(456);
    });

    it('returns undefined if chrome.tabs.query returns empty tabs array', async () => {
      global.chrome.devtools.inspectedWindow.tabId = undefined;
      (global.chrome.tabs.query as any).mockImplementation((_query: any, cb: any) => {
        cb([]);
      });
      const id = await getTabId();
      expect(id).toBeUndefined();
    });
  });

  describe('EventBus', () => {
    it('emits custom event to top window document', () => {
      const mockDispatch = vi.fn();
      const originalTop = window.top;
      Object.defineProperty(window, 'top', { value: { document: { dispatchEvent: mockDispatch } }, writable: true, configurable: true });

      vi.spyOn(document, 'querySelectorAll').mockReturnValue([] as any);

      EventBus.emit('TEST_EVENT', { data: 1 });

      expect(mockDispatch).toHaveBeenCalled();
      const eventArg = mockDispatch.mock.calls[0][0];
      expect(eventArg).toBeInstanceOf(CustomEvent);
      expect(eventArg.type).toBe('PROF_PREBID_MESSAGE_TEST_EVENT');
      expect(eventArg.detail).toEqual({ data: 1 });

      Object.defineProperty(window, 'top', { value: originalTop, writable: true, configurable: true });
    });

    it('falls back to window.document if window.top throws error', () => {
      const mockDispatch = vi.fn();
      const originalTop = window.top;
      Object.defineProperty(window, 'top', {
        get: () => {
          throw new Error('Cross origin');
        },
        configurable: true,
      });
      const spyDocumentDispatch = vi.spyOn(window.document, 'dispatchEvent').mockImplementation(mockDispatch);

      vi.spyOn(document, 'querySelectorAll').mockReturnValue([] as any);

      EventBus.emit('TEST_EVENT_FALLBACK', { data: 2 });

      expect(spyDocumentDispatch).toHaveBeenCalled();
      Object.defineProperty(window, 'top', { value: originalTop, writable: true, configurable: true });
      spyDocumentDispatch.mockRestore();
    });

    it('dispatches events to matching and handles cross-origin iframe errors', () => {
      const iframeDispatch = vi.fn();
      const normalIframe: any = {
        contentDocument: { dispatchEvent: iframeDispatch },
      };
      const errorIframe: any = {};
      Object.defineProperty(errorIframe, 'contentDocument', {
        get: () => {
          throw new Error('Frame error');
        },
      });

      vi.spyOn(document, 'querySelectorAll').mockReturnValue([normalIframe, errorIframe] as any);

      EventBus.emit('IFRAME_EVENT', { payload: 'ok' });

      expect(iframeDispatch).toHaveBeenCalled();
    });

    it('on registers listener and handles callback and cleanup', () => {
      const callback = vi.fn();
      const cleanup = EventBus.on('CUSTOM_TYPE', callback);

      const eventName = 'PROF_PREBID_MESSAGE_CUSTOM_TYPE';
      const customEvent = new CustomEvent(eventName, { detail: { info: 'hello' } });

      document.dispatchEvent(customEvent);
      expect(callback).toHaveBeenCalledWith({ info: 'hello' });

      cleanup();
      callback.mockClear();
      document.dispatchEvent(customEvent);
      expect(callback).not.toHaveBeenCalled();
    });

    it('onAny registers listeners for multiple events and handles cleanup', () => {
      const callback = vi.fn();
      const cleanup = EventBus.onAny(callback, ['EVT1', 'EVT2']);

      const event1 = new CustomEvent('PROF_PREBID_MESSAGE_EVT1', { detail: { val: 1 } });
      const event2 = new CustomEvent('PROF_PREBID_MESSAGE_EVT2', { detail: { val: 2 } });

      document.dispatchEvent(event1);
      expect(callback).toHaveBeenCalledWith('EVT1', { val: 1 });

      document.dispatchEvent(event2);
      expect(callback).toHaveBeenCalledWith('EVT2', { val: 2 });

      cleanup();
      callback.mockClear();
      document.dispatchEvent(event1);
      document.dispatchEvent(event2);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('sendChromeTabsMessage', () => {
    it('sends message to active tab', async () => {
      const mockSendMessage = vi.fn();
      global.chrome = {
        devtools: { inspectedWindow: { tabId: 42 } },
        tabs: { sendMessage: mockSendMessage, query: vi.fn() },
      } as any;

      await sendChromeTabsMessage('MY_TYPE', { key: 'val' });
      expect(mockSendMessage).toHaveBeenCalledWith(42, { type: 'MY_TYPE', payload: { key: 'val' } });
    });
  });

  describe('reloadPage', () => {
    it('reloads the active tab', async () => {
      const mockReload = vi.fn();
      global.chrome = {
        devtools: { inspectedWindow: { tabId: 10 } },
        tabs: { reload: mockReload, query: vi.fn() },
      } as any;

      await reloadPage();
      expect(mockReload).toHaveBeenCalledWith(10);
    });
  });

  describe('download', () => {
    it('creates and clicks a download link', () => {
      const mockClick = vi.fn();
      const mockSetAttribute = vi.fn();
      vi.spyOn(document, 'createElement').mockReturnValue({
        setAttribute: mockSetAttribute,
        click: mockClick,
      } as any);

      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:something');
      const mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      download({ test: true }, 'myfile');

      expect(mockSetAttribute).toHaveBeenCalledWith('href', 'blob:something');
      expect(mockSetAttribute).toHaveBeenCalledWith('download', expect.stringContaining('myfile'));
      expect(mockClick).toHaveBeenCalled();
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });
});
