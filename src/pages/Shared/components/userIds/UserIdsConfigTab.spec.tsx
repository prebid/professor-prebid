import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ConfigTab from './UserIdsConfigTab';
import AppStateContext from '../../contexts/appStateContext';

describe('UserIdsConfigTab (ConfigTab)', () => {
  const mockModules = [
    {
      name: 'criteoId',
      storage: { type: 'cookie', name: 'ct', expires: 30 },
      bidders: ['rubicon', 'criteo'],
      params: { partnerId: '123' },
    },
    {
      name: 'id5Id',
      storage: { type: 'html5', name: 'id5' },
    },
  ];

  it('renders User ID module configuration cards with chips and params', () => {
    const mockContext: any = {
      prebid: {
        config: {
          userSync: { userIds: mockModules },
        },
      },
    };

    render(
      <AppStateContext.Provider value={mockContext}>
        <ConfigTab searchQuery="" />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('criteoId')).toBeTruthy();
    expect(screen.getByText('type: cookie')).toBeTruthy();
    expect(screen.getByText('key: ct')).toBeTruthy();
    expect(screen.getByText('expires: 30d')).toBeTruthy();
    expect(screen.getByText('Allowed Bidders:')).toBeTruthy();
    expect(screen.getByText('rubicon')).toBeTruthy();
    expect(screen.getByText('Module Parameters (params):')).toBeTruthy();
  });

  it('filters modules by searchQuery and displays no match message', () => {
    const mockContext: any = {
      prebid: {
        config: {
          userSync: { userIds: mockModules },
        },
      },
    };

    const { rerender } = render(
      <AppStateContext.Provider value={mockContext}>
        <ConfigTab searchQuery="id5" />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('id5Id')).toBeTruthy();
    expect(screen.queryByText('criteoId')).toBeNull();

    rerender(
      <AppStateContext.Provider value={mockContext}>
        <ConfigTab searchQuery="name:criteo" />
      </AppStateContext.Provider>
    );
    expect(screen.getByText('criteoId')).toBeTruthy();
    expect(screen.queryByText('id5Id')).toBeNull();

    rerender(
      <AppStateContext.Provider value={mockContext}>
        <ConfigTab searchQuery="nonexistent" />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('No User ID modules match "nonexistent"')).toBeTruthy();
  });

  it('renders fallback message when no userSync userIds configuration exists', () => {
    render(
      <AppStateContext.Provider value={{ prebid: { config: {} } }}>
        <ConfigTab searchQuery="" />
      </AppStateContext.Provider>
    );

    expect(screen.getByText(/No User ID module configuration found/)).toBeTruthy();
  });
});
