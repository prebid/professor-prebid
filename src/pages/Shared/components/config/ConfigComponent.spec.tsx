import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ConfigComponent from './ConfigComponent';
import { ExpandableTile } from './tiles/ExpandableTile';
import AppStateContext from '../../contexts/appStateContext';
import CodeIcon from '@mui/icons-material/Code';

import * as utils from '../../utils';

vi.spyOn(utils, 'download').mockImplementation(() => {});

describe('ConfigComponent & ExpandableTile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders ExpandableTile and handles expand toggle and scrollIntoView', () => {
    const dummyScroll = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = dummyScroll;

    render(
      <ExpandableTile icon={<CodeIcon />} title="Test Tile" subtitle="Tile Subtitle">
        <div>Tile Content</div>
      </ExpandableTile>
    );

    expect(screen.getByText('Test Tile')).toBeTruthy();
    expect(screen.getByText('Tile Subtitle')).toBeTruthy();
    expect(screen.getByText('Tile Content')).toBeTruthy();

    const cardHeader = screen.getByText('Test Tile');
    fireEvent.click(cardHeader);

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(dummyScroll).toHaveBeenCalled();
  });

  it('renders ConfigComponent and handles filtering matching and non-matching keys', () => {
    const mockContext: any = {
      prebid: {
        config: {
          bidderTimeout: 3000,
          priceGranularity: 'medium',
        },
      },
    };

    render(
      <AppStateContext.Provider value={mockContext}>
        <ConfigComponent />
      </AppStateContext.Provider>
    );

    expect(screen.getByPlaceholderText('Filter config...')).toBeTruthy();

    const input = screen.getByPlaceholderText('Filter config...');

    fireEvent.change(input, { target: { value: 'bidderTimeout' } });
    expect(screen.getByText(/"config"/)).toBeTruthy();

    fireEvent.change(input, { target: { value: 'bidderTimeout:' } });
    expect(screen.getByText(/"config"/)).toBeTruthy();

    fireEvent.change(input, { target: { value: 'nonExistentParam' } });
    expect(screen.getByText('No matching configuration parameters')).toBeTruthy();
  });

  it('triggers download config JSON button click', () => {
    const mockContext: any = {
      prebid: {
        config: {
          bidderTimeout: 3000,
        },
      },
    };

    render(
      <AppStateContext.Provider value={mockContext}>
        <ConfigComponent />
      </AppStateContext.Provider>
    );

    const downloadBtn = screen.getByLabelText('Download Prebid config as JSON');
    fireEvent.click(downloadBtn);

    expect(utils.download).toHaveBeenCalledWith({ bidderTimeout: 3000 }, 'prebid-config');
  });

  it('handles empty prebid and config gracefully', () => {
    render(
      <AppStateContext.Provider value={{ prebid: {} }}>
        <ConfigComponent />
      </AppStateContext.Provider>
    );

    expect(screen.getByPlaceholderText('Filter config...')).toBeTruthy();
  });

  it('renders ErrorFallback and resets when a tile throws an error', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    const mockContext: any = {
      prebid: {
        config: {
          get userSync() {
            throw new Error('Test tile crash');
          },
        },
      },
    };

    render(
      <AppStateContext.Provider value={mockContext}>
        <ConfigComponent />
      </AppStateContext.Provider>
    );

    expect(screen.getAllByText(/An error occurred: Test tile crash/i).length).toBeGreaterThanOrEqual(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    console.error = originalConsoleError;
  });
});
