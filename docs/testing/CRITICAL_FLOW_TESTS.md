# Critical Flow Tests

**Last Updated**: January 2025  
**Status**: Active  
**Purpose**: Comprehensive end-to-end tests for critical user flows

---

## Overview

Critical flow tests ensure that the most important user journeys work correctly end-to-end. These tests cover:

1. **Authentication**: Complete auth lifecycle (register, login, token refresh, logout)
2. **Ingestion**: File upload, validation, processing, and data transformation
3. **Reconciliation**: Job creation, matching, processing, and results retrieval

---

## Test Files

### E2E Tests (Playwright)

**Location**: `e2e/critical-flows.spec.ts`

Comprehensive end-to-end tests using Playwright that test the full user journey through the web interface and API.

**Test Suites**:
- `Authentication Critical Flows`: Register, login, token refresh, logout, error handling, rate limiting
- `Ingestion Critical Flows`: File upload, validation, processing, error handling
- `Reconciliation Critical Flows`: Job creation, matching, processing, stopping jobs
- `End-to-End Critical Flow`: Complete workflow from auth → ingestion → reconciliation

### Backend Integration Tests (Rust)

**Location**: `backend/tests/critical_flow_tests.rs`

Integration tests that verify the backend services and business logic work correctly.

**Test Modules**:
- `auth_critical_flows`: Authentication service tests
- `ingestion_critical_flows`: File upload and processing tests
- `reconciliation_critical_flows`: Reconciliation job lifecycle tests
- `e2e_critical_flow`: Complete workflow integration test

---

## Running the Tests

### E2E Tests (Playwright)

```bash
# Run all critical flow tests
npx playwright test e2e/critical-flows.spec.ts

# Run specific test suite
npx playwright test e2e/critical-flows.spec.ts -g "Authentication Critical Flows"

# Run in headed mode (see browser)
npx playwright test e2e/critical-flows.spec.ts --headed

# Run with debug output
npx playwright test e2e/critical-flows.spec.ts --debug
```

### Backend Integration Tests (Rust)

```bash
# Run all critical flow tests
cd backend
cargo test critical_flow_tests

# Run specific test module
cargo test auth_critical_flows
cargo test ingestion_critical_flows
cargo test reconciliation_critical_flows

# Run with output
cargo test critical_flow_tests -- --nocapture
```

---

## Test Coverage

### Authentication Flows

✅ **User Registration**
- Create new user account
- Validate user data
- Return authentication token

✅ **User Login**
- Authenticate with email/password
- Receive access token
- Handle invalid credentials

✅ **Token Management**
- Validate JWT tokens
- Refresh expired tokens
- Handle token expiration

✅ **User Logout**
- Invalidate tokens
- Prevent further API access

✅ **Error Handling**
- Invalid credentials
- Invalid tokens
- Rate limiting

### Ingestion Flows

✅ **File Upload**
- Upload CSV/Excel/JSON files
- Validate file types
- Validate file sizes
- Store file metadata

✅ **File Processing**
- Parse file contents
- Validate data structure
- Transform data format
- Store processed data

✅ **Error Handling**
- Invalid file types
- Files too large
- Malformed data
- Processing failures

### Reconciliation Flows

✅ **Job Creation**
- Create reconciliation job
- Configure matching rules
- Set confidence thresholds
- Link data sources

✅ **Job Processing**
- Start reconciliation job
- Process matching algorithms
- Calculate confidence scores
- Generate match results

✅ **Results Retrieval**
- Get job status
- Retrieve match results
- Filter and paginate results
- Export results

✅ **Error Handling**
- Invalid data sources
- Missing required fields
- Job cancellation
- Processing failures

---

## Test Data

### Authentication Test Data

- **Valid User**: `test-{timestamp}@example.com` / `TestPassword123!`
- **Invalid Credentials**: Various invalid email/password combinations

### Ingestion Test Data

**Sample CSV**:
```csv
id,name,amount,date
1,Test Item 1,100.50,2024-01-01
2,Test Item 2,200.75,2024-01-02
3,Test Item 3,300.25,2024-01-03
```

### Reconciliation Test Data

**Matching Rules**:
- Exact matching on `id` field
- Exact matching on `amount` field
- Confidence threshold: 0.75

---

## Prerequisites

### E2E Tests

- Node.js 18+
- Playwright installed (`npx playwright install`)
- Backend server running on `http://localhost:2000`
- Test database configured

### Backend Tests

- Rust 1.70+
- PostgreSQL running
- Test database: `reconciliation_test`
- Redis (optional, for caching tests)

---

## Environment Setup

### E2E Tests

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Set environment variables
export VITE_API_URL=http://localhost:2000/api
export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reconciliation_test
```

### Backend Tests

```bash
# Set test database URL
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reconciliation_test

# Run migrations
cd backend
diesel migration run
```

---

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Critical Flow Tests
  run: |
    npx playwright test e2e/critical-flows.spec.ts
    cd backend && cargo test critical_flow_tests
```

---

## Troubleshooting

### E2E Tests Fail

1. **Check backend is running**: `curl http://localhost:2000/health`
2. **Check database connection**: Verify `TEST_DATABASE_URL` is correct
3. **Check Playwright installation**: `npx playwright install --force`
4. **Check browser compatibility**: Tests require Chromium, Firefox, or WebKit

### Backend Tests Fail

1. **Check database**: Ensure PostgreSQL is running and accessible
2. **Check migrations**: Run `diesel migration run` in backend directory
3. **Check test database**: Ensure `reconciliation_test` database exists
4. **Check dependencies**: Run `cargo build` to verify dependencies

### Common Issues

- **Timeout errors**: Increase timeout in test configuration
- **Database connection errors**: Verify database URL and credentials
- **Token validation errors**: Check JWT secret configuration
- **File upload errors**: Verify file size limits and upload path

---

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Tests should clean up created data (users, projects, files)
3. **Idempotency**: Tests should be able to run multiple times safely
4. **Error Scenarios**: Test both success and failure paths
5. **Performance**: Tests should complete within reasonable time limits

---

## Related Documentation

- [Testing Guide](../testing/TESTING_GUIDE.md)
- [API Reference](../api/API_REFERENCE.md)
- [Authentication Flow](../security/AUTHENTICATION_AUDIT.md)
- [Reconciliation Guide](../features/RECONCILIATION_GUIDE.md)

---

## Maintenance

### Adding New Tests

1. Follow existing test patterns
2. Use descriptive test names
3. Include both success and error scenarios
4. Update this documentation

### Updating Tests

1. Keep tests in sync with API changes
2. Update test data when schemas change
3. Verify tests still pass after updates
4. Update documentation

---

## Status

✅ **Authentication Flows**: Complete  
✅ **Ingestion Flows**: Complete  
✅ **Reconciliation Flows**: Complete  
✅ **E2E Integration**: Complete

All critical flows are covered by comprehensive tests.

