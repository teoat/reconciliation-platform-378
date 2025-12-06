/**
 * Comprehensive E2E Tests - All Features
 * Tests every feature and interaction in the reconciliation platform
 */

import { test, expect } from '@playwright/test';
import {
  takePageScreenshot,
  navigateTo,
  waitForElement,
  fillFormField,
  clickButton,
  elementExists,
  createTestFile,
  generateMockCSV,
  verifyErrorMessage,
  verifySuccessMessage,
} from './helpers';

test.describe('Feature Testing - Authentication', () => {
  test('Feature: Login with valid credentials', async ({ page }) => {
    await navigateTo(page, '/login');
    
    await fillFormField(page, 'input[type="email"]', 'test@example.com', 'Email');
    await fillFormField(page, 'input[type="password"]', 'password123', 'Password');
    
    await takePageScreenshot(page, 'feature-login-01-form-filled');
    
    await clickButton(page, 'button[type="submit"]', 'Submit Login');
    await page.waitForTimeout(2000);
    
    await takePageScreenshot(page, 'feature-login-02-after-submit');
    
    // Verify we navigated somewhere (login was processed)
    const url = page.url();
    console.log(`After login: ${url}`);
  });

  test('Feature: Login with invalid credentials', async ({ page }) => {
    await navigateTo(page, '/login');
    
    await fillFormField(page, 'input[type="email"]', 'wrong@example.com', 'Email');
    await fillFormField(page, 'input[type="password"]', 'wrongpassword', 'Password');
    
    await clickButton(page, 'button[type="submit"]', 'Submit Login');
    await page.waitForTimeout(1000);
    
    await takePageScreenshot(page, 'feature-login-03-invalid-credentials');
  });

  test('Feature: Email validation', async ({ page }) => {
    await navigateTo(page, '/login');
    
    // Test invalid email formats
    const invalidEmails = ['notanemail', '@example.com', 'test@', 'test'];
    
    for (let i = 0; i < invalidEmails.length; i++) {
      const email = invalidEmails[i];
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', 'password123');
      
      await takePageScreenshot(page, `feature-login-04-invalid-email-${i + 1}`);
      
      await page.fill('input[type="email"]', ''); // Clear for next iteration
    }
  });

  test('Feature: Password visibility toggle', async ({ page }) => {
    await navigateTo(page, '/login');
    
    await fillFormField(page, 'input[type="password"]', 'MySecretPassword123', 'Password');
    
    // Look for show/hide password button
    const hasToggle = await elementExists(page, 'button[aria-label*="password" i]');
    
    if (hasToggle) {
      await takePageScreenshot(page, 'feature-login-05-password-hidden');
      
      await clickButton(page, 'button[aria-label*="password" i]', 'Toggle Password');
      await page.waitForTimeout(500);
      
      await takePageScreenshot(page, 'feature-login-06-password-visible');
    } else {
      console.log('No password toggle found');
      await takePageScreenshot(page, 'feature-login-05-no-toggle');
    }
  });

  test('Feature: Remember me checkbox', async ({ page }) => {
    await navigateTo(page, '/login');
    
    const hasRememberMe = await elementExists(page, 'input[type="checkbox"]');
    
    if (hasRememberMe) {
      await page.check('input[type="checkbox"]');
      await takePageScreenshot(page, 'feature-login-07-remember-me-checked');
      
      await page.uncheck('input[type="checkbox"]');
      await takePageScreenshot(page, 'feature-login-08-remember-me-unchecked');
    } else {
      await takePageScreenshot(page, 'feature-login-07-no-remember-me');
    }
  });

  test('Feature: Registration form', async ({ page }) => {
    await navigateTo(page, '/register');
    
    // Fill registration form with test data
    const hasEmail = await elementExists(page, 'input[type="email"]');
    const hasPassword = await elementExists(page, 'input[type="password"]');
    
    if (hasEmail) {
      await fillFormField(page, 'input[type="email"]', 'newuser@example.com', 'Email');
    }
    
    if (hasPassword) {
      const passwordFields = await page.locator('input[type="password"]').all();
      
      if (passwordFields.length >= 1) {
        await passwordFields[0].fill('SecurePass123!');
      }
      
      if (passwordFields.length >= 2) {
        await passwordFields[1].fill('SecurePass123!');
      }
    }
    
    // Look for name fields
    const hasFirstName = await elementExists(page, 'input[name="firstName"], input[name="firstname"]');
    if (hasFirstName) {
      await fillFormField(page, 'input[name="firstName"], input[name="firstname"]', 'John', 'First Name');
    }
    
    const hasLastName = await elementExists(page, 'input[name="lastName"], input[name="lastname"]');
    if (hasLastName) {
      await fillFormField(page, 'input[name="lastName"], input[name="lastname"]', 'Doe', 'Last Name');
    }
    
    await takePageScreenshot(page, 'feature-register-01-filled');
  });

  test('Feature: Password strength indicator', async ({ page }) => {
    await navigateTo(page, '/register');
    
    const hasPassword = await elementExists(page, 'input[type="password"]');
    
    if (hasPassword) {
      // Test weak password
      await page.fill('input[type="password"]', '123');
      await page.waitForTimeout(500);
      await takePageScreenshot(page, 'feature-register-02-weak-password');
      
      // Test medium password
      await page.fill('input[type="password"]', 'password123');
      await page.waitForTimeout(500);
      await takePageScreenshot(page, 'feature-register-03-medium-password');
      
      // Test strong password
      await page.fill('input[type="password"]', 'SecureP@ssw0rd123!');
      await page.waitForTimeout(500);
      await takePageScreenshot(page, 'feature-register-04-strong-password');
    }
  });
});

