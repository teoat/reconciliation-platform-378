/**
 * E2E Test Helpers and Utilities
 */

import { Page, expect } from '@playwright/test';
import path from 'path';

/**
 * Authentication helper
 */
export async function login(page: Page, email = 'test@example.com', password = 'password123') {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete
  await page.waitForURL(/\/(dashboard|profile)/, { timeout: 10000 });
}

/**
 * Screenshot helper with consistent naming
 */
export async function takePageScreenshot(
  page: Page,
  name: string,
  options?: { fullPage?: boolean }
) {
  const screenshotPath = path.join('screenshots', `${name}.png`);
  await page.screenshot({
    path: screenshotPath,
    fullPage: options?.fullPage ?? true,
  });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

/**
 * Wait for element to be visible and ready
 */
export async function waitForElement(page: Page, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Fill form field with validation
 */
export async function fillFormField(
  page: Page,
  selector: string,
  value: string,
  label?: string
) {
  await waitForElement(page, selector);
  await page.fill(selector, value);
  
  if (label) {
    console.log(`✍️  Filled ${label}: ${value}`);
  }
}

/**
 * Click button with logging
 */
export async function clickButton(page: Page, selector: string, label?: string) {
  await waitForElement(page, selector);
  await page.click(selector);
  
  if (label) {
    console.log(`🖱️  Clicked: ${label}`);
  }
}

/**
 * Navigation helper
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  console.log(`🧭 Navigated to: ${path}`);
}

/**
 * Create test file for upload testing
 */
export function createTestFile(filename: string, content: string): string {
  const fs = require('fs');
  const testFilePath = path.join('/tmp', filename);
  fs.writeFileSync(testFilePath, content);
  return testFilePath;
}

/**
 * Mock CSV data for testing
 */
export function generateMockCSV(rows = 10): string {
  let csv = 'id,name,amount,date,status\n';
  for (let i = 1; i <= rows; i++) {
    csv += `${i},Transaction ${i},${(Math.random() * 1000).toFixed(2)},2024-01-${String(i).padStart(2, '0')},completed\n`;
  }
  return csv;
}

/**
 * Verify page accessibility
 */
export async function verifyAccessibility(page: Page) {
  // Check for basic accessibility attributes
  const hasHeading = await page.locator('h1').count() > 0;
  const hasAriaLabels = await page.locator('[aria-label]').count() > 0;
  
  return hasHeading || hasAriaLabels;
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Check if element exists without throwing
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    const element = await page.locator(selector).count();
    return element > 0;
  } catch {
    return false;
  }
}

/**
 * Get page title
 */
export async function getPageTitle(page: Page): Promise<string> {
  return await page.title();
}

/**
 * Verify error message
 */
export async function verifyErrorMessage(page: Page, expectedMessage?: string) {
  const errorSelectors = [
    '[role="alert"]',
    '.error',
    '.error-message',
    'text=/error/i',
    'text=/failed/i',
  ];
  
  for (const selector of errorSelectors) {
    const exists = await elementExists(page, selector);
    if (exists) {
      const text = await page.locator(selector).first().textContent();
      console.log(`⚠️  Error found: ${text}`);
      
      if (expectedMessage && text) {
        expect(text.toLowerCase()).toContain(expectedMessage.toLowerCase());
      }
      return true;
    }
  }
  
  return false;
}

/**
 * Verify success message
 */
export async function verifySuccessMessage(page: Page, expectedMessage?: string) {
  const successSelectors = [
    '[role="status"]',
    '.success',
    '.success-message',
    'text=/success/i',
    'text=/complete/i',
  ];
  
  for (const selector of successSelectors) {
    const exists = await elementExists(page, selector);
    if (exists) {
      const text = await page.locator(selector).first().textContent();
      console.log(`✅ Success message found: ${text}`);
      
      if (expectedMessage && text) {
        expect(text.toLowerCase()).toContain(expectedMessage.toLowerCase());
      }
      return true;
    }
  }
  
  return false;
}
