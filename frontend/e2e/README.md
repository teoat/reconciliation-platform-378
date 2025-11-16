# E2E Testing Setup Guide

## Prerequisites

### Install Playwright Browsers

Before running tests, install all required browsers:

```bash
cd frontend
npx playwright install
```

This will install:
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)

**Note**: Browser installation requires ~500MB of disk space.

### Backend Setup (Optional)

For full integration tests, ensure the backend is running:

```bash
# Backend should be running on http://localhost:2000
# Check backend health:
curl http://localhost:2000/api/health
```

Tests will gracefully degrade if backend is not available.

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Specific Test Suite
```bash
# Comprehensive diagnostics
npm run test:e2e comprehensive-diagnostic.spec.ts

# Reconciliation features
npm run test:e2e reconciliation-features.spec.ts

# Reconciliation workflows
npm run test:e2e reconciliation-workflows.spec.ts
```

### With UI
```bash
npm run test:e2e:ui
```

### In Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Single Browser
```bash
# Only Chromium
npm run test:e2e -- --project=chromium

# Only Firefox
npm run test:e2e -- --project=firefox

# Only WebKit
npm run test:e2e -- --project=webkit
```

## Test Suites

### 1. Comprehensive Diagnostic (`comprehensive-diagnostic.spec.ts`)
- Tests all pages and routes
- Responsive design testing
- Error handling verification
- Console and network error detection

### 2. Reconciliation Features (`reconciliation-features.spec.ts`)
- Quick Reconciliation Wizard
- Project-specific reconciliation
- File upload functionality
- Data table interactions
- Filter and search
- Modal/dialog interactions

### 3. Reconciliation Workflows (`reconciliation-workflows.spec.ts`)
- Complete wizard flow
- Upload, Configure, Run, Results tabs
- Settings configuration
- Job status tracking
- Match review and actions
- Export functionality
- Backend integration (when available)

## Backend Health Check

Tests automatically check backend health and gracefully degrade if unavailable.

The backend health check utility (`e2e/utils/backend-health.ts`) provides:
- `checkBackendHealth()` - Check if backend is running
- `waitForBackend()` - Wait for backend with retries
- `skipIfBackendUnavailable()` - Skip tests if backend unavailable
- `logBackendStatus()` - Log backend status for debugging

## Configuration

Test configuration is in `playwright.config.ts`:
- Base URL: `http://localhost:1000`
- Timeout: 30 seconds
- Screenshots: On failure
- Videos: On failure
- Trace: On first retry

## Troubleshooting

### Browsers Not Installed
```bash
npx playwright install
```

### Backend Connection Errors
- Ensure backend is running on port 2000
- Check firewall settings
- Tests will work without backend (graceful degradation)

### Authentication Issues
- Tests use `addInitScript` to set auth tokens
- If tests fail, check CSP configuration

### Timeout Errors
- Increase timeout in `playwright.config.ts`
- Check network connectivity
- Verify frontend server is running

## CI/CD Integration

Tests are configured for CI/CD:
- Automatic retries on failure (2 retries in CI)
- HTML reports generated
- JSON results for integration
- JUnit XML for test reporting

