import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

/** The e2e tests against real publisher sites (tagged @live): npm run test:e2e:live. They need network access. */
export default defineConfig({
  ...baseConfig,
  grep: /@live/,
  grepInvert: undefined,
});
