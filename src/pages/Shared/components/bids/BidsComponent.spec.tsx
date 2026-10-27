import React from 'react';
import { render, screen, fireEvent} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BidsComponent, { BidRowComponent,  GridCell } from './BidsComponent';
import { BID_FIELD_MAP, getBidKey } from './BidsComponentState';
import AppStateContext from '../../contexts/appStateContext';

import * as utils from '../../utils';

vi.spyOn(utils, 'download').mockImplementation(() => {});

describe('BidsComponent & BidsComponentState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockReceivedBids = [
    {
      requestId: 'req-1',
      bidder: 'rubicon',
      cpm: 2.5,
      currency: 'USD',
      adUnitCode: 'slot-1-very-long-name-exceeding-thirty-characters',
      width: 300,
      height: 250,
      mediaType: 'banner',
      ttl: 300,
      timeToRespond: 120,
      originalCpm: 2.5,
    },
    {
      requestId: 'req-2',
      bidder: 'criteo',
      cpm: 1.2,
      currency: 'EUR',
      adUnitCode: 'slot-2',
      size: '728x90',
      mediaType: 'banner',
    },
  ];

  const mockNoBids = [
    {
      bidder: 'appnexus',
      adUnitCode: 'slot-1-very-long-name-exceeding-thirty-characters',
      timeToRespond: 200,
    },
  ];

  const mockAuctionEvents: any = [
    {
      args: {
        bidsReceived: mockReceivedBids,
        noBids: mockNoBids,
      },
    },
  ];

  const mockContext: any = {
    auctionEndEvents: mockAuctionEvents,
  };

  it('renders empty message when no bids exist', () => {
    const emptyContext: any = { auctionEndEvents: [] };
    render(
      <AppStateContext.Provider value={emptyContext}>
        <BidsComponent />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('No matching bids')).toBeTruthy();
  });

  it('renders bids, handles preset filter clicks, and sorts columns', () => {
    render(
      <AppStateContext.Provider value={mockContext}>
        <BidsComponent />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('rubicon')).toBeTruthy();
    expect(screen.getByText('2.5')).toBeTruthy();
    expect(screen.getByText('All (3)')).toBeTruthy();
    expect(screen.getByText('Received (2)')).toBeTruthy();

    const receivedFilterBtn = screen.getByText('Received (2)');
    fireEvent.click(receivedFilterBtn);
    expect(screen.getByPlaceholderText('Filter bids...')).toHaveValue('cpm>0');

    const noBidsFilterBtn = screen.getByText('No Bids (1)');
    fireEvent.click(noBidsFilterBtn);
    expect(screen.getByPlaceholderText('Filter bids...')).toHaveValue('cpm=0');

    const allFilterBtn = screen.getByText('All (3)');
    fireEvent.click(allFilterBtn);
    expect(screen.getByPlaceholderText('Filter bids...')).toHaveValue('');

    const bidderHeader = screen.getByText(/Bidder Code/);
    fireEvent.click(bidderHeader);
    fireEvent.click(bidderHeader);

    const cpmHeader = screen.getByText(/CPM/);
    fireEvent.click(cpmHeader);

    const currencyHeader = screen.getByText(/Currency/);
    fireEvent.click(currencyHeader);

    const adUnitHeader = screen.getByText(/AdUnit Code/);
    fireEvent.click(adUnitHeader);

    const sizeHeader = screen.getByText(/Size/);
    fireEvent.click(sizeHeader);

    const mediaTypeHeader = screen.getByText(/Media Type/);
    fireEvent.click(mediaTypeHeader);
  });

  it('triggers download button click', () => {
    render(
      <AppStateContext.Provider value={mockContext}>
        <BidsComponent />
      </AppStateContext.Provider>
    );

    const downloadBtn = screen.getByLabelText('Download filtered bids as JSON');
    fireEvent.click(downloadBtn);

    expect(utils.download).toHaveBeenCalledWith(expect.any(Array), 'filtered-bids');
  });

  it('handles row expand/collapse and global expand/collapse', () => {
    render(
      <AppStateContext.Provider value={mockContext}>
        <BidsComponent />
      </AppStateContext.Provider>
    );

    const expandAllBtn = screen.getByLabelText('expand all rows');
    fireEvent.click(expandAllBtn);

    expect(screen.getByLabelText('collapse all rows')).toBeTruthy();

    const collapseRowBtns = screen.getAllByLabelText('collapse row');
    fireEvent.click(collapseRowBtns[0]);
  });

  it('tests BID_FIELD_MAP and getBidKey edge cases', () => {
    const b: any = {
      bidder: 'rubicon',
      currency: 'USD',
      adUnitCode: 'slot-1',
      mediaType: 'banner',
      cpm: 2.5,
      width: 300,
      height: 250,
      ttl: 300,
      timeToRespond: 100,
      originalCpm: 2.5,
      size: '300x250',
    };

    expect(BID_FIELD_MAP.bidder(b)).toBe('rubicon');
    expect(BID_FIELD_MAP.currency(b)).toBe('USD');
    expect(BID_FIELD_MAP.adunitcode(b)).toBe('slot-1');
    expect(BID_FIELD_MAP.mediatype(b)).toBe('banner');
    expect(BID_FIELD_MAP.cpm(b)).toBe(2.5);
    expect(BID_FIELD_MAP.width(b)).toBe(300);
    expect(BID_FIELD_MAP.height(b)).toBe(250);
    expect(BID_FIELD_MAP.ttl(b)).toBe(300);
    expect(BID_FIELD_MAP.timetorespond(b)).toBe(100);
    expect(BID_FIELD_MAP.originalcpm(b)).toBe(2.5);
    expect(BID_FIELD_MAP.size(b)).toBe('300x250');

    expect(getBidKey(b)).toBe('-slot-1-rubicon');
    expect(getBidKey({ bidder: 'test', adUnitCode: 'slot', timeToRespond: 50 } as any)).toBe('-slot-test');
  });

  it('renders BidRowComponent with missing fields (no cpm, no currency, no size, no mediaType)', () => {
    const incompleteBid: any = {};
    render(<BidRowComponent bid={incompleteBid} globalOpen={false} />);

    expect(screen.getByText('no cpm')).toBeTruthy();
    expect(screen.getByText('no currency')).toBeTruthy();
    expect(screen.getByText('no size')).toBeTruthy();
    expect(screen.getByText('no mediaType')).toBeTruthy();
  });

  it('renders GridCell with custom variant and sx props', () => {
    render(
      <GridCell cols={2} variant="h2" sx={{ color: 'red' }}>
        Cell Text
      </GridCell>
    );
    expect(screen.getByText('Cell Text')).toBeTruthy();
  });
});
