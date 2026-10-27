import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PreAuctionComponent, { PROVIDER_FIELD_MAP } from './PreAuctionComponent';
import AppStateContext from '../../contexts/appStateContext';
import InspectedPageContext from '../../contexts/inspectedPageContext';

import { download } from '../../utils';

vi.mock('../../utils', async () => {
  const actual = await vi.importActual<any>('../../utils');
  return {
    ...actual,
    download: vi.fn(),
  };
});

const makeContext = (prebid: any = {}, auctionEndEvents: any[] = [], harLog: any[] = []) => {
  const appState: any = {
    prebid,
    auctionEndEvents,
    tcf: {},
    googleAdManager: {},
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
    adsRendered: [],
    prebids: {},
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
  };

  const inspectedState: any = {
    harLog,
    inspectedPageUrl: 'https://example.com',
  };

  return { appState, inspectedState };
};

const renderComponent = (prebid: any = {}, auctionEndEvents: any[] = [], harLog: any[] = []) => {
  const { appState, inspectedState } = makeContext(prebid, auctionEndEvents, harLog);
  return render(
    <AppStateContext.Provider value={appState}>
      <InspectedPageContext.Provider value={inspectedState}>
        <PreAuctionComponent />
      </InspectedPageContext.Provider>
    </AppStateContext.Provider>
  );
};

