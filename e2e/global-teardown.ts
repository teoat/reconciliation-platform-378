/**
 * Global Teardown for Playwright Tests
 * Runs once after all tests
 */

async function globalTeardown() {
  // Add any global teardown logic here
  // For example: cleanup test database, stop services, etc.
  console.log('Global teardown: Cleaning up test environment...');
}

export default globalTeardown;

