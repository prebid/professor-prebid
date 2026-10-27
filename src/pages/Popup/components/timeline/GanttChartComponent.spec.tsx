import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppStateContext from '../../../Shared/contexts/appStateContext';
import GanttChartComponent from './GanttChartComponent';

const makeStateContext = (overrides: any = {}) => ({
  prebid: { events: [], config: { bidderTimeout: 3000 }, ...overrides.prebid } as any,
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
  topics: [{ topic: 1 }],
  setTopics: vi.fn(),
  ...overrides,
});

const makeBidderRequest = (overrides: any = {}) => ({
  bidderCode: 'appnexus',
  bidder: 'appnexus',
  bidderRequestId: 'req-1',
  auctionId: 'auction-abc12345',
  start: 100,
  bids: [{ cpm: 2.0, timeToRespond: 150 }],
  ...overrides,
});

const makeAuctionEndEvent = (bidderRequests: any[] = [makeBidderRequest()]): any => ({
  eventType: 'auctionEnd',
  args: {
    auctionId: 'auction-abc12345',
    auctionEnd: 500,
    timestamp: 0,
    bidderRequests,
  },
});

const Wrapper = ({ children, contextOverrides }: { children: React.ReactNode; contextOverrides?: any }) => <AppStateContext.Provider value={makeStateContext(contextOverrides)}>{children}</AppStateContext.Provider>;

