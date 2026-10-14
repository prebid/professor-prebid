import { Page} from '@playwright/test';
import { autoAcceptConsent } from '../fixtures/cmpConsentHandlers';
export class LiveSitePage {
  constructor(readonly page: Page) {}
  async navigateAndHandleConsent(url: string, timeoutMs: number = 30000): Promise<void> {
    try {
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: timeoutMs,
      });
    } catch (e) {}
    // Wait a brief moment for CMP to mount
    await this.page.waitForTimeout(1500);
    // Accept consent if banner appears
    await autoAcceptConsent(this.page);
    // Wait for async Prebid scripts to load
    await this.page.waitForTimeout(3000);
  }
  /**
   * Waits for Professor Prebid MCP bridge to be active on the page.
   */
  async waitForMcpBridge(timeoutMs: number = 15000): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        () => {
          const win = window as any;
          if (typeof win.__PROFESSOR_PREBID_MCP__ !== 'undefined') return true;
          document.dispatchEvent(new CustomEvent('PP_MCP_BRIDGE_ENABLE'));
          return false;
        },
        null,
        { timeout: timeoutMs }
      );
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Reads the live AdTech snapshot from the injected MCP bridge.
   */
  async getMcpSnapshot(): Promise<any> {
    return await this.page.evaluate(() => {
      const win = window as any;
      return win.__PROFESSOR_PREBID_MCP__?.getSnapshot ? win.__PROFESSOR_PREBID_MCP__.getSnapshot() : null;
    });
  }
  /**
   * Reads structured auctions from the injected MCP bridge.
   */
  async getMcpAuctions(): Promise<any[]> {
    return await this.page.evaluate(() => {
      const win = window as any;
      return win.__PROFESSOR_PREBID_MCP__?.getAuctions ? win.__PROFESSOR_PREBID_MCP__.getAuctions() : [];
    });
  }
  /**
   * Reads latency and timeout statistics from the injected MCP bridge.
   */
  async getMcpLatencySummary(): Promise<any> {
    return await this.page.evaluate(() => {
      const win = window as any;
      return win.__PROFESSOR_PREBID_MCP__?.getLatencySummary ? win.__PROFESSOR_PREBID_MCP__.getLatencySummary() : null;
    });
  }
  /**
   * Checks if Prebid global objects exist in window scope.
   */
  async getPagePrebidState(): Promise<{ hasPbjs: boolean; version?: string; installedModules: string[] }> {
    return await this.page.evaluate(() => {
      const win = window as any;
      const pb = win.pbjs || (win._pbjsGlobals && win[win._pbjsGlobals[0]]);
      return {
        hasPbjs: !!pb,
        version: pb?.version,
        installedModules: pb?.installedModules || [],
      };
    });
  }
  /**
   * Checks if on-page Professor Prebid Ad Overlays exist in DOM.
   */
  async getRenderedOverlaysCount(): Promise<number> {
    return await this.page.evaluate(() => {
      const overlays = document.querySelectorAll('iframe[id^="prpb-mask--container-"]');
      return overlays.length;
    });
  }
}
