import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('openDfpConsole', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.resetModules();
    delete (window as any).googletag;
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it('calls googletag.openConsole if function exists', async () => {
    const openConsoleMock = vi.fn();
    (window as any).googletag = {
      cmd: [],
      openConsole: openConsoleMock,
    };

    await import('./openDfpConsole');
    (window as any).googletag.cmd.forEach((fn: Function) => fn());

    expect(openConsoleMock).toHaveBeenCalled();
  });

  it('sets google_console=1 searchParam as fallback when google_console is missing', async () => {
    const locationMock = new URL('https://example.com/test');
    delete (window as any).location;
    (window as any).location = locationMock;

    (window as any).googletag = {
      cmd: [],
    };

    await import('./openDfpConsole');
    (window as any).googletag.cmd.forEach((fn: Function) => fn());

    expect((window as any).googletag.cmd.length).toBeGreaterThan(0);
    expect((window as any).location.href).toBe('https://example.com/test?google_console=1');
  });

  it('does not update window.location.href if google_console is already present in searchParams', async () => {
    const locationMock = new URL('https://example.com/test?google_console=1');
    delete (window as any).location;
    (window as any).location = locationMock;

    (window as any).googletag = {
      cmd: [],
    };

    await import('./openDfpConsole');
    (window as any).googletag.cmd.forEach((fn: Function) => fn());

    expect((window as any).location.href).toBe('https://example.com/test?google_console=1');
  });

  it('initializes googletag and googletag.cmd if undefined', async () => {
    delete (window as any).googletag;
    await import('./openDfpConsole');
    expect((window as any).googletag).toBeDefined();
    expect(Array.isArray((window as any).googletag.cmd)).toBe(true);
  });
});
