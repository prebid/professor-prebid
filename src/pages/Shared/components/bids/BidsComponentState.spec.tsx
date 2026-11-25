import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';
import BidsComponentState, { getBidKey, BID_FIELD_MAP } from './BidsComponentState';
import AppStateContext from '../../contexts/appStateContext';

describe('BidsComponentState', () => {
  it('handles getBidKey with and without requestId', () => {
    expect(getBidKey({ requestId: 'req-123' } as any)).toBe('req-123');
    expect(getBidKey({ adUnitCode: 'slot-1', bidder: 'rubicon', timeToRespond: 150 } as any)).toBe('-slot-1-rubicon');
  });

  it('evaluates BID_FIELD_MAP accessors', () => {
    const bid: any = {
      bidder: 'rubicon',
      currency: 'USD',
      adUnitCode: 'slot-1',
      mediaType: 'banner',
      cpm: 2.5,
      width: 300,
      height: 250,
      ttl: 300,
      timeToRespond: 120,
      originalCpm: 2.5,
      size: '300x250',
    };

    expect(BID_FIELD_MAP.bidder(bid)).toBe('rubicon');
    expect(BID_FIELD_MAP.currency(bid)).toBe('USD');
    expect(BID_FIELD_MAP.adunitcode(bid)).toBe('slot-1');
    expect(BID_FIELD_MAP.mediatype(bid)).toBe('banner');
    expect(BID_FIELD_MAP.cpm(bid)).toBe(2.5);
    expect(BID_FIELD_MAP.width(bid)).toBe(300);
    expect(BID_FIELD_MAP.height(bid)).toBe(250);
    expect(BID_FIELD_MAP.ttl(bid)).toBe(300);
    expect(BID_FIELD_MAP.timetorespond(bid)).toBe(120);
    expect(BID_FIELD_MAP.originalcpm(bid)).toBe(2.5);
    expect(BID_FIELD_MAP.size(bid)).toBe('300x250');
  });

  it('manages hook state, sorting, missing values, and toggles', () => {
    const mockContext: any = {
      auctionEndEvents: [
        {
          args: {
            bidsReceived: [
              { bidder: 'rubicon', cpm: 5, timeToRespond: 100, width: 300, height: 250, currency: 'USD', adUnitCode: 'slot-1' },
              { bidder: 'appnexus', cpm: 2, timeToRespond: 200, width: 728, height: 90, currency: 'EUR', adUnitCode: 'slot-2' },
              { bidder: 'criteo', cpm: undefined, timeToRespond: 150 },
            ],
            noBids: [{ bidder: 'pubmatic', adUnitCode: 'slot-1' }],
          },
        },
      ],
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => <AppStateContext.Provider value={mockContext}>{children}</AppStateContext.Provider>;

    const { result } = renderHook(() => BidsComponentState(), { wrapper });

    expect(result.current.counts.all).toBe(4);
    expect(result.current.counts.received).toBe(3);
    expect(result.current.counts.nobid).toBe(1);
    expect(result.current.suggestions.length).toBeGreaterThan(0);

    act(() => {
      result.current.toggleGlobalOpen();
    });
    expect(result.current.globalOpen).toBe(true);

    act(() => {
      result.current.toggleSort('cpm');
    });
    expect(result.current.sort.dir).toBe('asc');

    act(() => {
      result.current.toggleSort('bidder');
    });
    expect(result.current.sort.key).toBe('bidder');
    expect(result.current.sort.dir).toBe('asc');

    act(() => {
      result.current.setQuery('bidder:rubicon');
    });
    expect(result.current.sortedBids.length).toBe(1);
  });
});
