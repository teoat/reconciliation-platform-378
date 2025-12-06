/**
 * Global Setup for E2E Tests
 * Runs before all tests to prepare the test environment
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');
  
  // Ensure base URL is set
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:1000';
  console.log(`📍 Base URL: ${baseURL}`);
  
  // Optional: Create test user, seed database, etc.
  // For now, we assume the app is running and accessible
  
  try {
    // Verify the app is accessible
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    console.log('🔍 Checking if app is accessible...');
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('✅ App is accessible');
    
    await browser.close();
  } catch (error) {
    console.error('❌ Failed to access app:', error);
    console.log('⚠️  Make sure the app is running at', baseURL);
    // Don't fail the tests - they will fail individually with better error messages
  }
  
  console.log('✅ Global setup complete');
}

export default globalSetup;
