import React, { useContext } from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach} from 'vitest';
import AppStateContext, { StateContextProvider } from './appStateContext';
import InspectedPageContext from './inspectedPageContext';

const TestChild = () => {
  const ctx = useContext(AppStateContext);
  return (
    <div>
      <div data-testid="frameId">{ctx.frameId}</div>
      <div data-testid="pbjsNamespace">{ctx.pbjsNamespace}</div>
      <div data-testid="eventsCount">{ctx.events.length}</div>
      <div data-testid="adUnitCodes">{ctx.allAdUnitCodes.join(',')}</div>
      <div data-testid="bidders">{ctx.allBidderEvents.join(',')}</div>
      <div data-testid="bidRequested">{ctx.allBidRequestedEvents.length}</div>
      <div data-testid="noBid">{ctx.allNoBidEvents.length}</div>
      <div data-testid="bidderDone">{ctx.allBidderDoneEvents.length}</div>
      <div data-testid="winningBids">{ctx.allWinningBids.length}</div>
      <div data-testid="auctionInit">{ctx.auctionInitEvents.map((e) => e.args.timestamp).join(',')}</div>
      <div data-testid="auctionEnd">{ctx.auctionEndEvents.length}</div>
      <div data-testid="adsRendered">{ctx.adsRendered.length}</div>
      <div data-testid="isRefresh">{String(ctx.isRefresh)}</div>
      <div data-testid="initDataLoaded">{String(ctx.initDataLoaded)}</div>
      <div data-testid="topics">{ctx.topics.join(',')}</div>
      <button onClick={() => ctx.setIframeId('frame-2')}>Change Frame</button>
      <button onClick={() => ctx.setPbjsNamespace && ctx.setPbjsNamespace('customPbjs')}>Change Namespace</button>
      <button onClick={() => ctx.setInitiatorOutput({ key: 'val' })}>Set Initiator</button>
      <button onClick={() => ctx.setIsRefresh(true)}>Set Refresh</button>
      <button onClick={() => ctx.setInitDataLoaded(true)}>Set Init Data</button>
      <button onClick={() => ctx.setPrebidReleaseInfo({ latestVersion: '1.0' })}>Set Release Info</button>
      <button onClick={() => ctx.setTopics(['topicA'])}>Set Topics</button>
    </div>
  );
};

