#!/usr/bin/env tsx
// ============================================================================
// COMPREHENSIVE PAGE EVALUATION SCRIPT
// ============================================================================
// Evaluates all frontend pages using Playwright
// ============================================================================

import { chromium, Browser } from 'playwright';
import { injectAxe, getViolations } from 'axe-playwright';

interface PageEvaluation {
  path: string;
  name: string;
  public: boolean;
  loaded: boolean;
  loadTime: number;
  accessibility: {
    violations: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  console: {
    errors: number;
    warnings: number;
    logs: number;
  };
  network: {
    total: number;
    failed: number;
    slow: number; // > 1000ms
  };
  errors: string[];
  warnings: string[];
}

const PAGES = [
  { path: '/login', name: 'Login Page', public: true },
  { path: '/', name: 'Dashboard', public: false },
  { path: '/analytics', name: 'Analytics Dashboard', public: false },
  { path: '/projects/new', name: 'Create Project', public: false },
  { path: '/upload', name: 'File Upload', public: false },
  { path: '/users', name: 'User Management', public: false },
  { path: '/api-status', name: 'API Integration Status', public: false },
  { path: '/api-tester', name: 'API Tester', public: false },
  { path: '/api-docs', name: 'API Documentation', public: false },
  { path: '/settings', name: 'Settings', public: false },
  { path: '/profile', name: 'User Profile', public: false },
  { path: '/quick-reconciliation', name: 'Quick Reconciliation Wizard', public: false },
  { path: '/nonexistent-page-12345', name: '404 Not Found', public: true },
];

async function evaluatePage(browser: Browser, pageInfo: typeof PAGES[0]): Promise<PageEvaluation> {
  const page = await browser.newPage();
  const evaluation: PageEvaluation = {
    path: pageInfo.path,
    name: pageInfo.name,
    public: pageInfo.public,
    loaded: false,
    loadTime: 0,
    accessibility: {
      violations: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    },
    console: {
      errors: 0,
      warnings: 0,
      logs: 0,
    },
    network: {
      total: 0,
      failed: 0,
      slow: 0,
    },
    errors: [],
    warnings: [],
  };

  try {
    // Set up console message tracking
    const consoleMessages: Array<{ level: string; text: string }> = [];
    page.on('console', (msg) => {
      const level = msg.type();
      const text = msg.text();
      consoleMessages.push({ level, text });
      
      if (level === 'error') evaluation.console.errors++;
      else if (level === 'warning') evaluation.console.warnings++;
      else evaluation.console.logs++;
    });

    // Set up network request tracking
    const networkRequests: Array<{ url: string; status: number; duration: number }> = [];
    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      const timing = response.timing();
      const duration = timing ? timing.responseEnd - timing.requestStart : 0;
      
      networkRequests.push({ url, status, duration });
      evaluation.network.total++;
      
      if (status >= 400) evaluation.network.failed++;
      if (duration > 1000) evaluation.network.slow++;
    });

    // Set up request failed tracking
    page.on('requestfailed', (request) => {
      evaluation.network.failed++;
      evaluation.errors.push(`Request failed: ${request.url()}`);
    });