describe('Popup GanttChartComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "No auction events" when no auctionEndEvent is provided (single mode)', () => {
    render(
      <Wrapper>
        <GanttChartComponent mode="single" />
      </Wrapper>
    );
    expect(screen.getByText(/No auction events logged/i)).toBeTruthy();
  });

  it('shows "No auction events" when auctionEndEvents is empty (stacked mode)', () => {
    render(
      <Wrapper>
        <GanttChartComponent mode="stacked" auctionEndEvents={[]} />
      </Wrapper>
    );
    expect(screen.getByText(/No auction events logged/i)).toBeTruthy();
  });

  it('renders the SVG gantt chart for a single auction event with NO BID', () => {
    const emptyBidder = makeBidderRequest({ bids: [] });
    const auctionEndEvent = makeAuctionEndEvent([emptyBidder]);
    render(
      <Wrapper>
        <GanttChartComponent mode="single" auctionEndEvent={auctionEndEvent} />
      </Wrapper>
    );
    const svgEl = document.querySelector('svg');
    expect(svgEl).toBeTruthy();
    expect(screen.getByText('appnexus')).toBeTruthy();
    expect(screen.getByText('NO BID')).toBeTruthy();
  });

  it('renders a BID status badge with responseTimestamp fallback', () => {
    const bidResponseEvent = {
      eventType: 'bidResponse',
      args: { auctionId: 'auction-abc12345', bidderCode: 'appnexus', cpm: 1.5, responseTimestamp: 1200, requestTimestamp: 1000 },
    };
    render(
      <Wrapper contextOverrides={{ prebid: { events: [bidResponseEvent], config: { bidderTimeout: 3000 } } }}>
        <GanttChartComponent mode="single" auctionEndEvent={makeAuctionEndEvent()} />
      </Wrapper>
    );
    expect(screen.getByText(/BID/i)).toBeTruthy();
  });

  it('renders noBidEvent and calculates latency from responseTimestamp without timeToRespond', () => {
    const noBidEvent = {
      eventType: 'noBid',
      args: { auctionId: 'auction-abc12345', bidderCode: 'appnexus', responseTimestamp: 1150 },
    };
    render(
      <Wrapper contextOverrides={{ prebid: { events: [noBidEvent], config: { bidderTimeout: 3000 } } }}>
        <GanttChartComponent mode="single" auctionEndEvent={makeAuctionEndEvent()} />
      </Wrapper>
    );
    expect(screen.getByText('NO BID')).toBeTruthy();
  });

  it('renders timeout line inside plot when configuredTimeout is within plot range', () => {
    const auctionEndEvent = makeAuctionEndEvent();
    render(
      <Wrapper contextOverrides={{ prebid: { events: [], config: { bidderTimeout: 400 } } }}>
        <GanttChartComponent mode="single" auctionEndEvent={auctionEndEvent} />
      </Wrapper>
    );
    expect(document.querySelector('svg')).toBeTruthy();
  });

  it('renders timed out bidder when latency exceeds timeout and opens modal on click', () => {
    const timedOutBidder = makeBidderRequest({ bidderCode: 'slowBidder', start: 0, bids: [{ timeToRespond: 500 }] });
    const auctionEndEvent = makeAuctionEndEvent([timedOutBidder]);
    const timeoutEvent = {
      eventType: 'bidTimeout',
      args: [{ bidder: 'slowBidder', auctionId: 'auction-abc12345' }],
    };
    render(
      <Wrapper contextOverrides={{ prebid: { events: [timeoutEvent], config: { bidderTimeout: 100 } } }}>
        <GanttChartComponent mode="single" auctionEndEvent={auctionEndEvent} />
      </Wrapper>
    );
    expect(screen.getByText('slowBidder')).toBeTruthy();

    const slowBidderLabel = screen.getByText('slowBidder');
    fireEvent.click(slowBidderLabel);

    expect(screen.getAllByText('TIMEOUT').length).toBeGreaterThan(0);
  });

  it('renders "No bidders matched" when query filters out all bidders', () => {
    const auctionEndEvent = makeAuctionEndEvent();
    render(
      <Wrapper>
        <GanttChartComponent mode="single" auctionEndEvent={auctionEndEvent} query="zzznomatch" />
      </Wrapper>
    );
    expect(screen.getByText(/No bidders matched your filter query/i)).toBeTruthy();
  });

  it('filters bidders correctly with structured bidder: prefix query', () => {
    const auctionEndEvent = makeAuctionEndEvent([makeBidderRequest({ bidderCode: 'rubicon' }), makeBidderRequest({ bidderCode: 'appnexus' })]);
    render(
      <Wrapper>
        <GanttChartComponent mode="single" auctionEndEvent={auctionEndEvent} query="bidder:rubicon" />
      </Wrapper>
    );
    expect(screen.getByText('rubicon')).toBeTruthy();
    expect(screen.queryByText('appnexus')).toBeNull();
  });

  it('renders stacked mode with a section header', () => {
    const events = [makeAuctionEndEvent(), makeAuctionEndEvent([makeBidderRequest({ bidderCode: 'rubicon' })])];
    render(
      <Wrapper>
        <GanttChartComponent mode="stacked" auctionEndEvents={events} />
      </Wrapper>
    );
    const auctionHeaders = screen.getAllByText(/Auction #/);
    expect(auctionHeaders.length).toBeGreaterThanOrEqual(1);
  });

  it('renders pre-auction rows, handles child rows, notes, warnings, and dialog interactions', () => {
    const auctionInitEvent = {
      eventType: 'auctionInit',
      args: {
        auctionId: 'auction-abc12345',
        timestamp: 1000,
        adUnits: [{ code: 'unit-1', bids: [{ bidder: 'appnexus' }] }],
      },
    };
    const auctionEndEvent: any = {
      eventType: 'auctionEnd',
      args: {
        auctionId: 'auction-abc12345',
        timestamp: 1000,
        auctionEnd: 2000,
        metrics: {
          'requestBids.total': 1300,
          'requestBids.rtd': 100,
          'requestBids.userId': 50,
          'userId.mods.criteo.init': 30,
        },
        bidderRequests: [makeBidderRequest({ start: 1000 })],
      },
    };
    const mockConfig = {
      bidderTimeout: 3000,
      userSync: { auctionDelay: 300, userIds: [{ name: 'criteo' }] },
      realTimeData: { auctionDelay: 200, dataProviders: [{ name: 'rtd', waitForIt: true }] },
    };

    render(
      <Wrapper contextOverrides={{ prebid: { events: [auctionInitEvent, auctionEndEvent], config: mockConfig } }}>
        <GanttChartComponent mode="single" auctionEndEvent={auctionEndEvent} showPreAuction={true} />
      </Wrapper>
    );

    expect(document.querySelector('svg')).toBeTruthy();
    expect(screen.getByText('Auction Start')).toBeTruthy();

    const bidderRow = screen.getByText('appnexus');
    fireEvent.click(bidderRow);

    const closeBtn = screen.getByRole('button', { name: /close/i });
    expect(closeBtn).toBeTruthy();
    fireEvent.click(closeBtn);

    const preAuctionRow = screen.getByText('Real Time Data');
    fireEvent.click(preAuctionRow);

    expect(screen.getByText('PRE-AUCTION')).toBeTruthy();
    const closeBtn2 = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn2);
  });
});
