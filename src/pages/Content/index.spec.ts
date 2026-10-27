import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EVENTS, CONSOLE_TOGGLE, DOWNLOAD_FAILED, PBJS_NAMESPACE_CHANGE, POPUP_LOADED, SAVE_MASKS } from '../Shared/constants';

global.requestIdleCallback = vi.fn((cb) => 1) as any;

let capturedRuntimeListener: Function | null = null;
const mockSendMessage = vi.fn();
const mockGetURL = vi.fn((path) => `mock-extension://${path}`);
const mockStorageGet = vi.fn();
const mockAddListener = vi.fn((listener) => {
  capturedRuntimeListener = listener;
});

global.chrome = {
  runtime: {
    id: 'mock-id',
    sendMessage: mockSendMessage,
    onMessage: {
      addListener: mockAddListener,
      removeListener: vi.fn(),
    },
    getURL: mockGetURL,
  },
  storage: {
    local: {
      get: mockStorageGet,
    },
  },
} as any;

describe('Content Script', () => {
  let contentScript: any;
  let EventBus: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    if (document.head) {
      vi.spyOn(document.head, 'appendChild').mockImplementation((node: any) => node);
    }
    if (document.documentElement) {
      vi.spyOn(document.documentElement, 'appendChild').mockImplementation((node: any) => node);
    }
    ({ EventBus } = await import('../Shared/utils'));
    contentScript = await import('./index');
  });

  describe('Module Initialization & Script Injection', () => {
    it('injects script into document head when not on Cloudflare', async () => {
      expect(document.head.appendChild).toHaveBeenCalled();
      const appendedScript = (document.head.appendChild as any).mock.calls[0]?.[0];
      if (appendedScript) {
        appendedScript.remove = vi.fn();
        appendedScript.dispatchEvent(new Event('load'));
        expect(appendedScript.remove).toHaveBeenCalled();
      }
    });

    it('skips script injection on Cloudflare domains without calling requestIdleCallback', async () => {
      const originalHost = window.location.host;
      try {
        vi.resetModules();
        vi.clearAllMocks();
        Object.defineProperty(window, 'location', {
          writable: true,
          value: { ...window.location, host: 'challenges.cloudflare.com' },
        });
        await import('./index');
        expect(document.head.appendChild).not.toHaveBeenCalled();
        expect(global.requestIdleCallback).not.toHaveBeenCalled();
      } finally {
        Object.defineProperty(window, 'location', {
          writable: true,
          value: { ...window.location, host: originalHost },
        });
      }
    });

    it('defers injection via requestIdleCallback when document head and documentElement are null', async () => {
      expect(global.requestIdleCallback).toBeDefined();
    });

    it('sets up listeners when not in iframe', async () => {
      expect(capturedRuntimeListener).not.toBeNull();
    });

    it('sets up listeners in cross-origin iframes where window.top.document throws', async () => {
      const originalSelf = window.self;
      const originalTop = window.top;
      try {
        vi.resetModules();
        vi.clearAllMocks();
        capturedRuntimeListener = null;
        Object.defineProperty(window, 'self', { configurable: true, value: {} });
        Object.defineProperty(window, 'top', {
          configurable: true,
          value: {
            get document() {
              throw new DOMException('Blocked a frame with origin', 'SecurityError');
            },
          },
        });
        await import('./index');
        expect(capturedRuntimeListener).not.toBeNull();
      } finally {
        Object.defineProperty(window, 'self', { configurable: true, value: originalSelf });
        Object.defineProperty(window, 'top', { configurable: true, value: originalTop });
      }
    });
  });

  describe('sendToServiceWorker', () => {
    it('sends message to runtime and ignores promise rejections', () => {
      const payload = { foo: 'bar' };
      mockSendMessage.mockRejectedValueOnce(new Error('Extension context invalidated'));
      expect(() => contentScript.sendToServiceWorker('TEST_TYPE', payload)).not.toThrow();
      expect(mockSendMessage).toHaveBeenCalledWith({ type: 'TEST_TYPE', payload });
    });

    it('returns early if type is missing or falsy', () => {
      contentScript.sendToServiceWorker('', { data: 1 });
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('returns early if payload is missing or null', () => {
      contentScript.sendToServiceWorker('TEST_TYPE', null as any);
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('returns early if chrome.runtime.id is missing', () => {
      const originalId = global.chrome.runtime.id;
      global.chrome.runtime.id = undefined;
      contentScript.sendToServiceWorker('TEST_TYPE', {});
      expect(mockSendMessage).not.toHaveBeenCalled();
      global.chrome.runtime.id = originalId;
    });

    it('returns early if chrome.runtime.sendMessage is missing', () => {
      const originalSendMessage = global.chrome.runtime.sendMessage;
      (global.chrome.runtime as any).sendMessage = undefined;
      contentScript.sendToServiceWorker('TEST_TYPE', {});
      expect(mockSendMessage).not.toHaveBeenCalled();
      global.chrome.runtime.sendMessage = originalSendMessage;
    });
  });

  describe('updateOverlays', () => {
    it('dispatches SAVE_MASKS event when namespace is present', () => {
      const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
      contentScript.updateOverlays('pbjs');
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SAVE_MASKS,
          detail: 'pbjs',
        })
      );
    });

    it('does nothing when namespace is falsy/null', () => {
      const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
      contentScript.updateOverlays(null);
      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });

  describe('processEventBusMessages', () => {
    it('forwards valid messages to service worker', async () => {
      const payload = { data: 123 };
      await contentScript.processEventBusMessages('SOME_EVENT', payload);
      expect(mockSendMessage).toHaveBeenCalledWith({ type: 'SOME_EVENT', payload });
    });

    it('handles REQUEST_CONSOLE_STATE when checked is true', async () => {
      mockStorageGet.mockResolvedValue({ [CONSOLE_TOGGLE]: true });
      const dispatchSpy = vi.spyOn(document, 'dispatchEvent');

      await contentScript.processEventBusMessages(EVENTS.REQUEST_CONSOLE_STATE, {});

      expect(mockStorageGet).toHaveBeenCalledWith(CONSOLE_TOGGLE);
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CONSOLE_TOGGLE,
          detail: true,
        })
      );
    });

    it('handles REQUEST_CONSOLE_STATE when checked is false', async () => {
      mockStorageGet.mockResolvedValue({ [CONSOLE_TOGGLE]: false });
      const dispatchSpy = vi.spyOn(document, 'dispatchEvent');

      await contentScript.processEventBusMessages(EVENTS.REQUEST_CONSOLE_STATE, {});

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CONSOLE_TOGGLE,
          detail: false,
        })
      );
    });

    it('handles REQUEST_CONSOLE_STATE when chrome.storage is undefined', async () => {
      const originalStorage = global.chrome.storage;
      (global.chrome as any).storage = undefined;

      await expect(contentScript.processEventBusMessages(EVENTS.REQUEST_CONSOLE_STATE, {})).resolves.not.toThrow();

      (global.chrome as any).storage = originalStorage;
    });

    it('handles SEND_PREBID_DETAILS_TO_BACKGROUND with namespace', async () => {
      const payload = { namespace: 'customPbjs' };
      const dispatchSpy = vi.spyOn(document, 'dispatchEvent');

      await contentScript.processEventBusMessages(EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND, payload);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SAVE_MASKS,
          detail: 'customPbjs',
        })
      );
    });

    it('handles SEND_PREBID_DETAILS_TO_BACKGROUND with undefined payload', async () => {
      await expect(contentScript.processEventBusMessages(EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND, undefined)).resolves.not.toThrow();
    });
  });

  describe('processChromeRuntimeMessages', () => {
    // Messages below use the exact shape sendChromeTabsMessage produces: { type, payload }.
    it('forwards the overlay switch state from a CONSOLE_TOGGLE message', () => {
      expect(capturedRuntimeListener).toBeTruthy();
      const emitSpy = vi.spyOn(EventBus, 'emit');
      const dispatchSpy = vi.spyOn(document, 'dispatchEvent');

      capturedRuntimeListener!({ type: CONSOLE_TOGGLE, payload: { consoleState: true } });

      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: CONSOLE_TOGGLE, detail: true }));
      expect(emitSpy).toHaveBeenCalledWith(CONSOLE_TOGGLE, { detail: true });
    });

    it('forwards false when the overlay switch is turned off', () => {
      const dispatchSpy = vi.spyOn(document, 'dispatchEvent');

      capturedRuntimeListener!({ type: CONSOLE_TOGGLE, payload: { consoleState: false } });

      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: CONSOLE_TOGGLE, detail: false }));
    });

    it('refreshes overlays for the current namespace when the overlay switch is turned on', () => {
      const dispatchSpy = vi.spyOn(document, 'dispatchEvent');

      capturedRuntimeListener!({ type: PBJS_NAMESPACE_CHANGE, payload: 'myPbjs' });
      capturedRuntimeListener!({ type: CONSOLE_TOGGLE, payload: { consoleState: true } });

      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: SAVE_MASKS, detail: 'myPbjs' }));
    });

    it('stores the namespace from a PBJS_NAMESPACE_CHANGE message', async () => {
      expect(capturedRuntimeListener).toBeTruthy();
      const emitSpy = vi.spyOn(EventBus, 'emit');
      const dispatchSpy = vi.spyOn(document, 'dispatchEvent');

      capturedRuntimeListener!({ type: PBJS_NAMESPACE_CHANGE, payload: 'myPbjs' });
      expect(emitSpy).toHaveBeenCalledWith(PBJS_NAMESPACE_CHANGE, { detail: 'myPbjs' });

      // Any later update re-saves overlays for the stored namespace.
      await contentScript.processEventBusMessages(EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND, { slots: [] });
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: SAVE_MASKS, detail: 'myPbjs' }));
    });

    it('ignores a PBJS_NAMESPACE_CHANGE message without a namespace', () => {
      const emitSpy = vi.spyOn(EventBus, 'emit');

      capturedRuntimeListener!({ type: PBJS_NAMESPACE_CHANGE, payload: '' });

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('emits event on POPUP_LOADED message', () => {
      const emitSpy = vi.spyOn(EventBus, 'emit');
      const payload = { loaded: true };

      if (capturedRuntimeListener) {
        capturedRuntimeListener({ type: POPUP_LOADED, payload });
        expect(emitSpy).toHaveBeenCalledWith(POPUP_LOADED, payload);
      }
    });

    it('emits event on DOWNLOAD_FAILED message', () => {
      const emitSpy = vi.spyOn(EventBus, 'emit');
      const payload = { syncState: 'failed' };

      if (capturedRuntimeListener) {
        capturedRuntimeListener({ type: DOWNLOAD_FAILED, payload });
        expect(emitSpy).toHaveBeenCalledWith(DOWNLOAD_FAILED, payload);
      }
    });

    it('handles default switch case for unknown message types', () => {
      const emitSpy = vi.spyOn(EventBus, 'emit');

      if (capturedRuntimeListener) {
        capturedRuntimeListener({ type: 'UNKNOWN_TYPE' as any });
        expect(emitSpy).not.toHaveBeenCalled();
      }
    });
  });
});
