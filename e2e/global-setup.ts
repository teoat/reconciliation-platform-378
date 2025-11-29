/**
 * Global Setup for Playwright Tests
 * Runs once before all tests
 */

async function globalSetup() {
  console.log('Global setup: Starting test environment...');
  
  // Set TESTING environment variable for backend to use test pool configuration
  process.env.TESTING = 'true';
  
  // Verify backend is running
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:2000';
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
    const healthData = await response.json();
    console.log('✅ Backend is running and healthy:', healthData.data?.status || 'ok');
  } catch (error) {
    console.warn('⚠️  Backend health check failed. Make sure backend is running.');
    console.warn('   Start backend with: docker compose -f docker-compose.optimized.yml up -d backend');
  }
  
  console.log('Global setup: Test environment ready');
}

export default globalSetup;