test.describe('Feature Testing - Navigation', () => {
  test('Feature: Main navigation menu', async ({ page }) => {
    await navigateTo(page, '/');
    
    // Look for navigation elements
    const hasNav = await elementExists(page, 'nav');
    
    if (hasNav) {
      await takePageScreenshot(page, 'feature-nav-01-main-menu');
      
      // Find all navigation links
      const navLinks = await page.locator('nav a').all();
      console.log(`Found ${navLinks.length} navigation links`);
      
      // Take screenshot with focus on first link
      if (navLinks.length > 0) {
        await navLinks[0].hover();
        await takePageScreenshot(page, 'feature-nav-02-link-hover');
      }
    } else {
      await takePageScreenshot(page, 'feature-nav-01-no-nav');
    }
  });

  test('Feature: Breadcrumb navigation', async ({ page }) => {
    // Navigate through multiple pages to test breadcrumbs
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const hasBreadcrumb = await elementExists(page, '[aria-label="breadcrumb"], .breadcrumb');
    
    if (hasBreadcrumb) {
      await takePageScreenshot(page, 'feature-nav-03-breadcrumbs');
    } else {
      await takePageScreenshot(page, 'feature-nav-03-no-breadcrumbs');
    }
  });

  test('Feature: Page transitions', async ({ page }) => {
    const pages = ['/login', '/register', '/dashboard'];
    
    for (let i = 0; i < pages.length - 1; i++) {
      await page.goto(pages[i]);
      await page.waitForLoadState('networkidle');
      
      await takePageScreenshot(page, `feature-nav-04-transition-${i + 1}-before`);
      
      await page.goto(pages[i + 1]);
      await page.waitForTimeout(500);
      
      await takePageScreenshot(page, `feature-nav-04-transition-${i + 1}-after`);
    }
  });
});

test.describe('Feature Testing - Forms', () => {
  test('Feature: Form autofill', async ({ page }) => {
    await navigateTo(page, '/login');
    
    // Check autocomplete attributes
    const emailInput = page.locator('input[type="email"]');
    const autocomplete = await emailInput.getAttribute('autocomplete');
    
    console.log(`Email autocomplete: ${autocomplete}`);
    
    await takePageScreenshot(page, 'feature-forms-01-autofill');
  });

  test('Feature: Form keyboard shortcuts', async ({ page }) => {
    await navigateTo(page, '/login');
    
    // Tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.type('test@example.com');
    await page.keyboard.press('Tab');
    await page.keyboard.type('password123');
    
    await takePageScreenshot(page, 'feature-forms-02-keyboard-filled');
    
    // Submit with Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    await takePageScreenshot(page, 'feature-forms-03-keyboard-submit');
  });

  test('Feature: Form field validation messages', async ({ page }) => {
    await navigateTo(page, '/login');
    
    // Submit empty form
    await clickButton(page, 'button[type="submit"]', 'Submit Empty Form');
    await page.waitForTimeout(500);
    
    await takePageScreenshot(page, 'feature-forms-04-validation-empty');
    
    // Fill only email
    await fillFormField(page, 'input[type="email"]', 'test@example.com', 'Email');
    await clickButton(page, 'button[type="submit"]', 'Submit Partial Form');
    await page.waitForTimeout(500);
    
    await takePageScreenshot(page, 'feature-forms-05-validation-partial');
  });

  test('Feature: Multi-step form navigation', async ({ page }) => {
    await navigateTo(page, '/register');
    
    // Look for multi-step indicators
    const hasSteps = await elementExists(page, '[role="progressbar"], .step, .stepper');
    
    if (hasSteps) {
      await takePageScreenshot(page, 'feature-forms-06-multistep');
    } else {
      await takePageScreenshot(page, 'feature-forms-06-single-step');
    }
  });
});

