import { test as base, expect } from '@playwright/test';
import { closeExtensionContext, ExtensionContextInfo, launchExtensionContext } from '../helpers/extensionTestUtils';
import { attachAiDiagnosticOnFailure } from '../helpers/mcpTestHelpers';
import { LiveSitePage } from '../pom/LiveSitePage';
import { LIVE_SITES_CATALOG, LiveSiteConfig } from './liveSitesCatalog';

/**
 * Playwright test with Professor Prebid loaded. `extension` is one browser per worker, deleted with its
 * profile afterwards; `liveSite` is a fresh tab in it that gets the AI diagnostic attached when a test fails.
 */
export const test = base.extend<{ liveSite: LiveSitePage }, { extension: ExtensionContextInfo }>({
  extension: [
    // Playwright requires the destructuring pattern even when a fixture uses no other fixtures.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const extension = await launchExtensionContext();
      try {
        await use(extension);
      } finally {
        await closeExtensionContext(extension);
      }
    },
    { scope: 'worker' },
  ],
  liveSite: async ({ extension }, use, testInfo) => {
    const page = await extension.browserContext.newPage();
    try {
      await use(new LiveSitePage(page));
      await attachAiDiagnosticOnFailure(testInfo, page);
    } finally {
      await page.close();
    }
  },
});

export { expect };

/**
 * Tag for tests that load real publisher sites. They need network access and depend on those sites' ad setups,
 * so npm run test:e2e leaves them out; npm run test:e2e:live runs them.
 */
export const LIVE = '@live';

/** Prebid's version string, e.g. "v9.53.0" or "11.29.0". */
export const PREBID_VERSION = /^v?\d+\.\d+/;

export const liveSiteNamed = (name: string): LiveSiteConfig => {
  const site = LIVE_SITES_CATALOG.find((s) => s.name === name);
  if (!site) throw new Error(`${name} is not in LIVE_SITES_CATALOG`);
  return site;
};
