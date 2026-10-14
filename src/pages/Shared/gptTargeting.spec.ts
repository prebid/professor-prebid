import { describe, expect, it, vi } from 'vitest';
import { getSlotTargeting } from './gptTargeting';

describe('getSlotTargeting', () => {
  it('uses the current API without calling deprecated getters', () => {
    const deprecated = vi.fn(() => {
      throw new Error('deprecated GPT method called');
    });
    const getConfig = vi.fn(() => ({ targeting: { hb_bidder: 'example', interests: ['sports', 'music'], empty: '' } }));

    expect(getSlotTargeting({ getConfig, getTargetingKeys: deprecated, getTargeting: deprecated })).toEqual({ hb_bidder: ['example'], interests: ['sports', 'music'], empty: [''] });
    expect(getConfig).toHaveBeenCalledWith('targeting');
    expect(deprecated).not.toHaveBeenCalled();
  });

  it.each([{ targeting: undefined }, { targeting: null }, { targeting: {} }])('does not fall back when current targeting is empty: %j', (config) => {
    const getTargetingKeys = vi.fn();
    expect(getSlotTargeting({ getConfig: () => config, getTargetingKeys, getTargeting: vi.fn() })).toEqual({});
    expect(getTargetingKeys).not.toHaveBeenCalled();
  });

  it('supports older GPT versions without getConfig', () => {
    const getTargeting = vi.fn((key: string) => (key === 'hb_bidder' ? ['example'] : ['sports', 'music']));
    expect(getSlotTargeting({ getTargetingKeys: () => ['hb_bidder', 'interests'], getTargeting })).toEqual({ hb_bidder: ['example'], interests: ['sports', 'music'] });
    expect(getTargeting.mock.calls).toEqual([['hb_bidder'], ['interests']]);
  });

  it('returns empty targeting for a missing slot', () => {
    expect(getSlotTargeting(undefined)).toEqual({});
    expect(getSlotTargeting(null)).toEqual({});
  });

  it('skips unset values and preserves keys that match object properties', () => {
    const targeting = Object.fromEntries([
      ['__proto__', ['example']],
      ['toString', ['value']],
      ['unset', null],
    ]);
    const result = getSlotTargeting({ getConfig: () => ({ targeting }), getTargetingKeys: vi.fn(), getTargeting: vi.fn() });
    expect(Object.keys(result)).toEqual(['__proto__', 'toString']);
    expect(result['__proto__']).toEqual(['example']);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });

  it('does not share mutable arrays with GPT', () => {
    const values = ['sports'];
    const result = getSlotTargeting({ getConfig: () => ({ targeting: { interests: values } }), getTargetingKeys: vi.fn(), getTargeting: vi.fn() });
    result.interests.push('music');
    expect(values).toEqual(['sports']);
  });
});
