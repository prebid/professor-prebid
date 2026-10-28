import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGamSlotDetails } from './useGamSlotDetails';

describe('useGamSlotDetails', () => {
  let listeners: Record<string, (event: any) => void>;
  let responseInfo: any;
  const slot = {
    getSlotElementId: () => 'div-gpt-top',
    getAdUnitPath: () => '/1234,5678/site/top',
    getResponseInformation: () => responseInfo,
    getTargetingKeys: (): string[] => ['hb_bidder'],
    getTargeting: (key: string) => (key === 'hb_bidder' ? ['ix'] : []),
    getConfig: (): unknown => ({ targeting: { hb_bidder: ['ix'] } }),
  };

  beforeEach(() => {
    listeners = {};
    responseInfo = null;
    (window as any).parent = {
      googletag: {
        pubads: () => ({
          getSlots: () => [slot],
          addEventListener: vi.fn((type: string, fn: (event: any) => void) => (listeners[type] = fn)),
          removeEventListener: vi.fn(),
        }),
      },
    };
  });

  it('finds the slot by its div id or by the last segment of its ad unit path', () => {
    for (const code of ['div-gpt-top', 'top']) {
      const { result } = renderHook(() => useGamSlotDetails(code));
      expect(result.current.slotElementId).toBe('div-gpt-top');
      expect(result.current.slotAdUnitPath).toBe('/1234,5678/site/top');
      expect(result.current.networkId).toEqual(['1234', '5678']);
    }
  });

  it('reads the line item again when GPT reports a new response for the slot', () => {
    const { result } = renderHook(() => useGamSlotDetails('div-gpt-top'));
    expect(result.current.lineItemId).toBeNull();

    responseInfo = { lineItemId: 42, creativeId: 7 };
    act(() => listeners.slotRenderEnded({ slot }));

    expect(result.current.lineItemId).toBe(42);
    expect(result.current.creativeId).toBe(7);
  });

  it('stays empty while disabled', () => {
    const { result } = renderHook(() => useGamSlotDetails('div-gpt-top', false));
    expect(result.current.slotElementId).toBeNull();
  });
});
