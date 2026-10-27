import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GamDetailsComponent from './GamDetailsComponent';

describe('GamDetailsComponent', () => {
  let registeredListeners: Record<string, Function> = {};
  const mockAddEventListener = vi.fn((event, handler) => {
    registeredListeners[event] = handler;
  });
  const mockRemoveEventListener = vi.fn((event) => {
    delete registeredListeners[event];
  });

  beforeEach(() => {
    vi.resetAllMocks();
    registeredListeners = {};
    document.body.innerHTML = '';

    const mockGoogletag = {
      pubads: vi.fn().mockReturnValue({
        getSlots: vi.fn().mockReturnValue([
          {
            getSlotElementId: () => 'div-gpt-ad-1234567-0',
            getAdUnitPath: () => '/12345,67890,99999/ad-unit',
            getTargetingKeys: () => ['test-key'],
            getTargeting: (key: string) => (key === 'test-key' ? ['test-value'] : []),
            getResponseInformation: () => ({
              creativeId: 98765,
              lineItemId: 43210,
            }),
          },
          {
            getSlotElementId: () => 'div-secondary',
            getAdUnitPath: () => '/55555/path-match',
            getTargetingKeys: () => [],
            getTargeting: () => [],
            getResponseInformation: () => ({
              sourceAgnosticCreativeId: 11111,
              sourceAgnosticLineItemId: 22222,
            }),
          },
        ]),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      }),
    };

    (window as any).parent = { googletag: mockGoogletag };
    (global as any).googletag = mockGoogletag;
    (window as any).googletag = mockGoogletag;
  });

  it('renders nothing when elementId does not match any slot or googletag is absent', () => {
    const { container } = render(<GamDetailsComponent elementId="non-existent-id" inPopOver={false} truncate={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders line item, creative, multi-network links, and ad unit details when elementId matches', () => {
    const div = document.createElement('div');
    div.id = 'div-gpt-ad-1234567-0';
    div.setAttribute('data-google-query-id', 'query-123');
    document.body.appendChild(div);

    render(<GamDetailsComponent elementId="div-gpt-ad-1234567-0" inPopOver={false} truncate={false} />);

    expect(screen.getByText('LineItem-ID:')).toBeDefined();
    expect(screen.getByText('43210')).toBeDefined();
    expect(screen.getByText('Creative-ID:')).toBeDefined();
    expect(screen.getByText('98765')).toBeDefined();
    expect(screen.getByText('AdUnit Path:')).toBeDefined();
    expect(screen.getByText('Element-ID:')).toBeDefined();
    expect(screen.getByText('Query-ID:')).toBeDefined();
    expect(screen.getByText('query-123')).toBeDefined();
  });

  it('matches by adUnitPath and uses sourceAgnostic fallbacks', () => {
    render(<GamDetailsComponent elementId="/55555/path-match" inPopOver={false} truncate={false} />);

    expect(screen.getByText('LineItem-ID:')).toBeDefined();
    expect(screen.getByText('22222')).toBeDefined();
    expect(screen.getByText('Creative-ID:')).toBeDefined();
    expect(screen.getByText('11111')).toBeDefined();
  });

  it('truncates query ID when truncate is true', () => {
    const div = document.createElement('div');
    div.id = 'div-gpt-ad-1234567-0';
    div.setAttribute('data-google-query-id', 'long-query-id-1234567890');
    document.body.appendChild(div);

    render(<GamDetailsComponent elementId="div-gpt-ad-1234567-0" inPopOver={false} truncate={true} />);

    expect(screen.getByText('long...7890')).toBeDefined();
  });

  it('renders additional popover details when inPopOver is true and reacts to slotRenderEnded events', () => {
    render(<GamDetailsComponent elementId="div-gpt-ad-1234567-0" inPopOver={true} truncate={false} />);

    expect(screen.getByText('Response-Info:')).toBeDefined();
    expect(screen.getByText('Targeting:')).toBeDefined();
    expect(screen.getByText('test-key')).toBeDefined();
    expect(screen.getByText('test-value')).toBeDefined();

    if (registeredListeners['slotRenderEnded']) {
      act(() => {
        registeredListeners['slotRenderEnded']({
          slot: { getSlotElementId: () => 'div-gpt-ad-1234567-0' },
        });
      });
    }
  });

  it('adds and removes event listeners correctly on unmount', () => {
    const { unmount } = render(<GamDetailsComponent elementId="div-gpt-ad-1234567-0" inPopOver={false} truncate={false} />);

    expect(mockAddEventListener).toHaveBeenCalledWith('slotResponseReceived', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('slotRenderEnded', expect.any(Function));

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('slotResponseReceived', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('slotRenderEnded', expect.any(Function));
  });
});
