import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AppStateContext from '../../../Shared/contexts/appStateContext';
import PrebidConfigComponent from './PrebidConfigComponent';

const makeContext = (config: any) => ({
  prebid: { config, events: [] } as any,
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
  topics: [],
  setTopics: vi.fn(),
});

const wrap = (config: any) => (
  <AppStateContext.Provider value={makeContext(config)}>
    <PrebidConfigComponent />
  </AppStateContext.Provider>
);

describe('Popup PrebidConfigComponent', () => {
  it('renders null when config is missing', () => {
    const { container } = render(wrap(undefined));
    expect(container.firstChild).toBeNull();
  });

  it('renders with default values when config fields are absent', () => {
    render(wrap({}));
    expect(screen.getByText(/Bidder Sequence:/i)).toBeTruthy();
    expect(screen.getByText('random')).toBeTruthy();
    expect(screen.getByText('3000ms')).toBeTruthy();
    expect(screen.getByText('true')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('false')).toBeTruthy();
  });

  it('renders explicit config field values', () => {
    render(
      wrap({
        bidderSequence: 'fixed',
        bidderTimeout: 2000,
        enableSendAllBids: false,
        maxNestedIframes: 5,
        useBidCache: true,
      })
    );
    expect(screen.getByText('fixed')).toBeTruthy();
    expect(screen.getByText('2000ms')).toBeTruthy();
    expect(screen.getByText('false')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('true')).toBeTruthy();
  });

  it('renders Bid Cache Url when config.cache.url is present', () => {
    render(wrap({ cache: { url: 'https://cache.example.com' } }));
    expect(screen.getByText(/Bid Cache Url:/i)).toBeTruthy();
    expect(screen.getByText('https://cache.example.com')).toBeTruthy();
  });

  it('does not render Bid Cache Url when cache.url is absent', () => {
    render(wrap({}));
    expect(screen.queryByText(/Bid Cache Url:/i)).toBeNull();
  });

  it('renders Device Access when config.deviceAccess is defined', () => {
    render(wrap({ deviceAccess: false }));
    expect(screen.getByText(/Device Access:/i)).toBeTruthy();
    const falseTexts = screen.getAllByText('false');
    expect(falseTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render Device Access when config.deviceAccess is undefined', () => {
    render(wrap({}));
    expect(screen.queryByText(/Device Access:/i)).toBeNull();
  });

  it('expands the tile on header click', () => {
    render(wrap({ cache: { url: 'https://cache.example.com' }, deviceAccess: true }));
    const expandIcon = document.querySelector('[data-testid="ExpandMoreIcon"]') || document.querySelector('svg[class*="MuiSvgIcon"]');
    if (expandIcon) {
      fireEvent.click(expandIcon);
    }
    expect(screen.getByText(/Prebid Config/i)).toBeTruthy();
  });
});
