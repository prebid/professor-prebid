import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Popup } from './Popup';
import AppStateContext from '../Shared/contexts/appStateContext';
import { PBJS_NAMESPACE_CHANGE, POPUP_LOADED } from '../Shared/constants';
import * as utils from '../Shared/utils';

vi.mock('../Shared/components/navBar/Navbar', () => ({
  NavBar: () => <div data-testid="nav-bar">Mock NavBar</div>,
}));
vi.mock('../Shared/components/NoPrebidCardComponent', () => ({
  default: () => <div data-testid="no-prebid-card">Mock No Prebid Card</div>,
}));
vi.mock('../Shared/components/RoutesComponent', () => ({
  default: () => <div data-testid="routes-component">Mock Routes</div>,
}));

vi.mock('../Shared/utils', () => ({
  sendChromeTabsMessage: vi.fn(),
}));

vi.mock('@mui/material/Box', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="box">{children}</div>,
}));

describe('Popup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPopup = (contextValue: any) => {
    return render(
      <AppStateContext.Provider value={contextValue}>
        <Popup />
      </AppStateContext.Provider>
    );
  };

  it('renders NavBar and sends POPUP_LOADED on mount', () => {
    renderPopup({ pbjsNamespace: 'pbjs', prebids: {} });

    expect(screen.getByTestId('nav-bar')).toBeTruthy();
    expect(utils.sendChromeTabsMessage).toHaveBeenCalledWith(POPUP_LOADED, {});
    expect(utils.sendChromeTabsMessage).toHaveBeenCalledWith(PBJS_NAMESPACE_CHANGE, 'pbjs');
  });

  it('renders NoPrebidCardComponent when prebids is null', () => {
    renderPopup({ pbjsNamespace: 'pbjs', prebids: null });

    expect(screen.getByTestId('no-prebid-card')).toBeTruthy();
    expect(screen.queryByTestId('routes-component')).toBeNull();
  });

  it('renders NoPrebidCardComponent when prebids is undefined', () => {
    renderPopup({ pbjsNamespace: 'pbjs', prebids: undefined });

    expect(screen.getByTestId('no-prebid-card')).toBeTruthy();
    expect(screen.queryByTestId('routes-component')).toBeNull();
  });

  it('renders NoPrebidCardComponent when prebids is empty object {}', () => {
    renderPopup({ pbjsNamespace: 'pbjs', prebids: {} });

    expect(screen.getByTestId('no-prebid-card')).toBeTruthy();
    expect(screen.queryByTestId('routes-component')).toBeNull();
  });

  it('renders NoPrebidCardComponent when prebids has entries for other namespaces but not current pbjsNamespace', () => {
    renderPopup({ pbjsNamespace: 'pbjs', prebids: { custom_pbjs: { version: '1.0' } } });

    expect(screen.getByTestId('no-prebid-card')).toBeTruthy();
    expect(screen.queryByTestId('routes-component')).toBeNull();
  });

  it('renders RoutesComponent when prebids exist for the current pbjsNamespace', () => {
    const contextValue = {
      pbjsNamespace: 'pbjs',
      prebids: {
        pbjs: { version: '7.0.0' },
      },
    };
    renderPopup(contextValue);

    expect(screen.queryByTestId('no-prebid-card')).toBeNull();
    expect(screen.getByTestId('routes-component')).toBeTruthy();
  });

  it('sends PBJS_NAMESPACE_CHANGE when pbjsNamespace changes on context update', () => {
    const { rerender } = renderPopup({ pbjsNamespace: 'pbjs', prebids: {} });

    expect(utils.sendChromeTabsMessage).toHaveBeenCalledWith(PBJS_NAMESPACE_CHANGE, 'pbjs');

    rerender(
      <AppStateContext.Provider value={{ pbjsNamespace: 'customPbjs', prebids: {} }}>
        <Popup />
      </AppStateContext.Provider>
    );

    expect(utils.sendChromeTabsMessage).toHaveBeenCalledWith(PBJS_NAMESPACE_CHANGE, 'customPbjs');
  });
});
