import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';
import AdUnitsComponentState from './AdUnitsComponentState';
import AppStateContext from '../../contexts/appStateContext';

describe('AdUnitsComponentState', () => {
  it('handles empty/undefined auctionInitEvents', () => {
    const mockContext: any = {
      auctionInitEvents: undefined,
      allWinningBids: [],
      adsRendered: [],
      prebid: {},
      allBidderEvents: [],
      allAdUnitCodes: [],
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => <AppStateContext.Provider value={mockContext}>{children}</AppStateContext.Provider>;

    const { result } = renderHook(() => AdUnitsComponentState(), { wrapper });

    expect(result.current.adUnits).toEqual([]);
    expect(result.current.filteredAdUnits).toEqual([]);
  });

  it('processes and merges duplicated adUnits across auctions', () => {
    const mockContext: any = {
      auctionInitEvents: [
        {
          args: {
            adUnits: [
              {
                code: 'unit-1',
                mediaTypes: {
                  banner: {
                    sizes: [
                      [300, 250],
                      [300, 600],
                    ],
                  },
                },
                sizes: [[300, 250]],
                bids: [{ bidder: 'rubicon', params: { siteId: '1' } }],
                ortb2Imp: { ext: { gpid: '/123/banner' } },
                transactionId: 'tx-1',
                adUnitId: 'au-1',
              },
              {
                code: 'unit-2',
                mediaTypes: { video: { playerSize: [[640, 480]] } },
                sizes: [[640, 480]],
                bids: [{ bidder: 'appnexus', params: {} }],
              },
              {
                code: 'unit-3-native',
                mediaTypes: { native: { title: { required: true } } } as any,
              },
            ],
          },
        },
        {
          args: {
            adUnits: [
              {
                code: 'unit-1',
                mediaTypes: {
                  banner: {
                    sizes: [
                      [300, 250],
                      [300, 600],
                    ],
                  },
                },
                sizes: [[300, 250]],
                bids: [{ bidder: 'rubicon', params: { siteId: '1' } }],
                customField: { deep: { prop: 'merged-value' } },
              },
            ],
          },
        },
      ],
      allWinningBids: [],
      adsRendered: [],
      prebid: {},
      allBidderEvents: ['rubicon', 'appnexus'],
      allAdUnitCodes: ['unit-1', 'unit-2', 'unit-3-native'],
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => <AppStateContext.Provider value={mockContext}>{children}</AppStateContext.Provider>;

    const { result } = renderHook(() => AdUnitsComponentState(), { wrapper });

    expect(result.current.adUnits.length).toBe(3);
    expect(result.current.suggestions.length).toBeGreaterThan(0);

    act(() => {
      result.current.setQuery('mediatype:native');
    });
    expect(result.current.filteredAdUnits.length).toBe(1);

    act(() => {
      result.current.setQuery('width=300');
    });
    expect(result.current.filteredAdUnits.length).toBe(1);

    act(() => {
      result.current.setQuery('height=480');
    });
    expect(result.current.filteredAdUnits.length).toBe(1);

    act(() => {
      result.current.setQuery('mediatype:video');
    });
    expect(result.current.filteredAdUnits.length).toBe(1);

    act(() => {
      result.current.setQuery('gpid:/123/banner');
    });
    expect(result.current.filteredAdUnits.length).toBe(1);

    act(() => {
      result.current.setQuery('transactionid:tx-1');
    });
    expect(result.current.filteredAdUnits.length).toBe(1);

    act(() => {
      result.current.setQuery('adunitid:au-1');
    });
    expect(result.current.filteredAdUnits.length).toBe(1);
  });
});
