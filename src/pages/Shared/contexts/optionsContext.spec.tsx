import React, { useContext } from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OptionsContext, { OptionsContextProvider } from './optionsContext';
import { PAGES } from '../constants';

const TestComponent = () => {
  const ctx = useContext(OptionsContext);
  if (!ctx) return <div>No Context</div>;
  return (
    <div>
      <div data-testid="popup-items">{ctx.selectedPopUpNavItems.join(',')}</div>
      <div data-testid="panel-items">{ctx.selectedPanelNavItems.join(',')}</div>
      <button onClick={() => ctx.setSelectedPopUpNavItems(['test1'])}>Update Popup</button>
      <button onClick={() => ctx.setSelectedPanelNavItems(['test2'])}>Update Panel</button>
    </div>
  );
};

describe('OptionsContextProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.chrome = {
      storage: {
        sync: {
          get: vi.fn((keys, cb) => cb({})),
        },
      },
    } as any;
  });

  it('provides default non-beta items for popup and all items for panel when chrome.storage is empty', async () => {
    render(
      <OptionsContextProvider>
        <TestComponent />
      </OptionsContextProvider>
    );

    const expectedPopup = PAGES.filter(({ beta }) => !beta)
      .map((p) => p.path)
      .join(',');
    const expectedPanel = PAGES.map((p) => p.path).join(',');

    expect(screen.getByTestId('popup-items').textContent).toBe(expectedPopup);
    expect(screen.getByTestId('panel-items').textContent).toBe(expectedPanel);
  });

  it('loads stored nav items from chrome.storage when defined', async () => {
    global.chrome = {
      storage: {
        sync: {
          get: vi.fn((keys, cb) => {
            if (keys.includes('selectedPopUpNavItems')) cb({ selectedPopUpNavItems: ['custom1', 'custom2'] });
            else if (keys.includes('selectedPanelNavItems')) cb({ selectedPanelNavItems: ['panel1'] });
            else cb({});
          }),
        },
      },
    } as any;

    render(
      <OptionsContextProvider>
        <TestComponent />
      </OptionsContextProvider>
    );

    expect(screen.getByTestId('popup-items').textContent).toBe('custom1,custom2');
    expect(screen.getByTestId('panel-items').textContent).toBe('panel1');
  });

  it('allows updating state setters', async () => {
    render(
      <OptionsContextProvider>
        <TestComponent />
      </OptionsContextProvider>
    );

    act(() => {
      screen.getByText('Update Popup').click();
      screen.getByText('Update Panel').click();
    });

    expect(screen.getByTestId('popup-items').textContent).toBe('test1');
    expect(screen.getByTestId('panel-items').textContent).toBe('test2');
  });
});
