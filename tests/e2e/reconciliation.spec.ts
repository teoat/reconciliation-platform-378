// Playwright E2E Test Configuration
import { test, expect } from '@playwright/test';

// Test configuration
test.describe.configure({ mode: 'parallel' });

// Base URL
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test data
const testUser = {
  email: 'e2e-test@example.com',
  password: 'password123',
  firstName: 'E2E',
  lastName: 'Test',
  role: 'analyst',
};

test.describe('Reconciliation Platform E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(BASE_URL);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display landing page', async ({ page }) => {
    // Check if the main elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Reconciliation Platform')).toBeVisible();
  });

  test('should complete user registration flow', async ({ page }) => {
    // Click on register button
    await page.click('text=Register');
    
    // Fill registration form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="firstName"]', testUser.firstName);
    await page.fill('input[name="lastName"]', testUser.lastName);
    await page.selectOption('select[name="role"]', testUser.role);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('text=Registration successful')).toBeVisible();
  });

  test('should complete user login flow', async ({ page }) => {
    // Click on login button
    await page.click('text=Login');
    
    // Fill login form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should navigate through all pages', async ({ page }) => {
    // Login first
    await page.click('text=Login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard');
    
    // Test navigation to each page
    const pages = [
      { name: 'Ingestion', url: '/ingestion' },
      { name: 'Reconciliation', url: '/reconciliation' },
      { name: 'Adjudication', url: '/adjudication' },
      { name: 'Analytics', url: '/analytics' },
    ];
    
    for (const pageInfo of pages) {
      await page.click(`text=${pageInfo.name}`);
      await page.waitForURL(`**${pageInfo.url}`);
      await expect(page.locator(`text=${pageInfo.name}`)).toBeVisible();
    }
  });

  test('should create and manage projects', async ({ page }) => {
    // Login
    await page.click('text=Login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard');
    
    // Create new project
    await page.click('text=Create Project');
    await page.fill('input[name="name"]', 'E2E Test Project');
    await page.fill('textarea[name="description"]', 'Project created during E2E testing');
    
    // Submit project creation
    await page.click('button[type="submit"]');
    
    // Wait for project to be created
    await expect(page.locator('text=E2E Test Project')).toBeVisible();
    
    // Edit project
    await page.click('text=E2E Test Project');
    await page.click('button[aria-label="Edit project"]');
    await page.fill('input[name="name"]', 'E2E Test Project Updated');
    await page.click('button[type="submit"]');
    
    // Verify update
    await expect(page.locator('text=E2E Test Project Updated')).toBeVisible();
  });

  test('should upload and process files', async ({ page }) => {
    // Login
    await page.click('text=Login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Navigate to ingestion page
    await page.click('text=Ingestion');
    await page.waitForURL('**/ingestion');
    
    // Create test CSV file
    const csvContent = 'Amount,Date,Description\n1000,2024-01-15,Test Transaction 1\n2000,2024-01-16,Test Transaction 2';
    const csvFile = new File([csvContent], 'test-data.csv', { type: 'text/csv' });
    
    // Upload file
    await page.setInputFiles('input[type="file"]', csvFile);
    
    // Wait for upload to complete
    await expect(page.locator('text=File uploaded successfully')).toBeVisible();
    
    // Process file
    await page.click('text=Process Files');
    
    // Wait for processing to complete
    await expect(page.locator('text=Processing complete')).toBeVisible();
  });

  test('should perform reconciliation workflow', async ({ page }) => {
    // Login
    await page.click('text=Login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Navigate to reconciliation page
    await page.click('text=Reconciliation');
    await page.waitForURL('**/reconciliation');
    
    // Run AI matching
    await page.click('text=Run AI Matching');
    
    // Wait for matching to complete
    await expect(page.locator('text=Matching complete')).toBeVisible();
    
    // Check results
    await expect(page.locator('text=Matched Records')).toBeVisible();
    await expect(page.locator('text=Discrepancies')).toBeVisible();
  });

  test('should handle adjudication workflow', async ({ page }) => {
    // Login
    await page.click('text=Login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Navigate to adjudication page
    await page.click('text=Adjudication');
    await page.waitForURL('**/adjudication');
    
    // Select a discrepancy
    await page.click('text=Select Discrepancy');
    
    // Add comment
    await page.fill('textarea[name="comment"]', 'E2E test comment');
    await page.click('text=Add Comment');
    
    // Resolve discrepancy
    await page.click('text=Resolve');
    await page.selectOption('select[name="resolution"]', 'approved');
    await page.click('button[type="submit"]');
    
    // Verify resolution
    await expect(page.locator('text=Discrepancy resolved')).toBeVisible();
  });

  test('should display analytics and reports', async ({ page }) => {
    // Login
    await page.click('text=Login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Navigate to analytics page
    await page.click('text=Analytics');
    await page.waitForURL('**/analytics');
    
    // Check for charts and metrics
    await expect(page.locator('text=Performance Metrics')).toBeVisible();
    await expect(page.locator('text=Trend Analysis')).toBeVisible();
    await expect(page.locator('text=Quality Metrics')).toBeVisible();
    
    // Generate report
    await page.click('text=Generate Report');
    await page.selectOption('select[name="reportType"]', 'summary');
    await page.click('button[type="submit"]');
    
    // Wait for report generation
    await expect(page.locator('text=Report generated')).toBeVisible();
  });

  test('should handle real-time collaboration', async ({ page }) => {
    // Login
    await page.click('text=Login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Navigate to any page
    await page.click('text=Reconciliation');
    await page.waitForURL('**/reconciliation');
    
    // Open collaboration panel
    await page.click('button[aria-label="Live Collaboration"]');
    
    // Check if collaboration panel is visible
    await expect(page.locator('text=Live Collaboration')).toBeVisible();
    
    // Send a comment
    await page.fill('input[placeholder="Add a comment..."]', 'E2E test comment');
    await page.click('button[aria-label="Send comment"]');
    
    // Verify comment was sent
    await expect(page.locator('text=E2E test comment')).toBeVisible();
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test invalid login
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    
    // Test network error handling
    await page.route('**/api/**', route => route.abort());
    
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Check for error handling
    await expect(page.locator('text=Network error')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login
    await page.click('text=Login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Check if mobile navigation works
    await page.click('button[aria-label="Menu"]');
    await expect(page.locator('text=Ingestion')).toBeVisible();
    
    // Test mobile navigation
    await page.click('text=Ingestion');
    await page.waitForURL('**/ingestion');
    
    // Verify page is responsive
    await expect(page.locator('text=Ingestion')).toBeVisible();
  });
});

// Cleanup after all tests
test.afterAll(async ({ page }) => {
  // Clean up test data
  await page.goto(BASE_URL);
  await page.click('text=Login');
  await page.fill('input[name="email"]', testUser.email);
  await page.fill('input[name="password"]', testUser.password);
  await page.click('button[type="submit"]');
  
  // Delete test projects
  await page.click('text=Projects');
  const projects = await page.locator('[data-testid="project-item"]').all();
  for (const project of projects) {
    if (await project.textContent()?.includes('E2E Test')) {
      await project.click();
      await page.click('button[aria-label="Delete project"]');
      await page.click('text=Confirm Delete');
    }
  }
});
