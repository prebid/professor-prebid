import { test, expect, liveSiteNamed, PREBID_VERSION } from '../fixtures/extensionTest';
import { waitForDetectedPrebid } from '../helpers/extensionTestUtils';

test.describe('01 - Live Prebid Detection & Extension Lifecycle', () => {
  test.describe.configure({ timeout: 90000 });

  const sites = [
    { name: 'heise.de', title: 'detects Prebid.js behind a TCF v2 CMP on a German tech publisher (heise.de)' },
    { name: 'eatpicks.com', title: 'detects Prebid.js and GAM slots on a lifestyle site (eatpicks.com)' },
    { name: 'theguardian.com', title: 'detects Prebid.js in a custom wrapper on a news publisher (theguardian.com)' },
  ];

  for (const { name, title } of sites) {
    test(title, async ({ extension, liveSite }) => {
      const extensionErrors: string[] = [];
      liveSite.page.on('pageerror', (error) => {
        if (/prof(essor)?[ _-]?prebid/i.test(`${error.message} ${error.stack}`)) extensionErrors.push(error.message);
      });

      await liveSite.open(liveSiteNamed(name).url);

      const detected = await waitForDetectedPrebid(extension.serviceWorker, liveSite.page.url());
      expect(detected, `Professor Prebid should store the Prebid instance found on ${name}`).not.toBeNull();
      expect(detected!.details.namespace).toBe(detected!.namespace);
      expect(detected!.details.version).toMatch(PREBID_VERSION);
      expect(typeof detected!.details.config).toBe('object');

      // Accepting consent reloads some pages, so start the bridge on the page Prebid now runs in.
      expect(await liveSite.waitForMcpBridge(), 'MCP bridge should start, so the injected script runs').toBe(true);
      const snapshot = await liveSite.getMcpSnapshot();
      expect(snapshot.prebidVersion).toBe(detected!.details.version);

      expect(extensionErrors, `no errors from Professor Prebid on ${name}`).toEqual([]);
    });
  }
});
