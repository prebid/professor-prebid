import React, { useContext } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InspectedPageContext, { InspectedPageContextProvider } from './inspectedPageContext';
import { preAuctionHarKey } from '../constants';

const HAR_KEY = preAuctionHarKey(123);

vi.mock('../utils', () => ({
  getTabId: vi.fn().mockResolvedValue(123),
}));

vi.mock('./fetchEvents', () => ({
  fetchEvents: vi.fn((tabInfo) => Promise.resolve(tabInfo)),
}));

const TestComponent = () => {
  const ctx = useContext(InspectedPageContext);
  if (!ctx) return <div>No Context</div>;
  return (
    <div>
      <div data-testid="frames">{JSON.stringify(ctx.frames)}</div>
      <div data-testid="downloading">{ctx.downloading}</div>
      <div data-testid="syncState">{ctx.syncState}</div>
      <div data-testid="harLog">{JSON.stringify(ctx.harLog)}</div>
    </div>
  );
};

describe('InspectedPageContextProvider', () => {
  let listeners: Function[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    listeners = [];
    global.chrome = {
      storage: {
        local: {
          get: vi.fn((keys, cb) => {
            if (Array.isArray(keys) && keys.includes('tab_info_123')) {
              cb({ tab_info_123: { 'top-window': {} } });
            } else {
              cb({});
            }
          }),
        },
        session: {
          get: vi.fn((key, cb) => {
            cb(key === HAR_KEY ? { [HAR_KEY]: JSON.stringify([{ url: 'https://example.com' }]) } : {});
          }),
        },
        onChanged: {
          addListener: vi.fn((fn) => listeners.push(fn)),
          removeListener: vi.fn((fn) => {
            listeners = listeners.filter((l) => l !== fn);
          }),
        },
      },
    } as any;
  });

  it('loads initial tab info and harLog on mount', async () => {
    await act(async () => {
      render(
        <InspectedPageContextProvider>
          <TestComponent />
        </InspectedPageContextProvider>
      );
    });

    expect(screen.getByTestId('frames').textContent).toContain('top-window');
    expect(screen.getByTestId('downloading').textContent).toBe('false');
    await waitFor(() => expect(screen.getByTestId('harLog').textContent).toContain('https://example.com'), { timeout: 2000 });
  });

  it('only applies network log changes for the inspected tab from session storage', async () => {
    await act(async () => {
      render(
        <InspectedPageContextProvider>
          <TestComponent />
        </InspectedPageContextProvider>
      );
    });

    await act(async () => {
      listeners.forEach((listener) => {
        listener({ [preAuctionHarKey(999)]: { newValue: JSON.stringify([{ url: 'https://other-tab.com' }]) } }, 'session');
        listener({ [HAR_KEY]: { newValue: JSON.stringify([{ url: 'https://wrong-area.com' }]) } }, 'local');
        listener({ [HAR_KEY]: { newValue: JSON.stringify([{ url: 'https://inspected-tab.com' }]) } }, 'session');
      });
    });

    await waitFor(() => expect(screen.getByTestId('harLog').textContent).toContain('https://inspected-tab.com'), { timeout: 2000 });
    expect(screen.getByTestId('harLog').textContent).not.toContain('other-tab');
    expect(screen.getByTestId('harLog').textContent).not.toContain('wrong-area');
  });

  it('empties the network log when the stored log is removed for a new page', async () => {
    await act(async () => {
      render(
        <InspectedPageContextProvider>
          <TestComponent />
        </InspectedPageContextProvider>
      );
    });

    await act(async () => {
      listeners.forEach((listener) => listener({ [HAR_KEY]: { newValue: JSON.stringify([{ url: 'https://old-page.com' }]) } }, 'session'));
    });
    await waitFor(() => expect(screen.getByTestId('harLog').textContent).toContain('old-page'), { timeout: 2000 });

    await act(async () => {
      listeners.forEach((listener) => listener({ [HAR_KEY]: { oldValue: '[]', newValue: undefined } }, 'session'));
    });
    await waitFor(() => expect(screen.getByTestId('harLog').textContent).toBe('[]'), { timeout: 2000 });
  });

  it('handles initial mount when tabInfo does not exist in local storage', async () => {
    global.chrome.storage.local.get = vi.fn((keys, cb) => cb({}));

    await act(async () => {
      render(
        <InspectedPageContextProvider>
          <TestComponent />
        </InspectedPageContextProvider>
      );
    });

    expect(screen.getByTestId('frames').textContent).toBe('{}');
  });

  it('reacts to local storage changes and updates frames and harLog', async () => {
    let unmount: any;
    await act(async () => {
      const res = render(
        <InspectedPageContextProvider>
          <TestComponent />
        </InspectedPageContextProvider>
      );
      unmount = res.unmount;
    });

    await act(async () => {
      listeners.forEach((listener) => {
        listener(
          {
            tab_info_123: {
              oldValue: {},
              newValue: { 'top-window': { prebids: {} } },
            },
            [HAR_KEY]: {
              newValue: JSON.stringify([{ url: 'https://test.com/new' }]),
            },
          },
          'local'
        );
      });
    });

    expect(screen.getByTestId('frames').textContent).toContain('top-window');
    expect(listeners.length).toBeGreaterThan(0);

    unmount();
    expect(listeners.length).toBe(0);
  });

  it('handles invalid JSON in harLog storage change gracefully', async () => {
    await act(async () => {
      render(
        <InspectedPageContextProvider>
          <TestComponent />
        </InspectedPageContextProvider>
      );
    });

    await act(async () => {
      listeners.forEach((listener) => {
        listener(
          {
            [HAR_KEY]: {
              newValue: 'not-valid-json',
            },
          },
          'session'
        );
      });
    });

    expect(screen.getByTestId('syncState')).toBeDefined();
  });

  it('ignores storage changes for non-local area or unchanged tabInfo values', async () => {
    await act(async () => {
      render(
        <InspectedPageContextProvider>
          <TestComponent />
        </InspectedPageContextProvider>
      );
    });

    await act(async () => {
      listeners.forEach((listener) => {
        listener(
          {
            tab_info_123: {
              oldValue: { a: 1 },
              newValue: { a: 2 },
            },
          },
          'sync'
        );

        listener(
          {
            tab_info_123: {
              oldValue: { same: 1 },
              newValue: { same: 1 },
            },
          },
          'local'
        );

        listener(
          {
            other_key: {
              oldValue: 1,
              newValue: 2,
            },
          },
          'local'
        );
      });
    });

    expect(screen.getByTestId('syncState')).toBeDefined();
  });

  it('handles tab_info change where newValue is undefined', async () => {
    await act(async () => {
      render(
        <InspectedPageContextProvider>
          <TestComponent />
        </InspectedPageContextProvider>
      );
    });

    await act(async () => {
      listeners.forEach((listener) => {
        listener(
          {
            tab_info_123: {
              oldValue: { 'top-window': {} },
              newValue: undefined,
            },
          },
          'local'
        );
      });
    });

    expect(screen.getByTestId('syncState')).toBeDefined();
  });

  it('trims downloadingUrls when length exceeds 100', async () => {
    const { fetchEvents } = await import('./fetchEvents');
    (fetchEvents as any).mockImplementationOnce((tabInfo, setDownloading, setSyncInfo, downloadingUrls) => {
      for (let i = 0; i <= 105; i++) {
        downloadingUrls.push(`https://url-${i}.com`);
      }
      return Promise.resolve(tabInfo);
    });

    await act(async () => {
      render(
        <InspectedPageContextProvider>
          <TestComponent />
        </InspectedPageContextProvider>
      );
    });

    await act(async () => {
      listeners.forEach((listener) => {
        listener(
          {
            tab_info_123: {
              oldValue: {},
              newValue: { 'top-window': { prebids: {} } },
            },
          },
          'local'
        );
      });
    });

    expect(screen.getByTestId('syncState')).toBeDefined();
  });
});
