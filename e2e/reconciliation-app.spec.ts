import { test, expect } from '@playwright/test'

test.describe('378 Data and Evidence Reconciliation App E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
  })

  test.describe('Authentication Flow', () => {
    test('should display login page initially', async ({ page }) => {
      await expect(page).toHaveTitle(/378 Data and Evidence Reconciliation App/)
      await expect(page.locator('h1')).toContainText('Welcome')
    })

    test('should allow user to login', async ({ page }) => {
      // Fill in login form
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      
      // Click login button
      await page.click('button[type="submit"]')
      
      // Should redirect to projects page
      await expect(page).toHaveURL('/projects')
      await expect(page.locator('h1')).toContainText('Project Selection')
    })
  })

  test.describe('Project Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.waitForURL('/projects')
    })

    test('should display project list', async ({ page }) => {
      await expect(page.locator('[data-testid="project-list"]')).toBeVisible()
    })

    test('should allow creating new project', async ({ page }) => {
      // Click create project button
      await page.click('button:has-text("New Project")')
      
      // Fill project form
      await page.fill('input[name="name"]', 'E2E Test Project')
      await page.fill('textarea[name="description"]', 'A project created during E2E testing')
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Should see success message
      await expect(page.locator('text=Project created successfully')).toBeVisible()
    })

    test('should allow selecting a project', async ({ page }) => {
      // Click on first project
      await page.click('[data-testid="project-card"]:first-child')
      
      // Should navigate to ingestion page
      await expect(page).toHaveURL('/ingestion')
    })
  })

  test.describe('File Upload Interface', () => {
    test.beforeEach(async ({ page }) => {
      // Login and select project
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.waitForURL('/projects')
      await page.click('[data-testid="project-card"]:first-child')
      await page.waitForURL('/ingestion')
    })

    test('should display file upload area with drag and drop', async ({ page }) => {
      await expect(page.locator('[data-testid="file-upload-zone"]')).toBeVisible()
      await expect(page.locator('text=Drop files here or click to upload')).toBeVisible()
    })

    test('should allow drag and drop file upload', async ({ page }) => {
      // Create a test file
      const testFile = 'test-data.csv'
      
      // Simulate drag and drop
      await page.dispatchEvent('[data-testid="file-upload-zone"]', 'dragenter')
      await page.dispatchEvent('[data-testid="file-upload-zone"]', 'dragover')
      
      // Upload file via input
      await page.setInputFiles('[data-testid="file-upload"] input[type="file"]', testFile)
      
      // Should show processing status
      await expect(page.locator('text=Processing')).toBeVisible()
    })

    test('should validate file types and sizes', async ({ page }) => {
      // Try to upload invalid file type
      await page.setInputFiles('[data-testid="file-upload"] input[type="file"]', 'test.txt')
      
      // Should show error message
      await expect(page.locator('text=unsupported file type')).toBeVisible()
    })

    test('should show upload progress', async ({ page }) => {
      // Upload file
      await page.setInputFiles('[data-testid="file-upload"] input[type="file"]', 'test-data.csv')
      
      // Should show progress bar
      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible()
    })
  })

  test.describe('Reconciliation Job Management', () => {
    test.beforeEach(async ({ page }) => {
      // Complete login and file upload
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.waitForURL('/projects')
      await page.click('[data-testid="project-card"]:first-child')
      await page.waitForURL('/ingestion')
      await page.setInputFiles('[data-testid="file-upload"] input[type="file"]', 'test-data.csv')
      await page.waitForSelector('text=Processing complete')
      await page.click('button:has-text("Continue to Reconciliation")')
      await page.waitForURL('/reconciliation')
    })

    test('should display reconciliation jobs interface', async ({ page }) => {
      await expect(page.locator('[data-testid="reconciliation-interface"]')).toBeVisible()
      await expect(page.locator('text=Reconciliation Jobs')).toBeVisible()
    })

    test('should allow creating reconciliation job', async ({ page }) => {
      // Click create job button
      await page.click('button:has-text("Create Job")')
      
      // Fill job form
      await page.fill('input[name="name"]', 'E2E Test Reconciliation Job')
      await page.fill('textarea[name="description"]', 'Test reconciliation job')
      await page.fill('input[name="confidence_threshold"]', '80')
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Should see success message
      await expect(page.locator('text=Job created successfully')).toBeVisible()
    })

    test('should allow starting reconciliation job', async ({ page }) => {
      // Create job first
      await page.click('button:has-text("Create Job")')
      await page.fill('input[name="name"]', 'Test Job')
      await page.click('button[type="submit"]')
      
      // Start the job
      await page.click('button:has-text("Start")')
      
      // Should show running status
      await expect(page.locator('text=Running')).toBeVisible()
    })

    test('should show real-time job progress', async ({ page }) => {
      // Create and start job
      await page.click('button:has-text("Create Job")')
      await page.fill('input[name="name"]', 'Test Job')
      await page.click('button[type="submit"]')
      await page.click('button:has-text("Start")')
      
      // Should show progress bar
      await expect(page.locator('[data-testid="job-progress"]')).toBeVisible()
    })

    test('should allow cancelling running job', async ({ page }) => {
      // Create and start job
      await page.click('button:has-text("Create Job")')
      await page.fill('input[name="name"]', 'Test Job')
      await page.click('button[type="submit"]')
      await page.click('button:has-text("Start")')
      
      // Cancel the job
      await page.click('button:has-text("Stop")')
      
      // Should show cancelled status
      await expect(page.locator('text=Cancelled')).toBeVisible()
    })

    test('should display job results', async ({ page }) => {
      // Create and complete job
      await page.click('button:has-text("Create Job")')
      await page.fill('input[name="name"]', 'Test Job')
      await page.click('button[type="submit"]')
      await page.click('button:has-text("Start")')
      
      // Wait for completion
      await page.waitForSelector('text=Completed')
      
      // View results
      await page.click('button:has-text("View Results")')
      
      // Should show results modal
      await expect(page.locator('[data-testid="results-modal"]')).toBeVisible()
    })
  })

  test.describe('Analytics Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Login and navigate to analytics
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.waitForURL('/projects')
      await page.click('a[href="/analytics"]')
      await page.waitForURL('/analytics')
    })

    test('should display analytics dashboard', async ({ page }) => {
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible()
      await expect(page.locator('text=Analytics Dashboard')).toBeVisible()
    })

    test('should show real-time metrics', async ({ page }) => {
      await expect(page.locator('[data-testid="metrics-grid"]')).toBeVisible()
      await expect(page.locator('text=Total Projects')).toBeVisible()
      await expect(page.locator('text=Total Users')).toBeVisible()
    })

    test('should allow switching between metric views', async ({ page }) => {
      // Click on different metric tabs
      await page.click('button:has-text("Projects")')
      await expect(page.locator('[data-testid="projects-view"]')).toBeVisible()
      
      await page.click('button:has-text("Users")')
      await expect(page.locator('[data-testid="users-view"]')).toBeVisible()
      
      await page.click('button:has-text("Reconciliation")')
      await expect(page.locator('[data-testid="reconciliation-view"]')).toBeVisible()
    })

    test('should show WebSocket connection status', async ({ page }) => {
      await expect(page.locator('[data-testid="connection-status"]')).toBeVisible()
    })

    test('should allow changing time range', async ({ page }) => {
      // Change time range
      await page.selectOption('[data-testid="time-range"]', '7d')
      await expect(page.locator('[data-testid="metrics-grid"]')).toBeVisible()
      
      await page.selectOption('[data-testid="time-range"]', '90d')
      await expect(page.locator('[data-testid="metrics-grid"]')).toBeVisible()
    })
  })

  test.describe('WebSocket Integration', () => {
    test('should establish WebSocket connection', async ({ page }) => {
      // Login
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Check WebSocket connection
      await expect(page.locator('[data-testid="ws-status"]')).toContainText('Connected')
    })

    test('should receive real-time updates', async ({ page }) => {
      // Login and navigate to reconciliation
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.waitForURL('/projects')
      await page.click('[data-testid="project-card"]:first-child')
      await page.waitForURL('/reconciliation')
      
      // Create and start job
      await page.click('button:has-text("Create Job")')
      await page.fill('input[name="name"]', 'Test Job')
      await page.click('button[type="submit"]')
      await page.click('button:has-text("Start")')
      
      // Should receive real-time progress updates
      await expect(page.locator('[data-testid="job-progress"]')).toBeVisible()
    })
  })

  test.describe('Security Features', () => {
    test('should handle CSRF protection', async ({ page }) => {
      // Try to make request without CSRF token
      await page.route('**/api/**', route => {
        if (route.request().method() !== 'GET' && !route.request().headers()['x-csrf-token']) {
          route.fulfill({ status: 403, body: 'CSRF token missing' })
        } else {
          route.continue()
        }
      })
      
      // Login should still work
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      await expect(page).toHaveURL('/projects')
    })

    test('should handle rate limiting', async ({ page }) => {
      // Simulate rate limiting
      await page.route('**/api/**', route => {
        if (route.request().url().includes('/login')) {
          route.fulfill({ status: 429, body: 'Rate limit exceeded' })
        } else {
          route.continue()
        }
      })
      
      // Try to login multiple times
      for (let i = 0; i < 5; i++) {
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')
      }
      
      // Should show rate limit error
      await expect(page.locator('text=Rate limit exceeded')).toBeVisible()
    })
  })

  test.describe('Performance Testing', () => {
    test('should load pages within acceptable time', async ({ page }) => {
      const startTime = Date.now()
      
      // Login
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // 3 seconds max
    })

    test('should handle large file uploads', async ({ page }) => {
      // Login and navigate to upload
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.waitForURL('/projects')
      await page.click('[data-testid="project-card"]:first-child')
      await page.waitForURL('/ingestion')
      
      // Upload large file
      const startTime = Date.now()
      await page.setInputFiles('[data-testid="file-upload"] input[type="file"]', 'large-test-data.csv')
      
      // Wait for upload to complete
      await page.waitForSelector('text=Upload complete')
      const uploadTime = Date.now() - startTime
      
      expect(uploadTime).toBeLessThan(60000) // 60 seconds max
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Login
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Test keyboard navigation
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      
      // Should navigate to project
      await expect(page).toHaveURL('/ingestion')
    })

    test('should have proper ARIA labels', async ({ page }) => {
      // Login
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Check for ARIA labels
      await expect(page.locator('[aria-label]')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort())
      
      // Try to login
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Should show error message
      await expect(page.locator('text=Network error')).toBeVisible()
    })

    test('should handle 404 errors', async ({ page }) => {
      // Navigate to non-existent page
      await page.goto('/non-existent-page')
      
      // Should show 404 page
      await expect(page.locator('text=Page not found')).toBeVisible()
    })

    test('should handle server errors', async ({ page }) => {
      // Simulate server error
      await page.route('**/api/**', route => route.fulfill({ status: 500, body: 'Internal server error' }))
      
      // Try to login
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Should show error message
      await expect(page.locator('text=Server error')).toBeVisible()
    })
  })
})

