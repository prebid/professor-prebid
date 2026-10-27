import { test, expect, liveSiteNamed } from '../fixtures/extensionTest';

test.describe('05 - Live User IDs', () => {
  test.describe.configure({ timeout: 90000 });

  test('reports the EIDs of the configured user ID modules on a live publisher (eatpicks.com)', async ({ liveSite }) => {
    await liveSite.open(liveSiteNamed('eatpicks.com').url);
    expect(await liveSite.waitForAuctionEnd(), 'an auction should finish').toBe(true);
    expect(await liveSite.waitForMcpBridge()).toBe(true);

    const snapshot = await liveSite.getMcpSnapshot();
    expect(snapshot.installedModules).toContain('userId');
    expect(snapshot.userEids.length).toBeGreaterThan(0);
    for (const eid of snapshot.userEids) {
      expect(typeof eid.source).toBe('string');
      expect(Array.isArray(eid.uids)).toBe(true);
    }
  });
});
