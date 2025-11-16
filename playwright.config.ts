// Playwright Configuration for E2E Testing
// Comprehensive end-to-end testing setup

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './e2e',
  
  // Global test timeout
  timeout: 30 * 1000,
  
  // Expect timeout
  expect: {
    timeout: 5000,
  },
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:1000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Global test timeout
    actionTimeout: 10000,
    
    // Navigation timeout
    navigationTimeout: 30000,
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // Tablet testing
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],
  
  // Run your local dev server before starting the tests
  webServer: {
    command: 'echo "Using existing Docker container"',
    url: 'http://localhost:1000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
  
  // Global setup
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  
  // Global teardown
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
  
  // Test match patterns
  testMatch: [
    '**/*.spec.ts',
    '**/*.test.ts',
  ],
  
  // Ignore patterns
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
  ],
  
  // Output directory
  outputDir: 'test-results/',
  
  // Test results directory
  testResultsDir: 'test-results/',
  
  // Update snapshots
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true',
  
  // Preserve output
  preserveOutput: 'always',
  
  // Fully parallel
  fullyParallel: true,
  
  // Fail fast
  failFast: false,
  
  // Max failures
  maxFailures: process.env.CI ? 10 : undefined,
  
  // Metadata
  metadata: {
    testType: 'e2e',
    environment: process.env.NODE_ENV || 'test',
    version: process.env.npm_package_version || '1.0.0',
  },
});