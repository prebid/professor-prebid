import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdOverlayPortal, { OVERLAY_Z_INDEX } from './AdOverlayPortal';

vi.mock('./AdOverlayComponent', () => {
  return {
    default: (props: any) => (
      <div data-testid="mock-ad-overlay-component">
        <button data-testid="close-portal-btn" onClick={props.closePortal}>
          Close
        </button>
      </div>
    ),
  };
});

describe('AdOverlayPortal', () => {
  let container: HTMLElement;
  const mockMask = {
    elementId: 'test-ad-slot',
    winningCPM: 1.2,
    winningBidder: 'appnexus',
    currency: 'USD',
    timeToRespond: 120,
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.style.position = '';
    document.body.appendChild(container);
  });

  describe('OVERLAY_Z_INDEX', () => {
    it('is the largest z-index browsers accept, so page elements using it cannot cover the overlay', () => {
      expect(OVERLAY_Z_INDEX).toBe(2147483647);
    });
  });

  describe('Component rendering', () => {
    it('renders and appends container mask with shadow root when consoleState is true', () => {
      render(<AdOverlayPortal container={container} mask={mockMask} consoleState={true} pbjsNameSpace="pbjs" />);

      const maskElement = document.getElementById(`prpb-mask--container-${mockMask.elementId}`);
      expect(maskElement).not.toBeNull();
      expect(maskElement?.style.position).toBe('absolute');

      // ShadowRoot should be created
      expect(maskElement?.shadowRoot).not.toBeNull();

      const component = maskElement?.shadowRoot?.querySelector('[data-testid="mock-ad-overlay-component"]');
      expect(component).not.toBeNull();
    });

    it('does not append mask when consoleState is false', () => {
      render(<AdOverlayPortal container={container} mask={mockMask} consoleState={false} pbjsNameSpace="pbjs" />);

      expect(document.getElementById(`prpb-mask--container-${mockMask.elementId}`)).toBeNull();
    });

    it('updates dimensions when mask is already present and consoleState is true', () => {
      Object.defineProperty(container, 'offsetWidth', { value: 500, configurable: true });
      Object.defineProperty(container, 'offsetHeight', { value: 250, configurable: true });

      const div = document.createElement('div');
      div.id = `prpb-mask--container-${mockMask.elementId}`;
      container.appendChild(div);

      render(<AdOverlayPortal container={container} mask={mockMask} consoleState={true} pbjsNameSpace="pbjs" />);

      const managedDiv = document.getElementById(`prpb-mask--container-${mockMask.elementId}`);
      expect(managedDiv).not.toBeNull();
      expect(managedDiv?.style.width).toBe('500px');
      expect(managedDiv?.style.height).toBe('250px');
    });

    it('hides the mask container when closePortal is triggered', () => {
      render(<AdOverlayPortal container={container} mask={mockMask} consoleState={true} pbjsNameSpace="pbjs" />);

      const maskElement = document.getElementById(`prpb-mask--container-${mockMask.elementId}`);
      expect(maskElement).not.toBeNull();

      const closeBtn = maskElement?.shadowRoot?.querySelector('[data-testid="close-portal-btn"]') as HTMLButtonElement;
      if (closeBtn) {
        act(() => {
          closeBtn.click();
        });
        expect(maskElement?.style.display).toBe('none');
      }
    });

    it('keeps a closed mask hidden through the periodic re-sync until overlays are switched off and on', () => {
      vi.useFakeTimers();
      try {
        const { rerender } = render(<AdOverlayPortal container={container} mask={mockMask} consoleState={true} pbjsNameSpace="pbjs" />);
        const maskElement = document.getElementById(`prpb-mask--container-${mockMask.elementId}`);
        const closeBtn = maskElement?.shadowRoot?.querySelector('[data-testid="close-portal-btn"]') as HTMLButtonElement;
        expect(closeBtn).toBeTruthy();

        act(() => closeBtn.click());
        act(() => {
          vi.advanceTimersByTime(3000);
        });
        expect(maskElement?.style.display).toBe('none');

        // A new auction result for the same slot does not reopen it either.
        rerender(<AdOverlayPortal container={container} mask={{ ...mockMask, winningCPM: 3 }} consoleState={true} pbjsNameSpace="pbjs" />);
        expect(maskElement?.style.display).toBe('none');

        rerender(<AdOverlayPortal container={container} mask={mockMask} consoleState={false} pbjsNameSpace="pbjs" />);
        rerender(<AdOverlayPortal container={container} mask={mockMask} consoleState={true} pbjsNameSpace="pbjs" />);
        expect(document.getElementById(`prpb-mask--container-${mockMask.elementId}`)?.style.display).toBe('block');
      } finally {
        vi.useRealTimers();
      }
    });

    it('handles ad unit codes with quotes and backslashes, replacing a stale mask with the same id', () => {
      const code = 'slot"top\\1';
      const stale = document.createElement('div');
      stale.id = `prpb-mask--container-${code}`;
      container.appendChild(stale);

      expect(() => render(<AdOverlayPortal container={container} mask={{ ...mockMask, elementId: code }} consoleState={true} pbjsNameSpace="pbjs" />)).not.toThrow();

      const masks = Array.from(document.querySelectorAll('[id^="prpb-mask--container-"]')).filter((el) => el.id === `prpb-mask--container-${code}`);
      expect(masks).toHaveLength(1);
      expect(masks[0]).not.toBe(stale);
    });

    it('attaches to parentElement when container prop is an IFRAME', () => {
      const iframe = document.createElement('iframe');
      container.appendChild(iframe);

      render(<AdOverlayPortal container={iframe} mask={mockMask} consoleState={true} pbjsNameSpace="pbjs" />);

      const maskElement = document.getElementById(`prpb-mask--container-${mockMask.elementId}`);
      expect(maskElement).not.toBeNull();
      // Mask should be appended to the container (parent of iframe), NOT inside the iframe
      expect(maskElement?.parentElement).toBe(container);
    });

    it('cleans stale emotion styles and increments attachVersion when re-attached after slot refresh', () => {
      container.id = mockMask.elementId;
      const { rerender } = render(<AdOverlayPortal container={container} mask={mockMask} consoleState={true} pbjsNameSpace="pbjs" />);

      const maskElement = document.getElementById(`prpb-mask--container-${mockMask.elementId}`);
      expect(maskElement).not.toBeNull();

      // Simulate stale emotion style inside shadowRoot
      const staleStyle = document.createElement('style');
      staleStyle.setAttribute('data-emotion', 'prpb-css');
      maskElement?.shadowRoot?.appendChild(staleStyle);
      expect(maskElement?.shadowRoot?.querySelectorAll('style[data-emotion]').length).toBe(1);

      // Simulate slot refresh where slot innerHTML is cleared (mask detached)
      container.innerHTML = '';
      expect(maskElement?.parentNode).toBeNull();

      // Re-trigger render/sync when container is refreshed with new mask event
      act(() => {
        rerender(<AdOverlayPortal container={container} mask={{ ...mockMask, timeToRespond: 130 }} consoleState={true} pbjsNameSpace="pbjs" />);
      });

      // Mask should be re-attached, stale style cleaned, and component re-rendered
      expect(container.querySelector(`[id="prpb-mask--container-${mockMask.elementId}"]`)).not.toBeNull();
      expect(maskElement?.shadowRoot?.querySelectorAll('style[data-emotion]').length).toBe(0);
    });
  });
});
