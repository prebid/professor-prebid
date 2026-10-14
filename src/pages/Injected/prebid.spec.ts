import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Prebid, addEventListenersForPrebid } from './prebid';
import { EVENTS, POPUP_LOADED } from '../Shared/constants';

import { EventBus } from '../Shared/utils';

vi.mock('../Shared/utils', () => ({
  EventBus: {
    emit: vi.fn(),
  },
}));

describe('Prebid Injected Script', () => {
  let mockPbjs: any;
  let originalURL: typeof URL;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    originalURL = global.URL;
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://example.com/mock-blob-url');

    mockPbjs = {
      onEvent: vi.fn(),
      que: [] as Function[],
      getEvents: undefined,
      getConfig: vi.fn(() => ({ debug: false })),
      getUserIdsAsEids: vi.fn(() => [{ source: 'id.com', uids: [] }]),
      installedModules: ['consentManagement'],
      version: '7.0.0',
      bidderSettings: { appnexus: {} },
    };

    mockPbjs.que.push = function (fn: Function) {
      fn();
      return Array.prototype.push.call(this, fn);
    };

    vi.stubGlobal('window', {
      pbjs: mockPbjs,
      pbjs2: mockPbjs,
      _pbjsGlobals: ['pbjs'],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      postMessage: vi.fn(),
      sessionStorage: { getItem: vi.fn().mockReturnValue(null) },
      location: { host: 'example.com' },
      origin: 'https://example.com',
      PREBID_TIMEOUT: 3000,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    global.URL = originalURL;
  });

  it('initializes and registers event listeners when onEvent is a function', () => {
    const instance = new Prebid('pbjs', 'frame1');
    expect(instance.namespace).toBe('pbjs');
    expect(instance.frameId).toBe('frame1');
    expect(mockPbjs.onEvent).toHaveBeenCalledWith('auctionInit', expect.any(Function));
    expect(mockPbjs.onEvent).toHaveBeenCalledWith('auctionEnd', expect.any(Function));
    expect(mockPbjs.onEvent).toHaveBeenCalledWith('bidRequested', expect.any(Function));
    expect(mockPbjs.onEvent).toHaveBeenCalledWith('bidResponse', expect.any(Function));
    expect(mockPbjs.onEvent).toHaveBeenCalledWith('noBid', expect.any(Function));
    expect(mockPbjs.onEvent).toHaveBeenCalledWith('bidWon', expect.any(Function));
  });

  it('handles initialization when onEvent is not a function', () => {
    mockPbjs.onEvent = undefined;
    expect(() => new Prebid('pbjs', 'frame1')).not.toThrow();
  });

  it('pushes events and bounds the events array to 500 items when eventsApi is false', () => {
    const instance = new Prebid('pbjs', 'frame1') as any;
    const calls = mockPbjs.onEvent.mock.calls;
    const auctionInitCall = calls.find((c: any[]) => c[0] === 'auctionInit');
    const callback = auctionInitCall[1];

    instance.events = [];

    for (let i = 0; i < 505; i++) {
      callback({ id: i });
    }

    expect(instance.events.length).toBe(500);
    expect(instance.events[499]).toEqual({ eventType: 'auctionInit', args: { id: 504 } });
  });

  it('does not push events to internal array when eventsApi is true (getEvents is defined)', () => {
    mockPbjs.getEvents = vi.fn().mockReturnValue([]);
    const instance = new Prebid('pbjs', 'frame1') as any;
    const calls = mockPbjs.onEvent.mock.calls;
    const auctionInitCall = calls.find((c: any[]) => c[0] === 'auctionInit');
    const callback = auctionInitCall[1];

    instance.events = [];
    callback({ id: 1 });

    expect(instance.events.length).toBe(0);
  });

  it('handles all registered event callbacks (auctionEnd, bidRequested, bidResponse, noBid, bidWon)', () => {
    const instance = new Prebid('pbjs', 'frame1') as any;
    const calls = mockPbjs.onEvent.mock.calls;

    ['auctionEnd', 'bidRequested', 'bidResponse', 'noBid', 'bidWon'].forEach((eventName) => {
      const call = calls.find((c: any[]) => c[0] === eventName);
      const callback = call[1];
      callback({ eventData: eventName });
    });

    expect(instance.events.length).toBe(5);
  });

  it('validates window message event source and origin', () => {
    const instance = new Prebid('pbjs', 'frame1');
    const addEventListenerMock = window.addEventListener as any;
    const messageCall = addEventListenerMock.mock.calls.find((c: any[]) => c[0] === 'message');
    const listener = messageCall[1];

    const sendSpy = vi.spyOn(instance, 'sendDetailsToBackground');

    listener({
      source: window,
      origin: window.origin,
      data: { profPrebid: true, type: POPUP_LOADED },
    });
    expect(sendSpy).toHaveBeenCalled();

    sendSpy.mockClear();

    listener({
      source: window,
      origin: 'https://attacker.com',
      data: { profPrebid: true, type: POPUP_LOADED },
    });
    expect(sendSpy).not.toHaveBeenCalled();

    listener({
      source: window,
      origin: window.origin,
      data: { type: POPUP_LOADED },
    });
    expect(sendSpy).not.toHaveBeenCalled();

    listener({
      source: window,
      origin: window.origin,
      data: { profPrebid: true, type: 'OTHER_EVENT' },
    });
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('getDebugConfig parses valid sessionStorage JSON and handles errors', () => {
    const instance = new Prebid('pbjs', 'frame1');

    (window.sessionStorage.getItem as any).mockReturnValue('{"enabled": true}');
    expect(instance.getDebugConfig()).toEqual({ enabled: true });

    (window.sessionStorage.getItem as any).mockReturnValue('invalid-json');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(instance.getDebugConfig()).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  describe('getEventsObjUrl', () => {
    it('creates no object url when the events array is empty', () => {
      const instance = new Prebid('pbjs', 'frame1');
      instance.events = [];
      (global.URL.createObjectURL as any).mockClear();
      expect(instance.getEventsObjUrl()).toBeNull();
      expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('revokes the previous object url only after the grace period', () => {
      global.URL.revokeObjectURL = vi.fn();
      (global.URL.createObjectURL as any).mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second').mockReturnValueOnce('blob:third');
      const instance = new Prebid('pbjs', 'frame1');
      instance.events = [{ eventType: 'auctionInit', args: {} }];

      expect(instance.getEventsObjUrl()).toBe('blob:first');
      expect(instance.getEventsObjUrl()).toBe('blob:second');
      vi.advanceTimersByTime(29999);
      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:first');

      expect(instance.getEventsObjUrl()).toBe('blob:third');
      vi.advanceTimersByTime(30000);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:second');
      expect(global.URL.revokeObjectURL).not.toHaveBeenCalledWith('blob:third');
    });

    it('prunes doc property on adRenderSucceeded event', () => {
      const instance = new Prebid('pbjs', 'frame1');
      instance.events = [
        {
          eventType: 'adRenderSucceeded',
          args: { adId: '123', doc: { body: 'content' } },
        },
      ];

      const url = instance.getEventsObjUrl();
      expect(url).toBe('blob:http://example.com/mock-blob-url');
    });

    it('handles DOM nodes and circular references in safeStringify', () => {
      const instance = new Prebid('pbjs', 'frame1');
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      const fakeElement = Object.create(HTMLElement.prototype);

      instance.events = [
        {
          eventType: 'custom',
          args: { node: fakeElement, circular: circularObj },
        },
      ];

      const url = instance.getEventsObjUrl();
      expect(url).toBe('blob:http://example.com/mock-blob-url');
    });

    const serializedEvents = async (instance: any): Promise<any[]> => {
      const createObjectURL = global.URL.createObjectURL as any;
      instance.getEventsObjUrl();
      const blob = createObjectURL.mock.calls.at(-1)[0] as Blob;
      return JSON.parse(await blob.text());
    };

    it('keeps objects shared between branches intact instead of calling them circular', async () => {
      const instance = new Prebid('pbjs', 'frame1');

      const noBid = { bidder: 'appnexus', adUnitCode: 'div-1', cpm: 1.5 };
      instance.events = [
        {
          eventType: 'auctionEnd',
          args: { noBids: [noBid], bidderRequests: [{ bidderCode: 'appnexus', bids: [noBid] }] },
        },
      ];

      const [event] = await serializedEvents(instance);
      expect(event.args.noBids[0]).toEqual(noBid);
      expect(event.args.bidderRequests[0].bids[0]).toEqual(noBid);
    });

    it('still replaces a genuine reference cycle', async () => {
      const instance = new Prebid('pbjs', 'frame1');
      const cyclic: any = { bidder: 'appnexus' };
      cyclic.self = cyclic;
      instance.events = [{ eventType: 'auctionEnd', args: { noBids: [cyclic] } }];

      const [event] = await serializedEvents(instance);
      expect(event.args.noBids[0].bidder).toBe('appnexus');
      expect(event.args.noBids[0].self).toBe('[Circular]');
    });

    it('replaces DOM nodes without disturbing the rest of the payload', async () => {
      const instance = new Prebid('pbjs', 'frame1');
      const el = Object.create(HTMLElement.prototype);
      instance.events = [{ eventType: 'auctionEnd', args: { noBids: [{ bidder: 'appnexus', el }] } }];

      const [event] = await serializedEvents(instance);
      expect(event.args.noBids[0]).toEqual({ bidder: 'appnexus', el: '[DOM Node]' });
    });

    it('catches serialization errors and fallback stringifies error metadata', () => {
      const instance = new Prebid('pbjs', 'frame1');
      const throwingObj = {
        get bad() {
          throw new Error('Getter error');
        },
      };

      instance.events = [
        {
          eventType: 'errorEvent',
          args: throwingObj,
          elapsedTime: 123,
        },
      ];

      const url = instance.getEventsObjUrl();
      expect(url).toBe('blob:http://example.com/mock-blob-url');
    });

    it('uses globalPbjs.getEvents when available', () => {
      mockPbjs.getEvents = vi.fn().mockReturnValue([{ eventType: 'auctionInit', args: {} }]);
      const instance = new Prebid('pbjs', 'frame1');
      expect(instance.getEventsObjUrl()).toBe('blob:http://example.com/mock-blob-url');
      expect(mockPbjs.getEvents).toHaveBeenCalled();
    });
  });

  describe('sendDetailsToBackground', () => {
    it('emits prebid details via EventBus', () => {
      const instance = new Prebid('pbjs', 'frame1');
      instance.events = [{ eventType: 'auctionInit', args: {} }];

      instance.sendDetailsToBackground();
      expect(EventBus.emit).toHaveBeenCalledWith(
        EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND,
        expect.objectContaining({
          namespace: 'pbjs',
          frameId: 'frame1',
          version: '7.0.0',
          timeout: 3000,
        })
      );
    });

    it('still reports Prebid with an empty eventsUrl before the first auction', () => {
      const instance = new Prebid('pbjs', 'frame1');
      instance.events = [];
      (EventBus.emit as any).mockClear();

      instance.sendDetailsToBackground();
      expect(EventBus.emit).toHaveBeenCalledWith(EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND, expect.objectContaining({ namespace: 'pbjs', version: '7.0.0', eventsUrl: '' }));
    });

    it('handles optional functions like getUserIdsAsEids missing', () => {
      mockPbjs.getUserIdsAsEids = undefined;
      (window as any).PREBID_TIMEOUT = undefined;

      const instance = new Prebid('pbjs', 'frame1');
      instance.events = [{ eventType: 'auctionInit', args: {} }];

      instance.sendDetailsToBackground();
      expect(EventBus.emit).toHaveBeenCalledWith(
        EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND,
        expect.objectContaining({
          eids: [],
          timeout: null,
        })
      );
    });

    it('emits prebid details even when events array is empty', () => {
      const instance = new Prebid('pbjs', 'frame1');
      instance.events = [];
      instance.sendDetailsToBackground();
      expect(EventBus.emit).toHaveBeenCalledWith(
        EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND,
        expect.objectContaining({
          namespace: 'pbjs',
          frameId: 'frame1',
        })
      );
    });
  });

  describe('throttle', () => {
    it('runs immediately on first call', () => {
      const instance = new Prebid('pbjs', 'frame1');
      const fn = vi.fn();
      instance.lastTimeUpdateSentToContentScript = 0;
      instance.throttle(fn);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('schedules trailing call if invoked within interval', () => {
      const instance = new Prebid('pbjs', 'frame1');
      const fn = vi.fn();
      instance.lastTimeUpdateSentToContentScript = Date.now();

      instance.throttle(fn);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2500);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('runs immediately if interval has passed', () => {
      const instance = new Prebid('pbjs', 'frame1');
      const fn = vi.fn();
      instance.lastTimeUpdateSentToContentScript = Date.now() - 3000;

      instance.throttle(fn);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('reschedules updateTimeout when interval has passed', () => {
      const instance = new Prebid('pbjs', 'frame1');
      const fn = vi.fn();
      instance.lastTimeUpdateSentToContentScript = Date.now() - 3000;
      instance.updateTimeout = setTimeout(() => {}, 5000);

      instance.throttle(fn);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(instance.updateTimeout).toBeDefined();
    });
  });

  describe('addEventListenersForPrebid', () => {
    it('injects prebid instance for window._pbjsGlobals and property descriptor setter', () => {
      (window as any)._pbjsGlobals = ['pbjs'];
      addEventListenersForPrebid('frame-top');

      (window as any)._pbjsGlobals = ['pbjs2'];
      expect((window as any)._pbjsGlobals).toEqual(['pbjs2']);
    });

    it('detects prebid when window._pbjsGlobals.push is used', () => {
      (window as any)._pbjsGlobals = [];
      addEventListenersForPrebid('frame-top');
      (window as any)._pbjsGlobals.push('customPbjs');
      expect((window as any)._pbjsGlobals).toContain('customPbjs');
    });

    it('queues listener attachment when onEvent is not yet available', () => {
      const que: Function[] = [];
      const stubPbjs: any = { que };
      (window as any).stubPbjs = stubPbjs;
      const instance = new Prebid('stubPbjs', 'frame1');
      expect(instance.listenersAdded).toBe(false);
      expect(que.length).toBeGreaterThanOrEqual(1);

      // Now simulate Prebid finishing loading
      stubPbjs.onEvent = vi.fn();
      stubPbjs.getConfig = vi.fn().mockReturnValue({});
      que[0]();
      expect(instance.listenersAdded).toBe(true);
      expect(stubPbjs.onEvent).toHaveBeenCalledWith('auctionInit', expect.any(Function));
    });

    it('uses polling fallback when Object.defineProperty throws an error', () => {
      const definePropertySpy = vi.spyOn(Object, 'defineProperty').mockImplementation(() => {
        throw new Error('Cannot redefine property');
      });

      (window as any)._pbjsGlobals = undefined;
      addEventListenersForPrebid('frame-top');

      (window as any)._pbjsGlobals = ['pbjs'];
      vi.advanceTimersByTime(1000);

      expect(definePropertySpy).toHaveBeenCalled();
      definePropertySpy.mockRestore();
    });
  });
});
