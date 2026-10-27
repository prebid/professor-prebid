import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Options from './Options';

vi.mock('react-error-boundary', () => ({
  ErrorBoundary: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../Shared/components/ErrorCardComponent', () => ({
  default: () => <div>Error</div>,
}));

describe('Options Component', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();

    delete (window as any).location;
    (window as any).location = {
      ...originalLocation,
      reload: vi.fn(),
      href: 'http://localhost',
    };

    global.chrome = {
      storage: {
        sync: {
          get: vi.fn((keys, cb) => {
            cb({ selectedPopUpNavItems: [], selectedPanelNavItems: [] });
          }),
          set: vi.fn((data, cb) => {
            if (cb) cb();
          }),
          clear: vi.fn((cb) => {
            if (cb) cb();
          }),
        },
      },
    } as any;
  });

  afterEach(() => {
    (window as any).location = originalLocation;
  });

  it('renders page title text and section headers', async () => {
    await act(async () => {
      render(<Options title="Options" />);
    });
    expect(screen.getByText(/Enable or disable the following pages in the pop-up:/i)).toBeTruthy();
    expect(screen.getByText(/Enable or disable the following pages in the dev-tools-panel:/i)).toBeTruthy();
  });

  it('renders Save and Reset buttons', async () => {
    await act(async () => {
      render(<Options title="Options" />);
    });
    expect(screen.getByRole('button', { name: /Save/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Reset/i })).toBeTruthy();
  });

  it('renders page items for both pop-up and panel sections', async () => {
    await act(async () => {
      render(<Options title="Options" />);
    });
    const adUnitsLabels = screen.getAllByText('Ad Units');
    expect(adUnitsLabels.length).toBe(2);

    const bidsLabels = screen.getAllByText('Bids');
    expect(bidsLabels.length).toBe(2);
  });

  it('toggles PopUp nav item on and off (handleTogglePopUp)', async () => {
    await act(async () => {
      render(<Options title="Options" />);
    });

    const popUpAdUnitsItem = screen.getAllByText('Ad Units')[0].closest('li')!;
    const checkbox = popUpAdUnitsItem.querySelector('input') as HTMLInputElement;

    expect(checkbox.checked).toBe(false);

    await act(async () => {
      fireEvent.click(popUpAdUnitsItem);
    });
    expect(checkbox.checked).toBe(true);

    await act(async () => {
      fireEvent.click(popUpAdUnitsItem);
    });
    expect(checkbox.checked).toBe(false);
  });

  it('toggles Panel nav item on and off (handleTogglePanel)', async () => {
    await act(async () => {
      render(<Options title="Options" />);
    });

    const panelAdUnitsItem = screen.getAllByText('Ad Units')[1].closest('li')!;
    const checkbox = panelAdUnitsItem.querySelector('input') as HTMLInputElement;

    expect(checkbox.checked).toBe(false);

    await act(async () => {
      fireEvent.click(panelAdUnitsItem);
    });
    expect(checkbox.checked).toBe(true);

    await act(async () => {
      fireEvent.click(panelAdUnitsItem);
    });
    expect(checkbox.checked).toBe(false);
  });

  it('saves selected items to chrome.storage.sync on form submission (handleSubmit)', async () => {
    await act(async () => {
      render(<Options title="Options" />);
    });

    const saveButton = screen.getByRole('button', { name: /Save/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(chrome.storage.sync.set).toHaveBeenCalled();
  });

  it('resets selected items and clears chrome.storage.sync when Reset button is clicked (handleReset)', async () => {
    await act(async () => {
      render(<Options title="Options" />);
    });

    const resetButton = screen.getByRole('button', { name: /Reset/i });
    await act(async () => {
      fireEvent.click(resetButton);
    });

    expect(chrome.storage.sync.clear).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
  });
});
