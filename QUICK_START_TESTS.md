# Quick Start: Running Critical Flow Tests

## Step 1: Start the Backend

Open a terminal and run:

```bash
cd backend
cargo run
```

Wait until you see the backend is running (usually shows "Server running on http://0.0.0.0:2000" or similar).

**Keep this terminal open!**

## Step 2: Run the Tests

Open a **new terminal** and run:

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378

# Set the API URL
export API_BASE_URL=http://localhost:2000

# Run the tests
npx playwright test e2e/critical-flows.spec.ts --project=chromium
```

## Alternative: Use the Script

```bash
./scripts/run-critical-flow-tests.sh
```

## What to Expect

The tests will:
1. ✅ Test authentication flows (register, login, refresh, logout)
2. ✅ Test ingestion flows (file upload, processing)
3. ✅ Test reconciliation flows (job creation, processing)
4. ✅ Test complete end-to-end workflow

## Troubleshooting

**Backend not running?**
```bash
# Check if backend is running
curl http://localhost:2000/api/health

# If not, start it:
cd backend && cargo run
```

**Tests failing?**
- Make sure backend is running on port 2000
- Check backend logs for errors
- Verify database is running (PostgreSQL)

**Want to see the browser?**
```bash
npx playwright test e2e/critical-flows.spec.ts --project=chromium --headed
```

**Want interactive debugging?**
```bash
npx playwright test e2e/critical-flows.spec.ts --ui
```

