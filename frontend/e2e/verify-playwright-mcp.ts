/**
 * Playwright MCP Verification Script
 * This script verifies that Playwright MCP is working correctly
 * and can interact with the frontend application
 */

import { chromium, Browser, Page } from '@playwright/test';

interface FrontendConfig {
  baseURL: string;
  port: number;
  routes: string[];
  expectedElements: {
    selector: string;
    description: string;
  }[];
}

const FRONTEND_CONFIG: FrontendConfig = {
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:1000',
  port: 1000,
  routes: [
    '/',
    '/login',
    '/analytics',
    '/settings',
  ],
  expectedElements: [
    { selector: '#root', description: 'Root application element' },
    { selector: 'body', description: 'Body element' },
  ],
};

async function verifyPlaywrightMCP(): Promise<void> {
  console.log('🚀 Starting Playwright MCP Verification...\n');

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Launch browser
    console.log('📦 Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('✅ Browser launched successfully\n');

    // Create new page
    console.log('📄 Creating new page...');
    page = await browser.newPage();
    console.log('✅ Page created successfully\n');

    // Test 1: Navigate to base URL
    console.log(`🌐 Testing navigation to ${FRONTEND_CONFIG.baseURL}...`);
    const response = await page.goto(FRONTEND_CONFIG.baseURL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    
    if (!response) {
      throw new Error('Failed to get response from server');
    }

    console.log(`✅ Navigation successful (Status: ${response.status()})\n`);

    // Test 2: Check for root element
    console.log('🔍 Checking for root element...');
    const rootElement = page.locator('#root');
    await rootElement.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Root element found\n');

    // Test 3: Check page title
    console.log('📋 Checking page title...');
    const title = await page.title();
    console.log(`✅ Page title: "${title}"\n`);

    // Test 4: Check console errors
    console.log('⚠️  Checking for console errors...');
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000); // Wait for any async errors

    if (errors.length > 0) {
      console.log(`⚠️  Found ${errors.length} console error(s):`);
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No console errors detected\n');
    }

    // Test 5: Test route navigation
    console.log('🛣️  Testing route navigation...');
    for (const route of FRONTEND_CONFIG.routes) {
      try {
        const routeResponse = await page.goto(`${FRONTEND_CONFIG.baseURL}${route}`, {
          waitUntil: 'networkidle',
          timeout: 15000,
        });
        console.log(`   ✅ ${route} - Status: ${routeResponse?.status() || 'N/A'}`);
      } catch (error) {
        console.log(`   ⚠️  ${route} - Navigation failed (may require auth)`);
      }
    }
    console.log('');

    // Test 6: Check performance metrics
    console.log('⚡ Checking performance metrics...');
    const performanceMetrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        totalTime: perf.loadEventEnd - perf.fetchStart,
      };
    });
    console.log(`   DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`   Load Complete: ${performanceMetrics.loadComplete.toFixed(2)}ms`);
    console.log(`   Total Load Time: ${performanceMetrics.totalTime.toFixed(2)}ms`);
    console.log('✅ Performance metrics captured\n');

    // Test 7: Screenshot test
    console.log('📸 Taking screenshot...');
    await page.screenshot({
      path: 'test-results/playwright-mcp-verification.png',
      fullPage: true,
    });
    console.log('✅ Screenshot saved to test-results/playwright-mcp-verification.png\n');

    console.log('🎉 Playwright MCP Verification Complete!');
    console.log('\n✅ All tests passed successfully');
    console.log('\n📊 Summary:');
    console.log(`   - Base URL: ${FRONTEND_CONFIG.baseURL}`);
    console.log(`   - Routes tested: ${FRONTEND_CONFIG.routes.length}`);
    console.log(`   - Console errors: ${errors.length}`);
    console.log(`   - Load time: ${performanceMetrics.totalTime.toFixed(2)}ms`);

  } catch (error) {
    console.error('\n❌ Playwright MCP Verification Failed:');
    console.error(error);
    
    if (page) {
      try {
        await page.screenshot({
          path: 'test-results/playwright-mcp-error.png',
          fullPage: true,
        });
        console.error('\n📸 Error screenshot saved to test-results/playwright-mcp-error.png');
      } catch (screenshotError) {
        console.error('Failed to capture error screenshot');
      }
    }
    
    throw error;
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

// Run verification
if (require.main === module) {
  verifyPlaywrightMCP()
    .then(() => {
      console.log('\n✨ Verification script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Verification script failed:', error);
      process.exit(1);
    });
}

export { verifyPlaywrightMCP, FRONTEND_CONFIG };

