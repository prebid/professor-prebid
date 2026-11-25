import { Page } from '@playwright/test';

export class PopupPage {
  constructor(readonly page: Page) {}

  async isNoPrebidCardVisible(): Promise<boolean> {
    return this.page.getByText('No Prebid.js detected on this page.').isVisible();
  }

  async isNavBarVisible(): Promise<boolean> {
    return this.page.locator('.MuiTabs-root').isVisible();
  }
}