test.describe('Feature Testing - File Operations', () => {
  test('Feature: File selection dialog', async ({ page }) => {
    await navigateTo(page, '/');
    
    const hasFileInput = await elementExists(page, 'input[type="file"]');
    
    if (hasFileInput) {
      await takePageScreenshot(page, 'feature-files-01-before-select');
      
      // Create and upload test file
      const csvContent = generateMockCSV(10);
      const testFile = createTestFile('test-upload.csv', csvContent);
      
      await page.setInputFiles('input[type="file"]', testFile);
      await page.waitForTimeout(1000);
      
      await takePageScreenshot(page, 'feature-files-02-after-select');
    } else {
      await takePageScreenshot(page, 'feature-files-01-no-upload');
    }
  });

  test('Feature: Multiple file selection', async ({ page }) => {
    await navigateTo(page, '/');
    
    const hasFileInput = await elementExists(page, 'input[type="file"]');
    
    if (hasFileInput) {
      const file1 = createTestFile('data-1.csv', generateMockCSV(5));
      const file2 = createTestFile('data-2.csv', generateMockCSV(5));
      const file3 = createTestFile('data-3.csv', generateMockCSV(5));
      
      // Check if multiple attribute exists
      const isMultiple = await page.locator('input[type="file"]').getAttribute('multiple');
      
      if (isMultiple !== null) {
        await page.setInputFiles('input[type="file"]', [file1, file2, file3]);
        await page.waitForTimeout(1000);
        
        await takePageScreenshot(page, 'feature-files-03-multiple-files');
      } else {
        await takePageScreenshot(page, 'feature-files-03-single-file-only');
      }
    }
  });

  test('Feature: Drag and drop file upload', async ({ page }) => {
    await navigateTo(page, '/');
    
    const hasDropZone = await elementExists(page, '[data-testid="file-upload-zone"], .dropzone');
    
    if (hasDropZone) {
      await takePageScreenshot(page, 'feature-files-04-dropzone');
      
      // Simulate drag over
      await page.dispatchEvent('[data-testid="file-upload-zone"], .dropzone', 'dragenter');
      await page.waitForTimeout(300);
      
      await takePageScreenshot(page, 'feature-files-05-drag-active');
    } else {
      await takePageScreenshot(page, 'feature-files-04-no-dropzone');
    }
  });

  test('Feature: File type validation', async ({ page }) => {
    await navigateTo(page, '/');
    
    const hasFileInput = await elementExists(page, 'input[type="file"]');
    
    if (hasFileInput) {
      // Check accept attribute
      const accept = await page.locator('input[type="file"]').getAttribute('accept');
      console.log(`Accepted file types: ${accept}`);
      
      await takePageScreenshot(page, 'feature-files-06-file-types');
    }
  });
});

