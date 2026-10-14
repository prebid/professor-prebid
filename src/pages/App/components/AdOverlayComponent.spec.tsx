import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdOverlayComponent from './AdOverlayComponent';

describe('AdOverlayComponent', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const mockGoogletag = {
      pubads: vi.fn().mockReturnValue({
        getSlots: vi.fn().mockReturnValue([
          {
            getSlotElementId: () => 'div-gpt-ad-1234567-0',
            getAdUnitPath: () => '/12345/ad-unit',
            getTargetingKeys: () => [],
            getResponseInformation: () => null,
          },
        ]),
        refresh: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    };
    (window as any).parent = { googletag: mockGoogletag };
    (global as any).googletag = mockGoogletag;
    (window as any).googletag = mockGoogletag;
  });

  it('renders correctly with default props', () => {
    const { container } = render(<AdOverlayComponent elementId="div-gpt-ad-1234567-0" winningBidder="rubicon" winningCPM={1.5} currency="USD" timeToRespond={250} closePortal={vi.fn()} />);
    expect(screen.getAllByText('div-gpt-ad-1234567-0')).toBeDefined();
    expect(screen.getByText('rubicon')).toBeDefined();
    expect(screen.getByText('1.5 USD')).toBeDefined();
    expect(screen.getByText('250ms')).toBeDefined();
  });

  it('toggles expand/collapse when minimize/maximize icon is clicked', () => {
    const { container } = render(<AdOverlayComponent elementId="div-gpt-ad-1234567-0" winningBidder="rubicon" winningCPM={1.5} currency="USD" timeToRespond={250} closePortal={vi.fn()} />);
    expect(screen.getByText('rubicon')).toBeDefined();

    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[0]); // collapse

    expect(screen.queryByText('rubicon')).toBeNull();

    fireEvent.click(buttons[0]); // expand
    expect(screen.getByText('rubicon')).toBeDefined();
  });

  it('calls closePortal when close button is clicked', () => {
    const closePortalMock = vi.fn();
    const { container } = render(<AdOverlayComponent elementId="div-gpt-ad-1234567-0" winningBidder="rubicon" winningCPM={1.5} currency="USD" timeToRespond={250} closePortal={closePortalMock} />);
    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[3]);
    expect(closePortalMock).toHaveBeenCalled();
  });

  it('calls refresh on slot when refresh button is clicked', () => {
    const { container } = render(<AdOverlayComponent elementId="div-gpt-ad-1234567-0" winningBidder="rubicon" winningCPM={1.5} currency="USD" timeToRespond={250} />);
    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[2]);
    expect((window.parent as any).googletag.pubads().refresh).toHaveBeenCalled();
  });

  it('calls openInPopOver when popover button is clicked', () => {
    const { container } = render(<AdOverlayComponent elementId="div-gpt-ad-1234567-0" winningBidder="rubicon" winningCPM={1.5} currency="USD" timeToRespond={250} />);
    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[1]);
  });
});
