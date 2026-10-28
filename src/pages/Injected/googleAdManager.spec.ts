import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EventBus } from '../Shared/utils';

vi.mock('../Shared/utils', () => ({
  EventBus: {
    emit: vi.fn(),
  },
}));

describe('GoogleAdManager', () => {
  let gam: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const mockPubads = {
      addEventListener: vi.fn(),
      getSlots: vi.fn().mockReturnValue([]),
      isSRA: vi.fn().mockReturnValue(false),
    };

    (window as any).googletag = {
      cmd: [] as Function[],
      pubads: () => mockPubads,
      getEventLog: () => ({
        getAllEvents: (): unknown[] => [],
      }),
    };

    const originalPush = (window as any).googletag.cmd.push;
    (window as any).googletag.cmd.push = function (fn: Function) {
      fn();
      return originalPush.call(this, fn);
    };

    const mod = await import('./googleAdManager');
    gam = mod.googleAdManager;
    gam.init();
  });

  describe('init', () => {
    it('initializes googletag and cmd if undefined on window', () => {
      delete (window as any).googletag;
      gam.init();
      expect(gam.googletag).toBeDefined();
      expect(Array.isArray(gam.googletag.cmd)).toBe(true);
    });

    it('queues the listener hook on the shared window.googletag so GPT runs it when it loads', () => {
      delete (window as any).googletag;
      gam.init();
      expect((window as any).googletag).toBe(gam.googletag);
      expect((window as any).googletag.cmd).toHaveLength(1);
    });

    it('initializes cmd array if googletag exists but cmd is not an array', () => {
      (window as any).googletag = { cmd: 'not-an-array' };
      gam.init();
      expect(Array.isArray(gam.googletag.cmd)).toBe(true);
    });
  });

  describe('updatePostAuctionTimestamps', () => {
    it('sets start and end timestamps on first call', () => {
      gam.postAuctionStartTimestamp = null;
      gam.postAuctionEndTimestamp = null;
      gam.updatePostAuctionTimestamps(1000);
      expect(gam.postAuctionStartTimestamp).toBe(1000);
      expect(gam.postAuctionEndTimestamp).toBe(1000);
    });

    it('updates start when lower', () => {
      gam.postAuctionStartTimestamp = 2000;
      gam.postAuctionEndTimestamp = 2000;
      gam.updatePostAuctionTimestamps(1000);
      expect(gam.postAuctionStartTimestamp).toBe(1000);
    });

    it('updates end when higher', () => {
      gam.postAuctionStartTimestamp = 1000;
      gam.postAuctionEndTimestamp = 1000;
      gam.updatePostAuctionTimestamps(3000);
      expect(gam.postAuctionEndTimestamp).toBe(3000);
    });

    it('does not change start/end when input is between start and end', () => {
      gam.postAuctionStartTimestamp = 1000;
      gam.postAuctionEndTimestamp = 3000;
      gam.updatePostAuctionTimestamps(2000);
      expect(gam.postAuctionStartTimestamp).toBe(1000);
      expect(gam.postAuctionEndTimestamp).toBe(3000);
    });
  });

  describe('creativeRenderTime', () => {
    it('returns difference between onload and renderEnded', () => {
      gam.slotEvents = {
        'div-1': [
          { type: 'slotRenderEnded', timestamp: 100 },
          { type: 'slotOnload', timestamp: 250 },
        ],
      };
      expect(gam.creativeRenderTime('div-1')).toBe(150);
    });

    it('returns undefined if events missing', () => {
      gam.slotEvents = {};
      expect(gam.creativeRenderTime('div-1')).toBeUndefined();
    });
  });

  describe('getRequestMode', () => {
    it('returns value from isSRA when pubads is present', () => {
      gam.googletag = {
        pubads: () => ({ isSRA: () => true }),
      };
      expect(gam.getRequestMode()).toBe(true);
    });

    it('returns false when googletag or pubads is missing or returns null', () => {
      gam.googletag = undefined;
      expect(gam.getRequestMode()).toBe(false);

      gam.googletag = { pubads: (): null => null };
      expect(gam.getRequestMode()).toBe(false);
    });
  });

  describe('getFetchBeforeRefresh', () => {
    it('returns false when no events or getEventLog missing or returns null', () => {
      gam.googletag = { getEventLog: (): null => null };
      expect(gam.getFetchBeforeRefresh()).toBe(false);
    });

    it('returns true when fetch occurs before refresh', () => {
      gam.googletag = {
        getEventLog: () => ({
          getAllEvents: () => [{ getMessage: () => ({ getMessageId: () => 3 }) }, { getMessage: () => ({ getMessageId: () => 70 }) }],
        }),
      };
      expect(gam.getFetchBeforeRefresh()).toBe(true);
    });

    it('returns false when refresh occurs before fetch', () => {
      gam.googletag = {
        getEventLog: () => ({
          getAllEvents: () => [{ getMessage: () => ({ getMessageId: () => 70 }) }, { getMessage: () => ({ getMessageId: () => 3 }) }],
        }),
      };
      expect(gam.getFetchBeforeRefresh()).toBe(false);
    });

    it('handles events without getMessage method', () => {
      gam.googletag = {
        getEventLog: () => ({
          getAllEvents: (): unknown[] => [null, {}, { getMessage: (): null => null }, { getMessage: () => ({ getMessageId: (): null => null }) }],
        }),
      };
      expect(gam.getFetchBeforeRefresh()).toBe(false);
    });
  });

  describe('getFetchBeforeKeyValue', () => {
    it('returns false when no events or getEventLog missing or returns null', () => {
      gam.googletag = { getEventLog: (): null => null };
      expect(gam.getFetchBeforeKeyValue()).toBe(false);
    });

    it('returns true when fetch occurs before keyvalue', () => {
      gam.googletag = {
        getEventLog: () => ({
          getAllEvents: () => [{ getMessage: () => ({ getMessageId: () => 70 }) }, { getMessage: () => ({ getMessageId: () => 3 }) }, { getMessage: () => ({ getMessageId: () => 17 }) }],
        }),
      };
      expect(gam.getFetchBeforeKeyValue()).toBe(true);
    });

    it('returns false when keyvalue occurs before fetch', () => {
      gam.googletag = {
        getEventLog: () => ({
          getAllEvents: () => [{ getMessage: () => ({ getMessageId: () => 17 }) }, { getMessage: () => ({ getMessageId: () => 3 }) }],
        }),
      };
      expect(gam.getFetchBeforeKeyValue()).toBe(false);
    });

    it('handles events without getMessage method', () => {
      gam.googletag = {
        getEventLog: () => ({
          getAllEvents: (): unknown[] => [null, {}, { getMessage: (): null => null }, { getMessage: () => ({ getMessageId: (): null => null }) }],
        }),
      };
      expect(gam.getFetchBeforeKeyValue()).toBe(false);
    });
  });

  describe('getRenderMode', () => {
    it('defaults to async (true) when no events or getEventLog missing or returns null', () => {
      gam.googletag = { getEventLog: (): null => null };
      expect(gam.getRenderMode()).toBe(true);
    });

    it('returns false when synchronous rendering event exists', () => {
      gam.googletag = {
        getEventLog: () => ({
          getAllEvents: () => [{ getMessage: () => ({ getMessageId: () => 63, getMessageArgs: () => ['synchronous rendering'] }) }],
        }),
      };
      expect(gam.getRenderMode()).toBe(false);
    });

    it('handles malformed event objects gracefully', () => {
      gam.googletag = {
        getEventLog: () => ({
          getAllEvents: () => [null, {}, { getMessage: () => ({ getMessageId: () => 63, getMessageArgs: () => ['async'] }) }],
        }),
      };
      expect(gam.getRenderMode()).toBe(true);
    });
  });

  describe('getSlots', () => {
    it('returns slots with targeting, sizes, and viewport fallbacks', () => {
      const origInnerWidth = window.innerWidth;
      const origInnerHeight = window.innerHeight;

      Object.defineProperty(window, 'innerWidth', { value: 0, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 0, configurable: true });

      const deprecatedGetter = () => {
        throw new Error('deprecated GPT method called');
      };
      const mockSlot1 = {
        getSlotElementId: () => 'slot-1',
        getAdUnitPath: () => '/1234/unit1',
        getConfig: () => ({ targeting: { kv1: ['v1', 'v2'], kv2: null as string[], kv3: 'single' } }),
        getTargetingMap: deprecatedGetter,
        getTargetingKeys: deprecatedGetter,
        getTargeting: deprecatedGetter,
        getSizes: (w: number, h: number) => ['300x250', { getWidth: () => 728, getHeight: () => 90 }],
      };

      const mockSlot2 = {
        getSlotElementId: () => 'slot-2',
        getAdUnitPath: () => '/1234/unit2',
        getTargetingKeys: (): string[] => [],
        getTargeting: (): string[] => [],
        getSizes: (w?: number): null => {
          if (w !== undefined) return null;
          return null;
        },
      };

      gam.googletag = {
        pubads: () => ({
          getSlots: () => [mockSlot1, mockSlot2],
        }),
      };

      const slots = gam.getSlots();
      expect(slots).toHaveLength(2);
      expect(slots[0]).toEqual({
        elementId: 'slot-1',
        name: '/1234/unit1',
        sizes: ['300x250', '728x90'],
        targeting: [
          { key: 'kv1', value: 'v1,v2' },
          { key: 'kv3', value: 'single' },
        ],
        creativeRenderTime: undefined,
      });
      expect(slots[1]).toEqual({
        elementId: 'slot-2',
        name: '/1234/unit2',
        sizes: [],
        targeting: [],
        creativeRenderTime: undefined,
      });

      Object.defineProperty(window, 'innerWidth', { value: origInnerWidth, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: origInnerHeight, configurable: true });
    });

    it('returns empty array when googletag or pubads is missing', () => {
      gam.googletag = undefined;
      expect(gam.getSlots()).toEqual([]);
    });
  });

  describe('addEventListeners and sendDetailsToContentScript', () => {
    it('registers pubads listeners and handles initial & repeated slot events', () => {
      const listeners: Record<string, Function> = {};
      const mockPubads = {
        addEventListener: vi.fn((name, cb) => {
          listeners[name] = cb;
        }),
        getSlots: vi.fn().mockReturnValue([]),
        isSRA: vi.fn().mockReturnValue(true),
      };

      (window as any).googletag = {
        cmd: [],
        pubads: () => mockPubads,
        getEventLog: () => ({
          getAllEvents: (): unknown[] => [],
        }),
      };

      gam.init();
      (window as any).googletag.cmd.forEach((fn: Function) => fn());

      expect(mockPubads.addEventListener).toHaveBeenCalledWith('slotRequested', expect.any(Function));

      const eventPayload = { slot: { getSlotElementId: () => 'slot-1' } };

      listeners['slotRequested'](eventPayload);
      listeners['slotResponseReceived'](eventPayload);
      listeners['slotRenderEnded'](eventPayload);
      listeners['slotOnload'](eventPayload);
      listeners['slotVisibilityChanged'](eventPayload);
      listeners['impressionViewable'](eventPayload);

      listeners['slotRequested'](eventPayload);
      listeners['slotResponseReceived'](eventPayload);
      listeners['slotRenderEnded'](eventPayload);
      listeners['slotOnload'](eventPayload);
      listeners['slotVisibilityChanged'](eventPayload);
      listeners['impressionViewable'](eventPayload);

      expect(gam.slotEvents['slot-1']).toHaveLength(12);
    });

    it('deduplicates sendDetailsToContentScript messages when content is unchanged', () => {
      gam.lastMessage = undefined;
      gam.googletag = {
        pubads: () => ({ getSlots: (): unknown[] => [], isSRA: () => false }),
        getEventLog: () => ({ getAllEvents: (): unknown[] => [] }),
      };

      gam.sendDetailsToContentScript();
      expect(EventBus.emit).toHaveBeenCalledTimes(1);

      gam.sendDetailsToContentScript();
      expect(EventBus.emit).toHaveBeenCalledTimes(1);
    });
  });
});
