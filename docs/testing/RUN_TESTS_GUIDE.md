# Test Running Guide for Agents

**Last Updated**: January 2025  
**Status**: ✅ Ready to Use

## Quick Reference

### Backend Tests (Rust)
```bash
cd backend
cargo test                    # All tests
cargo test --lib              # Unit tests only
cargo test --test '*'        # Integration tests
./run_tests.sh                # Comprehensive test script
```

### Frontend Tests (TypeScript/React)
```bash
cd frontend
npm test                      # Run all tests (Vitest)
npm run test:ui               # Run with UI
npm run test:coverage        # Run with coverage
```

### E2E Tests (Playwright)
```bash
# From project root
npm run test:e2e             # Run all E2E tests
npm run test:e2e:ui         # Run with Playwright UI
npm run test:e2e:headed     # Run in headed mode (see browser)
npm run test:e2e:debug      # Run in debug mode
```

### All Tests (Comprehensive)
```bash
# From project root
./scripts/test.sh            # Runs backend, frontend, and E2E tests
```

---

## Prerequisites

### Backend Tests
- ✅ Rust and Cargo installed
- ✅ PostgreSQL running (for integration tests)
- ✅ Redis running (optional, for some tests)

### Frontend Tests
- ✅ Node.js and npm installed
- ✅ Dependencies installed: `cd frontend && npm install`

### E2E Tests
- ✅ Playwright browsers installed: `npx playwright install`
- ✅ Frontend dev server or Docker container running
- ✅ Backend running (optional, tests degrade gracefully)

---

## Backend Testing

### Quick Start
```bash
cd backend
cargo test
```

### Test Types

#### Unit Tests
```bash
# Run all unit tests (co-located with source)
cargo test --lib

# Run specific module tests
cargo test --lib services::reconciliation

# Run with output
cargo test --lib -- --nocapture
```

#### Integration Tests
```bash
# Run all integration tests
cargo test --test '*'

# Run specific integration test file
cargo test --test integration_tests

# Run with features
cargo test --test '*' --features test
```

#### Comprehensive Test Script
```bash
cd backend
./run_tests.sh
```

This script:
- ✅ Checks prerequisites (Rust, PostgreSQL, Redis)
- ✅ Sets up test environment
- ✅ Runs unit, integration, API, performance, and security tests
- ✅ Generates test report
- ✅ Cleans up test environment

### Test Coverage
```bash
# Install cargo-tarpaulin if needed
cargo install cargo-tarpaulin

# Generate coverage report
cargo tarpaulin --out Html
```

### Common Issues

**PostgreSQL not running:**
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Or check if running
pg_isready -h localhost -p 5432
```

**Redis not running:**
```bash
# Start Redis
docker-compose up -d redis

# Or check if running
redis-cli ping
```

---

## Frontend Testing

### Quick Start
```bash
cd frontend
npm test
```

### Test Commands

#### Run All Tests
```bash
npm test                      # Run once
npm test -- --watch          # Watch mode
```

#### Test UI (Interactive)
```bash
npm run test:ui
```
Opens Vitest UI in browser for interactive test running.

#### Coverage
```bash
npm run test:coverage
```
Generates coverage report in `coverage/` directory.

#### Run Specific Test
```bash
npm test -- path/to/test.ts
npm test -- --grep "test name"
```

### Test Structure

Tests are located in:
- `frontend/src/__tests__/` - Unit and component tests
- `frontend/e2e/` - E2E tests (Playwright)

### Test Utilities

Use test utilities from `frontend/src/utils/testUtils.tsx`:
- `renderWithProviders()` - Render with Redux/Router
- `createTestStore()` - Create test Redux store
- `createMockResponse()` - Mock API responses
- See [TEST_UTILITIES_GUIDE.md](./TEST_UTILITIES_GUIDE.md) for details

### Common Issues

**Dependencies not installed:**
```bash
cd frontend
npm install
```

**Port conflicts:**
```bash
# Check what's using port 5173
lsof -ti:5173

# Kill process if needed
lsof -ti:5173 | xargs kill -9
```

---

## E2E Testing (Playwright)

### Quick Start

#### 1. Install Playwright Browsers
```bash
npx playwright install
```

#### 2. Ensure Services Running
```bash
# Option 1: Docker (recommended)
docker-compose up -d

# Option 2: Manual
# Frontend: cd frontend && npm run dev
# Backend: cd backend && cargo run
```

#### 3. Run Tests
```bash
# From project root
npm run test:e2e
```

### Test Commands

#### All Tests
```bash
npm run test:e2e
```

#### Interactive UI
```bash
npm run test:e2e:ui
```
Opens Playwright UI for test selection and debugging.

#### Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

#### Debug Mode
```bash
npm run test:e2e:debug
```
Opens Playwright Inspector for step-by-step debugging.

#### Specific Test Suite
```bash
# Run specific test file
npx playwright test e2e/reconciliation-features.spec.ts

