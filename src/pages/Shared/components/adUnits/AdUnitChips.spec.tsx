import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Ortb2ImpExtChipComponent, MediaTypeChipComponent, AdUnitChipComponent, BidChipComponent, InterstitialChipComponent } from './AdUnitChips';
import AppStateContext from '../../contexts/appStateContext';

vi.mock('../../../Shared/utils', () => ({
  getTabId: vi.fn().mockResolvedValue(1),
}));

describe('AdUnitChips components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders Ortb2ImpExtChipComponent and opens/closes popover', () => {
    const input: any = { gpid: '/12345/slot' };
    render(<Ortb2ImpExtChipComponent input={input} label="ORTB2 Imp" />);

    const chip = screen.getByText('ORTB2 Imp');
    expect(chip).toBeTruthy();

    fireEvent.click(chip);
    expect(screen.getByText(/\/12345\/slot/)).toBeTruthy();

    const popover = screen.getByRole('presentation');
    fireEvent.keyDown(popover, { key: 'Escape' });
  });

  it('renders MediaTypeChipComponent with winner and non-winner colors', () => {
    const input: any = { sizes: [[300, 250]] };
    const { rerender } = render(<MediaTypeChipComponent input={input} label="banner: 300x250" isWinner={true} />);
    expect(screen.getByText('banner: 300x250')).toBeTruthy();

    rerender(<MediaTypeChipComponent input={input} label="banner: 300x250" isWinner={false} />);
    expect(screen.getByText('banner: 300x250')).toBeTruthy();
  });

  it('renders AdUnitChipComponent and handles scroll2element success and timeout reset', async () => {
    const mockExecuteScript = vi.fn().mockImplementation(({ func, args }, cb) => {
      const dummyElem = document.createElement('div');
      dummyElem.id = 'slot-1';
      dummyElem.scrollIntoView = vi.fn();
      document.body.appendChild(dummyElem);

      const res = func('slot-1');
      expect(res).toBe(true);

      vi.advanceTimersByTime(5000);

      document.body.removeChild(dummyElem);

      cb([{ result: true }]);
    });

    global.chrome = {
      scripting: {
        executeScript: mockExecuteScript,
      },
    } as any;

    const adUnit: any = { code: 'slot-1' };
    const { rerender } = render(<AdUnitChipComponent adUnit={adUnit} />);

    const chip = screen.getByText('slot-1');
    expect(chip).toBeTruthy();

    await act(async () => {
      fireEvent.click(chip);
      vi.runAllTimers();
    });

    expect(screen.getByText('✓ slot-1')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText('slot-1')).toBeTruthy();

    rerender(<AdUnitChipComponent adUnit={{ code: 'slot-2' }} />);
    expect(screen.getByText('slot-2')).toBeTruthy();
  });

  it('renders AdUnitChipComponent and handles scroll2element element not found', async () => {
    const mockExecuteScript = vi.fn().mockImplementation(({ func }, cb) => {
      if (typeof func === 'function') {
        func('non-existent');
      }
      cb([{ result: false }]);
    });

    global.chrome = {
      scripting: {
        executeScript: mockExecuteScript,
      },
    } as any;

    const adUnit: any = { code: 'non-existent' };
    render(<AdUnitChipComponent adUnit={adUnit} />);

    const chip = screen.getByText('non-existent');
    await act(async () => {
      fireEvent.click(chip);
      vi.runAllTimers();
    });

    expect(screen.getByText(/not found/)).toBeTruthy();
  });

  it('renders BidChipComponent with combinations of winner, rendered, and received status', () => {
    const mockBid: any = { bidder: 'rubicon', cpm: 2.5, currency: 'USD', adUnitCode: 'slot-1' };
    const mockAppState: any = { topics: ['topic-1'] };

    const { rerender } = render(
      <AppStateContext.Provider value={mockAppState}>
        <BidChipComponent input={mockBid} label="rubicon: 2.5 USD" isWinner={true} bidReceived={{ args: mockBid } as any} bidRequested={{ args: {} } as any} isRendered={true} />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('rubicon: 2.5 USD')).toBeTruthy();

    rerender(
      <AppStateContext.Provider value={mockAppState}>
        <BidChipComponent input={mockBid} label="rubicon: 2.5 USD" isWinner={false} bidReceived={{ args: mockBid } as any} bidRequested={undefined} isRendered={false} />
      </AppStateContext.Provider>
    );

    rerender(
      <AppStateContext.Provider value={mockAppState}>
        <BidChipComponent input={mockBid} label="rubicon" isWinner={false} bidReceived={undefined} bidRequested={undefined} isRendered={false} />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('rubicon')).toBeTruthy();
  });

  it('renders InterstitialChipComponent', () => {
    const mockAdUnit: any = { ortb2Imp: { instl: 1 } };
    render(<InterstitialChipComponent adUnit={mockAdUnit} />);
    expect(screen.getByText('Interstitial')).toBeTruthy();
  });
});
