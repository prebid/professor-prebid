import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ToolsComponent from './ToolsComponent';
import OverlayControlComponent from './OverlayControlComponent';
import AppStateContext from '../../contexts/appStateContext';

vi.mock('../../../Shared/utils', () => ({
  getTabId: vi.fn().mockResolvedValue(1),
  sendChromeTabsMessage: vi.fn(),
}));

describe('Tools & OverlayControl components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.chrome = {
      storage: {
        local: {
          get: vi.fn((key, cb) => cb({ consoleState: true })),
          set: vi.fn((val, cb) => cb?.()),
        },
      },
      scripting: {
        executeScript: vi.fn().mockImplementation((opts, cb) => {
          if (typeof opts?.func === 'function') {
            (window as any).googletag = {
              openConsole: vi.fn(),
              cmd: [],
            };
            opts.func();
            ((window as any).googletag.cmd || []).forEach((fn: any) => fn());
          }
          const result = [{ result: JSON.stringify({ enabled: false, bidders: [], bids: [] }) }];
          if (cb) cb(result);
          return Promise.resolve(result);
        }),
      },
    } as any;
  });

  it('renders OverlayControlComponent and toggles overlay switch', () => {
    render(<OverlayControlComponent />);
    expect(screen.getByText(/On-Page AdUnit Info Overlay/i)).toBeTruthy();

    const switchEl = screen.getByRole('checkbox');
    fireEvent.click(switchEl);

    expect(chrome.storage.local.set).toHaveBeenCalled();
  });

  it('renders ToolsComponent with version >= 7.3.0 (DebuggingModuleComponent)', async () => {
    const mockAppState: any = {
      prebid: { version: '7.30.0', eventsUrl: 'https://test.domain.com/events' },
      prebids: { test: 'data' },
    };

    render(
      <AppStateContext.Provider value={mockAppState}>
        <ToolsComponent />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('Quick Actions & Utilities')).toBeTruthy();
    expect(screen.getByText('Google GAM Console')).toBeTruthy();

    const gamBtn = screen.getByText('Google GAM Console');
    await act(async () => {
      fireEvent.click(gamBtn);
    });

    expect(chrome.scripting.executeScript).toHaveBeenCalled();

    const downloadBtn = screen.getByText('Download Session JSON');
    fireEvent.click(downloadBtn);

    const resetBtn = screen.getByText('Reset Extension Storage');
    fireEvent.click(resetBtn);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ tabInfos: null });
  });

  it('renders ToolsComponent with version < 7.3.0 (ModifyBidResponsesComponent)', () => {
    const legacyAppState: any = {
      prebid: { version: '6.0.0' },
      prebids: {},
      events: [],
    };

    render(
      <AppStateContext.Provider value={legacyAppState}>
        <ToolsComponent />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('Quick Actions & Utilities')).toBeTruthy();
  });

  it('handles empty prebid version and invalid semver gracefully', () => {
    const invalidVerState: any = {
      prebid: { version: 'invalid-semver-string' },
      prebids: undefined,
    };

    render(
      <AppStateContext.Provider value={invalidVerState}>
        <ToolsComponent />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('Quick Actions & Utilities')).toBeTruthy();

    const downloadBtn = screen.getByText('Download Session JSON');
    fireEvent.click(downloadBtn);
  });

  it('handles Google GAM Console fallback when googletag.openConsole is not defined', async () => {
    global.chrome.scripting.executeScript = vi.fn().mockImplementation((opts) => {
      if (typeof opts?.func === 'function') {
        (window as any).googletag = { cmd: [] };
        opts.func();
        ((window as any).googletag.cmd || []).forEach((fn: any) => fn());
      }
      return Promise.resolve([{ result: null }]);
    });

    const mockAppState: any = {
      prebid: { version: '8.0.0' },
      prebids: { test: '1' },
    };

    render(
      <AppStateContext.Provider value={mockAppState}>
        <ToolsComponent />
      </AppStateContext.Provider>
    );

    const gamBtn = screen.getByText('Google GAM Console');
    await act(async () => {
      fireEvent.click(gamBtn);
    });

    expect(global.chrome.scripting.executeScript).toHaveBeenCalled();
  });
});
