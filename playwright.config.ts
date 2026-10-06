import { defineConfig, devices } from 'playwright/test'

/**
 * Browser pass over the EMR pages. It runs against the real stack: the Vite dev
 * server (started here when it is not already running), the NestJS API on :8080
 * and Medplum behind it. Needs E2E_USERNAME / E2E_PASSWORD for a platform admin
 * (see the backend's LOCAL_CREDENTIALS.md). Data it creates is tagged, not deleted.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    actionTimeout: 10_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
