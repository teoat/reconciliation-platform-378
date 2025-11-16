// Simplified Playwright Configuration for Frontend Testing
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  use: {
    baseURL: 'http://localhost:1000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 }
      },
    },
  ],
  webServer: {
    command: 'echo "Using existing Docker container on port 1000"',
    url: 'http://localhost:1000',
    reuseExistingServer: true,
    timeout: 5 * 1000,
  },
});

