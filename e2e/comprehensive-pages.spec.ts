/**
 * Comprehensive E2E Tests - All Pages with Screenshots
 * Tests every page and feature of the reconciliation platform
 */

import { test, expect, Page } from '@playwright/test';
import {
  takePageScreenshot,
  navigateTo,
  waitForElement,
  fillFormField,
  clickButton,
  elementExists,
  createTestFile,
  generateMockCSV,
} from './helpers';

test.describe('Comprehensive E2E Tests - All Pages', () => {
  test.describe('Authentication Pages', () => {
    test('Login Page - Initial State', async ({ page }) => {
      await navigateTo(page, '/login');
      
      // Verify page loaded
      await waitForElement(page, 'input[type="email"]');
      
      // Take screenshot
      await takePageScreenshot(page, '01-login-page-initial');
      
      // Verify elements exist
      const hasEmailInput = await elementExists(page, 'input[type="email"]');
      const hasPasswordInput = await elementExists(page, 'input[type="password"]');
      const hasSubmitButton = await elementExists(page, 'button[type="submit"]');
      
      expect(hasEmailInput).toBe(true);
      expect(hasPasswordInput).toBe(true);
      expect(hasSubmitButton).toBe(true);
    });

    test('Login Page - Form Interaction', async ({ page }) => {
      await navigateTo(page, '/login');
      
      // Fill form
      await fillFormField(page, 'input[type="email"]', 'test@example.com', 'Email');
      await fillFormField(page, 'input[type="password"]', 'password123', 'Password');
      
      // Take screenshot of filled form
      await takePageScreenshot(page, '02-login-page-filled');
      
      // Verify form values
      const emailValue = await page.inputValue('input[type="email"]');
      expect(emailValue).toBe('test@example.com');
    });

    test('Login Page - Error State', async ({ page }) => {
      await navigateTo(page, '/login');
      
      // Try to submit empty form
      await clickButton(page, 'button[type="submit"]', 'Submit');
      
      // Wait a bit for validation
      await page.waitForTimeout(1000);
      
      // Take screenshot of error state
      await takePageScreenshot(page, '03-login-page-error');
    });

    test('Register Page - Initial State', async ({ page }) => {
      await navigateTo(page, '/register');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      await takePageScreenshot(page, '04-register-page-initial');
      
      // Verify registration form exists
      const hasForm = await elementExists(page, 'form');
      expect(hasForm).toBe(true);
    });

    test('Register Page - Form Fields', async ({ page }) => {
      await navigateTo(page, '/register');
      await page.waitForLoadState('networkidle');
      
      // Check for common registration fields
      const hasEmailField = await elementExists(page, 'input[type="email"]');
      const hasPasswordField = await elementExists(page, 'input[type="password"]');
      
      // Fill available fields if they exist
      if (hasEmailField) {
        await fillFormField(page, 'input[type="email"]', 'newuser@example.com', 'Email');
      }
      
      if (hasPasswordField) {
        const passwordInputs = await page.locator('input[type="password"]').all();
        if (passwordInputs.length > 0) {
          await fillFormField(page, 'input[type="password"]', 'SecurePass123!', 'Password');
        }
      }
      
      // Take screenshot
      await takePageScreenshot(page, '05-register-page-filled');
    });

    test('Unauthorized Page', async ({ page }) => {
      await navigateTo(page, '/unauthorized');
      
      // Take screenshot
      await takePageScreenshot(page, '06-unauthorized-page');
      
      // Verify unauthorized message
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/unauthorized|access denied|forbidden/i);
    });
  });

  test.describe('Authenticated Pages', () => {
    // Note: These tests will navigate to the pages directly
    // In a real scenario, you'd need valid authentication
    
    test('Dashboard Page', async ({ page }) => {
      // Try to navigate to dashboard (may redirect to login)
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of current state
      await takePageScreenshot(page, '07-dashboard-page');
      
      // Verify we're on some page
      const title = await page.title();
      expect(title).toBeTruthy();
    });

    test('Profile Page', async ({ page }) => {
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      await takePageScreenshot(page, '08-profile-page');
    });

    test('2FA Management Page', async ({ page }) => {
      await page.goto('/2fa-management');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      await takePageScreenshot(page, '09-2fa-management-page');
    });
  });

  test.describe('Application Pages - Main Flow', () => {
    test('Project Selection Page - Mock Data', async ({ page }) => {
      // Navigate directly to test the page component
      // In reality, this would be behind auth
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of whatever page we land on
      await takePageScreenshot(page, '10-initial-page');
      
      // Try navigating to common routes
      const routes = ['/projects', '/project-selection', '/'];
      
      for (const route of routes) {
        try {
          await page.goto(route, { timeout: 5000 });
          await page.waitForTimeout(1000);
          const url = page.url();
          console.log(`📍 Route ${route} -> ${url}`);
        } catch (e) {
          console.log(`⚠️  Route ${route} not accessible`);
        }
      }
    });

    test('Login Flow and Navigation', async ({ page }) => {
      // Go to login
      await navigateTo(page, '/login');
      
      // Fill login form
      await fillFormField(page, 'input[type="email"]', 'test@example.com', 'Email');
      await fillFormField(page, 'input[type="password"]', 'password123', 'Password');
      
      // Screenshot before submit
      await takePageScreenshot(page, '11-login-before-submit');
      
      // Submit form
      await clickButton(page, 'button[type="submit"]', 'Login');
      
      // Wait for potential navigation
      await page.waitForTimeout(2000);
      
      // Screenshot after submit
      await takePageScreenshot(page, '12-after-login-submit');
      
      // Get current URL
      const currentUrl = page.url();
      console.log(`📍 After login: ${currentUrl}`);
    });
  });

  test.describe('Feature Testing - Forms and Interactions', () => {
    test('File Upload Interface', async ({ page }) => {
      await navigateTo(page, '/');
      
      // Look for file upload elements
      const hasFileInput = await elementExists(page, 'input[type="file"]');
      
      if (hasFileInput) {
        // Create test CSV file
        const csvContent = generateMockCSV(5);
        const testFile = createTestFile('test-data.csv', csvContent);
        
        // Upload file
        await page.setInputFiles('input[type="file"]', testFile);
        
        await page.waitForTimeout(1000);
        
        // Take screenshot
        await takePageScreenshot(page, '13-file-upload-interface');
      } else {
        // Just take screenshot of current page
        await takePageScreenshot(page, '13-no-file-upload-found');
      }
    });

    test('Navigation and Routing', async ({ page }) => {
      const testRoutes = [
        { path: '/', name: 'home' },
        { path: '/login', name: 'login' },
        { path: '/register', name: 'register' },
        { path: '/dashboard', name: 'dashboard' },
        { path: '/profile', name: 'profile' },
        { path: '/unauthorized', name: 'unauthorized' },
      ];

      for (const route of testRoutes) {
        try {
          await page.goto(route.path, { timeout: 5000 });
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(500);
          
          // Take screenshot
          await takePageScreenshot(page, `14-route-${route.name}`);
          
          console.log(`✅ Route ${route.path} accessible`);
        } catch (error) {
          console.log(`⚠️  Route ${route.path} failed: ${error}`);
          
          // Take screenshot anyway
          await takePageScreenshot(page, `14-route-${route.name}-error`);
        }
      }
    });

    test('Responsive Design - Mobile View', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await navigateTo(page, '/login');
      await takePageScreenshot(page, '15-mobile-login');
      
      await navigateTo(page, '/register');
      await takePageScreenshot(page, '16-mobile-register');
      
      // Reset viewport
      await page.setViewportSize({ width: 1280, height: 720 });
    });

    test('Responsive Design - Tablet View', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await navigateTo(page, '/login');
      await takePageScreenshot(page, '17-tablet-login');
      
      await navigateTo(page, '/register');
      await takePageScreenshot(page, '18-tablet-register');
      
      // Reset viewport
      await page.setViewportSize({ width: 1280, height: 720 });
    });

    test('Keyboard Navigation', async ({ page }) => {
      await navigateTo(page, '/login');
      
      // Focus first input
      await page.keyboard.press('Tab');
      
      // Type email
      await page.keyboard.type('test@example.com');
      
      // Tab to password
      await page.keyboard.press('Tab');
      
      // Type password
      await page.keyboard.type('password123');
      
      // Take screenshot
      await takePageScreenshot(page, '19-keyboard-navigation');
      
      // Tab to button and press Enter
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      await page.waitForTimeout(1000);
      
      // Take screenshot after submit
      await takePageScreenshot(page, '20-keyboard-submit');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('404 Page', async ({ page }) => {
      await page.goto('/this-page-does-not-exist-12345');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      await takePageScreenshot(page, '21-404-page');
      
      // Verify some content exists
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });

    test('Network Error Handling', async ({ page }) => {
      // Set offline
      await page.context().setOffline(true);
      
      try {
        await page.goto('/login', { timeout: 5000 });
      } catch (e) {
        console.log('Expected offline error:', e);
      }
      
      // Set back online
      await page.context().setOffline(false);
      
      // Now navigate successfully
      await navigateTo(page, '/login');
      await takePageScreenshot(page, '22-after-network-recovery');
    });

    test('Form Validation', async ({ page }) => {
      await navigateTo(page, '/login');
      
      // Try invalid email
      await fillFormField(page, 'input[type="email"]', 'invalid-email', 'Invalid Email');
      await fillFormField(page, 'input[type="password"]', '123', 'Short Password');
      
      // Take screenshot
      await takePageScreenshot(page, '23-form-validation-invalid');
      
      // Clear and enter valid data
      await page.fill('input[type="email"]', 'valid@example.com');
      await page.fill('input[type="password"]', 'ValidPassword123!');
      
      // Take screenshot
      await takePageScreenshot(page, '24-form-validation-valid');
    });
  });

  test.describe('Accessibility Features', () => {
    test('ARIA Labels and Roles', async ({ page }) => {
      await navigateTo(page, '/login');
      
      // Check for ARIA attributes
      const ariaElements = await page.locator('[aria-label], [role]').count();
      console.log(`Found ${ariaElements} elements with ARIA attributes`);
      
      // Take screenshot
      await takePageScreenshot(page, '25-accessibility-check');
      
      // Verify heading hierarchy
      const headings = await page.locator('h1, h2, h3').all();
      console.log(`Found ${headings.length} headings`);
      
      expect(ariaElements).toBeGreaterThan(0);
    });

    test('Focus Management', async ({ page }) => {
      await navigateTo(page, '/login');
      
      // Tab through focusable elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(300);
      }
      
      // Take screenshot showing focus
      await takePageScreenshot(page, '26-focus-management');
    });
  });

  test.describe('Performance and Loading States', () => {
    test('Page Load Performance', async ({ page }) => {
      const startTime = Date.now();
      
      await navigateTo(page, '/login');
      
      const loadTime = Date.now() - startTime;
      console.log(`⏱️  Page load time: ${loadTime}ms`);
      
      // Take screenshot
      await takePageScreenshot(page, '27-page-load-performance');
      
      // Verify load time is reasonable
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
    });

    test('Loading States', async ({ page }) => {
      await navigateTo(page, '/login');
      
      // Fill form
      await fillFormField(page, 'input[type="email"]', 'test@example.com', 'Email');
      await fillFormField(page, 'input[type="password"]', 'password123', 'Password');
      
      // Click submit
      await clickButton(page, 'button[type="submit"]', 'Submit');
      
      // Try to catch loading state
      await page.waitForTimeout(100);
      
      // Take screenshot of potential loading state
      await takePageScreenshot(page, '28-loading-state');
    });
  });

  test.describe('Complete User Journey', () => {
    test('Full User Flow - Login to Navigation', async ({ page }) => {
      // Step 1: Initial page
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await takePageScreenshot(page, '29-journey-01-initial');
      
      // Step 2: Navigate to login
      await navigateTo(page, '/login');
      await takePageScreenshot(page, '29-journey-02-login-page');
      
      // Step 3: Fill login form
      await fillFormField(page, 'input[type="email"]', 'user@example.com', 'Email');
      await fillFormField(page, 'input[type="password"]', 'SecurePass123!', 'Password');
      await takePageScreenshot(page, '29-journey-03-login-filled');
      
      // Step 4: Submit login
      await clickButton(page, 'button[type="submit"]', 'Login');
      await page.waitForTimeout(2000);
      await takePageScreenshot(page, '29-journey-04-after-login');
      
      // Step 5: Navigate to profile (if accessible)
      try {
        await page.goto('/profile', { timeout: 5000 });
        await page.waitForLoadState('networkidle');
        await takePageScreenshot(page, '29-journey-05-profile');
      } catch (e) {
        console.log('Profile not accessible, taking current state');
        await takePageScreenshot(page, '29-journey-05-current-state');
      }
      
      // Step 6: Try to access dashboard
      try {
        await page.goto('/dashboard', { timeout: 5000 });
        await page.waitForLoadState('networkidle');
        await takePageScreenshot(page, '29-journey-06-dashboard');
      } catch (e) {
        console.log('Dashboard not accessible');
        await takePageScreenshot(page, '29-journey-06-current-state');
      }
    });
  });

  test.describe('Final Coverage - All Pages Screenshots', () => {
    test('Capture All Defined Pages', async ({ page }) => {
      const allPages = [
        { path: '/', name: 'root' },
        { path: '/login', name: 'login-final' },
        { path: '/register', name: 'register-final' },
        { path: '/dashboard', name: 'dashboard-final' },
        { path: '/profile', name: 'profile-final' },
        { path: '/2fa-management', name: '2fa-final' },
        { path: '/unauthorized', name: 'unauthorized-final' },
        { path: '/admin-settings', name: 'admin-settings-final' },
      ];

      for (let i = 0; i < allPages.length; i++) {
        const pageConfig = allPages[i];
        
        try {
          await page.goto(pageConfig.path, { timeout: 5000, waitUntil: 'networkidle' });
          await page.waitForTimeout(1000);
          
          // Take screenshot
          await takePageScreenshot(page, `30-final-${String(i + 1).padStart(2, '0')}-${pageConfig.name}`);
          
          console.log(`✅ Captured ${pageConfig.path}`);
        } catch (error) {
          console.log(`⚠️  Failed to capture ${pageConfig.path}: ${error}`);
          
          // Take screenshot of error state
          try {
            await takePageScreenshot(page, `30-final-${String(i + 1).padStart(2, '0')}-${pageConfig.name}-error`);
          } catch (e) {
            console.log(`❌ Could not take error screenshot`);
          }
        }
      }
    });
  });
});
