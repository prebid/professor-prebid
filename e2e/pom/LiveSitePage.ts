import { Page } from '@playwright/test';
import { autoAcceptConsent } from '../fixtures/cmpConsentHandlers';
import { waitForMcpBridge } from '../helpers/mcpTestHelpers';

/** A live publisher page, read through Prebid.js itself and through Professor Prebid's MCP bridge. */
export class LiveSitePage {
  constructor(readonly page: Page) {}

  /**
   * Navigates to `url` and accepts the consent banner if one appears. Live ad pages rarely reach `load`
   * (ads keep loading), so this only waits for DOMContentLoaded; a page that fails to load fails the
   * assertions that follow.
   */
  async open(url: string, { navigationTimeoutMs = 30000, consentTimeoutMs = 8000 } = {}): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: navigationTimeoutMs }).catch(() => {});
    await autoAcceptConsent(this.page, consentTimeoutMs);
  }

  /** Whether the MCP bridge came up, which shows the injected script runs on the page. */
  async waitForMcpBridge(timeoutMs = 15000): Promise<boolean> {
    return waitForMcpBridge(this.page, timeoutMs)
      .then(() => true)
      .catch(() => false);
  }

  /** Whether Prebid.js loaded on the page within `timeoutMs`; on GDPR sites it only loads after consent. */
  async waitForPrebid(timeoutMs = 30000): Promise<boolean> {
    return this.page
      .waitForFunction(
        () => {
          const win = window as any;
          const pbjs = win.pbjs || (win._pbjsGlobals && win[win._pbjsGlobals[0]]);
          return typeof pbjs?.version === 'string' && pbjs.version.length > 0;
        },
        null,
        { timeout: timeoutMs, polling: 500 }
      )
      .then(() => true)
      .catch(() => false);
  }

  /** Whether Prebid.js finished an auction on the page within `timeoutMs`. */
  async waitForAuctionEnd(timeoutMs = 30000): Promise<boolean> {
    return this.page
      .waitForFunction(
        () => {
          const win = window as any;
          const pbjs = win.pbjs || (win._pbjsGlobals && win[win._pbjsGlobals[0]]);
          const events: any[] = typeof pbjs?.getEvents === 'function' ? pbjs.getEvents() : [];
          return events.some((event) => event?.eventType === 'auctionEnd');
        },
        null,
        { timeout: timeoutMs, polling: 500 }
      )
      .then(() => true)
      .catch(() => false);
  }

  /** The bridge's snapshot, or null when the bridge is not on the page. */
  async getMcpSnapshot(): Promise<any> {
    return this.page.evaluate(() => (window as any).__PROFESSOR_PREBID_MCP__?.getSnapshot?.() ?? null);
  }

  async getMcpLatencySummary(): Promise<any> {
    return this.page.evaluate(() => (window as any).__PROFESSOR_PREBID_MCP__?.getLatencySummary?.() ?? null);
  }

  async generateAiPrompt(): Promise<string | null> {
    return this.page.evaluate(() => (window as any).__PROFESSOR_PREBID_MCP__?.generateAiPrompt?.() ?? null);
  }

  /** Prebid's own config, read straight from the page. */
  async getPrebidConfig(): Promise<Record<string, any> | null> {
    return this.page.evaluate(() => {
      const win = window as any;
      const pbjs = win.pbjs || (win._pbjsGlobals && win[win._pbjsGlobals[0]]);
      return typeof pbjs?.getConfig === 'function' ? pbjs.getConfig() : null;
    });
  }

  /** The distinct event types in Prebid's own event log. */
  async getPrebidEventTypes(): Promise<string[]> {
    return this.page.evaluate(() => {
      const win = window as any;
      const pbjs = win.pbjs || (win._pbjsGlobals && win[win._pbjsGlobals[0]]);
      const events: any[] = typeof pbjs?.getEvents === 'function' ? pbjs.getEvents() : [];
      return Array.from(new Set(events.map((event) => event?.eventType)));
    });
  }

  /** Number of Professor Prebid ad overlays (AdOverlayPortal containers) on the page. */
  async countOverlays(): Promise<number> {
    return this.page.locator('[id^="prpb-mask--container-"]').count();
  }
}
