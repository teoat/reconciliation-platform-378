# Test Structure and Commands

## Overview

The Reconciliation Platform uses a unified testing structure with standardized commands for running tests across all components.

## Directory Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── reconciliation.spec.ts
│   ├── authentication.spec.ts
│   └── workflows.spec.ts
├── load/                   # Load and performance tests
│   ├── k6-load-test.js
│   └── locustfile.py
├── performance/            # Performance benchmarks
│   └── benchmarks.ts
├── security/               # Security tests
│   └── security-audit.ts
├── uat/                    # User acceptance tests
│   └── acceptance.spec.ts
└── setup.ts               # Test setup utilities

frontend/
├── src/
│   ├── __tests__/         # Unit tests
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   └── test/              # Test utilities
│       └── test-utils.tsx

backend/
├── tests/
│   ├── integration/       # Integration tests
│   ├── unit/              # Unit tests
│   └── e2e/               # Backend E2E tests
└── src/
    └── *_tests.rs         # Inline unit tests
```

## Standardized Test Commands

### Root-Level Commands

```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e           # End-to-end tests only
npm run test:load          # Load tests
npm run test:security      # Security tests

# With coverage
npm run test:coverage      # Generate coverage report

# Watch mode
npm run test:watch         # Watch for changes
```

### Frontend Tests

```bash
cd frontend

# Unit tests
npm run test:unit
npm run test:unit -- --coverage
npm run test:unit -- --watch
npm run test:unit -- --testPathPattern="components"

# Integration tests
npm run test:integration
npm run test:integration:coverage

# E2E tests with Playwright
npm run test:e2e
npm run test:e2e -- --project=chromium
npm run test:e2e -- --grep="login"
npm run test:e2e -- --ui              # Interactive mode

# Visual regression
npm run test:visual

# Performance
npm run test:performance
```

### Backend Tests

```bash
cd backend

# All tests
cargo test

# Unit tests only
cargo test --lib

# Integration tests
cargo test --test integration_tests

# Specific test module
cargo test services::reconciliation

# With output
cargo test -- --nocapture

# Single-threaded (for database tests)
cargo test -- --test-threads=1

# Benchmarks
cargo bench
```

## Test Configuration

### Jest Configuration (Frontend)

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{ts,tsx}',
  ],
};
```

### Playwright Configuration (E2E)

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Cargo Test Configuration (Backend)

```toml
# Cargo.toml
[dev-dependencies]
tokio-test = "0.4"
mockall = "0.12"
fake = "2.9"
rstest = "0.18"

[[test]]
name = "integration_tests"
path = "tests/integration/mod.rs"

[profile.test]
opt-level = 0
debug = true
```

## Writing Tests

### Frontend Unit Test Example

```typescript
// src/__tests__/components/ReconciliationList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReconciliationList } from '@/components/ReconciliationList';
import { TestWrapper } from '@/test/test-utils';

describe('ReconciliationList', () => {
  it('displays reconciliations', async () => {
    render(
      <TestWrapper>
        <ReconciliationList projectId="123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Reconciliation 1')).toBeInTheDocument();
    });
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ReconciliationList projectId="123" />
      </TestWrapper>
    );

    await user.click(screen.getByRole('combobox', { name: /status/i }));
    await user.click(screen.getByRole('option', { name: /pending/i }));

    await waitFor(() => {
      expect(screen.getAllByTestId('reconciliation-item')).toHaveLength(5);
    });
  });
});
```

### Backend Unit Test Example

```rust
// src/services/reconciliation_tests.rs
#[cfg(test)]
mod tests {
    use super::*;
    use mockall::predicate::*;
    use rstest::*;

    #[fixture]
    fn mock_repo() -> MockReconciliationRepository {
        MockReconciliationRepository::new()
    }

    #[rstest]
    #[tokio::test]
    async fn test_create_reconciliation(mut mock_repo: MockReconciliationRepository) {
        let input = CreateReconciliationInput {
            project_id: Uuid::new_v4(),
            name: "Test Reconciliation".to_string(),
        };

        mock_repo
            .expect_create()
            .withf(|r| r.name == "Test Reconciliation")
            .returning(|_| Ok(Reconciliation::default()));

        let service = ReconciliationService::new(Arc::new(mock_repo));
        let result = service.create(input).await;

        assert!(result.is_ok());
    }

    #[rstest]
    #[case("pending", 5)]
    #[case("completed", 3)]
    #[case("error", 1)]
    #[tokio::test]
    async fn test_list_by_status(
        #[case] status: &str,
        #[case] expected_count: usize,
    ) {
        // Test implementation
    }
}
```

### E2E Test Example

```typescript
// e2e/reconciliation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Reconciliation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('creates a new reconciliation', async ({ page }) => {
    await page.click('text=New Reconciliation');
    await page.fill('[name="name"]', 'Test Reconciliation');
    await page.selectOption('[name="project"]', 'project-1');
    await page.click('button:has-text("Create")');

    await expect(page.locator('.toast-success')).toHaveText(
      'Reconciliation created successfully'
    );
  });

  test('runs reconciliation matching', async ({ page }) => {
    await page.goto('/reconciliations/recon-1');
    await page.click('button:has-text("Run Matching")');

    await expect(page.locator('.progress-bar')).toBeVisible();
    await expect(page.locator('.status')).toHaveText('Completed', {
      timeout: 30000,
    });
  });
});
```

## CI Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        component: [frontend, backend]
    steps:
      - uses: actions/checkout@v4
      
      - name: Run unit tests
        run: |
          if [ "${{ matrix.component }}" == "frontend" ]; then
            cd frontend && npm ci && npm run test:unit
          else
            cd backend && cargo test --lib
          fi

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - name: Run integration tests
        run: cd backend && cargo test --test integration_tests

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Playwright
        run: cd frontend && npx playwright install --with-deps
      - name: Run E2E tests
        run: cd frontend && npm run test:e2e
```

## Coverage Requirements

| Test Type | Minimum Coverage |
|-----------|-----------------|
| Frontend Unit Tests | 80% |
| Backend Unit Tests | 80% |
| Integration Tests | 70% |
| E2E Critical Paths | 100% |

## Running Specific Tests

```bash
# By file pattern
npm run test -- --testPathPattern="auth"

# By test name
npm run test -- --testNamePattern="login"

# Specific file
npm run test -- src/__tests__/auth.test.ts

# Backend specific module
cargo test auth_service::tests

# E2E specific test
npx playwright test auth.spec.ts
```

## Debugging Tests

```bash
# Frontend - verbose output
npm run test -- --verbose

# Frontend - debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Playwright - debug mode
PWDEBUG=1 npx playwright test

# Backend - with output
cargo test -- --nocapture

# Backend - specific test with backtrace
RUST_BACKTRACE=1 cargo test specific_test -- --nocapture
```
