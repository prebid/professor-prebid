import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Panel from './Panel';
import StateContext from '../Shared/contexts/appStateContext';
import InspectedPageContext from '../Shared/contexts/inspectedPageContext';
import { PBJS_NAMESPACE_CHANGE } from '../Shared/constants';
import * as utils from '../Shared/utils';

vi.mock('../Shared/components/navBar/Navbar', () => ({
  NavBar: () => <div data-testid="nav-bar">NavBar</div>,
}));
vi.mock('../Shared/components/NoPrebidCardComponent', () => ({
  default: () => <div data-testid="no-prebid-card">No Prebid</div>,
}));
vi.mock('../Shared/components/RoutesComponent', () => ({
  default: () => <div data-testid="routes-component">Routes</div>,
}));
vi.mock('../Shared/components/DownloadingCardComponent', () => ({
  default: () => <div data-testid="downloading-card">Downloading</div>,
}));

vi.mock('../Shared/utils', () => ({
  sendChromeTabsMessage: vi.fn(),
}));

vi.mock('@mui/material/Box', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="box">{children}</div>,
}));

const renderPanel = (stateCtx: any, pageCtx: any) => {
  return render(
    <InspectedPageContext.Provider value={pageCtx}>
      <StateContext.Provider value={stateCtx}>
        <Panel />
      </StateContext.Provider>
    </InspectedPageContext.Provider>
  );
};

describe('Panel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders NavBar and sends PBJS_NAMESPACE_CHANGE on mount', () => {
    renderPanel({ pbjsNamespace: 'pbjs', prebids: null }, { downloading: 'false' });

    expect(screen.getByTestId('nav-bar')).toBeTruthy();
    expect(utils.sendChromeTabsMessage).toHaveBeenCalledWith(PBJS_NAMESPACE_CHANGE, 'pbjs');
  });

  it('sends PBJS_NAMESPACE_CHANGE when pbjsNamespace changes', () => {
    const { rerender } = renderPanel({ pbjsNamespace: 'pbjs', prebids: null }, { downloading: 'false' });
    expect(utils.sendChromeTabsMessage).toHaveBeenCalledWith(PBJS_NAMESPACE_CHANGE, 'pbjs');

    rerender(
      <InspectedPageContext.Provider value={{ downloading: 'false' }}>
        <StateContext.Provider value={{ pbjsNamespace: 'custom_pbjs', prebids: null }}>
          <Panel />
        </StateContext.Provider>
      </InspectedPageContext.Provider>
    );

    expect(utils.sendChromeTabsMessage).toHaveBeenCalledWith(PBJS_NAMESPACE_CHANGE, 'custom_pbjs');
  });

  it('shows NoPrebidCardComponent when no prebids and downloading is "false"', () => {
    renderPanel({ pbjsNamespace: 'pbjs', prebids: null }, { downloading: 'false' });

    expect(screen.getByTestId('no-prebid-card')).toBeTruthy();
    expect(screen.queryByTestId('routes-component')).toBeNull();
    expect(screen.queryByTestId('downloading-card')).toBeNull();
  });

  it('does NOT show NoPrebidCardComponent when no prebids and downloading is NOT "false"', () => {
    renderPanel({ pbjsNamespace: 'pbjs', prebids: null }, { downloading: 'idle' });

    expect(screen.queryByTestId('no-prebid-card')).toBeNull();
    expect(screen.queryByTestId('routes-component')).toBeNull();
    expect(screen.queryByTestId('downloading-card')).toBeNull();
  });

  it('shows RoutesComponent when prebids exist for pbjsNamespace and downloading is "false"', () => {
    renderPanel({ pbjsNamespace: 'pbjs', prebids: { pbjs: { version: '7.0' } } }, { downloading: 'false' });

    expect(screen.getByTestId('routes-component')).toBeTruthy();
    expect(screen.queryByTestId('no-prebid-card')).toBeNull();
    expect(screen.queryByTestId('downloading-card')).toBeNull();
  });

  it('shows DownloadingCardComponent after 1s delay when downloading is "true"', () => {
    renderPanel({ pbjsNamespace: 'pbjs', prebids: null }, { downloading: 'true' });

    expect(screen.queryByTestId('downloading-card')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByTestId('downloading-card')).toBeTruthy();
  });

  it('shows DownloadingCardComponent after 1s delay when downloading is "error"', () => {
    renderPanel({ pbjsNamespace: 'pbjs', prebids: null }, { downloading: 'error' });

    expect(screen.queryByTestId('downloading-card')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByTestId('downloading-card')).toBeTruthy();
  });

  it('hides RoutesComponent when downloading card is displayed', () => {
    renderPanel({ pbjsNamespace: 'pbjs', prebids: { pbjs: { version: '7.0' } } }, { downloading: 'true' });

    expect(screen.getByTestId('routes-component')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByTestId('downloading-card')).toBeTruthy();
    expect(screen.queryByTestId('routes-component')).toBeNull();
  });

  it('resets showDownloadCard to false when downloading state changes to false or idle', () => {
    const { rerender } = renderPanel({ pbjsNamespace: 'pbjs', prebids: null }, { downloading: 'true' });

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByTestId('downloading-card')).toBeTruthy();

    rerender(
      <InspectedPageContext.Provider value={{ downloading: 'false' }}>
        <StateContext.Provider value={{ pbjsNamespace: 'pbjs', prebids: null }}>
          <Panel />
        </StateContext.Provider>
      </InspectedPageContext.Provider>
    );

    expect(screen.queryByTestId('downloading-card')).toBeNull();
    expect(screen.getByTestId('no-prebid-card')).toBeTruthy();
  });

  it('cleans up timeout on unmount without throwing errors', () => {
    const { unmount } = renderPanel({ pbjsNamespace: 'pbjs', prebids: null }, { downloading: 'true' });

    unmount();

    act(() => {
      vi.advanceTimersByTime(1100);
    });
  });
});
