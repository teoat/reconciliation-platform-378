#!/usr/bin/env tsx

/**
 * Google OAuth Diagnostic Script
 * 
 * Uses Playwright with Chrome DevTools Protocol to diagnose Google OAuth setup.
 * Captures console logs, network requests, and performs comprehensive checks.
 */

// Use @playwright/test when run from frontend directory
import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface DiagnosticReport {
  timestamp: string;
  checks: CheckResult[];
  consoleLogs: ConsoleLog[];
  networkRequests: NetworkRequest[];
  screenshots: string[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

interface ConsoleLog {
  type: 'log' | 'error' | 'warning' | 'info' | 'debug';
  message: string;
  timestamp: string;
  location?: {
    url: string;
    line: number;
    column: number;
  };
}

interface NetworkRequest {
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  error?: string;
  timestamp: string;
}

class GoogleOAuthDiagnostic {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private checks: CheckResult[] = [];
  private consoleLogs: ConsoleLog[] = [];
  private networkRequests: NetworkRequest[] = [];
  private screenshots: string[] = [];

  async run() {
    console.log('🔍 Starting Google OAuth Diagnostic...\n');

    try {
      // Launch browser with DevTools
      await this.launchBrowser();

      // Setup monitoring
      await this.setupMonitoring();

      // Run checks
      await this.runChecks();

      // Generate report
      await this.generateReport();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Diagnostic failed:', errorMessage);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async launchBrowser() {
    console.log('🌐 Launching browser with DevTools...');

    this.browser = await chromium.launch({
      headless: false, // Show browser for debugging
      devtools: true, // Enable DevTools
      args: [
        '--disable-blink-features=AutomationControlled',
        '--enable-logging',
        '--v=1',
      ],
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: {
        dir: 'test-results/google-oauth-diagnostic/videos',
        size: { width: 1280, height: 720 },
      },
    });

    this.page = await this.context.newPage();
  }

  private async setupMonitoring() {
    if (!this.page) return;

    console.log('📡 Setting up monitoring...');

    // Monitor console
    this.page.on('console', (msg) => {
      const type = msg.type() as ConsoleLog['type'];
      const text = msg.text();
      const location = msg.location();

      this.consoleLogs.push({
        type,
        message: text,
        timestamp: new Date().toISOString(),
        location: location
          ? {
              url: location.url,
              line: location.lineNumber || 0,
              column: location.columnNumber || 0,
            }
          : undefined,
      });

      // Log errors and warnings
      if (type === 'error' || type === 'warning') {
        console.log(`[${type.toUpperCase()}] ${text}`);
      }
    });

    // Monitor network requests
    this.page.on('request', (request) => {
      const url = request.url();
      if (url.includes('google') || url.includes('gsi') || url.includes('oauth2')) {
        this.networkRequests.push({
          url,
          method: request.method(),
          headers: request.headers(),
          timestamp: new Date().toISOString(),
        });
      }
    });

    this.page.on('response', (response) => {
      const url = response.url();
      const existing = this.networkRequests.find((r) => r.url === url);
      if (existing) {
        existing.status = response.status();
        existing.statusText = response.statusText();
        existing.headers = response.headers();
      }
    });

    this.page.on('requestfailed', (request) => {
      const url = request.url();
      const existing = this.networkRequests.find((r) => r.url === url);
      if (existing) {
        existing.error = request.failure()?.errorText || 'Request failed';
      }
    });
  }

  private async runChecks() {
    if (!this.page) return;

    console.log('\n🔍 Running diagnostic checks...\n');

    // Check 1: Page loads
    await this.checkPageLoad();

    // Check 2: Environment variable
    await this.checkEnvironmentVariable();

    // Check 3: Google script loads
    await this.checkGoogleScript();

    // Check 4: Console errors
    await this.checkConsoleErrors();

    // Check 5: Network requests
    await this.checkNetworkRequests();

    // Check 6: Google button exists
    await this.checkGoogleButton();

    // Check 7: Button functionality
    await this.checkButtonFunctionality();

    // Take screenshot
    await this.takeScreenshot('final-state');
  }

  private async checkPageLoad() {
    if (!this.page) return;

    try {
      await this.page.goto('http://localhost:1000/login', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      this.addCheck('Page Load', 'pass', 'Login page loaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addCheck('Page Load', 'fail', `Failed to load page: ${errorMessage}`);
    }
  }

  private async checkEnvironmentVariable() {
    if (!this.page) return;

    try {
      const clientId = await this.page.evaluate(() => {
        // @ts-expect-error - Vite env variables are available at runtime
        return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      });

      if (clientId && clientId.length > 0) {
        const isValid = /^[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$/.test(clientId);
        if (isValid) {
          this.addCheck(
            'Environment Variable',
            'pass',
            `VITE_GOOGLE_CLIENT_ID is set correctly`,
            { clientId: clientId.substring(0, 30) + '...' }
          );
        } else {
          this.addCheck(
            'Environment Variable',
            'warning',
            'VITE_GOOGLE_CLIENT_ID format may be incorrect',
            { clientId: clientId.substring(0, 30) + '...' }
          );
        }
      } else {
        this.addCheck('Environment Variable', 'fail', 'VITE_GOOGLE_CLIENT_ID is not set');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addCheck('Environment Variable', 'fail', `Error: ${errorMessage}`);
    }
  }

  private async checkGoogleScript() {
    if (!this.page) return;

    try {
      console.log('⏳ Waiting for Google Identity Services script...');
      
      // Wait up to 15 seconds for script to load
      await this.page.waitForFunction(
        () => {
          // @ts-expect-error - Google Identity Services types not available
          return typeof window.google !== 'undefined' && window.google?.accounts?.id;
        },
        { timeout: 15000 }
      ).catch(async () => {
        // Script didn't load, check if it's still loading
        const stillLoading = await this.page?.evaluate(() => {
          // Check if script tag exists
          const scripts = Array.from(document.querySelectorAll('script'));
          return scripts.some(s => s.src.includes('accounts.google.com/gsi/client'));
        });

        if (stillLoading) {
          // Wait a bit more
          await this.page?.waitForTimeout(5000);
        }
      });

      const scriptLoaded = await this.page.evaluate(() => {
        // @ts-expect-error - Google Identity Services types not available
        return typeof window.google !== 'undefined' && window.google?.accounts?.id !== undefined;
      });

      if (scriptLoaded) {
        this.addCheck('Google Script', 'pass', 'Google Identity Services script loaded');
      } else {
        this.addCheck('Google Script', 'fail', 'Google Identity Services script not found');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addCheck('Google Script', 'fail', `Script did not load: ${errorMessage}`);
    }
  }

  private async checkConsoleErrors() {
    await this.page?.waitForTimeout(2000);

    const googleErrors = this.consoleLogs.filter(
      (log) =>
        log.type === 'error' &&
        (log.message.toLowerCase().includes('google') ||
          log.message.toLowerCase().includes('oauth') ||
          log.message.toLowerCase().includes('client_id') ||
          log.message.toLowerCase().includes('gsi'))
    );

    if (googleErrors.length === 0) {
      this.addCheck('Console Errors', 'pass', 'No Google OAuth console errors');
    } else {
      this.addCheck(
        'Console Errors',
        'fail',
        `Found ${googleErrors.length} Google OAuth error(s)`,
        { errors: googleErrors }
      );
    }
  }

  private async checkNetworkRequests() {
    const gsiRequest = this.networkRequests.find((r) =>
      r.url.includes('accounts.google.com/gsi/client')
    );

    if (gsiRequest) {
      if (gsiRequest.status === 200) {
        this.addCheck('Network Requests', 'pass', 'Google Identity Services loaded successfully', {
          url: gsiRequest.url,
          status: gsiRequest.status,
        });
      } else {
        this.addCheck(
          'Network Requests',
          'fail',
          `Google script failed to load (Status: ${gsiRequest.status})`,
          { url: gsiRequest.url, status: gsiRequest.status }
        );
      }
    } else {
      this.addCheck('Network Requests', 'warning', 'Google script request not found');
    }
  }

  private async checkGoogleButton() {
    if (!this.page) return;

    const selectors = [
      '#google-signin-button',
      '[data-google-signin]',
      'button:has-text("Sign in with Google")',
      'button:has-text("Continue with Google")',
      '.google-signin-button',
    ];

    let found = false;
    for (const selector of selectors) {
      try {
        const element = await this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          found = true;
          this.addCheck('Google Button', 'pass', `Button found with selector: ${selector}`, {
            selector,
          });
          break;
        }
      } catch {
        // Continue
      }
    }

    if (!found) {
      const notConfigured = await this.page
        .locator('text=/Google.*not.*configured/i')
        .first()
        .isVisible()
        .catch(() => false);

      if (notConfigured) {
        this.addCheck('Google Button', 'warning', 'Button not shown (not configured message)');
      } else {
        this.addCheck('Google Button', 'fail', 'Google Sign-In button not found');
      }
    }
  }

  private async checkButtonFunctionality() {
    if (!this.page) return;

    const selectors = [
      '#google-signin-button',
      '[data-google-signin]',
      'button:has-text("Sign in with Google")',
    ];

    for (const selector of selectors) {
      try {
        const button = this.page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          const popupPromise = this.page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
          await button.click();
          const popup = await popupPromise;

          if (popup) {
            this.addCheck('Button Functionality', 'pass', 'Button opens popup correctly');
            await popup.close();
            return;
          } else {
            this.addCheck('Button Functionality', 'warning', 'Button clicked but popup did not open');
            return;
          }
        }
      } catch {
        // Continue
      }
    }

    this.addCheck('Button Functionality', 'warning', 'Could not test button (not found)');
  }

  private async takeScreenshot(name: string) {
    if (!this.page) return;

    const screenshotDir = path.join(process.cwd(), 'test-results', 'google-oauth-diagnostic', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const screenshotPath = path.join(screenshotDir, `${name}-${Date.now()}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    this.screenshots.push(screenshotPath);
  }

  private addCheck(name: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
    this.checks.push({ name, status, message, details });
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${name}: ${message}`);
  }

  private async generateReport() {
    const report: DiagnosticReport = {
      timestamp: new Date().toISOString(),
      checks: this.checks,
      consoleLogs: this.consoleLogs.filter((l) => l.type === 'error' || l.type === 'warning'),
      networkRequests: this.networkRequests,
      screenshots: this.screenshots,
      summary: {
        total: this.checks.length,
        passed: this.checks.filter((c) => c.status === 'pass').length,
        failed: this.checks.filter((c) => c.status === 'fail').length,
        warnings: this.checks.filter((c) => c.status === 'warning').length,
      },
    };

    const reportDir = path.join(process.cwd(), 'test-results', 'google-oauth-diagnostic');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, `diagnostic-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Diagnostic Summary');
    console.log('====================');
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`\n📄 Full report: ${reportPath}`);
    console.log(`📸 Screenshots: ${this.screenshots.length} saved`);
    console.log(`🌐 Network requests: ${this.networkRequests.length} captured`);
    console.log(`📝 Console logs: ${this.consoleLogs.length} captured\n`);
  }

  private async cleanup() {
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run diagnostic
if (require.main === module) {
  const diagnostic = new GoogleOAuthDiagnostic();
  diagnostic
    .run()
    .then(() => {
      console.log('✅ Diagnostic completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Diagnostic failed:', error);
      process.exit(1);
    });
}

export { GoogleOAuthDiagnostic };