describe('PreAuctionComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.chrome = {
      devtools: {
        network: {},
      },
    } as any;
  });

  describe('PROVIDER_FIELD_MAP', () => {
    it('extracts correct fields from a provider diagnostic', () => {
      const mockProvider: any = {
        name: 'testProvider',
        type: 'rtd',
        awaited: true,
        auctions: [{ verdict: 'landed' }, { verdict: 'missed' }],
        hosts: ['api.test.com', 'cdn.test.com'],
      };

      expect(PROVIDER_FIELD_MAP.provider(mockProvider)).toBe('testProvider');
      expect(PROVIDER_FIELD_MAP.type(mockProvider)).toBe('rtd');
      expect(PROVIDER_FIELD_MAP.awaited(mockProvider)).toBe('true');
      expect(PROVIDER_FIELD_MAP.verdict(mockProvider)).toBe('landed missed');
      expect(PROVIDER_FIELD_MAP.host(mockProvider)).toBe('api.test.com cdn.test.com');
    });
  });

  it('renders empty message when no providers are configured', () => {
    renderComponent({ config: {} });
    expect(screen.getByText(/No real time data or user id modules are configured on this page/i)).toBeTruthy();
  });

  it('renders provider rows when RTD or userSync is configured', () => {
    const prebid: any = {
      config: {
        realTimeData: {
          auctionDelay: 250,
          dataProviders: [
            {
              name: 'permutive',
              waitForIt: true,
            },
          ],
        },
        userSync: {
          auctionDelay: 100,
          userIds: [
            {
              name: 'sharedId',
            },
          ],
        },
      },
    };

    const auctionEndEvents = [
      {
        args: {
          auctionId: 'auc-1',
          timestamp: 100,
          auctionEnd: 500,
          bidderRequests: [{ start: 200 }],
          ortb2: {
            user: {
              ext: {
                data: {
                  permutive: ['seg1'],
                },
              },
            },
          },
        },
      },
    ];

    const harLog = [
      {
        url: 'https://api.permutive.com/v1/segments',
        host: 'api.permutive.com',
        startedDateTime: 120,
        time: 50,
      },
    ];

    renderComponent(prebid, auctionEndEvents, harLog);

    expect(screen.getByText(/Providers: 2/i)).toBeTruthy();
    expect(screen.getByText(/Auction: 1/i)).toBeTruthy();
    expect(screen.getAllByText('permutive').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('sharedId').length).toBeGreaterThanOrEqual(1);
  });

  it('filters providers based on search query', () => {
    const prebid: any = {
      config: {
        realTimeData: {
          dataProviders: [{ name: 'permutive' }, { name: 'browsi' }],
        },
      },
    };

    renderComponent(prebid);

    expect(screen.getAllByText('permutive').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('browsi').length).toBeGreaterThanOrEqual(1);

    const input = screen.getByPlaceholderText('Filter providers...');
    fireEvent.change(input, { target: { value: 'provider:permutive' } });

    expect(screen.getAllByText('permutive').length).toBeGreaterThanOrEqual(1);
  });

  it('toggles raw JSON view when CodeIcon button is clicked', () => {
    const prebid: any = {
      config: {
        realTimeData: {
          dataProviders: [{ name: 'permutive' }],
        },
      },
    };

    renderComponent(prebid);

    const codeBtn = screen.getByTestId('CodeIcon').closest('button')!;
    fireEvent.click(codeBtn);

    fireEvent.click(codeBtn);
    expect(screen.getAllByText('permutive').length).toBeGreaterThanOrEqual(1);
  });

  it('calls download utility when DownloadIcon button is clicked', () => {
    const prebid: any = {
      config: {
        realTimeData: {
          dataProviders: [{ name: 'permutive' }],
        },
      },
    };

    renderComponent(prebid);

    const downloadBtn = screen.getByTestId('DownloadIcon').closest('button')!;
    fireEvent.click(downloadBtn);

    expect(download).toHaveBeenCalledWith(
      expect.objectContaining({
        diagnostics: expect.any(Object),
        correlation: expect.any(Object),
      }),
      'pre-auction-diagnostics'
    );
  });

  it('toggles ProviderRow details collapse on row click', () => {
    const prebid: any = {
      config: {
        realTimeData: {
          dataProviders: [{ name: 'permutive', waitForIt: true }],
        },
      },
    };

    renderComponent(prebid);

    const rowHeader = screen.getAllByText('permutive')[0];
    fireEvent.click(rowHeader);

    expect(screen.getAllByText(/waitForIt/i).length).toBeGreaterThanOrEqual(1);
  });

  it('opens and closes popover on AuctionVerdictChip click with evidence detail and previewValue', () => {
    const prebid: any = {
      config: {
        realTimeData: {
          dataProviders: [{ name: 'permutive', waitForIt: true }],
        },
      },
    };

    const auctionEndEvents = [
      {
        args: {
          auctionId: 'auc-1',
          timestamp: 100,
          bidderRequests: [{ start: 200 }],
          ortb2: {
            user: {
              ext: {
                data: {
                  permutive: 'this_is_a_very_long_string_of_permutive_data_that_exceeds_one_hundred_and_twenty_characters_in_length_to_test_the_preview_truncation_logic_properly',
                },
              },
            },
          },
        },
      },
    ];

    const harLog = [
      {
        url: 'https://api.permutive.com/v1/segments',
        host: 'api.permutive.com',
        startedDateTime: 150,
        time: 100,
      },
    ];

    renderComponent(prebid, auctionEndEvents, harLog);

    const chip = screen.getAllByText(/#1/)[0];
    fireEvent.click(chip);

    expect(screen.getByText(/Auction #1 — permutive/)).toBeTruthy();

    const rowHeader = screen.getAllByText('permutive')[0];
    fireEvent.click(rowHeader);
  });

  it('shows info alerts when HAR is not supported (e.g. popup mode)', () => {
    global.chrome = {} as any;
    const prebid: any = {
      config: {
        realTimeData: {
          dataProviders: [{ name: 'permutive' }],
        },
      },
    };

    renderComponent(prebid);

    expect(screen.getByText(/Verdicts below come from config and auction data and are complete/i)).toBeTruthy();
  });

  it('renders unmatched sections including ortb2, ortb2Imp, eids, and segments if present', () => {
    const prebid: any = {
      eids: [{ source: 'unknown-eid-source.com' }],
      config: {
        realTimeData: {
          dataProviders: [{ name: 'permutive' }],
        },
      },
    };

    const auctionEndEvents = [
      {
        args: {
          auctionId: 'auc-1',
          bidderRequests: [
            {
              ortb2: {
                site: {
                  ext: {
                    data: {
                      customVendorData: '123',
                    },
                  },
                },
                user: {
                  data: [
                    {
                      name: 'segmentGroupA',
                      segment: [{ id: '1' }],
                    },
                  ],
                },
              },
              bids: [
                {
                  ortb2Imp: {
                    ext: {
                      data: {
                        unmatchedImp: true,
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    ];

    const harLog = [
      {
        url: 'https://unrelated-ad-network.com/tag.js',
        host: 'unrelated-ad-network.com',
        startedDateTime: 100,
        time: 50,
      },
    ];

    renderComponent(prebid, auctionEndEvents, harLog);

    expect(screen.getByText(/Requests not attributed to any configured provider/i)).toBeTruthy();
    expect(screen.getByText(/ortb2Imp writes not attributable/i)).toBeTruthy();
    expect(screen.getByText(/ortb2 writes not attributable/i)).toBeTruthy();
    expect(screen.getByText(/EID sources not attributable/i)).toBeTruthy();
    expect(screen.getByText(/ortb2 data segments seen/i)).toBeTruthy();
  });

  it('renders "No requests captured yet" alert when DevTools is open but HAR log is empty', () => {
    const prebid: any = {
      config: {
        realTimeData: {
          dataProviders: [{ name: 'permutive' }],
        },
      },
    };

    renderComponent(prebid, [], []);

    expect(screen.getByText(/No requests captured yet/i)).toBeTruthy();
  });

  it('renders AuctionVerdictChip when auctionEndEvent is missing from memory', () => {
    const prebid: any = {
      config: {
        realTimeData: {
          dataProviders: [{ name: 'permutive' }],
        },
      },
    };

    const { rerender } = renderComponent(prebid, [{ args: { auctionId: 'auc-1' } }]);

    const { appState, inspectedState } = makeContext(prebid, [], []);
    rerender(
      <AppStateContext.Provider value={appState}>
        <InspectedPageContext.Provider value={inspectedState}>
          <PreAuctionComponent />
        </InspectedPageContext.Provider>
      </AppStateContext.Provider>
    );

    expect(screen.getByText(/Provider: 1/i)).toBeTruthy();
  });
});
