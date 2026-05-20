import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.UAT_WEB_URL || 'http://localhost:5173';
const stagingE2e =
  process.env.STAGING_E2E === '1' ||
  (Boolean(process.env.UAT_WEB_URL) && process.env.UAT_WEB_URL !== 'http://localhost:5173');

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: stagingE2e
    ? undefined
    : [
        {
          command: 'npm run dev:api',
          url: 'http://localhost:3001/api/v1/health',
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: 'npm run dev:web',
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ],
});
