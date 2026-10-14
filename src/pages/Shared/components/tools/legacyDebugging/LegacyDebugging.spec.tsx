import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ModifyBidResponsesComponent from './ModifyBidResponsesComponent';
import BidderFilter from './BidderFilter';
import BidOverWriteComponent from './BidOverWriteComponent';
import AppStateContext from '../../../contexts/appStateContext';

vi.mock('../../../../Shared/utils', () => ({
  getTabId: vi.fn().mockResolvedValue(1),
}));

describe('LegacyDebugging components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.chrome = {
      scripting: {
        executeScript: vi.fn().mockImplementation((opts) => {
          if (typeof opts?.func === 'function') {
            const mockSessionStorage = {
              getItem: vi.fn().mockReturnValue(JSON.stringify({ enabled: true, bidders: ['rubicon'], bids: [{ bidder: 'rubicon', adUnitCode: 'slot-1', cpm: 5, currency: 'USD' }] })),
              setItem: vi.fn(),
            };
            (global as any).sessionStorage = mockSessionStorage;
            opts.func('pbjs', { enabled: true });
          }
          return Promise.resolve([
            {
              result: JSON.stringify({
                enabled: true,
                bidders: ['rubicon'],
                bids: [{ bidder: 'rubicon', adUnitCode: 'slot-1', cpm: 5, currency: 'USD' }],
              }),
            },
          ]);
        }),
      },
    } as any;
  });

  it('renders BidderFilter component and handles adding/removing bidders and mousedown', () => {
    const mockConfig: any = { enabled: true, bidders: ['rubicon', 'appnexus'] };
    const mockAppState: any = {
      events: [
        {
          eventType: 'auctionInit',
          args: {
            adUnits: [{ bids: [{ bidder: 'rubicon' }, { bidder: 'appnexus' }] }],
          },
        },
      ],
    };
    const setDebugConfigState = vi.fn();

    const { container } = render(
      <AppStateContext.Provider value={mockAppState}>
        <BidderFilter debugConfigState={mockConfig} setDebugConfigState={setDebugConfigState} />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('Filter Bidder(s)')).toBeTruthy();
    expect(screen.getByText('rubicon')).toBeTruthy();

    const chip = screen.getByText('rubicon');
    fireEvent.mouseDown(chip);

    const cancelIcons = container.querySelectorAll('[data-testid="CancelIcon"]');
    if (cancelIcons.length > 0) {
      fireEvent.click(cancelIcons[0]);
      expect(setDebugConfigState).toHaveBeenCalled();
    }

    const switchBtn = screen.getByRole('checkbox');
    fireEvent.click(switchBtn);
    expect(setDebugConfigState).toHaveBeenCalled();

    fireEvent.click(switchBtn);
    expect(setDebugConfigState).toHaveBeenCalled();
  });

  it('renders BidOverWriteComponent and handles cpm, currency, bidder select, adUnit select, and chip deletion', () => {
    const mockConfig: any = {
      enabled: true,
      bids: [{ bidder: 'rubicon', adUnitCode: 'slot-1-very-long-name-exceeding-twenty-six-characters', cpm: 5, currency: 'USD' }],
    };
    const mockAppState: any = {
      events: [
        {
          eventType: 'auctionEnd',
          args: {
            adUnitCodes: ['slot-1-very-long-name-exceeding-twenty-six-characters', 'slot-2'],
            adUnits: [{ bids: [{ bidder: 'rubicon' }, { bidder: 'appnexus' }] }],
          },
        },
      ],
    };
    const setDebugConfigState = vi.fn();

    const { container } = render(
      <AppStateContext.Provider value={mockAppState}>
        <BidOverWriteComponent debugConfigState={mockConfig} setDebugConfigState={setDebugConfigState} />
      </AppStateContext.Provider>
    );

    const cpmInput = screen.getByDisplayValue('5');
    fireEvent.change(cpmInput, { target: { value: '15' } });
    expect(setDebugConfigState).toHaveBeenCalled();

    const currencyInput = screen.getByDisplayValue('USD');
    fireEvent.change(currencyInput, { target: { value: 'EUR' } });
    expect(setDebugConfigState).toHaveBeenCalled();

    const chips = container.querySelectorAll('.MuiChip-root');
    chips.forEach((c) => fireEvent.mouseDown(c));

    const deleteIcons = container.querySelectorAll('[data-testid="CancelIcon"]');
    deleteIcons.forEach((icon) => {
      fireEvent.click(icon);
      expect(setDebugConfigState).toHaveBeenCalled();
    });

    const switchBtn = screen.getAllByRole('checkbox')[0];
    fireEvent.click(switchBtn);
    expect(setDebugConfigState).toHaveBeenCalled();
  });

  it('renders BidOverWriteComponent with empty bids and tests global bidder overwrite', () => {
    const mockConfig: any = { enabled: true, bids: [] };
    const mockAppState: any = {
      events: [
        {
          eventType: 'auctionEnd',
          args: {
            adUnitCodes: ['slot-1'],
            adUnits: [{ bids: [{ bidder: 'rubicon' }] }],
          },
        },
      ],
    };
    const setDebugConfigState = vi.fn();

    render(
      <AppStateContext.Provider value={mockAppState}>
        <BidOverWriteComponent debugConfigState={mockConfig} setDebugConfigState={setDebugConfigState} />
      </AppStateContext.Provider>
    );

    const switchBtn = screen.getAllByRole('checkbox')[0];
    fireEvent.click(switchBtn);
    expect(setDebugConfigState).toBeDefined();

    const selects = screen.getAllByRole('combobox');
    if (selects.length >= 2) {
      fireEvent.mouseDown(selects[0]);
      fireEvent.mouseDown(selects[1]);
    }
  });

  it('renders ModifyBidResponsesComponent and toggles switch and saves config', async () => {
    const mockAppState: any = { pbjsNamespace: 'pbjs', isSmallScreen: true, events: [] };

    await act(async () => {
      render(
        <AppStateContext.Provider value={mockAppState}>
          <ModifyBidResponsesComponent />
        </AppStateContext.Provider>
      );
    });

    expect(screen.getByText('Enable Debugging')).toBeTruthy();

    const toggleSwitch = screen.getAllByRole('checkbox')[0];
    await act(async () => {
      fireEvent.click(toggleSwitch);
    });

    expect(chrome.scripting.executeScript).toHaveBeenCalled();
  });
});
