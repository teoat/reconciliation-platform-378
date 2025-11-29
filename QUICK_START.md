# Quick Start: Run All Critical Flow Tests

## 🚀 Simplest Method (Recommended)

### Step 1: Start Backend (Terminal 1)

```bash
cd backend
cargo run
```

**Wait for:** `Server running on http://0.0.0.0:2000`

⏳ **First run takes 1-2 minutes** (compilation)

### Step 2: Run Tests (Terminal 2)

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378
export API_BASE_URL=http://localhost:2000
npx playwright test e2e/critical-flows.spec.ts --project=chromium
```

## 📋 Alternative: Use Scripts

### Option A: Simple Script (backend must be running)

```bash
./scripts/quick-start-tests.sh
```

### Option B: Auto-start Script (tries to start backend)

```bash
./scripts/run-all-tests-quick-start.sh
```

## ✅ What Gets Tested

- **Authentication**: Register → Login → Token Refresh → Logout
- **Ingestion**: File Upload → Validation → Processing
- **Reconciliation**: Job Creation → Matching → Results
- **End-to-End**: Complete workflow from auth to reconciliation

## 🔍 Troubleshooting

### Backend Not Starting?

```bash
# Check logs
tail -f /tmp/backend-test.log

# Check if database is running
psql -h localhost -U postgres -d reconciliation_app -c "SELECT 1;"

# Check if port is in use
lsof -i :2000
```

### Tests Failing?

```bash
# Verify backend is running
curl http://localhost:2000/api/health

# Check backend logs
tail -f /tmp/backend-test.log
```

### View Test Results

```bash
# HTML report
npx playwright show-report

# Or check test-results directory
ls -la test-results/
```

## 💡 Tips

- **See browser**: Add `--headed` flag
- **Interactive**: Add `--ui` flag
- **Debug**: Add `--debug` flag
- **Specific test**: Add `-g "Authentication"` to filter

## 📊 Test Commands

```bash
# All tests
npx playwright test e2e/critical-flows.spec.ts --project=chromium

# Only authentication
npx playwright test e2e/critical-flows.spec.ts -g "Authentication"

# Only ingestion
npx playwright test e2e/critical-flows.spec.ts -g "Ingestion"

# Only reconciliation
npx playwright test e2e/critical-flows.spec.ts -g "Reconciliation"

# With UI (interactive)
npx playwright test e2e/critical-flows.spec.ts --ui

# Headed mode (see browser)
npx playwright test e2e/critical-flows.spec.ts --headed
```

