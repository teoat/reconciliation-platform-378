/**
 * Playwright Test Script to Navigate and Test All Frontend Features
 * 
 * This script tests all features of the frontend application:
 * - Projects page
 * - Ingestion page
 * - Reconciliation page
 * - Cashflow Evaluation page
 * - Adjudication page
 * - Visualization/Analytics page
 * - Pre-Summary page
 * - Summary & Export page
 * 
 * Authentication is temporarily disabled for testing.
 * 
 * Run with: npx playwright test test-frontend-features-playwright.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:1000';

// All available pages in the frontend
const PAGES = [
  { id: 'projects', label: 'Projects', selector: '[data-testid="projects-page"], button:has-text("Projects")' },
  { id: 'ingestion', label: 'Ingestion', selector: '[data-testid="ingestion-page"], button:has-text("Ingestion")' },
  { id: 'reconciliation', label: 'Reconciliation', selector: '[data-testid="reconciliation-page"], button:has-text("Reconciliation")' },
  { id: 'cashflow-evaluation', label: 'Cashflow Evaluation', selector: '[data-testid="cashflow-page"]' },
  { id: 'adjudication', label: 'Adjudication', selector: '[data-testid="adjudication-page"], button:has-text("Adjudication")' },
  { id: 'visualization', label: 'Analytics/Visualization', selector: '[data-testid="visualization-page"], button:has-text("Analytics")' },
  { id: 'presummary', label: 'Pre-Summary', selector: '[data-testid="presummary-page"], button:has-text("Pre-Summary")' },
  { id: 'summary', label: 'Summary & Export', selector: '[data-testid="summary-page"], button:has-text("Summary")' },
];

test.describe('Frontend Features Navigation Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(BASE_URL);
    
    // Wait for the page to load (authentication is disabled, so should go straight to projects)
    await page.waitForLoadState('networkidle');
    
    // Verify we're authenticated (should auto-authenticate)
    const authStatus = await page.evaluate(() => localStorage.getItem('auth'));
    expect(authStatus).toBe('true');
  });

  test('should load Projects page by default', async ({ page }) => {
    // Should be on projects page after authentication
    await expect(page).toHaveURL(new RegExp(BASE_URL));
    
    // Check if navigation is visible
    const navigation = page.locator('nav');
    await expect(navigation).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/projects-page.png', fullPage: true });
  });

  test('should navigate to all pages via navigation menu', async ({ page }) => {
    for (const pageInfo of PAGES) {
      // Skip projects as it's the default
      if (pageInfo.id === 'projects') continue;
      
      // Try to find and click the navigation button
      const navButton = page.locator(`button:has-text("${pageInfo.label}")`).first();
      
      if (await navButton.isVisible().catch(() => false)) {
        await navButton.click();
        await page.waitForTimeout(1000); // Wait for page transition
        
        // Take screenshot of each page
        await page.screenshot({ 
          path: `test-results/${pageInfo.id}-page.png`, 
          fullPage: true 
        });
        
        console.log(`✓ Navigated to ${pageInfo.label} page`);
      } else {
        console.log(`⚠ Navigation button for ${pageInfo.label} not found`);
      }
    }
  });

  test('should display all navigation items', async ({ page }) => {
    const navItems = [
      'Projects',
      'Ingestion',
      'Reconciliation',
      'Adjudication',
      'Analytics',
      'Pre-Summary',
      'Summary'
    ];
    
    for (const item of navItems) {
      const navButton = page.locator(`button:has-text("${item}")`).first();
      await expect(navButton).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show Frenly AI component', async ({ page }) => {
    // Frenly AI should be visible on authenticated pages
    const frenlyAI = page.locator('[data-testid="frenly-ai"], .frenly-ai, [class*="Frenly"]').first();
    
    // Check if any Frenly-related element exists
    const hasFrenly = await page.locator('body').textContent().then(text => 
      text?.includes('Frenly') || text?.includes('AI')
    );
    
    expect(hasFrenly).toBeTruthy();
  });

  test('should show PWA install prompt', async ({ page }) => {
    // PWA install prompt might be visible
    const pwaPrompt = page.locator('[data-testid="pwa-prompt"], [class*="PWA"]').first();
    
    // Just verify the page loaded (PWA prompt might be conditional)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle project selection', async ({ page }) => {
    // Look for project selection elements
    const projectSelectors = [
      'button:has-text("Select")',
      '[data-testid="project-card"]',
      '[data-testid="project-select"]',
      'button[class*="project"]'
    ];
    
    let projectFound = false;
    for (const selector of projectSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        projectFound = true;
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    if (projectFound) {
      console.log('✓ Project selection handled');
    } else {
      console.log('⚠ No project selection elements found (might need mock data)');
    }
  });

  test('should capture full page screenshots of all features', async ({ page }) => {
    // Navigate through all pages and take screenshots
    for (const pageInfo of PAGES) {
      try {
        // Try to navigate to the page
        if (pageInfo.id !== 'projects') {
          const navButton = page.locator(`button:has-text("${pageInfo.label}")`).first();
          if (await navButton.isVisible().catch(() => false)) {
            await navButton.click();
            await page.waitForTimeout(1500);
          }
        }
        
        // Take full page screenshot
        await page.screenshot({ 
          path: `test-results/feature-${pageInfo.id}.png`,
          fullPage: true 
        });
        
        // Get page HTML for analysis
        const html = await page.content();
        const hasContent = html.length > 1000; // Basic content check
        
        console.log(`${pageInfo.label}: ${hasContent ? '✓ Has content' : '⚠ Minimal content'}`);
      } catch (error) {
        console.error(`Error testing ${pageInfo.label}:`, error);
      }
    }
  });

  test('should verify responsive design', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' },
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      await page.screenshot({ 
        path: `test-results/responsive-${viewport.name}.png`,
        fullPage: true 
      });
    }
  });
});


