import { defineConfig } from '@playwright/test';

/** The live A/B performance benchmark (npm run test:perf); it launches its own browsers. */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'performance.spec.ts',
  workers: 1,
  reporter: 'list',
});