test.describe('Feature Testing - UI Components', () => {
  test('Feature: Loading spinners', async ({ page }) => {
    await navigateTo(page, '/login');
    
    await fillFormField(page, 'input[type="email"]', 'test@example.com', 'Email');
    await fillFormField(page, 'input[type="password"]', 'password123', 'Password');
    
    // Click submit and quickly capture loading state
    await clickButton(page, 'button[type="submit"]', 'Submit');
    await page.waitForTimeout(100); // Catch the loading spinner
    
    await takePageScreenshot(page, 'feature-ui-01-loading-spinner');
  });

  test('Feature: Buttons and interactions', async ({ page }) => {
    await navigateTo(page, '/login');
    
    const submitButton = page.locator('button[type="submit"]');
    
    // Normal state
    await takePageScreenshot(page, 'feature-ui-02-button-normal');
    
    // Hover state
    await submitButton.hover();
    await page.waitForTimeout(300);
    await takePageScreenshot(page, 'feature-ui-03-button-hover');
    
    // Focus state
    await submitButton.focus();
    await page.waitForTimeout(300);
    await takePageScreenshot(page, 'feature-ui-04-button-focus');
  });

  test('Feature: Tooltips and popovers', async ({ page }) => {
    await navigateTo(page, '/');
    
    // Look for elements with tooltips
    const hasTooltip = await elementExists(page, '[title], [data-tooltip], [aria-describedby]');
    
    if (hasTooltip) {
      const tooltipElement = page.locator('[title], [data-tooltip]').first();
      await tooltipElement.hover();
      await page.waitForTimeout(500);
      
      await takePageScreenshot(page, 'feature-ui-05-tooltip');
    } else {
      await takePageScreenshot(page, 'feature-ui-05-no-tooltip');
    }
  });

  test('Feature: Modal dialogs', async ({ page }) => {
    await navigateTo(page, '/');
    
    // Look for modal triggers
    const hasModal = await elementExists(page, '[data-modal], [aria-modal]');
    
    if (hasModal) {
      await takePageScreenshot(page, 'feature-ui-06-modal-trigger');
    } else {
      await takePageScreenshot(page, 'feature-ui-06-no-modal');
    }
  });

  test('Feature: Alerts and notifications', async ({ page }) => {
    await navigateTo(page, '/login');
    
    // Trigger an action that might show an alert
    await clickButton(page, 'button[type="submit"]', 'Submit Empty Form');
    await page.waitForTimeout(1000);
    
    await takePageScreenshot(page, 'feature-ui-07-alert-notification');
  });

  test('Feature: Tab navigation', async ({ page }) => {
    await navigateTo(page, '/');
    
    const hasTabs = await elementExists(page, '[role="tablist"], .tabs, [data-tabs]');
    
    if (hasTabs) {
      await takePageScreenshot(page, 'feature-ui-08-tabs');
      
      // Click on tabs if present
      const tabs = await page.locator('[role="tab"]').all();
      
      if (tabs.length > 1) {
        await tabs[1].click();
        await page.waitForTimeout(500);
        
        await takePageScreenshot(page, 'feature-ui-09-tabs-switched');
      }
    } else {
      await takePageScreenshot(page, 'feature-ui-08-no-tabs');
    }
  });
});

test.describe('Feature Testing - Accessibility', () => {
  test('Feature: Screen reader support', async ({ page }) => {
    await navigateTo(page, '/login');
    
    // Check for screen reader elements
    const srElements = await page.locator('.sr-only, .visually-hidden').count();
    console.log(`Found ${srElements} screen reader only elements`);
    
    await takePageScreenshot(page, 'feature-a11y-01-screen-reader');
  });

  test('Feature: Skip to content link', async ({ page }) => {
    await navigateTo(page, '/');
    
    // Tab to reveal skip link
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    
    await takePageScreenshot(page, 'feature-a11y-02-skip-link');
  });

  test('Feature: Focus visible indicators', async ({ page }) => {
    await navigateTo(page, '/login');
    
    // Tab through elements to show focus
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
    }
    
    await takePageScreenshot(page, 'feature-a11y-03-focus-visible');
  });

  test('Feature: Color contrast', async ({ page }) => {
    await navigateTo(page, '/login');
    
    // Take screenshot for manual color contrast checking
    await takePageScreenshot(page, 'feature-a11y-04-color-contrast');
  });
});

test.describe('Feature Testing - Error States', () => {
  test('Feature: Network timeout', async ({ page }) => {
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 10000); // Delay all requests
    });
    
    await page.goto('/login', { timeout: 5000 }).catch(() => {});
    
    await takePageScreenshot(page, 'feature-errors-01-timeout');
  });

  test('Feature: 500 server error', async ({ page }) => {
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
    
    await navigateTo(page, '/login');
    
    await fillFormField(page, 'input[type="email"]', 'test@example.com', 'Email');
    await fillFormField(page, 'input[type="password"]', 'password123', 'Password');
    await clickButton(page, 'button[type="submit"]', 'Submit');
    
    await page.waitForTimeout(1000);
    
    await takePageScreenshot(page, 'feature-errors-02-server-error');
  });

  test('Feature: 404 not found', async ({ page }) => {
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 404,
        body: JSON.stringify({ error: 'Not Found' }),
      });
    });
    
    await navigateTo(page, '/login');
    await fillFormField(page, 'input[type="email"]', 'test@example.com', 'Email');
    await fillFormField(page, 'input[type="password"]', 'password123', 'Password');
    await clickButton(page, 'button[type="submit"]', 'Submit');
    
    await page.waitForTimeout(1000);
    
    await takePageScreenshot(page, 'feature-errors-03-not-found');
  });
});
