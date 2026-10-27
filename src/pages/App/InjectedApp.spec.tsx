import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import InjectedApp, { findAdContainer, containsCode } from './InjectedApp';
import { EVENTS, CONSOLE_TOGGLE, SAVE_MASKS } from '../Shared/constants';
import { EventBus } from '../Shared/utils';

vi.mock('./components/AdOverlayPortal', () => ({
  default: ({ mask, consoleState, container, pbjsNameSpace, onOpenPopover }: any) => (
    <div data-testid={`overlay-portal-${mask.elementId}`} data-console-state={consoleState} data-pbjs-namespace={pbjsNameSpace}>
      AdOverlayPortal: {mask.elementId} | CPM: {mask.winningCPM ?? 'none'} | Bidder: {mask.winningBidder ?? 'none'}
      <button data-testid={`open-popover-${mask.elementId}`} onClick={onOpenPopover}>Open</button>
    </div>
  ),
}));

vi.mock('./components/PopOverComponent', () => ({
  default: ({ elementId, winningCPM, open, onClose }: any) =>
    open ? (
      <div data-testid="injected-popover-dialog" data-element-id={elementId} data-cpm={winningCPM}>
        Popover: {elementId} | CPM: {winningCPM}
        <button data-testid="close-popover-btn" onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

// Mock EventBus
vi.mock('../Shared/utils', async () => {
  const original = await vi.importActual<typeof import('../Shared/utils')>('../Shared/utils');
  return {
    ...original,
    EventBus: {
      emit: vi.fn(),
    },
  };
});

describe('InjectedApp Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Clean up window pbjs mock properties
    delete (window as any).pbjs;
    delete (window as any).customPbjs;
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits REQUEST_CONSOLE_STATE on mount and attaches event listeners', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    render(<InjectedApp />);

    expect(EventBus.emit).toHaveBeenCalledWith(EVENTS.REQUEST_CONSOLE_STATE, null);
    expect(addEventListenerSpy).toHaveBeenCalledWith(CONSOLE_TOGGLE, expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith(SAVE_MASKS, expect.any(Function));
  });

  it('removes event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(<InjectedApp />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(CONSOLE_TOGGLE, expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith(SAVE_MASKS, expect.any(Function));
  });

  it('updates consoleState when CONSOLE_TOGGLE event is dispatched', () => {
    render(<InjectedApp />);

    act(() => {
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: true }));
    });

    // When consoleState is true, SAVE_MASKS should process
    // Setup window.pbjs mock
    const mockAdUnitDiv = document.createElement('div');
    mockAdUnitDiv.id = 'div-gpt-ad-1';
    document.body.appendChild(mockAdUnitDiv);

    (window as any).pbjs = {
      getEvents: () => [
        {
          eventType: 'auctionEnd',
          args: { adUnitCodes: ['div-gpt-ad-1'] },
        },
        {
          eventType: 'bidWon',
          args: {
            adUnitCode: 'div-gpt-ad-1',
            cpm: 2.456,
            bidder: 'rubicon',
            currency: 'USD',
            responseTimestamp: 100,
          },
        },
      ],
    };

    act(() => {
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
    });

    expect(screen.getByTestId('overlay-portal-div-gpt-ad-1')).toBeTruthy();
    expect(screen.getByText(/CPM: 2.46/)).toBeTruthy();
    expect(screen.getByText(/Bidder: rubicon/)).toBeTruthy();
  });

  it('does not give an ad unit the winning bid of another ad unit whose code starts the same', () => {
    ['div-gpt-ad-1', 'div-gpt-ad-12'].forEach((id) => {
      const div = document.createElement('div');
      div.id = id;
      document.body.appendChild(div);
    });
    (window as any).pbjs = {
      getEvents: () => [
        { eventType: 'auctionEnd', args: { adUnitCodes: ['div-gpt-ad-1', 'div-gpt-ad-12'] } },
        { eventType: 'bidWon', args: { adUnitCode: 'div-gpt-ad-1', cpm: 1, bidder: 'rubicon', responseTimestamp: 100 } },
        { eventType: 'bidWon', args: { adUnitCode: 'div-gpt-ad-12', cpm: 9, bidder: 'appnexus', responseTimestamp: 200 } },
      ],
    };

    render(<InjectedApp />);
    act(() => {
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: true }));
    });
    act(() => {
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
    });

    expect(screen.getByTestId('overlay-portal-div-gpt-ad-1').textContent).toContain('Bidder: rubicon');
    expect(screen.getByTestId('overlay-portal-div-gpt-ad-12').textContent).toContain('Bidder: appnexus');
  });

  it('shows a bid placed under the GAM ad unit path on the GAM slot overlay', () => {
    const div = document.createElement('div');
    div.id = 'div-gpt-top';
    document.body.appendChild(div);
    const slot = { getSlotElementId: () => 'div-gpt-top', getAdUnitPath: () => '/1234/site/top' };
    (window as any).googletag = { pubads: () => ({ getSlots: () => [slot] }) };
    (window as any).pbjs = {
      getEvents: () => [{ eventType: 'bidWon', args: { adUnitCode: '/1234/site/top', cpm: 3, bidder: 'ix', responseTimestamp: 100 } }],
    };

    try {
      render(<InjectedApp />);
      act(() => {
        document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: true }));
      });
      act(() => {
        document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
      });

      expect(screen.getByTestId('overlay-portal-div-gpt-top').textContent).toContain('Bidder: ix');
    } finally {
      delete (window as any).googletag;
    }
  });

  it('draws overlays when SAVE_MASKS follows CONSOLE_TOGGLE in the same tick', () => {
    const div = document.createElement('div');
    div.id = 'div-gpt-ad-1';
    document.body.appendChild(div);
    (window as any).pbjs = { getEvents: () => [{ eventType: 'auctionEnd', args: { adUnitCodes: ['div-gpt-ad-1'] } }] };

    render(<InjectedApp />);
    // The content script dispatches both events back to back, with no render in between.
    act(() => {
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: true }));
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
    });

    expect(screen.getByTestId('overlay-portal-div-gpt-ad-1')).toBeTruthy();
  });

  it('ignores SAVE_MASKS event if detail is missing or consoleState is false', () => {
    render(<InjectedApp />);

    // consoleState is false initially
    act(() => {
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
    });

    expect(screen.queryByTestId(/overlay-portal-/)).toBeNull();

    // Enable console state, but pass empty namespace detail
    act(() => {
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: true }));
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: '' }));
    });

    expect(screen.queryByTestId(/overlay-portal-/)).toBeNull();
  });

  it('handles window[pbjsNamespace] being undefined or lacking getEvents', () => {
    render(<InjectedApp />);

    act(() => {
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: true }));
      // 'nonExistentPbjs' is not defined on window
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'nonExistentPbjs' }));
    });

    expect(screen.queryByTestId(/overlay-portal-/)).toBeNull();
  });

  it('filters out ad units that are not present in the DOM', () => {
    render(<InjectedApp />);

    (window as any).pbjs = {
      getEvents: () => [
        {
          eventType: 'auctionEnd',
          args: { adUnitCodes: ['missing-ad-unit'] },
        },
      ],
    };

    act(() => {
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: true }));
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
    });

    expect(screen.queryByTestId('overlay-portal-missing-ad-unit')).toBeNull();
  });

  it('matches DOM elements using document.querySelector selector fallback', () => {
    const elem = document.createElement('div');
    elem.id = 'slot_123_banner';
    document.body.appendChild(elem);

    (window as any).pbjs = {
      getEvents: () => [
        {
          eventType: 'auctionEnd',
          args: { adUnitCodes: ['slot_123'] },
        },
        {
          eventType: 'bidWon',
          args: {
            adUnitCode: 'slot_123',
            cpm: 1.5,
            bidderCode: 'appnexus',
            responseTimestamp: 50,
          },
        },
      ],
    };

    render(<InjectedApp />);

    act(() => {
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: true }));
    });

    act(() => {
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
    });

    expect(screen.getByTestId('overlay-portal-slot_123')).toBeTruthy();
    expect(screen.getByText(/Bidder: appnexus/)).toBeTruthy();
  });

  it('resolves parent container when matched element is an iframe', () => {
    const parentDiv = document.createElement('div');
    parentDiv.id = 'gpt-slot-wrapper';
    const iframe = document.createElement('iframe');
    iframe.id = 'google_ads_iframe_/1234/slot_iframe_0';
    parentDiv.appendChild(iframe);
    document.body.appendChild(parentDiv);

    (window as any).pbjs = {
      getEvents: () => [
        {
          eventType: 'auctionEnd',
          args: { adUnitCodes: ['slot_iframe'] },
        },
      ],
    };

    render(<InjectedApp />);

    act(() => {
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: true }));
    });

    act(() => {
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
    });

    expect(screen.getByTestId('overlay-portal-slot_iframe')).toBeTruthy();
  });

  it('sorts multiple bidWon events by responseTimestamp descending to pick the winning bid', () => {
    const elem = document.createElement('div');
    elem.id = 'slot_multi';
    document.body.appendChild(elem);

    (window as any).pbjs = {
      getEvents: () => [
        {
          eventType: 'auctionEnd',
          args: { adUnitCodes: ['slot_multi'] },
        },
        {
          eventType: 'bidWon',
          args: {
            adUnitCode: 'slot_multi',
            cpm: 1.0,
            bidder: 'bidderA',
            responseTimestamp: 100,
          },
        },
        {
          eventType: 'bidWon',
          args: {
            adUnitCode: 'slot_multi',
            cpm: 3.75,
            bidder: 'bidderB',
            responseTimestamp: 250, // latest response
          },
        },
      ],
    };

    render(<InjectedApp />);

    act(() => {
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: true }));
    });

    act(() => {
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
    });

    expect(screen.getByTestId('overlay-portal-slot_multi')).toBeTruthy();
    expect(screen.getByText(/CPM: 3.75/)).toBeTruthy();
    expect(screen.getByText(/Bidder: bidderB/)).toBeTruthy();
  });

  it('throttles rapid SAVE_MASKS events and executes scheduled update when interval passes', () => {
    const elem = document.createElement('div');
    elem.id = 'slot_throttle';
    document.body.appendChild(elem);

    const getEventsMock = vi.fn(() => [
      {
        eventType: 'auctionEnd',
        args: { adUnitCodes: ['slot_throttle'] },
      },
    ]);

    (window as any).pbjs = {
      getEvents: getEventsMock,
    };

    render(<InjectedApp />);

    act(() => {
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: true }));
    });

    act(() => {
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
    });

    expect(getEventsMock).toHaveBeenCalledTimes(1);

    act(() => {
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
    });

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(getEventsMock).toHaveBeenCalledTimes(2);
  });

  it('does not update masks on timeout if consoleState becomes false before timeout fires', () => {
    const elem = document.createElement('div');
    elem.id = 'slot_cancel';
    document.body.appendChild(elem);

    const getEventsMock = vi.fn(() => [
      {
        eventType: 'auctionEnd',
        args: { adUnitCodes: ['slot_cancel'] },
      },
    ]);

    (window as any).pbjs = {
      getEvents: getEventsMock,
    };

    render(<InjectedApp />);

    act(() => {
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: true }));
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
    });

    act(() => {
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: false }));
    });

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(getEventsMock).toHaveBeenCalledTimes(1);
  });

  it('clears scheduled timeout when unmounting', () => {
    const { unmount } = render(<InjectedApp />);

    act(() => {
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: true }));
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
      // Second dispatch within throttle window creates a scheduled timeout
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
    });

    unmount();
  });

  it('persists the popover modal when ad refresh occurs and updates its data without closing', () => {
    const elem = document.createElement('div');
    elem.id = 'slot_refresh_modal';
    document.body.appendChild(elem);

    let currentCPM = 1.25;
    const getEventsMock = vi.fn(() => [
      {
        eventType: 'auctionEnd',
        args: { adUnitCodes: ['slot_refresh_modal'] },
      },
      {
        eventType: 'bidWon',
        args: { adUnitCode: 'slot_refresh_modal', cpm: currentCPM, bidder: 'rubicon', responseTimestamp: 100 },
      },
    ]);

    (window as any).pbjs = {
      getEvents: getEventsMock,
    };

    render(<InjectedApp />);

    act(() => {
      document.dispatchEvent(new CustomEvent(CONSOLE_TOGGLE, { detail: true }));
    });

    act(() => {
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
    });

    // 1. Open the popover modal
    const openBtn = screen.getByTestId('open-popover-slot_refresh_modal');
    act(() => {
      openBtn.click();
    });

    // Modal is open
    expect(screen.getByTestId('injected-popover-dialog')).not.toBeNull();
    expect(screen.getByTestId('injected-popover-dialog').getAttribute('data-cpm')).toBe('1.25');

    // 2. Simulate ad refresh: auction runs again with new higher CPM
    currentCPM = 2.75;
    act(() => {
      vi.advanceTimersByTime(1100);
      document.dispatchEvent(new CustomEvent(SAVE_MASKS, { detail: 'pbjs' }));
    });

    // Modal STILL open and updated its CPM!
    expect(screen.getByTestId('injected-popover-dialog')).not.toBeNull();
    expect(screen.getByTestId('injected-popover-dialog').getAttribute('data-cpm')).toBe('2.75');

    // 3. Close the modal
    const closeBtn = screen.getByTestId('close-popover-btn');
    act(() => {
      closeBtn.click();
    });
    expect(screen.queryByTestId('injected-popover-dialog')).toBeNull();
  });
});

