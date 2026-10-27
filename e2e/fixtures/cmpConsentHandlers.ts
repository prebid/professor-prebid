import { Frame, Locator, Page } from '@playwright/test';

/** "Accept all" buttons of the CMPs used by the live test sites (OneTrust, Usercentrics, Sourcepoint, consentmanager, Quantcast, Cookiebot, Funding Choices, Didomi...). */
export const CONSENT_SELECTORS = [
  '#onetrust-accept-btn-handler',
  '#onetrust-accept-all-handler',
  '[data-testid="uc-accept-all-button"]',
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
  '#didomi-notice-agree-button',
  'button.accept-all',
  'button[name="agree"]',
  'button[value="agree"]',
  '[aria-label="Accept all"]',
  '[data-gdpr-consent="accept"]',
  'button:has-text("Alle akzeptieren")',
  'button:has-text("Alles akzeptieren")',
  'button:has-text("Zustimmen")',
  'button:has-text("Einverstanden")',
  'button:has-text("Akzeptieren")',
  'button:has-text("Tout accepter")',
  'button:has-text("Accepter & Fermer")',
  'button:has-text("Accepter")',
  'button:has-text("Alles accepteren")',
  'button:has-text("Ga akkoord")',
  'button:has-text("Akkoord")',
  'button:has-text("Accepteren")',
  'button:has-text("Accept all")',
  'button:has-text("Accept All")',
  'button:has-text("I Accept")',
  'button:has-text("I agree")',
  'button:has-text("Accept Cookies")',
  'button:has-text("Agree & Proceed")',
  'button:has-text("Got it")',
];

// CMPs often keep a hidden copy of their buttons (heise.de has two "Agree" buttons), so only visible ones count.
const consentButton = (frame: Frame): Locator =>
  CONSENT_SELECTORS.map((selector) => frame.locator(selector))
    .reduce((all, locator) => all.or(locator))
    .filter({ visible: true })
    .first();

/**
 * Clicks the first visible consent button in the page or any of its frames, polling until `timeoutMs`
 * because most CMP banners mount a few seconds after DOMContentLoaded. Returns whether one was clicked.
 * (locator.isVisible does not wait, so a single pass right after load would miss them.)
 */
export const autoAcceptConsent = async (page: Page, timeoutMs = 8000): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const button = consentButton(frame);
      if (await button.isVisible().catch(() => false)) {
        await button.click({ timeout: 2000 }).catch(() => {});
        return true;
      }
    }
    await page.waitForTimeout(250);
  }
  return false;
};
