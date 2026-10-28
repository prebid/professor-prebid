import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavBar } from './Navbar';

vi.mock('./NavbarSelector', () => ({
  NavbarSelector: () => <div data-testid="navbar-selector">Selector</div>,
}));
vi.mock('./NavbarTabs', () => ({
  NavBarTabs: () => <div data-testid="navbar-tabs">Tabs</div>,
}));
vi.mock('./NavbarReload', () => ({
  NavBarReload: () => <div data-testid="navbar-reload">Reload</div>,
}));
vi.mock('@mui/material/AppBar', () => ({
  default: ({ children }: any) => <nav data-testid="appbar">{children}</nav>,
}));

describe('NavBar', () => {
  it('renders all sub-components', () => {
    render(<NavBar />);
    expect(screen.getByTestId('navbar-selector')).toBeTruthy();
    expect(screen.getByTestId('navbar-tabs')).toBeTruthy();
    expect(screen.getByTestId('navbar-reload')).toBeTruthy();
  });

  it('wraps in AppBar', () => {
    render(<NavBar />);
    expect(screen.getByTestId('appbar')).toBeTruthy();
  });
});