describe('findAdContainer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('matches ad unit codes containing CSS special characters via the fallback selector', () => {
    const el = document.createElement('div');
    el.id = 'wrap-ad"unit\\1-x';
    document.body.appendChild(el);

    expect(findAdContainer('ad"unit\\1')).toBe(el);
  });

  it('skips extension-owned elements, masks, scripts and styles', () => {
    const root = document.createElement('div');
    root.id = 'professor_prebid-root';
    const inner = document.createElement('div');
    inner.id = 'inside-slot-a';
    root.appendChild(inner);
    const mask = document.createElement('div');
    mask.id = 'prpb-mask--container-slot-a';
    const script = document.createElement('script');
    script.id = 'script-slot-a';
    const target = document.createElement('div');
    target.id = 'page-slot-a';
    document.body.append(root, mask, script, target);

    expect(findAdContainer('slot-a')).toBe(target);
  });

  it('does not match an element whose id only starts with the ad unit code', () => {
    const el = document.createElement('div');
    el.id = 'div-gpt-ad-12';
    document.body.appendChild(el);

    expect(findAdContainer('div-gpt-ad-1')).toBeNull();
    expect(findAdContainer('div-gpt-ad-12')).toBe(el);
  });

  it('prefers the GAM slot whose path ends with the ad unit code over one that only shares a prefix', () => {
    const wrong = document.createElement('div');
    wrong.id = 'gpt-a';
    const right = document.createElement('div');
    right.id = 'gpt-b';
    document.body.append(wrong, right);
    const slots = [
      { getSlotElementId: () => 'gpt-a', getAdUnitPath: () => '/1/top-sticky' },
      { getSlotElementId: () => 'gpt-b', getAdUnitPath: () => '/1/top' },
    ];
    (window as any).googletag = { pubads: () => ({ getSlots: () => slots }) };
    try {
      expect(findAdContainer('top')).toBe(right);
    } finally {
      delete (window as any).googletag;
    }
  });

  it('containsCode only matches whole tokens', () => {
    expect(containsCode('wrap-div-gpt-ad-1_0', 'div-gpt-ad-1')).toBe(true);
    expect(containsCode('div-gpt-ad-12', 'div-gpt-ad-1')).toBe(false);
    expect(containsCode('div-gpt-ad-12-div-gpt-ad-1', 'div-gpt-ad-1')).toBe(true);
    expect(containsCode('', 'x')).toBe(false);
  });

  it('returns null instead of throwing when nothing matches', () => {
    expect(() => findAdContainer('a"b]c')).not.toThrow();
    expect(findAdContainer('a"b]c')).toBeNull();
  });
});
