import { Page} from '@playwright/test';

export class PopupPage {
  constructor(readonly page: Page) {}

  async isNoPrebidCardVisible(): Promise<boolean> {
    return await this.page.locator('text="No Prebid.js detected"').isVisible();
  }

  async selectTab(tabLabel: string): Promise<void> {
    const tabButton = this.page.locator(`button:has-text("${tabLabel}")`).first();
    if (await tabButton.isVisible()) {
      await tabButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  async isNavBarVisible(): Promise<boolean> {
    return await this.page.locator('.MuiTabs-root').isVisible();
  }
}
