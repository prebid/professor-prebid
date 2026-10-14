import { Page } from '@playwright/test';
export const autoAcceptConsent = async function(page: Page, timeoutMs: number = 3000): Promise<boolean> {
  const consentSelectors = [
    '#onetrust-accept-btn-handler',
    '#onetrust-accept-all-handler',
    'button#onetrust-accept-btn-handler',
    '[data-testid="uc-accept-all-button"]',
    'button[data-testid="uc-accept-all-button"]',
    'button.sp_choice_type_11',
    'button[title="AGREE"]',
    'button[title="Agree"]',
    'button[title="Accept All"]',
    'button[title="Accept"]',
    '.cmpboxbtn.cmpboxbtnyes',
    '#cmpboxbtnyes',
    '.qc-cmp2-summary-buttons button:first-child',
    '.qc-cmp-button:first-child',
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    '#CybotCookiebotDialogBodyButtonAccept',
    'button.fc-cta-consent',
    '.fc-consent-root button.fc-cta-consent',
    '#didomi-notice-agree-button',
    'button[name="agree"]',
    'button[value="agree"]',
    'button:has-text("Alle akzeptieren")',
    'button:has-text("Alles akzeptieren")',
    'button:has-text("Zustimmen")',
    'button:has-text("Einverstanden")',
    'button:has-text("Akzeptieren")',
    'button:has-text("Accepter")',
    'button:has-text("Tout accepter")',
    'button:has-text("Accepter & Fermer")',
    'button:has-text("Continuer sans accepter")',
    '#didomi-notice-agree-button',
    '.didomi-continue-without-agreeing',
    'button:has-text("Akkoord")',
    'button:has-text("Alles accepteren")',
    'button:has-text("Accepteren")',
    'button:has-text("Ga akkoord")',
    'button:has-text("Accept All")',
    'button:has-text("Accept all")',
    'button:has-text("ACCEPT ALL")',
    'button:has-text("I Accept")',
    'button:has-text("I agree")',
    'button:has-text("Accept Cookies")',
    'button:has-text("Agree & Proceed")',
    'button:has-text("Got it")',
    '[aria-label="Accept all"]',
    '[data-gdpr-consent="accept"]',
  ];
  for (const selector of consentSelectors) {
    try {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 250 })) {
        await btn.click({ timeout: 1500 });
        await page.waitForTimeout(500);
        return true;
      }
    } catch {
      // Continue to next selector
    }
  }
  // Try inside any active iframes
  const frames = page.frames();
  for (const frame of frames) {
    for (const selector of consentSelectors.slice(0, 15)) {
      try {
        const btn = frame.locator(selector).first();
        if (await btn.isVisible({ timeout: 150 })) {
          await btn.click({ timeout: 1500 });
          await page.waitForTimeout(500);
          return true;
        }
      } catch {
        // Continue
      }
    }
  }
  return false;
}
