// Playwright Configuration for E2E Testing
// Comprehensive end-to-end testing setup

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './e2e',
  
  // Global test timeout (optimized for reliability)
  timeout: 60 * 1000, // Increased from 30s to 60s for complex E2E tests
  
  // Expect timeout (optimized for async operations)
  expect: {
    timeout: 10000, // Increased from 5s to 10s for better reliability
    // Use toHaveScreenshot for visual regression testing
    toHaveScreenshot: {
      threshold: 0.2, // 20% threshold for visual comparisons
      maxDiffPixels: 100, // Maximum pixel difference allowed
    },
  },
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry strategy (optimized for flaky tests)
  retries: process.env.CI ? 2 : 1, // Retry once locally, twice on CI
  
  // Worker configuration (optimized for reliability)
  // Default to sequential execution to avoid database connection pool exhaustion
  // Can be overridden with PLAYWRIGHT_WORKERS environment variable
  workers: process.env.PLAYWRIGHT_WORKERS 
    ? parseInt(process.env.PLAYWRIGHT_WORKERS) 
    : 1, // Default to 1 worker (sequential) to avoid pool exhaustion
  
  // Reporter configuration (optimized)
  reporter: process.env.CI
    ? [
        ['html', { 
          outputFolder: 'playwright-report',
          open: 'never',
        }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/results.xml' }],
        ['list'],
      ]
    : [
        ['html', { 
          outputFolder: 'playwright-report',
          open: 'on-failure', // Auto-open on local failures
        }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/results.xml' }],
      ],
  
  // Shared settings for all the projects below (optimized)
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8000',
    
    // Collect trace when retrying the failed test (optimized for debugging)
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure', // Keep traces on local failures
    
    // Take screenshot on failure (optimized)
    screenshot: 'only-on-failure',
    
    // Record video on failure (optimized for CI)
    video: process.env.CI ? 'retain-on-failure' : 'on-first-retry', // Videos on CI failures, traces on local
    
    // Global action timeout (optimized for slow networks)
    actionTimeout: 15000, // Increased from 10s to 15s
    
    // Navigation timeout (optimized)
    navigationTimeout: 45000, // Increased from 30s to 45s for slow pages
    
    // Additional performance optimizations
    ignoreHTTPSErrors: true, // Useful for local development with self-signed certs
    bypassCSP: true, // Bypass Content Security Policy for testing
    locale: 'en-US', // Set default locale
    timezoneId: 'America/New_York', // Set default timezone
  },
  
  // Configure projects for major browsers (optimized)
  projects: [
    // Primary browser for development (fastest)
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Optimize Chromium-specific settings
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage', // Overcome limited resource problems
            '--no-sandbox', // Useful for CI environments
          ],
        },
      },
    },
    
    // Secondary browsers (run in parallel when needed)
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile testing (optimized for performance)
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
  // Commented out for now - app needs to be started manually
  // webServer: {
  //   command: 'echo "Using existing Docker container"',
  //   url: 'http://localhost:1000',
  //   reuseExistingServer: true,
  //   timeout: 120 * 1000,
  // },
  
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
  
  // Update snapshots
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true' ? 'all' : 'none',
  
  // Preserve output
  preserveOutput: 'always',
  
  // Fully parallel
  fullyParallel: true,
  
  // Max failures
  maxFailures: process.env.CI ? 10 : undefined,
  
  // Metadata
  metadata: {
    testType: 'e2e',
    environment: process.env.NODE_ENV || 'test',
    version: process.env.npm_package_version || '1.0.0',
  },
});