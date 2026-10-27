import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PbjsVersionInfoComponent from './PbjsVersionInfoComponent';
import PbjsVersionInfoPopOver from './PbjsVersionInfoPopOver';
import PbjsVersionInfoContent from './PbjsVersionInfoContent';
import AppStateContext from '../../contexts/appStateContext';

describe('PbjsVersionInfo components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.chrome = {
      storage: {
        local: {
          get: vi.fn((key, cb) => cb({})),
          set: vi.fn((val, cb) => cb?.()),
        },
      },
    } as any;
  });

  const mockReleaseInfo: any = {
    latestVersion: '8.1.0',
    latestVersionPublishedAt: '2026-05-01T00:00:00Z',
    installedVersion: '8.0.0',
    installedVersionPublishedAt: '2023-01-01T00:00:00Z',
    timeElapsedSinceLatestVersion: {
      text: '3 years, 4 months',
    },
    featureCountSinceInstalledVersion: 5,
    maintenanceCountSinceInstalledVersion: 3,
    bugfixCountSinceInstalledVersion: 10,
    releasesSinceInstalledVersion: [
      {
        tag_name: '8.1.0',
        name: 'v8.1.0 Release',
        published_at: '2026-05-01T00:00:00Z',
        html_url: 'https://github.com/prebid/Prebid.js/releases/tag/v8.1.0',
        doc: { body: { innerHTML: '<p>Release details for 8.1.0</p>' } },
        body: 'Release details for 8.1.0',
      },
    ],
  };

  it('renders PbjsVersionInfoComponent with version data and handles close click', () => {
    const closeFn = vi.fn();
    const mockContext: any = {
      prebid: { version: '8.0.0' },
      prebidReleaseInfo: mockReleaseInfo,
      setPrebidReleaseInfo: vi.fn(),
    };

    render(
      <AppStateContext.Provider value={mockContext}>
        <PbjsVersionInfoComponent close={closeFn} />
      </AppStateContext.Provider>
    );

    expect(screen.getByText(/Installed Version/i)).toBeTruthy();

    const closeBtn = screen.getAllByRole('button')[0];
    fireEvent.click(closeBtn);
    expect(closeFn).toHaveBeenCalled();
  });

  it('renders PbjsVersionInfoPopOver when open', () => {
    const mockContext: any = {
      prebid: { version: '8.0.0' },
      prebidReleaseInfo: mockReleaseInfo,
      setPrebidReleaseInfo: vi.fn(),
    };

    render(
      <AppStateContext.Provider value={mockContext}>
        <PbjsVersionInfoPopOver pbjsVersionPopUpOpen={true} setPbjsVersionPopUpOpen={vi.fn()} />
      </AppStateContext.Provider>
    );

    expect(screen.getByText(/Installed Version/i)).toBeTruthy();
  });

  it('renders latest version message and documentation links when installed version matches latest', () => {
    const latestReleaseInfo: any = {
      ...mockReleaseInfo,
      latestVersion: '8.0.0',
      installedVersion: 'v8.0.0',
    };

    const mockContext: any = {
      prebid: { version: 'v8.0.0' },
      prebidReleaseInfo: latestReleaseInfo,
      setPrebidReleaseInfo: vi.fn(),
    };

    render(
      <AppStateContext.Provider value={mockContext}>
        <PbjsVersionInfoContent />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('Up to date')).toBeTruthy();
    expect(screen.getByText(/All latest features and bug fixes are present/)).toBeTruthy();
    expect(screen.getByText('Prebid.org Docs')).toBeTruthy();
  });

  it('renders metric cards and toggles changelog release accordions when installed version is older', () => {
    const mockContext: any = {
      prebid: { version: '8.0.0' },
      prebidReleaseInfo: mockReleaseInfo,
      setPrebidReleaseInfo: vi.fn(),
    };

    render(
      <AppStateContext.Provider value={mockContext}>
        <PbjsVersionInfoContent />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('New Features')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('Maintenance Updates')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Bug Fixes')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('3 years, 4 months')).toBeTruthy();

    expect(screen.getByText('v8.1.0 Release')).toBeTruthy();

    const expandBtn = screen.getByText('Expand All');
    fireEvent.click(expandBtn);
    expect(screen.getByText('Collapse All')).toBeTruthy();
    expect(screen.getByText(/Release details for 8.1.0/)).toBeTruthy();
  });

  it('filters changelog items with search query', () => {
    const multiReleaseInfo: any = {
      ...mockReleaseInfo,
      releasesSinceInstalledVersion: [
        {
          tag_name: '8.1.0',
          name: 'v8.1.0 Release',
          published_at: '2026-05-01T00:00:00Z',
          html_url: 'https://github.com/prebid/Prebid.js/releases/tag/v8.1.0',
          body: 'Special Feature X Added',
        },
        {
          tag_name: '8.0.1',
          name: 'v8.0.1 Patch',
          published_at: '2026-02-01T00:00:00Z',
          html_url: 'https://github.com/prebid/Prebid.js/releases/tag/v8.0.1',
          body: 'Bug fix for Y',
        },
      ],
    };

    const mockContext: any = {
      prebid: { version: '8.0.0' },
      prebidReleaseInfo: multiReleaseInfo,
      setPrebidReleaseInfo: vi.fn(),
    };

    render(
      <AppStateContext.Provider value={mockContext}>
        <PbjsVersionInfoContent />
      </AppStateContext.Provider>
    );

    const searchInput = screen.getByPlaceholderText('Filter changelog...');
    fireEvent.change(searchInput, { target: { value: 'Feature X' } });

    expect(screen.getByText('v8.1.0 Release')).toBeTruthy();
    expect(screen.queryByText('v8.0.1 Patch')).toBeNull();

    const releaseHeader = screen.getByText('v8.1.0 Release');
    fireEvent.click(releaseHeader);

    fireEvent.change(searchInput, { target: { value: 'NonExistentMatch12345' } });
    expect(screen.getByText(/No releases match "NonExistentMatch12345"/)).toBeTruthy();
  });

  it('handles copy summary action', () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    const mockContext: any = {
      prebid: { version: '8.0.0' },
      prebidReleaseInfo: mockReleaseInfo,
      setPrebidReleaseInfo: vi.fn(),
    };

    render(
      <AppStateContext.Provider value={mockContext}>
        <PbjsVersionInfoContent />
      </AppStateContext.Provider>
    );

    const copyBtn = screen.getByLabelText(/Copy version summary/i);
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalled();
  });

  it('fetches release info from GitHub API when cached data is missing and processes markdown headers', async () => {
    const setPrebidReleaseInfo = vi.fn();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            tag_name: '8.0.0',
            published_at: '2023-01-01T00:00:00Z',
            body: '<h2 id="newfeatures">New Features</h2><ul><li>Feature 1</li></ul><h2 id="maintenance">Maintenance</h2><ul><li>Maint 1</li></ul><h2 id="bugfixes">Bug Fixes</h2><ul><li>Bug 1</li></ul>',
          },
        ]),
    });
    global.fetch = mockFetch;

    const mockContext: any = {
      prebid: { version: 'v8.0.0' },
      prebidReleaseInfo: {},
      setPrebidReleaseInfo,
    };

    await act(async () => {
      render(
        <AppStateContext.Provider value={mockContext}>
          <PbjsVersionInfoContent />
        </AppStateContext.Provider>
      );
    });

    expect(mockFetch).toHaveBeenCalled();
    expect(setPrebidReleaseInfo).toHaveBeenCalled();
  });

  it('handles paginated releases when first page has 100 items and installed version is on page 2', async () => {
    const setPrebidReleaseInfo = vi.fn();
    const page1Releases = Array.from({ length: 100 }, (_, i) => ({
      tag_name: `9.${i}.0`,
      published_at: '2026-01-01T00:00:00Z',
      body: '<h2 id="newfeatures">New</h2><ul><li>F</li></ul>',
    }));
    const page2Releases = [
      {
        tag_name: '8.0.0',
        published_at: '2025-05-01T00:00:00Z',
        body: '<h2 id="newfeatures">New</h2><ul><li>F</li></ul>',
      },
    ];

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('&page=1&')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(page1Releases) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(page2Releases) });
    });
    global.fetch = mockFetch;

    const mockContext: any = {
      prebid: { version: 'v8.0.0' },
      prebidReleaseInfo: {},
      setPrebidReleaseInfo,
    };

    await act(async () => {
      render(
        <AppStateContext.Provider value={mockContext}>
          <PbjsVersionInfoContent />
        </AppStateContext.Provider>
      );
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('uses cached release info from chrome.storage when valid and unexpired, and falls back to fetch when not in cache', async () => {
    const cachedData = [
      {
        tag_name: '7.50.0', // does not match installed v8.0.0 -> triggers !page fallback fetch
        published_at: '2025-01-01T00:00:00Z',
        cached_at: Date.now(),
        body: '<h2 id="newfeatures">New Features</h2><ul><li>Feature 1</li></ul>',
      },
    ];

    global.chrome.storage.local.get = vi.fn((key, cb) => cb({ pbjsReleasesData: JSON.stringify(cachedData) }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            tag_name: '8.0.0',
            published_at: '2025-01-01T00:00:00Z',
            body: '<h2 id="newfeatures">New</h2>',
          },
        ]),
    });
    global.fetch = mockFetch;

    const setPrebidReleaseInfo = vi.fn();
    const mockContext: any = {
      prebid: { version: 'v8.0.0' },
      prebidReleaseInfo: {},
      setPrebidReleaseInfo,
    };

    await act(async () => {
      render(
        <AppStateContext.Provider value={mockContext}>
          <PbjsVersionInfoContent />
        </AppStateContext.Provider>
      );
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('handles expired cache and fetches new releases from GitHub', async () => {
    const expiredData = [
      {
        tag_name: '8.0.0',
        published_at: '2024-01-01T00:00:00Z',
        cached_at: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
        body: '',
      },
    ];

    global.chrome.storage.local.get = vi.fn((key, cb) => cb({ pbjsReleasesData: JSON.stringify(expiredData) }));
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            tag_name: '8.0.0',
            published_at: '2024-01-01T00:00:00Z',
            body: '<h2 id="newfeatures">New</h2><ul><li>1</li></ul>',
          },
        ]),
    });
    global.fetch = mockFetch;

    const mockContext: any = {
      prebid: { version: 'v8.0.0' },
      prebidReleaseInfo: {},
      setPrebidReleaseInfo: vi.fn(),
    };

    await act(async () => {
      render(
        <AppStateContext.Provider value={mockContext}>
          <PbjsVersionInfoContent />
        </AppStateContext.Provider>
      );
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('handles fetch API errors gracefully and provides retry button', async () => {
    global.chrome.storage.local.get = vi.fn((key, cb) => cb({}));
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const mockContext: any = {
      prebid: { version: 'v8.0.0' },
      prebidReleaseInfo: {},
      setPrebidReleaseInfo: vi.fn(),
    };

    await act(async () => {
      render(
        <AppStateContext.Provider value={mockContext}>
          <PbjsVersionInfoContent />
        </AppStateContext.Provider>
      );
    });

    expect(screen.getByText(/GitHub API returned status 500/i)).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('handles network throw error during fetch', async () => {
    global.chrome.storage.local.get = vi.fn((key, cb) => cb({}));
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const mockContext: any = {
      prebid: { version: 'v8.0.0' },
      prebidReleaseInfo: {},
      setPrebidReleaseInfo: vi.fn(),
    };

    await act(async () => {
      render(
        <AppStateContext.Provider value={mockContext}>
          <PbjsVersionInfoContent />
        </AppStateContext.Provider>
      );
    });

    expect(screen.getByText('Network offline')).toBeTruthy();
  });

  it('handles version not found in GitHub release list', async () => {
    global.chrome.storage.local.get = vi.fn((key, cb) => cb({}));
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ tag_name: 'v9.9.9', published_at: '2026-01-01T00:00:00Z', body: '' }]),
    });

    const mockContext: any = {
      prebid: { version: 'v0.0.1-custom' },
      prebidReleaseInfo: {},
      setPrebidReleaseInfo: vi.fn(),
    };

    await act(async () => {
      render(
        <AppStateContext.Provider value={mockContext}>
          <PbjsVersionInfoContent />
        </AppStateContext.Provider>
      );
    });

    expect(screen.getByText(/No release data found on GitHub/i)).toBeTruthy();
  });
});
