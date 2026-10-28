import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // The live A/B benchmark takes over an hour; run it on its own with npm run test:perf.
  testIgnore: '**/performance.spec.ts',
  // Tests against real publisher sites (tagged @live) run with npm run test:e2e:live.
  grepInvert: /@live/,
  timeout: 60 * 1000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false, // Extension tests share one browser per worker
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    actionTimeout: 0,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
