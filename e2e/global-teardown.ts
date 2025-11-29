/**
 * Global Teardown for Playwright Tests
 * Runs once after all tests
 */

async function globalTeardown() {
  console.log('Global teardown: Cleaning up test environment...');
  
  // Clean up TESTING environment variable
  delete process.env.TESTING;
  
  // Optional: Clean up test database if needed
  // This would require database connection and cleanup logic
  
  console.log('Global teardown: Test environment cleaned up');
}

export default globalTeardown;

