import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { iabTcf } from './tcf';
import { EventBus } from '../Shared/utils';

vi.mock('../Shared/utils', () => ({
  EventBus: {
    emit: vi.fn(),
  },
}));

describe('IabTcf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).__cmp = undefined;
    (window as any).__tcfapi = undefined;
    iabTcf.stopLoop = true;
    iabTcf.lastMessage = undefined;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('isTCFInpage returns false when no CMP', () => {
    expect(iabTcf.isTCFInpage()).toBeFalsy();
  });

  it('isTCFInpage returns truthy when __cmp exists', () => {
    (window as any).__cmp = vi.fn();
    expect(iabTcf.isTCFInpage()).toBeTruthy();
  });

  it('isTCFInpage returns truthy when __tcfapi exists', () => {
    (window as any).__tcfapi = vi.fn();
    expect(iabTcf.isTCFInpage()).toBeTruthy();
  });

  it('criteoVendorId is 91', () => {
    expect(iabTcf.criteoVendorId).toBe(91);
  });

  it('init sets stopLoop to true after 8000ms and calls loop', () => {
    vi.useFakeTimers();
    const loopSpy = vi.spyOn(iabTcf, 'loop').mockImplementation(() => {});
    iabTcf.stopLoop = false;
    iabTcf.init();
    expect(loopSpy).toHaveBeenCalled();
    vi.advanceTimersByTime(8000);
    expect(iabTcf.stopLoop).toBe(true);
    loopSpy.mockRestore();
  });

  it('loop calls sendDetailsToContentScript if TCF is in page', () => {
    (window as any).__tcfapi = vi.fn();
    const sendSpy = vi.spyOn(iabTcf, 'sendDetailsToContentScript').mockImplementation(() => {});
    iabTcf.loop();
    expect(sendSpy).toHaveBeenCalled();
    sendSpy.mockRestore();
  });

  it('loop schedules another loop if not TCF in page and stopLoop is false', () => {
    vi.useFakeTimers();
    iabTcf.stopLoop = false;
    const sendSpy = vi.spyOn(iabTcf, 'sendDetailsToContentScript').mockImplementation(() => {});

    iabTcf.loop();
    expect(iabTcf.stopLoop).toBe(false);

    iabTcf.stopLoop = true;
    vi.advanceTimersByTime(1000);
    sendSpy.mockRestore();
  });

  it('loop does not schedule another loop if stopLoop is true', () => {
    vi.useFakeTimers();
    iabTcf.stopLoop = true;
    const sendSpy = vi.spyOn(iabTcf, 'sendDetailsToContentScript').mockImplementation(() => {});
    iabTcf.loop();
    expect(vi.getTimerCount()).toBe(0);
    sendSpy.mockRestore();
  });

  it('pingV1 invokes callback with cmpLoaded when success is true', () => {
    (window as any).__cmp = vi.fn((cmd, param, cb) => cb({ cmpLoaded: true }, true));
    const cb = vi.fn();
    iabTcf.pingV1(cb);
    expect(cb).toHaveBeenCalledWith(true);
  });

  it('pingV1 invokes callback with false when success is false', () => {
    (window as any).__cmp = vi.fn((cmd, param, cb) => cb({ cmpLoaded: true }, false));
    const cb = vi.fn();
    iabTcf.pingV1(cb);
    expect(cb).toHaveBeenCalledWith(false);
  });

  it('pingV1 handles error when __cmp throws', () => {
    (window as any).__cmp = vi.fn(() => {
      throw new Error('fail');
    });
    const cb = vi.fn();
    iabTcf.pingV1(cb);
    expect(cb).toHaveBeenCalledWith(false);
  });

  it('pingV1 works safely when callback is not provided', () => {
    (window as any).__cmp = vi.fn((cmd, param, cb) => cb({ cmpLoaded: true }, true));
    expect(() => iabTcf.pingV1(null)).not.toThrow();
  });

  it('pingV1 handles error when callback is not provided and __cmp throws', () => {
    (window as any).__cmp = vi.fn(() => {
      throw new Error('fail');
    });
    expect(() => iabTcf.pingV1(null)).not.toThrow();
  });

  it('getConsentDataV1 invokes callback with consentData when success is true', () => {
    (window as any).__cmp = vi.fn((cmd, param, cb) => cb('consent_str', true));
    const cb = vi.fn();
    iabTcf.getConsentDataV1(cb);
    expect(cb).toHaveBeenCalledWith('consent_str');
  });

  it('getConsentDataV1 invokes callback with null when success is false', () => {
    (window as any).__cmp = vi.fn((cmd, param, cb) => cb('consent_str', false));
    const cb = vi.fn();
    iabTcf.getConsentDataV1(cb);
    expect(cb).toHaveBeenCalledWith(null);
  });

  it('getConsentDataV1 handles error when __cmp throws', () => {
    (window as any).__cmp = vi.fn(() => {
      throw new Error('fail');
    });
    const cb = vi.fn();
    iabTcf.getConsentDataV1(cb);
    expect(cb).toHaveBeenCalledWith(null);
  });

  it('getConsentDataV1 works safely when callback is not provided', () => {
    (window as any).__cmp = vi.fn((cmd, param, cb) => cb('consent_str', true));
    expect(() => iabTcf.getConsentDataV1(null)).not.toThrow();
  });

  it('getConsentDataV1 handles error when callback is not provided and __cmp throws', () => {
    (window as any).__cmp = vi.fn(() => {
      throw new Error('fail');
    });
    expect(() => iabTcf.getConsentDataV1(null)).not.toThrow();
  });

  it('pingV2 invokes callback with pingReturn', () => {
    (window as any).__tcfapi = vi.fn((cmd, ver, cb) => cb({ cmpLoaded: true }));
    const cb = vi.fn();
    iabTcf.pingV2(cb);
    expect(cb).toHaveBeenCalledWith({ cmpLoaded: true });
  });

  it('pingV2 handles error when __tcfapi throws', () => {
    (window as any).__tcfapi = vi.fn(() => {
      throw new Error('fail');
    });
    const cb = vi.fn();
    iabTcf.pingV2(cb);
    expect(cb).toHaveBeenCalledWith(null);
  });

  it('pingV2 works safely when callback is not provided', () => {
    (window as any).__tcfapi = vi.fn((cmd, ver, cb) => cb({ cmpLoaded: true }));
    expect(() => iabTcf.pingV2(null)).not.toThrow();
  });

  it('pingV2 handles error when callback is not provided and __tcfapi throws', () => {
    (window as any).__tcfapi = vi.fn(() => {
      throw new Error('fail');
    });
    expect(() => iabTcf.pingV2(null)).not.toThrow();
  });

  it('getTCDataV2 invokes callback with tcData when success is true', () => {
    (window as any).__tcfapi = vi.fn((cmd, ver, cb) => cb('tc_data_str', true));
    const cb = vi.fn();
    iabTcf.getTCDataV2(cb);
    expect(cb).toHaveBeenCalledWith('tc_data_str');
  });

  it('getTCDataV2 invokes callback with null when success is false', () => {
    (window as any).__tcfapi = vi.fn((cmd, ver, cb) => cb('tc_data_str', false));
    const cb = vi.fn();
    iabTcf.getTCDataV2(cb);
    expect(cb).toHaveBeenCalledWith(null);
  });

  it('getTCDataV2 handles error when __tcfapi throws', () => {
    (window as any).__tcfapi = vi.fn(() => {
      throw new Error('fail');
    });
    const cb = vi.fn();
    iabTcf.getTCDataV2(cb);
    expect(cb).toHaveBeenCalledWith(null);
  });

  it('getTCDataV2 works safely when callback is not provided', () => {
    (window as any).__tcfapi = vi.fn((cmd, ver, cb) => cb('tc_data_str', true));
    expect(() => iabTcf.getTCDataV2(null)).not.toThrow();
  });

  it('getTCDataV2 handles error when callback is not provided and __tcfapi throws', () => {
    (window as any).__tcfapi = vi.fn(() => {
      throw new Error('fail');
    });
    expect(() => iabTcf.getTCDataV2(null)).not.toThrow();
  });

  it('sendDetailsToContentScript emits v1 and v2 details via EventBus', () => {
    iabTcf.lastMessage = undefined;

    (window as any).__cmp = vi.fn((cmd, param, cb) => {
      if (cmd === 'ping') cb({ cmpLoaded: true }, true);
      if (cmd === 'getConsentData') cb({ gdprApplies: true, consentData: 'v1_str' }, true);
    });

    (window as any).__tcfapi = vi.fn((cmd, ver, cb) => {
      if (cmd === 'ping') cb({ cmpLoaded: true, gdprApplies: false });
      if (cmd === 'getTCData') cb({ tcString: 'v2_str' }, true);
    });

    iabTcf.sendDetailsToContentScript();
    expect(EventBus.emit).toHaveBeenCalledTimes(2);
  });

  it('sendDetailsToContentScript skips emitting when message is duplicate', () => {
    iabTcf.lastMessage = undefined;

    (window as any).__cmp = vi.fn((cmd, param, cb) => {
      if (cmd === 'ping') cb({ cmpLoaded: true }, true);
      if (cmd === 'getConsentData') cb({ gdprApplies: true, consentData: 'v1_str' }, true);
    });

    iabTcf.sendDetailsToContentScript();
    expect(EventBus.emit).toHaveBeenCalledTimes(1);

    iabTcf.sendDetailsToContentScript();
    expect(EventBus.emit).toHaveBeenCalledTimes(1);
  });

  it('sendDetailsToContentScript handles errors gracefully when pingV1 or pingV2 throw', () => {
    iabTcf.lastMessage = undefined;

    (window as any).__cmp = vi.fn(() => {
      throw new Error('cmp fail');
    });
    (window as any).__tcfapi = vi.fn(() => {
      throw new Error('tcfapi fail');
    });

    expect(() => iabTcf.sendDetailsToContentScript()).not.toThrow();
  });
});
