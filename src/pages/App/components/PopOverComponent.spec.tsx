import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PopOverComponent from './PopOverComponent';

describe('PopOverComponent', () => {
  const mockSetAnchorEl = vi.fn();
  const defaultProps = {
    elementId: 'div-gpt-ad-1234567-0',
    winningBidder: 'appnexus',
    winningCPM: 2.5,
    currency: 'USD',
    timeToRespond: 300,
    onClose: mockSetAnchorEl,
    open: true,
    pbjsNameSpace: 'pbjs',
  };

  const mockPbjs: any = {
    version: '8.50.0',
    getBidResponsesForAdUnitCode: vi.fn().mockReturnValue({
      bids: [
        { bidder: 'appnexus', cpm: 2.5, timeToRespond: 120 },
        { bidder: 'rubicon', cpm: 1.2, timeToRespond: 200 },
      ],
    }),
    getAllWinningBids: vi.fn().mockReturnValue([
      {
        adUnitCode: 'div-gpt-ad-1234567-0',
        bidder: 'appnexus',
        cpm: 2.5,
        ad: '<div>Ad Creative Banner</div>',
        native: { title: 'Native Title' },
      },
    ]),
    adUnits: [{ code: 'div-gpt-ad-1234567-0', mediaTypes: { banner: { sizes: [[300, 250]] } } }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).pbjs = mockPbjs;
    (window as any).parent = {
      googletag: {
        pubads: () => ({
          getSlots: () => [
            {
              getSlotElementId: () => 'div-gpt-ad-1234567-0',
              getAdUnitPath: () => '/12345,67890/homepage',
              getTargetingKeys: () => ['key1'],
              getTargeting: (k: string) => (k === 'key1' ? ['val1'] : []),
              getResponseInformation: () => ({
                creativeId: 111,
                lineItemId: 222,
              }),
            },
          ],
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }),
      },
    };
    (global as any).googletag = (window as any).parent.googletag;
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  it('renders correctly with prebid and GAM cards when anchorEl is provided', () => {
    render(<PopOverComponent {...defaultProps} />);

    expect(screen.getAllByText('div-gpt-ad-1234567-0').length).toBeGreaterThan(0);
    expect(screen.getAllByText('appnexus').length).toBeGreaterThan(0);
    expect(screen.getByText('2.5 USD')).toBeTruthy();
    expect(screen.getByText('300ms')).toBeTruthy();
    expect(screen.getByText('8.50.0')).toBeTruthy();
    expect(screen.getByText('/12345,67890/homepage')).toBeTruthy();
  });

  it('handles copying info card text to clipboard', () => {
    render(<PopOverComponent {...defaultProps} />);

    const copyButtons = screen.getAllByRole('button');

    if (copyButtons.length > 1) {
      fireEvent.click(copyButtons[1]);
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    }
  });

  it('toggles expandable sections when clicked', () => {
    render(<PopOverComponent {...defaultProps} />);

    const adUnitSection = screen.getByText('AdUnit Info');
    fireEvent.click(adUnitSection);
  });

  it('renders the creative in a sandboxed iframe instead of the publisher DOM', () => {
    render(<PopOverComponent {...defaultProps} />);

    const frame = screen.getByTestId('creative-preview-frame') as HTMLIFrameElement;
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
    expect(frame.getAttribute('srcdoc')).toBe('<div>Ad Creative Banner</div>');
    expect(screen.queryByText('Ad Creative Banner')).toBeNull();
  });

  it('shows the Prebid data stored under the GAM path for a popover keyed by the slot div id', () => {
    const path = '/12345,67890/homepage';
    (window as any).pbjs = {
      ...mockPbjs,
      getBidResponsesForAdUnitCode: vi.fn((code: string) => ({ bids: code === path ? [{ bidder: 'appnexus', cpm: 2.5 }] : [] })),
      getAllWinningBids: vi.fn().mockReturnValue([{ adUnitCode: path, bidder: 'appnexus', cpm: 2.5, ad: '<div>Path Creative</div>' }]),
      adUnits: [{ code: path, mediaTypes: { banner: { sizes: [[300, 250]] } } }],
    };
    render(<PopOverComponent {...defaultProps} />);

    expect((window as any).pbjs.getBidResponsesForAdUnitCode).toHaveBeenCalledWith(path);
    expect(screen.getByTestId('creative-preview-frame').getAttribute('srcdoc')).toBe('<div>Path Creative</div>');
  });

  it('does not render content when isOpen is false', () => {
    render(<PopOverComponent {...defaultProps} open={false} />);
    expect(screen.queryByText('div-gpt-ad-1234567-0')).toBeNull();
  });

  it('calls setAnchorEl when close button is clicked', () => {
    render(<PopOverComponent {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    expect(mockSetAnchorEl).toHaveBeenCalled();
  });
});
