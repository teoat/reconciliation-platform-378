# Centralized Test Directory

This directory contains all tests for the Reconciliation Platform organized by type.

## Directory Structure

```
tests/
├── README.md           # This file
├── setup.ts            # Test setup and configuration
├── unit/               # Unit tests
│   ├── components/     # Component unit tests
│   └── utils/          # Utility function tests
├── e2e/                # End-to-end tests (Playwright)
│   └── *.spec.ts       # E2E test specifications
├── load/               # Load testing
│   └── load-test.yml   # k6 load test configuration
├── performance/        # Performance tests
│   └── load-test.js    # Performance test scripts
├── security/           # Security tests
│   └── security.spec.ts # Security test specifications
└── uat/                # User Acceptance Tests
    └── uat_executor.py # UAT test executor
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run E2E tests with UI
npx playwright test --ui

# Run specific E2E test file
npx playwright test tests/e2e/reconciliation.spec.ts
```

### Load Tests

```bash
# Run load tests (requires k6)
k6 run tests/load/load-test.js

# Run with custom options
k6 run --vus 10 --duration 30s tests/load/load-test.js
```

### Security Tests

```bash
# Run security tests
npx playwright test tests/security/
```

## Test Configuration

### Jest (Unit Tests)

Configuration is in `jest.config.js`:
- Test environment: jsdom
- Coverage thresholds: 75% global
- Module path mapping for `@/` imports

### Playwright (E2E Tests)

Configuration is in `playwright.config.ts`:
- Multiple browser support (Chromium, Firefox, WebKit)
- Screenshot on failure
- Video recording for debugging

## Writing Tests

### Unit Tests

```typescript
// tests/unit/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
// tests/e2e/feature.spec.ts
import { test, expect } from '@playwright/test';

test('should complete user flow', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Reconciliation App/);
});
```

## Legacy Test Locations

For backward compatibility, tests in these locations are still recognized:
- `__tests__/` - Original Jest test directory
- `e2e/` - Original E2E test directory

New tests should be placed in the centralized `/tests` directory.

## Coverage Reports

After running `npm run test:coverage`, coverage reports are generated in:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI

## CI Integration

Tests are automatically run in CI via `.github/workflows/ci.yml`:
1. Linting
2. Type checking
3. Unit tests (frontend)
4. Unit tests (backend)
5. Build verification
