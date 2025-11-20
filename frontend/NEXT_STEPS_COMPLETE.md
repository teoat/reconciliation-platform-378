# Next Steps - Complete Guide

**Date**: 2025-01-27  
**Status**: Ready to Execute

## Step 1: Start Backend Server ✅

The backend needs to be running for authentication to work.

### Option A: Using Start Script (Recommended)

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378
./start-backend.sh
```

### Option B: Manual Start

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/backend

# Set environment variables
export DATABASE_URL=postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app
export REDIS_URL=redis://localhost:6379
export JWT_SECRET=dev-secret-key-change-in-production
export PORT=2000
export HOST=0.0.0.0
export RUST_LOG=info

# Start backend
cargo run
```

**Wait for**: `✅ Server bound successfully to 0.0.0.0:2000`

## Step 2: Verify Backend is Running ✅

In a **new terminal**, run:

```bash
# Check if backend is accessible
curl http://localhost:2000/api/health

# Should return: {"status":"ok"} or similar JSON
```

**Expected Output**:
```json
{"status":"ok","timestamp":"2025-01-27T..."}
```

## Step 3: Ensure Frontend is Running ✅

In another terminal:

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/frontend

# Check if frontend is running
lsof -ti:1000 && echo "✅ Frontend running" || echo "❌ Start frontend: npm run dev"
```

If not running:
```bash
npm run dev
```

**Wait for**: `Local: http://localhost:1000/`

## Step 4: Seed Demo Users (If Needed) ✅

If demo users don't exist in the database:

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/frontend
npm run seed-demo-users
```

**Expected Output**:
```
✅ Admin user created
✅ Manager user created
✅ User created
```

## Step 5: Run E2E Tests ✅

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/frontend
npx playwright test e2e/auth-flow-e2e.spec.ts --reporter=list
```

**Expected**: Most tests should pass (except those requiring specific backend state)

## Step 6: Manual Testing Checklist ✅

### Test 1: Login Page Loads
1. Open: `http://localhost:1000/login`
2. ✅ Page loads without errors
3. ✅ Email and password fields are visible
4. ✅ "Sign In" button is visible
5. ✅ "Sign up" link is visible

### Test 2: Email Validation
1. Click in email field
2. Type: `notanemail` (invalid)
3. Click outside field (blur)
4. ✅ Error message appears: "Invalid email address"

### Test 3: Password Visibility Toggle
1. Type password in password field
2. Click eye icon
3. ✅ Password becomes visible (type changes to "text")
4. Click eye icon again
5. ✅ Password becomes hidden (type changes to "password")

### Test 4: Login with Valid Credentials
1. Enter: `admin@example.com` / `AdminPassword123!`
2. Click "Sign In"
3. ✅ Should redirect to dashboard
4. ✅ No error messages

### Test 5: Login with Invalid Credentials
1. Enter: `invalid@example.com` / `wrongpassword`
2. Click "Sign In"
3. ✅ Error message appears: "Invalid credentials" or similar
4. ✅ Still on login page

### Test 6: Error Message Display
1. Try login with wrong credentials
2. ✅ Red error box appears at top of form
3. ✅ Error message is readable
4. ✅ AlertCircle icon is visible

### Test 7: Registration Form
1. Click "Sign up" link
2. ✅ Form switches to registration
3. ✅ First name, last name, email, password, confirm password fields visible
4. ✅ "Create Account" button visible

### Test 8: Password Strength Indicator
1. In registration form, click password field
2. Type: `weak` (weak password)
3. ✅ Password strength indicator appears
4. ✅ Shows "WEAK" or similar
5. ✅ Shows checklist of requirements

### Test 9: Password Confirmation Match
1. In registration form
2. Enter password: `Password123!`
3. Enter confirm password: `Different123!`
4. Click "Create Account"
5. ✅ Error appears: "Passwords don't match"

### Test 10: Network Error Handling
1. Stop backend server (Ctrl+C)
2. Try to login
3. ✅ Error message appears: "Unable to connect to server" or similar
4. ✅ User-friendly error message (not technical)

## Step 7: Monitor for Issues ✅

### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. ✅ No red errors
4. ✅ No network errors (when backend is running)

### Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try to login
4. ✅ Request to `/api/auth/login` succeeds (200) or fails gracefully (401/500)
5. ✅ No CORS errors
6. ✅ Response received (even if error)

### Check Application Tab
1. Open DevTools (F12)
2. Go to Application tab → Local Storage
3. After successful login:
   - ✅ `authToken` is stored
   - ✅ Token is a valid JWT string

## Troubleshooting

### Backend Won't Start

**Check Database**:
```bash
# Check if PostgreSQL is running
psql -U postgres -d reconciliation_app -c "SELECT 1;" || echo "Database not accessible"
```

**Check Port**:
```bash
# Check if port 2000 is in use
lsof -ti:2000 && echo "Port 2000 in use" || echo "Port 2000 available"
```

**Kill Process on Port** (if needed):
```bash
lsof -ti:2000 | xargs kill -9
```

### Frontend Won't Start

**Clear Cache**:
```bash
cd frontend
rm -rf node_modules/.vite dist
npm run dev
```

### Tests Fail

**Check Backend is Running**:
```bash
curl http://localhost:2000/api/health
```

**Check Frontend is Running**:
```bash
curl http://localhost:1000
```

**Run Tests with Debug**:
```bash
npx playwright test e2e/auth-flow-e2e.spec.ts --debug
```

## Success Criteria

✅ Backend running on port 2000  
✅ Frontend running on port 1000  
✅ Health check returns OK  
✅ Login page loads correctly  
✅ All form validations work  
✅ Error messages display properly  
✅ Password features work (toggle, strength)  
✅ E2E tests pass (with backend running)

## Quick Command Reference

```bash
# Start backend
cd backend && cargo run

# Start frontend
cd frontend && npm run dev

# Check backend health
curl http://localhost:2000/api/health

# Run E2E tests
cd frontend && npx playwright test e2e/auth-flow-e2e.spec.ts

# Seed demo users
cd frontend && npm run seed-demo-users
```

---

**Ready to proceed?** Follow steps 1-7 above!

