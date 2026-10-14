import { Page} from '@playwright/test';

export class DevToolsPanelPage {
  constructor(readonly page: Page) {}

  async selectTab(tabLabel: string): Promise<void> {
    const tabButton = this.page.locator(`button:has-text("${tabLabel}")`).first();
    await tabButton.click();
    await this.page.waitForTimeout(300);
  }

  async isTabActive(tabLabel: string): Promise<boolean> {
    const tabButton = this.page.locator(`button:has-text("${tabLabel}")`).first();
    const variant = await tabButton.getAttribute('class');
    return variant?.includes('MuiButton-contained') ?? false;
  }

  async toggleAdOverlay(): Promise<void> {
    await this.selectTab('Tools');
    const overlaySwitch = this.page.locator('input[type="checkbox"]').first();
    await overlaySwitch.click();
    await this.page.waitForTimeout(400);
  }

  async injectDevtoolsMcp(): Promise<void> {
    await this.selectTab('Tools');
    const injectBtn = this.page.locator('button:has-text("Inject Standalone MCP")').first();
    if (await injectBtn.isVisible()) {
      await injectBtn.click();
      await this.page.waitForTimeout(500);
    }
  }

  async generateAiDiagnosticPrompt(): Promise<void> {
    await this.selectTab('Tools');
    const aiBtn = this.page.locator('button:has-text("Generate AI Prompt"), button:has-text("Copy Diagnostic Snapshot")').first();
    if (await aiBtn.isVisible()) {
      await aiBtn.click();
      await this.page.waitForTimeout(300);
    }
  }

  async getTableRowsCount(): Promise<number> {
    return await this.page.locator('tbody tr, .MuiTableRow-root').count();
  }

  async hasJsonViewerContent(): Promise<boolean> {
    return (await this.page.locator('pre, .w-json-view-container, code').count()) > 0;
  }
}
