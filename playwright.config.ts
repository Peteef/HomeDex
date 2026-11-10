import { defineConfig, devices } from '@playwright/test';

const port = 3100;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://127.0.0.1:${String(port)}`, trace: 'retain-on-failure' },
  projects: [
    {
      name: 'iphone-13-mini',
      use: { ...devices['iPhone 13 Mini'], viewport: { width: 375, height: 812 } },
    },
    {
      name: 'iphone-17-pro',
      use: { ...devices['iPhone 17 Pro'], viewport: { width: 402, height: 874 } },
    },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build && npm start',
    url: `http://127.0.0.1:${String(port)}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      PORT: String(port),
      HOST: '127.0.0.1',
      DATA_DIR: '.e2e-data',
    },
  },
});
