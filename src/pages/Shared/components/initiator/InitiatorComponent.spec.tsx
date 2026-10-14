import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InitiatorComponent from './InitiatorComponent';
import InspectedPageContext from '../../contexts/inspectedPageContext';
import { preAuctionHarKey } from '../../constants';

describe('InitiatorComponent', () => {
  const sampleHarLog: any[] = [
    {
      id: 'req_1',
      url: 'https://ib.adnxs.com/ut/v3/prebid',
      host: 'ib.adnxs.com',
      pathname: '/ut/v3/prebid',
      method: 'POST',
      status: 200,
      statusText: 'OK',
      startedDateTime: 1000,
      time: 120,
      resourceType: 'fetch',
      queryString: [
        { name: 'gdpr', value: '1' },
        { name: 'gdpr_consent', value: 'CP12345' },
      ],
      requestHeaders: [{ name: 'Content-Type', value: 'application/json' }],
      responseHeaders: [{ name: 'Cache-Control', value: 'no-cache' }],
      postData: { text: '{"id":"test-auction"}' },
      timings: { dns: 10, connect: 20, wait: 60, receive: 30 },
    },
    {
      id: 'req_2',
      url: 'https://sync.rubiconproject.com/usersync?redirect=https%3A%2F%2Fprebid.org%2Fsetuid',
      host: 'sync.rubiconproject.com',
      pathname: '/usersync',
      method: 'GET',
      status: 302,
      redirectURL: 'https://pixel.rubiconproject.com/tap.php',
      startedDateTime: 1050,
      time: 45,
      queryString: [{ name: 'us_privacy', value: '1YNN' }],
    },
    {
      id: 'req_3',
      url: 'https://pixel.rubiconproject.com/tap.php',
      host: 'pixel.rubiconproject.com',
      pathname: '/tap.php',
      method: 'GET',
      status: 200,
      startedDateTime: 1100,
      time: 30,
    },
    {
      id: 'req_4',
      url: 'https://id5-sync.com/g/v2',
      host: 'id5-sync.com',
      pathname: '/g/v2',
      method: 'GET',
      status: 200,
      startedDateTime: 1120,
      time: 50,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.chrome = {
      storage: {
        session: {
          set: vi.fn(),
        },
      },
      devtools: {
        inspectedWindow: {
          tabId: 7,
          reload: vi.fn(),
        },
      },
    } as any;
  });

  it('renders empty state when no network requests are captured', () => {
    const mockContext: any = {
      harLog: [],
      frames: {},
      downloading: 'false',
      syncState: '',
      initReqChainResult: {},
    };

    render(
      <InspectedPageContext.Provider value={mockContext}>
        <InitiatorComponent />
      </InspectedPageContext.Provider>
    );

    expect(screen.getByText('No Network Activity Recorded Yet')).toBeTruthy();
    const reloadBtn = screen.getByRole('button', { name: /Reload Page/i });
    fireEvent.click(reloadBtn);
    expect(chrome.devtools.inspectedWindow.reload).toHaveBeenCalledWith({ ignoreCache: true });
  });

  it('renders category counters and request waterfall table with data', () => {
    const mockContext: any = {
      harLog: sampleHarLog,
      frames: {},
      downloading: 'false',
      syncState: '',
      initReqChainResult: {},
    };

    render(
      <InspectedPageContext.Provider value={mockContext}>
        <InitiatorComponent />
      </InspectedPageContext.Provider>
    );

    expect(screen.getByText(/All: 4/)).toBeTruthy();
    expect(screen.getByText(/Bids: 1/)).toBeTruthy();
    expect(screen.getByText(/Syncs: 2/)).toBeTruthy();
    expect(screen.getByText(/User IDs: 1/)).toBeTruthy();

    expect(screen.getByText('ib.adnxs.com')).toBeTruthy();
    expect(screen.getByText('sync.rubiconproject.com')).toBeTruthy();
  });

  it('filters entries when category chip is clicked', () => {
    const mockContext: any = {
      harLog: sampleHarLog,
      frames: {},
      downloading: 'false',
      syncState: '',
      initReqChainResult: {},
    };

    render(
      <InspectedPageContext.Provider value={mockContext}>
        <InitiatorComponent />
      </InspectedPageContext.Provider>
    );

    const bidsChip = screen.getByText(/Bids: 1/);
    fireEvent.click(bidsChip);

    expect(screen.getByText('ib.adnxs.com')).toBeTruthy();
    expect(screen.queryByText('id5-sync.com')).toBeNull();
  });

  it('filters entries using search bar query', () => {
    const mockContext: any = {
      harLog: sampleHarLog,
      frames: {},
      downloading: 'false',
      syncState: '',
      initReqChainResult: {},
    };

    render(
      <InspectedPageContext.Provider value={mockContext}>
        <InitiatorComponent />
      </InspectedPageContext.Provider>
    );

    const searchInput = screen.getByPlaceholderText(/Filter requests/i);
    fireEvent.change(searchInput, { target: { value: 'bidder:appnexus' } });

    expect(screen.getByText('ib.adnxs.com')).toBeTruthy();
    expect(screen.queryByText('sync.rubiconproject.com')).toBeNull();
  });

  it('switches view mode to Initiator Cascade and Privacy Audit', () => {
    const mockContext: any = {
      harLog: sampleHarLog,
      frames: {},
      downloading: 'false',
      syncState: '',
      initReqChainResult: {},
    };

    render(
      <InspectedPageContext.Provider value={mockContext}>
        <InitiatorComponent />
      </InspectedPageContext.Provider>
    );

    const cascadeTab = screen.getByRole('tab', { name: /Initiator Cascade/i });
    fireEvent.click(cascadeTab);
    expect(screen.getByPlaceholderText(/Filter tree cascade/i)).toBeTruthy();

    const privacyTab = screen.getByRole('tab', { name: /Privacy Audit/i });
    fireEvent.click(privacyTab);
    expect(screen.getByText('TCF Consent (GDPR)')).toBeTruthy();
  });

  it('opens detail drawer when clicking a request row and allows tab switching', () => {
    const mockContext: any = {
      harLog: sampleHarLog,
      frames: {},
      downloading: 'false',
      syncState: '',
      initReqChainResult: {},
    };

    render(
      <InspectedPageContext.Provider value={mockContext}>
        <InitiatorComponent />
      </InspectedPageContext.Provider>
    );

    const adnxsRow = screen.getByText('ib.adnxs.com');
    fireEvent.click(adnxsRow);

    expect(screen.getByText('General Information')).toBeTruthy();

    const queryParamsTab = screen.getByRole('tab', { name: /Query Params/i });
    fireEvent.click(queryParamsTab);
    expect(screen.getByText('gdpr_consent')).toBeTruthy();

    const payloadTab = screen.getByRole('tab', { name: /Payload/i });
    fireEvent.click(payloadTab);
    expect(screen.getByText(/test-auction/)).toBeTruthy();
  });

  it('handles clearing the network log and raw JSON toggle', async () => {
    const mockContext: any = {
      harLog: sampleHarLog,
      frames: {},
      downloading: 'false',
      syncState: '',
      initReqChainResult: {},
    };

    render(
      <InspectedPageContext.Provider value={mockContext}>
        <InitiatorComponent />
      </InspectedPageContext.Provider>
    );

    const rawJsonBtn = screen.getByRole('button', { name: /Switch to Raw JSON view/i });
    fireEvent.click(rawJsonBtn);

    const clearBtn = screen.getByRole('button', { name: /Clear Captured Network Log/i });
    fireEvent.click(clearBtn);

    await waitFor(() => expect(chrome.storage.session.set).toHaveBeenCalledWith({ [preAuctionHarKey(7)]: JSON.stringify([]) }));
  });
});
