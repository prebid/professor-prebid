import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserIdsComponent from './UserIdsComponent';
import AppStateContext from '../../contexts/appStateContext';

import * as utils from '../../utils';

describe('UserIdsComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContext: any = {
    prebid: {
      eids: [
        {
          source: 'criteo.com',
          uids: [{ id: 'criteo-user-id-123', atype: 1 }],
        },
      ],
      config: {
        userSync: {
          userIds: [
            {
              name: 'criteo',
              storage: { type: 'cookie', name: 'ct' },
            },
          ],
        },
      },
    },
  };

  it('renders tabs, headers and options autocomplete', () => {
    render(
      <AppStateContext.Provider value={mockContext}>
        <UserIdsComponent />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('User IDs: 1')).toBeTruthy();
    expect(screen.getByText('Modules: 1')).toBeTruthy();
    expect(screen.getByText('criteo.com')).toBeTruthy();

    const modulesTab = screen.getByText('Modules: 1');
    fireEvent.click(modulesTab);

    expect(screen.getByText('User ID Module')).toBeTruthy();

    const userIdsTab = screen.getByText('User IDs: 1');
    fireEvent.click(userIdsTab);
    expect(screen.getByText('criteo.com')).toBeTruthy();

    const input = screen.getByPlaceholderText('Filter by source, ID or module name...');
    fireEvent.change(input, { target: { value: 'criteo' } });
    expect(screen.getByText('criteo.com')).toBeTruthy();
  });

  it('handles empty prebid and config gracefully', () => {
    render(
      <AppStateContext.Provider value={{ prebid: {} }}>
        <UserIdsComponent />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('User IDs: 0')).toBeTruthy();
    expect(screen.getByText('Modules: 0')).toBeTruthy();
  });

  it('handles download button click and raw JSON toggle', () => {
    const downloadSpy = vi.spyOn(utils, 'download').mockImplementation(() => {});
    render(
      <AppStateContext.Provider value={mockContext}>
        <UserIdsComponent />
      </AppStateContext.Provider>
    );

    const downloadBtns = screen.getAllByLabelText('Download User ID session data as JSON');
    fireEvent.click(downloadBtns[downloadBtns.length - 1]);
    expect(downloadSpy).toHaveBeenCalled();

    const jsonBtn = screen.getByLabelText('Switch to raw JSON view');
    fireEvent.click(jsonBtn);
    expect(screen.getByText('Raw User ID Data Object:')).toBeTruthy();

    const listBtn = screen.getByLabelText('Switch to list view');
    fireEvent.click(listBtn);
    expect(screen.queryByText('Raw User ID Data Object:')).toBeNull();
  });
});
