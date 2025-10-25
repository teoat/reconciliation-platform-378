// Security Testing Framework
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

// Security test configuration
test.describe.configure({ mode: 'serial' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Security Testing Suite', () => {
  test.beforeAll(async () => {
    // Run security audit
    console.log('Running security audit...');
    try {
      execSync('npm audit --audit-level=moderate', { stdio: 'inherit' });
    } catch (error) {
      console.warn('Security audit found issues:', error.message);
    }
  });

  test('should prevent SQL injection attacks', async ({ page }) => {
    await page.goto(`${BASE_URL}/api/auth/login`);
    
    // Test SQL injection in login form
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "admin'--",
      "admin'/*",
      "' UNION SELECT * FROM users --"
    ];
    
    for (const input of maliciousInputs) {
      await page.fill('input[name="email"]', input);
      await page.fill('input[name="password"]', 'password');
      await page.click('button[type="submit"]');
      
      // Should not crash or expose database errors
      await expect(page.locator('text=Database error')).not.toBeVisible();
      await expect(page.locator('text=SQL syntax error')).not.toBeVisible();
    }
  });

  test('should prevent XSS attacks', async ({ page }) => {
    await page.goto(`${BASE_URL}/api/auth/register`);
    
    // Test XSS in registration form
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>',
      '"><script>alert("XSS")</script>'
    ];
    
    for (const payload of xssPayloads) {
      await page.fill('input[name="firstName"]', payload);
      await page.fill('input[name="lastName"]', 'Test');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should not execute JavaScript
      const alerts = await page.evaluate(() => {
        return window.alert.toString();
      });
      expect(alerts).not.toContain('XSS');
    }
  });

  test('should enforce authentication requirements', async ({ page }) => {
    // Test protected endpoints without authentication
    const protectedEndpoints = [
      '/api/projects',
      '/api/ingestion/jobs',
      '/api/auth/me',
      '/api/projects/123',
    ];
    
    for (const endpoint of protectedEndpoints) {
      const response = await page.request.get(`${BASE_URL}${endpoint}`);
      expect(response.status()).toBe(401);
    }
  });

  test('should validate input data', async ({ page }) => {
    await page.goto(`${BASE_URL}/api/auth/register`);
    
    // Test invalid email formats
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'test@',
      'test..test@example.com',
      'test@example',
    ];
    
    for (const email of invalidEmails) {
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.click('button[type="submit"]');
      
      // Should show validation error
      await expect(page.locator('text=Invalid email format')).toBeVisible();
    }
    
    // Test weak passwords
    const weakPasswords = ['123', 'password', 'abc', '123456'];
    
    for (const password of weakPasswords) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.click('button[type="submit"]');
      
      // Should show password strength error
      await expect(page.locator('text=Password too weak')).toBeVisible();
    }
  });

  test('should prevent CSRF attacks', async ({ page }) => {
    // Test CSRF protection on state-changing operations
    await page.goto(`${BASE_URL}/api/auth/login`);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for login
    await page.waitForURL('**/dashboard');
    
    // Try to make a request without proper CSRF token
    const response = await page.request.post(`${BASE_URL}/api/projects`, {
      data: {
        name: 'CSRF Test Project',
        description: 'This should fail'
      }
    });
    
    // Should require CSRF token
    expect(response.status()).toBe(403);
  });

  test('should enforce rate limiting', async ({ page }) => {
    // Test rate limiting on login endpoint
    const promises = [];
    
    for (let i = 0; i < 10; i++) {
      promises.push(
        page.request.post(`${BASE_URL}/api/auth/login`, {
          data: {
            email: 'test@example.com',
            password: 'wrongpassword'
          }
        })
      );
    }
    
    const responses = await Promise.all(promises);
    
    // Some requests should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('should handle file upload security', async ({ page }) => {
    await page.goto(`${BASE_URL}/ingestion`);
    
    // Test malicious file uploads
    const maliciousFiles = [
      { name: 'malicious.php', content: '<?php system($_GET["cmd"]); ?>' },
      { name: 'malicious.js', content: 'alert("XSS")' },
      { name: 'malicious.exe', content: 'MZ' },
      { name: '../../../etc/passwd', content: 'root:x:0:0:root:/root:/bin/bash' }
    ];
    
    for (const file of maliciousFiles) {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: file.name,
        mimeType: 'application/octet-stream',
        buffer: Buffer.from(file.content)
      });
      
      // Should reject malicious files
      await expect(page.locator('text=File type not allowed')).toBeVisible();
    }
  });

  test('should validate JWT tokens', async ({ page }) => {
    // Test invalid JWT tokens
    const invalidTokens = [
      'invalid-token',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
      'Bearer invalid-token',
      'expired-token',
    ];
    
    for (const token of invalidTokens) {
      const response = await page.request.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      expect(response.status()).toBe(401);
    }
  });

  test('should prevent directory traversal', async ({ page }) => {
    // Test directory traversal attacks
    const traversalPaths = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
    ];
    
    for (const path of traversalPaths) {
      const response = await page.request.get(`${BASE_URL}/api/files/${path}`);
      expect(response.status()).toBe(400);
    }
  });

  test('should enforce HTTPS in production', async ({ page }) => {
    // Test HTTPS enforcement
    const response = await page.request.get(`${BASE_URL}/api/health`);
    
    // Should redirect to HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      expect(response.url()).toMatch(/^https:/);
    }
  });

  test('should have proper security headers', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/health`);
    const headers = response.headers();
    
    // Check for security headers
    expect(headers['x-frame-options']).toBeDefined();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-xss-protection']).toBeDefined();
    expect(headers['strict-transport-security']).toBeDefined();
  });

  test('should prevent information disclosure', async ({ page }) => {
    // Test for information disclosure
    const sensitiveEndpoints = [
      '/api/users',
      '/api/admin',
      '/api/config',
      '/api/debug',
      '/.env',
      '/package.json',
      '/README.md'
    ];
    
    for (const endpoint of sensitiveEndpoints) {
      const response = await page.request.get(`${BASE_URL}${endpoint}`);
      
      // Should not expose sensitive information
      expect(response.status()).toBe(404);
      
      const body = await response.text();
      expect(body).not.toContain('password');
      expect(body).not.toContain('secret');
      expect(body).not.toContain('token');
    }
  });

  test('should handle session security', async ({ page }) => {
    await page.goto(`${BASE_URL}/api/auth/login`);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Check session cookie security
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session'));
    
    if (sessionCookie) {
      expect(sessionCookie.httpOnly).toBe(true);
      expect(sessionCookie.secure).toBe(true);
      expect(sessionCookie.sameSite).toBe('strict');
    }
  });

  test('should prevent clickjacking', async ({ page }) => {
    // Test if page can be embedded in iframe
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Try to embed page in iframe
    const iframe = await page.evaluate(() => {
      const iframe = document.createElement('iframe');
      iframe.src = window.location.href;
      document.body.appendChild(iframe);
      return iframe.contentWindow !== null;
    });
    
    // Should not be embeddable
    expect(iframe).toBe(false);
  });

  test('should validate API parameters', async ({ page }) => {
    // Test parameter validation
    const invalidParams = [
      { page: -1, limit: 0 },
      { page: 'invalid', limit: 'invalid' },
      { page: 999999999, limit: 999999999 },
      { search: '<script>alert("XSS")</script>' },
      { sort: '; DROP TABLE users; --' }
    ];
    
    for (const params of invalidParams) {
      const response = await page.request.get(`${BASE_URL}/api/projects`, {
        params: params
      });
      
      // Should validate parameters
      expect(response.status()).toBe(400);
    }
  });

  test('should handle error messages securely', async ({ page }) => {
    // Test error message handling
    await page.goto(`${BASE_URL}/api/auth/login`);
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Error message should not reveal system information
    const errorMessage = await page.locator('text=Invalid credentials').textContent();
    expect(errorMessage).not.toContain('database');
    expect(errorMessage).not.toContain('server');
    expect(errorMessage).not.toContain('error');
  });
});