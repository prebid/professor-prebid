import React, { useContext } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InspectedPageContext, { InspectedPageContextProvider } from './inspectedPageContext';
import { preAuctionHarKey } from '../constants';
import { harChunkKey } from '../harLogStorage';

const HAR_KEY = preAuctionHarKey(123);

// A storage change that stores `entries` as chunk `chunkId` of a tab's network log, and makes it the whole log.
const logChange = (entries: object[], tabId = 123, chunkId = 0) => ({
  [preAuctionHarKey(tabId)]: { newValue: JSON.stringify([chunkId]) },
  [harChunkKey(tabId, chunkId)]: { newValue: JSON.stringify(entries) },
});

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
          get: vi.fn((keys, cb) => {
            const stored: Record<string, string> = { [HAR_KEY]: '[0]', [harChunkKey(123, 0)]: JSON.stringify([{ url: 'https://example.com' }]) };
            cb(
              Object.fromEntries(
                [keys]
                  .flat()
                  .filter((key: string) => key in stored)
                  .map((key: string) => [key, stored[key]])
              )
            );
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
      listeners.forEach((listener) => listener(logChange([{ url: 'https://inspected-tab.com' }]), 'session'));
    });
    await waitFor(() => expect(screen.getByTestId('harLog').textContent).toContain('https://inspected-tab.com'), { timeout: 2000 });

    // Sent last, so any of them would replace the log if the filter let it through.
    await act(async () => {
      listeners.forEach((listener) => {
        listener(logChange([{ url: 'https://other-tab.com' }], 999), 'session');
        listener(logChange([{ url: 'https://wrong-area.com' }]), 'local');
      });
      await new Promise((resolve) => setTimeout(resolve, 1200)); // past the 1s debounce
    });
    expect(screen.getByTestId('harLog').textContent).toContain('https://inspected-tab.com');
    expect(screen.getByTestId('harLog').textContent).not.toContain('other-tab');
    expect(screen.getByTestId('harLog').textContent).not.toContain('wrong-area');
  });

  it('adds a new chunk to the log without re-reading the chunks it already has', async () => {
    await act(async () => {
      render(
        <InspectedPageContextProvider>
          <TestComponent />
        </InspectedPageContextProvider>
      );
    });
    await waitFor(() => expect(screen.getByTestId('harLog').textContent).toContain('https://example.com'), { timeout: 2000 });

    await act(async () => {
      listeners.forEach((listener) => listener({ [HAR_KEY]: { newValue: '[0,1]' }, [harChunkKey(123, 1)]: { newValue: JSON.stringify([{ url: 'https://next.com' }]) } }, 'session'));
    });

    await waitFor(() => expect(JSON.parse(screen.getByTestId('harLog').textContent!)).toEqual([{ url: 'https://example.com' }, { url: 'https://next.com' }]), { timeout: 2000 });
  });

  it('empties the network log when the panel clears it', async () => {
    await act(async () => {
      render(
        <InspectedPageContextProvider>
          <TestComponent />
        </InspectedPageContextProvider>
      );
    });
    await waitFor(() => expect(screen.getByTestId('harLog').textContent).toContain('https://example.com'), { timeout: 2000 });

    await act(async () => {
      listeners.forEach((listener) => listener({ [HAR_KEY]: { newValue: '[]' } }, 'session'));
    });
    await waitFor(() => expect(screen.getByTestId('harLog').textContent).toBe('[]'), { timeout: 2000 });
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
      listeners.forEach((listener) => listener(logChange([{ url: 'https://old-page.com' }]), 'session'));
    });
    await waitFor(() => expect(screen.getByTestId('harLog').textContent).toContain('old-page'), { timeout: 2000 });

    await act(async () => {
      listeners.forEach((listener) => listener({ [HAR_KEY]: { oldValue: '[0]', newValue: undefined } }, 'session'));
    });
    await waitFor(() => expect(screen.getByTestId('harLog').textContent).toBe('[]'), { timeout: 2000 });
  });

  it('handles initial mount when tabInfo does not exist in local storage', async () => {
    global.chrome.storage.local.get = vi.fn((keys, cb) => cb({})) as any;

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
            ...logChange([{ url: 'https://test.com/new' }]),
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
            [HAR_KEY]: { newValue: '[0]' },
            [harChunkKey(123, 0)]: { newValue: 'not-valid-json' },
          },
          'session'
        );
      });
    });

    // The initial log (example.com) is replaced by an empty one rather than kept or crashing.
    await waitFor(() => expect(screen.getByTestId('harLog').textContent).toBe('[]'), { timeout: 2000 });
  });

  it('ignores storage changes for non-local area or unchanged tabInfo values', async () => {
    const { fetchEvents } = await import('./fetchEvents');
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

    // Only the initial load fetched events.
    expect(fetchEvents).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('frames').textContent).toBe(JSON.stringify({ 'top-window': {} }));
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

    // A removed tab info clears the frames.
    await waitFor(() => expect(screen.getByTestId('frames').textContent).toBe('{}'));
  });
});