describe('StateContextProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses default fallback values when consumer rendered outside provider', () => {
    render(<TestChild />);
    expect(screen.getByTestId('frameId').textContent).toBe('');
    expect(screen.getByTestId('pbjsNamespace').textContent).toBe('');
  });

  it('sets default frameId to top-window when top-window prebids exist and processes all event types', async () => {
    const mockInspectedContext: any = {
      frames: {
        'top-window': {
          prebids: {
            pbjs: {
              events: [
                { eventType: 'auctionInit', args: { timestamp: 200, adUnitCodes: ['code2'] } },
                { eventType: 'auctionInit', args: { timestamp: 100, adUnitCodes: ['code1'] } },
                { eventType: 'bidResponse', args: { bidder: 'appnexus' } },
                { eventType: 'bidRequested', args: {} },
                { eventType: 'noBid', args: { bidder: 'rubicon' } },
                { eventType: 'bidderDone', args: {} },
                { eventType: 'bidWon', args: {} },
                { eventType: 'auctionEnd', args: {} },
                { eventType: 'adRenderSucceeded', args: {} },
              ],
            },
            tcf: { version: 2 },
          },
          googleAdManager: { slots: [] },
        },
      },
      downloading: 'false',
      syncState: '',
      initReqChainResult: {},
    };

    render(
      <InspectedPageContext.Provider value={mockInspectedContext}>
        <StateContextProvider>
          <TestChild />
        </StateContextProvider>
      </InspectedPageContext.Provider>
    );

    expect(screen.getByTestId('frameId').textContent).toBe('top-window');
    expect(screen.getByTestId('pbjsNamespace').textContent).toBe('pbjs');
    expect(screen.getByTestId('eventsCount').textContent).toBe('9');
    expect(screen.getByTestId('adUnitCodes').textContent).toBe('code2,code1');
    expect(screen.getByTestId('bidders').textContent).toBe('appnexus,rubicon');
    expect(screen.getByTestId('auctionInit').textContent).toBe('100,200');
    expect(screen.getByTestId('bidRequested').textContent).toBe('1');
    expect(screen.getByTestId('noBid').textContent).toBe('1');
    expect(screen.getByTestId('bidderDone').textContent).toBe('1');
    expect(screen.getByTestId('winningBids').textContent).toBe('1');
    expect(screen.getByTestId('auctionEnd').textContent).toBe('1');
    expect(screen.getByTestId('adsRendered').textContent).toBe('1');
  });

  it('sets default frameId to first frame with prebids if top-window has no prebids', async () => {
    const mockInspectedContext: any = {
      frames: {
        'top-window': {},
        'frame-1': {
          prebids: {
            otherPbjs: {
              events: [],
            },
          },
        },
      },
    };

    render(
      <InspectedPageContext.Provider value={mockInspectedContext}>
        <StateContextProvider>
          <TestChild />
        </StateContextProvider>
      </InspectedPageContext.Provider>
    );

    expect(screen.getByTestId('frameId').textContent).toBe('frame-1');
    expect(screen.getByTestId('pbjsNamespace').textContent).toBe('otherPbjs');
  });

  it('defaults to top-window if no frames have prebids', async () => {
    const mockInspectedContext: any = {
      frames: {
        'top-window': {},
      },
    };

    render(
      <InspectedPageContext.Provider value={mockInspectedContext}>
        <StateContextProvider>
          <TestChild />
        </StateContextProvider>
      </InspectedPageContext.Provider>
    );

    expect(screen.getByTestId('frameId').textContent).toBe('top-window');
  });

  it('allows changing frameId, namespace, and state setters', async () => {
    const mockInspectedContext: any = {
      frames: {
        'top-window': { prebids: { pbjs: { events: [] } } },
        'frame-2': { prebids: { customPbjs: { events: [] } } },
      },
    };

    render(
      <InspectedPageContext.Provider value={mockInspectedContext}>
        <StateContextProvider>
          <TestChild />
        </StateContextProvider>
      </InspectedPageContext.Provider>
    );

    act(() => {
      screen.getByText('Change Frame').click();
    });

    expect(screen.getByTestId('frameId').textContent).toBe('frame-2');

    act(() => {
      screen.getByText('Change Namespace').click();
    });

    expect(screen.getByTestId('pbjsNamespace').textContent).toBe('customPbjs');

    act(() => {
      screen.getByText('Set Initiator').click();
      screen.getByText('Set Refresh').click();
      screen.getByText('Set Init Data').click();
      screen.getByText('Set Release Info').click();
      screen.getByText('Set Topics').click();
    });

    expect(screen.getByTestId('isRefresh').textContent).toBe('true');
    expect(screen.getByTestId('initDataLoaded').textContent).toBe('true');
    expect(screen.getByTestId('topics').textContent).toBe('topicA');
  });

  it('fetches browsingTopics when supported by document', async () => {
    const mockBrowsingTopics = vi.fn().mockResolvedValue(['sports', 'news']);
    const originalFeaturePolicy = document.featurePolicy;
    const originalBrowsingTopics = document.browsingTopics;

    (document as any).featurePolicy = {
      allowsFeature: (feature: string) => feature === 'browsing-topics',
    };
    (document as any).browsingTopics = mockBrowsingTopics;

    const mockInspectedContext: any = {
      frames: {
        'top-window': { prebids: { pbjs: { events: [] } } },
      },
    };

    await act(async () => {
      render(
        <InspectedPageContext.Provider value={mockInspectedContext}>
          <StateContextProvider>
            <TestChild />
          </StateContextProvider>
        </InspectedPageContext.Provider>
      );
    });

    expect(mockBrowsingTopics).toHaveBeenCalled();
    expect(screen.getByTestId('topics').textContent).toBe('sports,news');

    (document as any).featurePolicy = originalFeaturePolicy;
    (document as any).browsingTopics = originalBrowsingTopics;
  });

  it('handles browsingTopics failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockBrowsingTopics = vi.fn().mockRejectedValue(new Error('Topics permission error'));
    const originalFeaturePolicy = document.featurePolicy;
    const originalBrowsingTopics = document.browsingTopics;

    (document as any).featurePolicy = {
      allowsFeature: (feature: string) => feature === 'browsing-topics',
    };
    (document as any).browsingTopics = mockBrowsingTopics;

    const mockInspectedContext: any = {
      frames: {
        'top-window': { prebids: { pbjs: { events: [] } } },
      },
    };

    await act(async () => {
      render(
        <InspectedPageContext.Provider value={mockInspectedContext}>
          <StateContextProvider>
            <TestChild />
          </StateContextProvider>
        </InspectedPageContext.Provider>
      );
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching topics', expect.any(Error));

    consoleSpy.mockRestore();
    (document as any).featurePolicy = originalFeaturePolicy;
    (document as any).browsingTopics = originalBrowsingTopics;
  });
});
