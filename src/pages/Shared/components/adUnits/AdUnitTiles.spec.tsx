import React from 'react';
import { render, screen, fireEvent} from '@testing-library/react';
import { describe, it, expect} from 'vitest';
import { AdUnitTile, AdServerTile, BiddersTile, MediaTypesTile, Ortb2ImpTile } from './AdUnitTiles';
import AppStateContext from '../../contexts/appStateContext';

describe('AdUnitTiles components', () => {
  const mockAdUnit: any = {
    code: 'slot-1',
    mediaTypes: {
      banner: { sizes: [[300, 250]] },
    },
    bids: [{ bidder: 'rubicon', params: {} }],
    ortb2Imp: { instl: 1, ext: { gpid: '/12345/slot' } },
  };

  const mockAppState: any = {
    isPanel: true,
    googleAdManager: {
      slots: [
        {
          name: 'slot-1',
          elementId: 'slot-1',
          sizes: ['300x250'],
          targeting: [
            { key: 'kw', value: 'news' },
            { key: 'emptyKey', value: '' },
          ],
        },
      ],
    },
    allWinningBids: [
      {
        args: {
          adUnitCode: 'slot-1',
          bidder: 'rubicon',
          mediaType: 'banner',
          size: '300x250',
        },
      },
    ],
    allBidResponseEvents: [
      {
        args: {
          adUnitCode: 'slot-1',
          bidder: 'rubicon',
          mediaType: 'banner',
          size: '300x250',
          cpm: 2.5,
          currency: 'USD',
        },
      },
    ],
    allBidRequestedEvents: [
      {
        args: {
          bidderCode: 'rubicon',
          bids: [{ adUnitCode: 'slot-1' }],
        },
      },
    ],
    adsRendered: [
      {
        args: {
          bid: { adUnitCode: 'slot-1', bidder: 'rubicon' },
        },
      },
    ],
  };

  it('renders AdUnitTile and toggles expanded view', () => {
    render(
      <AppStateContext.Provider value={mockAppState}>
        <AdUnitTile adUnit={mockAdUnit} colCount={3} />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('slot-1')).toBeTruthy();
    expect(screen.getByText('Interstitial')).toBeTruthy();

    const expandBtn = screen.getByLabelText('show more');
    fireEvent.click(expandBtn);

    expect(screen.getByText('AdUnit JSON:')).toBeTruthy();
  });

  it('renders AdServerTile when slot is found and toggles expanded JSON view', () => {
    render(
      <AppStateContext.Provider value={mockAppState}>
        <AdServerTile adUnit={mockAdUnit} colCount={3} />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('300x250')).toBeTruthy();
    expect(screen.getByText('kw: news')).toBeTruthy();

    const expandBtn = screen.getByLabelText('show more');
    fireEvent.click(expandBtn);
    expect(screen.getByText('Ad Server Slot JSON:')).toBeTruthy();
  });

  it('renders AdServerTile when no slot matches', () => {
    const emptySlotState: any = {
      ...mockAppState,
      googleAdManager: {
        slots: [
          { name: 'other-slot-1', elementId: 'other-slot-1' },
          { name: 'other-slot-2', elementId: 'other-slot-2' },
        ],
      },
    };

    render(
      <AppStateContext.Provider value={emptySlotState}>
        <AdServerTile adUnit={{ code: 'unmatched-slot' } as any} colCount={3} />
      </AppStateContext.Provider>
    );

    expect(screen.getAllByText('Unable to match Prebid AdUnit with ad-server slot.')).toBeTruthy();
  });

  it('renders BiddersTile with bid status and toggles expansion', () => {
    render(
      <AppStateContext.Provider value={mockAppState}>
        <BiddersTile adUnit={mockAdUnit} colCount={3} />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('rubicon (2.50 USD)')).toBeTruthy();

    const expandBtn = screen.getByLabelText('show more');
    fireEvent.click(expandBtn);
    expect(screen.getByText('Bids JSON:')).toBeTruthy();
  });

  it('renders MediaTypesTile with banner sizes and matches winning size', () => {
    render(
      <AppStateContext.Provider value={mockAppState}>
        <MediaTypesTile adUnit={mockAdUnit} colCount={3} />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('300x250')).toBeTruthy();

    const expandBtn = screen.getByLabelText('show more');
    fireEvent.click(expandBtn);
  });

  it('renders MediaTypesTile when mediaTypes is empty', () => {
    const emptyMediaAdUnit: any = { code: 'slot-2', mediaTypes: {} };
    render(
      <AppStateContext.Provider value={mockAppState}>
        <MediaTypesTile adUnit={emptyMediaAdUnit} colCount={3} />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('Media Types Object:')).toBeTruthy();
  });

  it('renders Ortb2ImpTile when ortb2Imp is present and returns null when absent', () => {
    const { rerender } = render(
      <AppStateContext.Provider value={mockAppState}>
        <Ortb2ImpTile adUnit={mockAdUnit} colCount={3} />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('ORTB2 Imp:')).toBeTruthy();

    rerender(
      <AppStateContext.Provider value={mockAppState}>
        <Ortb2ImpTile adUnit={{ code: 'slot-no-ortb' } as any} colCount={3} />
      </AppStateContext.Provider>
    );

    expect(screen.queryByText('ORTB2 Imp:')).toBeNull();
  });
});
