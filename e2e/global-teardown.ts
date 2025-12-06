/**
 * Global Teardown for E2E Tests
 * Runs after all tests to clean up the test environment
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');
  
  // Optional: Clean up test data, close connections, etc.
  
  console.log('✅ Global teardown complete');
}

export default globalTeardown;