    // Authenticate if needed
    if (!pageInfo.public) {
      await page.context().addInitScript(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem('authToken', 'test-token');
            window.localStorage.setItem('user', JSON.stringify({
              id: '1',
              email: 'test@example.com',
              first_name: 'Test',
              last_name: 'User',
              role: 'admin'
            }));
          } catch (e) {
            // localStorage might be blocked
          }
        }
      });
    }

    // Navigate to page
    const startTime = Date.now();
    await page.goto(`http://localhost:1000${pageInfo.path}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    evaluation.loadTime = Date.now() - startTime;
    evaluation.loaded = true;

    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Inject axe for accessibility testing
    await injectAxe(page);
    await page.waitForTimeout(1000);

    // Run accessibility check
    const violations = await getViolations(page, undefined, {
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    });

    evaluation.accessibility.violations = violations.length;
    violations.forEach(v => {
      if (v.impact === 'critical') evaluation.accessibility.critical++;
      else if (v.impact === 'serious') evaluation.accessibility.serious++;
      else if (v.impact === 'moderate') evaluation.accessibility.moderate++;
      else if (v.impact === 'minor') evaluation.accessibility.minor++;
    });

    // Check for visible error messages
    const errorCount = await page.locator('[role="alert"], .error, .error-message').count();
    if (errorCount > 0) {
      evaluation.warnings.push(`${errorCount} visible error message(s) found`);
    }

    // Check page title
    const title = await page.title();
    if (!title || title.trim() === '') {
      evaluation.warnings.push('Page title is missing');
    }

    // Check for main content
    const mainContent = await page.locator('main, [role="main"]').count();
    if (mainContent === 0) {
      evaluation.warnings.push('No main content area found');
    }

    // Check for heading hierarchy
    const h1Count = await page.locator('h1').count();
    if (h1Count === 0) {
      evaluation.warnings.push('No h1 heading found');
    } else if (h1Count > 1) {
      evaluation.warnings.push(`Multiple h1 headings found (${h1Count})`);
    }

  } catch (error) {
    evaluation.errors.push(`Failed to evaluate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    evaluation.loaded = false;
  } finally {
    await page.close();
  }

  return evaluation;
}

async function main() {
  console.log('🚀 Starting comprehensive page evaluation...\n');

  const browser = await chromium.launch({ headless: false });
  const results: PageEvaluation[] = [];

  try {
    for (const pageInfo of PAGES) {
      console.log(`Evaluating: ${pageInfo.name} (${pageInfo.path})...`);
      const result = await evaluatePage(browser, pageInfo);
      results.push(result);
      
      // Print quick summary
      const status = result.loaded ? '✅' : '❌';
      console.log(`  ${status} Loaded: ${result.loadTime}ms`);
      console.log(`  Accessibility: ${result.accessibility.violations} violations (${result.accessibility.critical} critical, ${result.accessibility.serious} serious)`);
      console.log(`  Console: ${result.console.errors} errors, ${result.console.warnings} warnings`);
      console.log(`  Network: ${result.network.failed}/${result.network.total} failed\n`);
    }

    // Generate summary
    const summary = {
      totalPages: results.length,
      loadedPages: results.filter(r => r.loaded).length,
      totalAccessibilityViolations: results.reduce((sum, r) => sum + r.accessibility.violations, 0),
      criticalAccessibilityViolations: results.reduce((sum, r) => sum + r.accessibility.critical, 0),
      totalConsoleErrors: results.reduce((sum, r) => sum + r.console.errors, 0),
      totalNetworkFailures: results.reduce((sum, r) => sum + r.network.failed, 0),
      averageLoadTime: results.filter(r => r.loaded).reduce((sum, r) => sum + r.loadTime, 0) / results.filter(r => r.loaded).length,
      pagesWithErrors: results.filter(r => r.errors.length > 0).length,
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 EVALUATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Pages: ${summary.totalPages}`);
    console.log(`Loaded Pages: ${summary.loadedPages} (${((summary.loadedPages / summary.totalPages) * 100).toFixed(1)}%)`);
    console.log(`Average Load Time: ${summary.averageLoadTime.toFixed(0)}ms`);
    console.log(`Total Accessibility Violations: ${summary.totalAccessibilityViolations}`);
    console.log(`Critical Accessibility Violations: ${summary.criticalAccessibilityViolations}`);
    console.log(`Total Console Errors: ${summary.totalConsoleErrors}`);
    console.log(`Total Network Failures: ${summary.totalNetworkFailures}`);
    console.log(`Pages with Errors: ${summary.pagesWithErrors}`);
    console.log('='.repeat(60));

    // Save detailed results
    const fs = await import('fs');
    const path = await import('path');
    const outputPath = path.join(process.cwd(), 'frontend', 'PAGE_EVALUATION_RESULTS.json');
    fs.writeFileSync(outputPath, JSON.stringify({ summary, results }, null, 2));
    console.log(`\n📄 Detailed results saved to: ${outputPath}`);

  } finally {
    await browser.close();
  }
}

main().catch(console.error);


