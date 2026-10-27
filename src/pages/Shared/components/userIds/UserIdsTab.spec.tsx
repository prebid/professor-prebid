import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserIdsTab from './UserIdsTab';
import AppStateContext from '../../contexts/appStateContext';

describe('UserIdsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
      writable: true,
      configurable: true,
    });
  });

  const mockEids = [
    {
      source: 'criteo.com',
      uids: [{ id: 'criteo-uid-123', atype: 1, ext: { rtiPartner: 'criteo' } }],
    },
    {
      source: 'sharedid.org',
      uids: [{ id: 'sharedid-uid-456' }],
    },
  ];

  it('renders EID cards, supports copying UID to clipboard, and toggles JSON view', async () => {
    const mockContext: any = {
      prebid: { eids: mockEids },
    };

    render(
      <AppStateContext.Provider value={mockContext}>
        <UserIdsTab searchQuery="" />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('criteo.com')).toBeTruthy();
    expect(screen.getByText('criteo-uid-123')).toBeTruthy();
    expect(screen.getByText('atype: 1')).toBeTruthy();
    expect(screen.getByText('Extension Metadata (ext):')).toBeTruthy();

    const copyBtns = screen.getAllByLabelText('Copy User ID to clipboard');
    await act(async () => {
      fireEvent.click(copyBtns[0]);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('criteo-uid-123');
    expect(screen.getByText('User ID copied to clipboard!')).toBeTruthy();

    const codeBtns = screen.getAllByLabelText('Toggle Raw EID JSON payload');
    fireEvent.click(codeBtns[0]);
  });

  it('filters EIDs by searchQuery and handles empty results', () => {
    const mockContext: any = {
      prebid: { eids: mockEids },
    };

    const { rerender } = render(
      <AppStateContext.Provider value={mockContext}>
        <UserIdsTab searchQuery="sharedid" />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('sharedid.org')).toBeTruthy();
    expect(screen.queryByText('criteo.com')).toBeNull();

    rerender(
      <AppStateContext.Provider value={mockContext}>
        <UserIdsTab searchQuery="source:criteo" />
      </AppStateContext.Provider>
    );
    expect(screen.getByText('criteo.com')).toBeTruthy();
    expect(screen.queryByText('sharedid.org')).toBeNull();

    rerender(
      <AppStateContext.Provider value={mockContext}>
        <UserIdsTab searchQuery="nonexistent" />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('No User IDs match "nonexistent"')).toBeTruthy();
  });

  it('renders message when no EIDs are detected', () => {
    render(
      <AppStateContext.Provider value={{ prebid: { eids: [] } }}>
        <UserIdsTab searchQuery="" />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('No User IDs (EIDs) detected on this page.')).toBeTruthy();
  });
});
