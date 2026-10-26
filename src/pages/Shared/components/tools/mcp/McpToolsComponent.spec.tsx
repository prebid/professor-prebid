import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import McpToolsComponent, { generateMcpAiPrompt, injectDevtoolsMcpScript } from './McpToolsComponent';
import AppStateContext from '../../../../Shared/contexts/appStateContext';
import { MCP_BRIDGE_ENABLE } from '../../../constants';

vi.mock('../../../../Shared/utils', () => ({
  getTabId: vi.fn().mockResolvedValue(1),
}));

describe('McpToolsComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.chrome = {
      scripting: {
        executeScript: vi.fn().mockImplementation((opts) => {
          if (typeof opts?.func === 'function') {
            (window as any).pbjs = { onEvent: vi.fn(), installedModules: [] };
            opts.func(...(opts.args || []));
          }
          return Promise.resolve([{ result: true }]);
        }),
      },
    } as any;

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  it('renders correctly when devtoolsMcp is not installed', () => {
    const mockState: any = {
      prebid: { version: '8.0.0', installedModules: ['appnexusBidAdapter'] },
      prebids: {},
    };

    render(
      <AppStateContext.Provider value={mockState}>
        <McpToolsComponent />
      </AppStateContext.Provider>
    );

    expect(screen.getByText(/Model Context Protocol \(MCP\) & AI Diagnostics/i)).toBeTruthy();
    expect(screen.getByText('MCP Standalone Inactive')).toBeTruthy();
    expect(screen.getByText('Inject DevTools MCP Standalone')).toBeTruthy();
    expect(screen.getByText('Copy AI Diagnostic Snapshot')).toBeTruthy();
    expect(screen.getByText('Export MCP JSON')).toBeTruthy();
  });

  it('renders as active when devtoolsMcp is in installedModules', () => {
    const mockState: any = {
      prebid: { version: '11.29.0', installedModules: ['appnexusBidAdapter', 'devtoolsMcp'] },
      prebids: {},
    };

    render(
      <AppStateContext.Provider value={mockState}>
        <McpToolsComponent />
      </AppStateContext.Provider>
    );

    expect(screen.getByText('DevTools MCP Active')).toBeTruthy();
    expect(screen.getByText('MCP Module Injected')).toBeTruthy();
  });

  it('injects standalone script when inject button is clicked', async () => {
    const mockState: any = {
      prebid: { version: '8.0.0', installedModules: [] },
      prebids: {},
    };

    render(
      <AppStateContext.Provider value={mockState}>
        <McpToolsComponent />
      </AppStateContext.Provider>
    );

    const injectBtn = screen.getByText('Inject DevTools MCP Standalone');
    await act(async () => {
      fireEvent.click(injectBtn);
    });

    expect(chrome.scripting.executeScript).toHaveBeenCalled();
  });

  it('copies AI diagnostic snapshot to clipboard', async () => {
    const mockState: any = {
      prebid: {
        version: '11.29.0',
        installedModules: ['appnexusBidAdapter'],
        timeout: 1500,
        eventsUrl: 'https://example.com/events',
      },
      prebids: {
        pbjs: { version: '11.29.0', installedModules: ['appnexusBidAdapter'] },
      },
    };

    render(
      <AppStateContext.Provider value={mockState}>
        <McpToolsComponent />
      </AppStateContext.Provider>
    );

    const copyBtn = screen.getByText('Copy AI Diagnostic Snapshot');
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('handles injection failure gracefully', async () => {
    global.chrome.scripting.executeScript = vi.fn().mockRejectedValue(new Error('Script injection blocked'));

    render(
      <AppStateContext.Provider value={{ prebid: { version: '8.0.0', installedModules: [] } }}>
        <McpToolsComponent />
      </AppStateContext.Provider>
    );

    const injectBtn = screen.getByText('Inject DevTools MCP Standalone');
    await act(async () => {
      fireEvent.click(injectBtn);
    });

    expect(screen.getByText('Failed to inject DevTools MCP module.')).toBeTruthy();
  });

  it('handles clipboard copy failure gracefully', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard blocked')),
      },
      writable: true,
      configurable: true,
    });

    render(
      <AppStateContext.Provider value={{ prebid: { version: '8.0.0' } }}>
        <McpToolsComponent />
      </AppStateContext.Provider>
    );

    const copyBtn = screen.getByText('Copy AI Diagnostic Snapshot');
    await act(async () => {
      fireEvent.click(copyBtn);
    });
  });

  it('exercises injectDevtoolsMcpScript inner function and handles event recording and custom globals', async () => {
    let capturedFunc: Function = () => {};
    let capturedArgs: any[] = [];
    global.chrome.scripting.executeScript = vi.fn().mockImplementation((opts) => {
      capturedFunc = opts.func;
      capturedArgs = opts.args || [];
      return Promise.resolve([{ result: true }]);
    });
    const bridgeEnableListener = vi.fn();
    document.addEventListener(MCP_BRIDGE_ENABLE, bridgeEnableListener);

    await injectDevtoolsMcpScript();

    const registeredHandlers: { [k: string]: Function } = {};
    const mockPbjs: any = {
      installedModules: ['dfp'],
      onEvent: vi.fn((evt, cb) => {
        registeredHandlers[evt] = cb;
      }),
    };
    delete (window as any).__PREBID_DEVTOOLS_MCP_INITIALIZED__;
    (window as any).pbjs = mockPbjs;
    (window as any)._pbjsGlobals = ['pbjs'];

    capturedFunc(...capturedArgs);
    expect(bridgeEnableListener).toHaveBeenCalledTimes(1);
    document.removeEventListener(MCP_BRIDGE_ENABLE, bridgeEnableListener);

    registeredHandlers['auctionInit']?.({ auctionId: 'auc-1', timeout: 2000 });
    registeredHandlers['bidResponse']?.({ auctionId: 'auc-1', cpm: 2.0 });
    registeredHandlers['noBid']?.({ auctionId: 'auc-1' });
    registeredHandlers['bidWon']?.({ auction: { auctionId: 'auc-1' } });

    expect((window as any).__PREBID_DEVTOOLS_MCP__.getEvents().length).toBe(4);
    expect((window as any).__PREBID_DEVTOOLS_MCP__.getAuctions().length).toBe(1);

    capturedFunc(...capturedArgs);
  });

  it('records each event once when pbjs is also listed in _pbjsGlobals, and leaves installedModules untouched', async () => {
    let capturedFunc: Function = () => {};
    let capturedArgs: any[] = [];
    global.chrome.scripting.executeScript = vi.fn().mockImplementation((opts) => {
      capturedFunc = opts.func;
      capturedArgs = opts.args || [];
      return Promise.resolve([{ result: true }]);
    });
    await injectDevtoolsMcpScript();

    // Like Prebid, keep every registered handler and call all of them.
    const handlers: { [k: string]: Function[] } = {};
    const mockPbjs: any = {
      installedModules: ['dfp'],
      onEvent: vi.fn((evt, cb) => (handlers[evt] = [...(handlers[evt] || []), cb])),
    };
    const fire = (evt: string, args: any) => (handlers[evt] || []).forEach((cb) => cb(args));
    delete (window as any).__PREBID_DEVTOOLS_MCP_INITIALIZED__;
    (window as any).pbjs = mockPbjs;
    (window as any)._pbjsGlobals = ['pbjs'];

    capturedFunc(...capturedArgs);
    fire('bidResponse', { auctionId: 'auc-1', cpm: 2.0 });
    fire('bidWon', { auctionId: 'auc-1' });

    const mcp = (window as any).__PREBID_DEVTOOLS_MCP__;
    expect(mcp.getEvents()).toHaveLength(2);
    expect(mcp.getAuctions()[0].bidsReceived).toHaveLength(1);
    expect(mcp.getAuctions()[0].winningBids).toHaveLength(1);
    expect(mockPbjs.installedModules).toEqual(['dfp']);
  });

  it('generateMcpAiPrompt reports MCP as active after injection even without the devtoolsMcp module', () => {
    expect(generateMcpAiPrompt({ installedModules: [] }, undefined, true)).toContain('**DevTools MCP Active:** `Yes`');
    expect(generateMcpAiPrompt({ installedModules: [] }, undefined)).toContain('**DevTools MCP Active:** `No`');
  });

  it('triggers export MCP JSON download', () => {
    const mockState: any = {
      prebid: { version: '11.29.0', installedModules: ['devtoolsMcp'] },
      prebids: {},
    };

    render(
      <AppStateContext.Provider value={mockState}>
        <McpToolsComponent />
      </AppStateContext.Provider>
    );

    const exportBtn = screen.getByText('Export MCP JSON');
    fireEvent.click(exportBtn);
  });

  it('generateMcpAiPrompt formats complete prompt string', () => {
    const prompt = generateMcpAiPrompt({ version: '11.29.0', installedModules: ['rubiconBidAdapter', 'devtoolsMcp'], timeout: 1200, debug: true, eids: [{ source: 'id5' }] }, { pbjs: { version: '11.29.0', installedModules: [] } });
    expect(prompt).toContain('11.29.0');
    expect(prompt).toContain('DevTools MCP Active:** `Yes`');
    expect(prompt).toContain('1200ms');
    expect(prompt).toContain('Debug Mode:** Enabled');
  });
});