# Run specific test
npx playwright test e2e/reconciliation-features.spec.ts -g "should upload file"
```

#### Single Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Test Suites

Located in `frontend/e2e/`:

1. **comprehensive-diagnostic.spec.ts** - All pages and routes
2. **reconciliation-features.spec.ts** - Reconciliation features
3. **reconciliation-workflows.spec.ts** - Complete workflows
4. **auth-flow-e2e.spec.ts** - Authentication flows
5. **accessibility.spec.ts** - Accessibility compliance
6. **performance.spec.ts** - Performance testing
7. **visual.spec.ts** - Visual regression

See [frontend/e2e/README.md](../../frontend/e2e/README.md) for details.

### Configuration

Playwright config: `playwright.config.ts`

Key settings:
- Base URL: `http://localhost:1000` (or `PLAYWRIGHT_BASE_URL`)
- Timeout: 60s per test
- Retries: 1 locally, 2 on CI
- Browsers: Chromium, Firefox, WebKit, Mobile

### Common Issues

**Browsers not installed:**
```bash
npx playwright install
```

**Backend not running:**
```bash
# Tests will gracefully degrade, but for full tests:
docker-compose up -d backend
# Or
cd backend && cargo run
```

**Frontend not running:**
```bash
# Tests expect frontend on http://localhost:1000
# If using Docker:
docker-compose up -d frontend

# Or manually:
cd frontend && npm run dev -- --port 1000
```

**Port conflicts:**
```bash
# Check what's using port 1000
lsof -ti:1000

# Kill if needed
lsof -ti:1000 | xargs kill -9
```

---

## Comprehensive Testing

### Run All Tests

From project root:
```bash
./scripts/test.sh
```

This script:
- ✅ Runs backend unit tests
- ✅ Runs backend integration tests
- ✅ Runs frontend tests
- ✅ Runs E2E tests
- ✅ Generates summary report

### Test Results

Results are saved to:
- `reports/test-backend.log` - Backend test output
- `reports/test-frontend.log` - Frontend test output
- `reports/test-e2e.log` - E2E test output
- `test-results/` - Playwright test results

---

## Test Coverage

### Backend Coverage
```bash
cd backend
cargo install cargo-tarpaulin
cargo tarpaulin --out Html
```
Report: `tarpaulin-report.html`

### Frontend Coverage
```bash
cd frontend
npm run test:coverage
```
Report: `frontend/coverage/index.html`

### Coverage Targets
- **Backend**: 70% minimum (enforced in CI)
- **Frontend**: 60-80% for critical paths

---

## CI/CD Testing

Tests run automatically on:
- Every push to any branch
- Every pull request
- Scheduled nightly runs

See `.github/workflows/` for CI configuration.

---

## Troubleshooting

### Backend Tests Failing

1. **Check prerequisites:**
   ```bash
   cargo --version
   pg_isready -h localhost -p 5432
   redis-cli ping
   ```

2. **Check test database:**
   ```bash
   # Create test database if needed
   createdb -h localhost -U postgres reconciliation_test
   ```

3. **Run with verbose output:**
   ```bash
   cargo test -- --nocapture
   ```

### Frontend Tests Failing

1. **Clear cache:**
   ```bash
   cd frontend
   rm -rf node_modules/.vite
   npm run cache:clean
   ```

2. **Reinstall dependencies:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check test utilities:**
   ```bash
   # Ensure testUtils.tsx exists
   ls frontend/src/utils/testUtils.tsx
   ```

### E2E Tests Failing

1. **Check services:**
   ```bash
   curl http://localhost:1000  # Frontend
   curl http://localhost:2000/health  # Backend
   ```

2. **Reinstall browsers:**
   ```bash
   npx playwright install --force
   ```

3. **Run in headed mode to see what's happening:**
   ```bash
   npm run test:e2e:headed
   ```

4. **Check Playwright config:**
   ```bash
   # Verify base URL matches your setup
   cat playwright.config.ts | grep baseURL
   ```

---

## Quick Commands Cheat Sheet

```bash
# Backend
cd backend && cargo test

# Frontend
cd frontend && npm test

# E2E
npm run test:e2e

# All
./scripts/test.sh

# Coverage
cd backend && cargo tarpaulin
cd frontend && npm run test:coverage
```

---

## Related Documentation

- [Test Utilities Guide](./TEST_UTILITIES_GUIDE.md) - Test helper functions
- [Test Templates Guide](./TEST_TEMPLATES_GUIDE.md) - Test templates
- [Testing Status](./TESTING_STATUS.md) - Current test coverage status
- [E2E Testing Setup](../../frontend/e2e/README.md) - E2E test details

---

## Need Help?

If tests are failing:
1. Check prerequisites are installed
2. Ensure services are running
3. Review error messages carefully
4. Try running tests individually
5. Check related documentation

For persistent issues, check:
- Test logs in `reports/`
- Playwright reports in `test-results/html-report/`
- Backend logs if using Docker





