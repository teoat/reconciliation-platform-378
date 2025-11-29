# How to Run Critical Flow Tests

**Quick Start Guide**

## Prerequisites

1. **Backend Running**: The tests require the backend API to be running
   ```bash
   cd backend
   cargo run
   # Backend should be on http://localhost:2000
   ```

2. **Playwright Installed**: 
   ```bash
   npx playwright install chromium
   ```

## Quick Run

### Option 1: Using the Script (Recommended)

```bash
./scripts/run-critical-flow-tests.sh
```

### Option 2: Direct Playwright Command

```bash
# Set API base URL
export API_BASE_URL=http://localhost:2000

# Run tests
npx playwright test e2e/critical-flows.spec.ts --project=chromium
```

### Option 3: With UI Mode

```bash
npx playwright test e2e/critical-flows.spec.ts --ui
```

## Test Structure

The tests are organized into three main suites:

1. **Authentication Critical Flows**
   - Full auth flow (register → login → refresh → logout)
   - Error handling
   - Rate limiting

2. **Ingestion Critical Flows**
   - File upload
   - File processing
   - Error handling

3. **Reconciliation Critical Flows**
   - Job creation
   - Job processing
   - Results retrieval

## Troubleshooting

### Backend Not Running

```bash
# Check if backend is running
curl http://localhost:2000/api/health

# If not, start it:
cd backend && cargo run
```

### Playwright Browsers Not Installed

```bash
npx playwright install chromium
```

### Tests Failing

1. Check backend logs
2. Verify database is running
3. Check API endpoints are accessible
4. Review test output for specific errors

## Environment Variables

- `API_BASE_URL`: Backend API URL (default: `http://localhost:2000`)
- `PLAYWRIGHT_BASE_URL`: Frontend URL (default: `http://localhost:1000`)

## Running Specific Tests

```bash
# Run only authentication tests
npx playwright test e2e/critical-flows.spec.ts -g "Authentication"

# Run only ingestion tests
npx playwright test e2e/critical-flows.spec.ts -g "Ingestion"

# Run only reconciliation tests
npx playwright test e2e/critical-flows.spec.ts -g "Reconciliation"
```

## Debug Mode

```bash
# Run in debug mode (step through tests)
npx playwright test e2e/critical-flows.spec.ts --debug

# Run in headed mode (see browser)
npx playwright test e2e/critical-flows.spec.ts --headed
```

## Viewing Results

After tests complete, view the HTML report:

```bash
npx playwright show-report
```

