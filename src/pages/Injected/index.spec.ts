import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MCP_BRIDGE_ENABLE } from '../Shared/constants';

vi.mock('./googleAdManager', () => ({ googleAdManager: { init: vi.fn() } }));
vi.mock('./prebid', () => ({ addEventListenersForPrebid: vi.fn() }));
vi.mock('./tcf', () => ({ iabTcf: { init: vi.fn() } }));
vi.mock('../App/InjectedApp', () => ({ default: () => null }));

describe('Injected entry point', () => {
  beforeEach(() => {
    vi.resetModules();
    delete (window as any).__PROFESSOR_PREBID_MCP__;
  });

  it('does not expose the MCP bridge on page load', async () => {
    await import('./index');
    expect((window as any).__PROFESSOR_PREBID_MCP__).toBeUndefined();
  });

  it('installs the MCP bridge once the enable event is dispatched', async () => {
    await import('./index');
    document.dispatchEvent(new CustomEvent(MCP_BRIDGE_ENABLE));
    expect((window as any).__PROFESSOR_PREBID_MCP__?.bridgeVersion).toBe('1.0.0');
  });
});
