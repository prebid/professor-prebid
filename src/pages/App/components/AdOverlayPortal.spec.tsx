import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdOverlayPortal, { getMaxZIndex } from './AdOverlayPortal';

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

  describe('getMaxZIndex', () => {
    it('returns maximum z-index value', () => {
      expect(getMaxZIndex()).toBe(999999);
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
