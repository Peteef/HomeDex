import { defineConfig, devices } from '@playwright/test';
import { E2E_DATA_DIR, PROJECTS } from './e2e/fixtures.ts';

const port = 3100;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${String(port)}`,
    // The app follows the browser's language, so the tests pin it.
    locale: 'en-US',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: PROJECTS.iphone13Mini,
      use: { ...devices['iPhone 13 Mini'], viewport: { width: 375, height: 812 } },
    },
    {
      name: PROJECTS.iphone17Pro,
      use: { ...devices['iPhone 17 Pro'], viewport: { width: 402, height: 874 } },
    },
    { name: PROJECTS.desktopChrome, use: { ...devices['Desktop Chrome'] } },
    { name: PROJECTS.desktopSafari, use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run build && node e2e/prepare-data.ts && npm start',
    url: `http://127.0.0.1:${String(port)}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      PORT: String(port),
      HOST: '127.0.0.1',
      DATA_DIR: E2E_DATA_DIR,
    },
  },
});
