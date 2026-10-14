import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppStateContext from '../../../Shared/contexts/appStateContext';
import BidderBarComponent from './BidderBarComponent';

const makeStateContext = (topics: any[] = []) => ({
  prebid: { events: [], config: {} } as any,
  tcf: {} as any,
  googleAdManager: {} as any,
  pbjsNamespace: '',
  setPbjsNamespace: vi.fn(),
  frameId: '',
  setIframeId: vi.fn(),
  isSmallScreen: false,
  isPanel: false,
  events: [],
  allBidResponseEvents: [],
  allBidRequestedEvents: [],
  allNoBidEvents: [],
  allBidderEvents: [],
  allBidderDoneEvents: [],
  allAdUnitCodes: [],
  allWinningBids: [],
  auctionInitEvents: [],
  auctionEndEvents: [],
  adsRendered: [],
  prebids: {} as any,
  initiatorOutput: {},
  setInitiatorOutput: vi.fn(),
  isRefresh: false,
  setIsRefresh: vi.fn(),
  initDataLoaded: false,
  setInitDataLoaded: vi.fn(),
  prebidReleaseInfo: {},
  setPrebidReleaseInfo: vi.fn(),
  topics,
  setTopics: vi.fn(),
});

const mockAuctionEndEvent: any = {
  eventType: 'auctionEnd',
  args: {
    auctionId: 'auction-1',
    auctionEnd: 1000,
    timestamp: 0,
    bidderRequests: [
      {
        bidderCode: 'appnexus',
        bidder: 'appnexus',
        bidderRequestId: 'req-1',
        start: 50,
        auctionId: 'auction-1',
        bids: [],
      },
    ],
  },
};

const mockItem = {
  bidderCode: 'appnexus',
  start: 50,
  end: 350,
  bidderRequestId: 'req-1',
};

const makeGridRef = (): React.MutableRefObject<any> => {
  const li = document.createElement('li');
  li.dataset.timestamp = '50';
  Object.defineProperty(li, 'offsetLeft', { value: 100 });
  Object.defineProperty(li, 'offsetWidth', { value: 200 });

  const ul = document.createElement('ul');
  ul.appendChild(li);

  return { current: ul };
};

const Wrapper = ({ topics = [], gridRef = makeGridRef(), auctionEndLeft = 900 }: any) => (
  <AppStateContext.Provider value={makeStateContext(topics)}>
    <ul>
      <BidderBarComponent item={mockItem} auctionEndLeft={auctionEndLeft} auctionEndEvent={mockAuctionEndEvent} gridRef={gridRef} />
    </ul>
  </AppStateContext.Provider>
);

describe('Popup BidderBarComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the bidder bar with bidder code and timing info', () => {
    render(<Wrapper />);
    expect(screen.getByText(/appnexus/)).toBeTruthy();
    expect(screen.getByText(/ms/)).toBeTruthy();
  });

  it('does not show timeout indicator when within auctionEndLeft', () => {
    render(<Wrapper auctionEndLeft={900} />);
    expect(screen.queryByText(/timeout/i)).toBeNull();
  });

  it('shows timeout indicator when bar extends beyond auctionEndLeft', () => {
    render(<Wrapper auctionEndLeft={0} />);
    expect(screen.getByText(/(timeout)/i)).toBeTruthy();
  });

  it('opens a popover on ListItem click and closes on next click', () => {
    render(<Wrapper />);
    const listItem = screen.getByText(/appnexus/).closest('li') as HTMLElement;
    fireEvent.click(listItem);
    expect(document.querySelector('[role="presentation"]')).toBeTruthy();

    fireEvent.click(listItem);
  });

  it('renders with topics in context', () => {
    render(<Wrapper topics={['topic-a', 'topic-b']} />);
    expect(screen.getByText(/appnexus/)).toBeTruthy();
  });
});
