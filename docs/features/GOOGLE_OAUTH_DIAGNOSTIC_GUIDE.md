# Google OAuth Diagnostic Guide

## Overview

This guide explains how to use Playwright and Chrome DevTools Protocol to diagnose Google OAuth setup issues.

## Quick Start

### Option 1: Simple Diagnostic Script (Recommended)

```bash
./diagnose-google-oauth.sh
```

This will:
- Check if frontend server is running
- Launch browser with DevTools enabled
- Run comprehensive diagnostic checks
- Generate detailed report

### Option 2: Playwright Test

```bash
cd frontend
npm run test:e2e:google-oauth:headed
```

### Option 3: Debug Mode

```bash
cd frontend
npm run test:e2e:google-oauth:debug
```

## What Gets Checked

### 1. Page Load
- ✅ Login page loads successfully
- ✅ No navigation errors
- ✅ Page is accessible

### 2. Environment Variable
- ✅ `VITE_GOOGLE_CLIENT_ID` is set
- ✅ Format is correct (Google OAuth client ID format)
- ✅ Variable is accessible in browser context

### 3. Google Identity Services Script
- ✅ Script loads from `accounts.google.com/gsi/client`
- ✅ `window.google` object is available
- ✅ `window.google.accounts.id` is initialized

### 4. Console Errors (Chrome DevTools)
- ✅ Captures all console messages
- ✅ Filters Google OAuth related errors
- ✅ Logs error locations (file, line, column)

### 5. Network Requests (Chrome DevTools)
- ✅ Monitors all Google-related requests
- ✅ Checks script loading status
- ✅ Captures request/response headers
- ✅ Detects failed requests

### 6. Google Sign-In Button
- ✅ Button exists in DOM
- ✅ Button is visible
- ✅ Button is not disabled
- ✅ Multiple selector strategies tried

### 7. Button Functionality
- ✅ Button is clickable
- ✅ Click opens Google OAuth popup
- ✅ Popup URL is correct

## Diagnostic Output

### Report Location

All diagnostic results are saved to:
```
test-results/google-oauth-diagnostic/
```

### Files Generated

1. **Diagnostic Report** (`diagnostic-report-*.json`)
   - Complete test results
   - Console logs (errors and warnings)
   - Network requests
   - Screenshots list
   - Summary statistics

2. **Screenshots** (`screenshots/`)
   - Full-page screenshots
   - Timestamped for each check

3. **Video Recording** (`videos/`)
   - Full browser session recording
   - Useful for debugging

### Report Structure

```json
{
  "timestamp": "2025-01-16T10:30:00Z",
  "checks": [
    {
      "name": "Page Load",
      "status": "pass",
      "message": "Login page loaded successfully"
    },
    {
      "name": "Environment Variable",
      "status": "pass",
      "message": "VITE_GOOGLE_CLIENT_ID is set correctly",
      "details": {
        "clientId": "600300535059-8jtb47bloe..."
      }
    }
  ],
  "consoleLogs": [
    {
      "type": "error",
      "message": "Error message here",
      "location": {
        "url": "http://localhost:1000/login",
        "line": 123,
        "column": 45
      }
    }
  ],
  "networkRequests": [
    {
      "url": "https://accounts.google.com/gsi/client",
      "method": "GET",
      "status": 200,
      "headers": {}
    }
  ],
  "summary": {
    "total": 7,
    "passed": 6,
    "failed": 1,
    "warnings": 0
  }
}
```

## Using Chrome DevTools

### Accessing DevTools in Playwright

When running in headed mode, DevTools are automatically enabled:

```bash
npm run test:e2e:google-oauth:headed
```

### Manual DevTools Access

1. **Open Chrome with remote debugging:**
   ```bash
   google-chrome --remote-debugging-port=9222
   ```

2. **Connect Playwright to existing browser:**
   ```typescript
   const browser = await chromium.connectOverCDP('http://localhost:9222');
   ```

### Console Logs

All console messages are captured automatically:
- `console.log()` → type: 'log'
- `console.error()` → type: 'error'
- `console.warn()` → type: 'warning'
- `console.info()` → type: 'info'
- `console.debug()` → type: 'debug'

### Network Monitoring

All network requests are monitored:
- Request URL
- Request method
- Response status
- Response headers
- Error messages (if failed)

### Performance Metrics

The diagnostic can also capture:
- Page load time
- Script load time
- Network request timing
- DOM ready time

## Troubleshooting with Diagnostics

### Issue: Button Not Showing

**Check the diagnostic report for:**
1. Environment variable status
2. Google script load status
3. Console errors related to Google OAuth
4. Network request failures

**Common fixes:**
- Restart frontend server after setting env var
- Check `.env.local` file exists and has correct format
- Verify Google Cloud Console configuration

### Issue: Console Errors

**Check console logs in report:**
```json
"consoleLogs": [
  {
    "type": "error",
    "message": "VITE_GOOGLE_CLIENT_ID is not defined",
    "location": {
      "url": "http://localhost:1000/login",
      "line": 45
    }
  }
]
```

**Fix:**
- Set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env.local`
- Restart frontend server

### Issue: Network Request Failures

**Check network requests in report:**
```json
"networkRequests": [
  {
    "url": "https://accounts.google.com/gsi/client",
    "status": 404,
    "error": "Failed to load resource"
  }
]
```

**Fix:**
- Check internet connection
- Verify Google services are accessible
- Check for CORS or CSP issues

### Issue: Script Not Loading

**Check Google Script status:**
- Look for "Google Script" check in report
- Check network requests for script URL
- Verify `window.google` object exists

**Fix:**
- Check browser console for errors
- Verify CSP (Content Security Policy) allows Google scripts
- Check network tab for blocked requests

## Advanced Usage

### Custom Diagnostic Checks

You can extend the diagnostic by adding custom checks:

```typescript
// In diagnose-google-oauth.ts
private async checkCustomFeature() {
  // Your custom check logic
  const result = await this.page.evaluate(() => {
    // Check something
    return true;
  });
  
  this.addCheck('Custom Feature', result ? 'pass' : 'fail', 'Message');
}
```

### Filtering Console Logs

Modify the console filter to capture specific messages:

```typescript
page.on('console', (msg) => {
  const text = msg.text();
  // Only capture specific errors
  if (text.includes('Google') || text.includes('OAuth')) {
    // Process message
  }
});
```

### Network Request Filtering

Filter network requests to specific domains:

```typescript
page.on('request', (request) => {
  const url = request.url();
  if (url.includes('google.com') || url.includes('oauth2')) {
    // Monitor this request
  }
});
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Run Google OAuth Diagnostic
  run: |
    cd frontend
    npm run test:e2e:google-oauth
  continue-on-error: true

- name: Upload Diagnostic Report
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: google-oauth-diagnostic
    path: frontend/test-results/google-oauth-diagnostic/
```

## Best Practices

1. **Run diagnostics before deployment**
   - Catch configuration issues early
   - Verify all checks pass

2. **Save diagnostic reports**
   - Keep historical reports
   - Compare before/after changes

3. **Use headed mode for debugging**
   - See what's happening in browser
   - Debug interactively

4. **Check console logs regularly**
   - Monitor for new errors
   - Track error patterns

5. **Monitor network requests**
   - Verify API calls succeed
   - Check response times

## Related Documentation

- [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md)
- [Next Steps Guide](./GOOGLE_OAUTH_NEXT_STEPS.md)
- [Playwright Documentation](https://playwright.dev)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)

