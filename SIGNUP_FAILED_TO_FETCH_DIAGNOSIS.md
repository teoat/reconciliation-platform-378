# Comprehensive Signup "Failed to Fetch" Diagnosis

**Date**: November 20, 2025  
**Status**: 🔴 **CRITICAL ISSUES FOUND**

## Executive Summary

The signup "failed to fetch" error is caused by **TWO critical issues**:

1. **Backend Stack Overflow Crash** - Backend crashes with stack overflow when handling requests
2. **Frontend Running in Production Mode** - Frontend is using nginx (production), not Vite dev server, so proxy doesn't work

---

## Issue #1: Backend Stack Overflow Crash 🔴

### Problem
Backend crashes with stack overflow when starting:
```
thread 'actix-rt|system:0|arbiter:2' has overflowed its stack
fatal runtime error: stack overflow, aborting
```

### Root Cause
The backend starts successfully but crashes when handling requests, likely due to:
- Infinite recursion in middleware or handlers
- Deep call stack in request processing
- Memory issue in Actix runtime

### Evidence
- Backend health endpoint works: `curl http://localhost:2000/api/health` ✅
- Register endpoint returns empty reply: `curl -X POST http://localhost:2000/api/auth/register` ❌
- Backend logs show stack overflow error

### Solution
1. **Immediate Fix**: Restart backend with increased stack size
2. **Long-term Fix**: Investigate and fix the stack overflow in the code

---

## Issue #2: Frontend Running in Production Mode 🔴

### Problem
Frontend is running in **production mode with nginx**, not the Vite dev server:
- Frontend returns nginx 405 errors
- Vite proxy (`/api` → `http://localhost:2000`) is NOT active
- Frontend serves built HTML, not dev server

### Evidence
```bash
curl http://localhost:1000/api/auth/register
# Returns: <html><head><title>405 Not Allowed</title></head>...nginx/1.27.5
```

### Solution
**Start the Vite dev server instead of production build:**

```bash
cd frontend
npm run dev
# Should start on http://localhost:1000 with Vite proxy active
```

---

## Current Status

### ✅ Working
- Backend compiles successfully
- Backend starts and listens on port 2000
- Backend health endpoint responds
- Environment variables configured (.env file)
- PostgreSQL database running

### ❌ Not Working
- Backend crashes on register requests (stack overflow)
- Frontend proxy not active (production mode)
- Signup requests fail with "failed to fetch"

---

## Step-by-Step Fix

### Step 1: Fix Backend Stack Overflow

**Option A: Increase Stack Size (Quick Fix)**
```bash
cd backend
RUST_MIN_STACK=8388608 cargo run
# Or set in .env: RUST_MIN_STACK=8388608
```

**Option B: Investigate Root Cause**
- Check middleware for infinite recursion
- Review error handler middleware
- Check request processing chain

### Step 2: Start Frontend Dev Server

```bash
cd frontend
# Stop any production server
pkill -f nginx
pkill -f "node.*1000"

# Start Vite dev server
npm run dev
```

### Step 3: Verify Setup

```bash
# 1. Check backend
curl http://localhost:2000/api/health
# Should return: {"success":true,"data":{"status":"healthy"...}}

# 2. Check frontend proxy
curl http://localhost:1000/api/health
# Should proxy to backend and return same response

# 3. Test signup
curl -X POST http://localhost:1000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","first_name":"Test","last_name":"User"}'
```

---

## Configuration Files

### Backend `.env` (✅ Created)
```bash
DATABASE_URL=postgresql://reconciliation_user:reconciliation_pass@localhost:5432/reconciliation_app
JWT_SECRET=development_jwt_secret_key_change_in_production_32_chars_minimum_length_for_security
JWT_REFRESH_SECRET=development_jwt_refresh_secret_key_change_in_production_32_chars_minimum_length_for_security
```

### Frontend API Client (✅ Fixed)
- Uses `/api` in development (Vite proxy)
- Fixed in `frontend/src/services/apiClient/utils.ts`

### Vite Proxy (✅ Configured)
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:2000',
    changeOrigin: true,
    secure: false,
  }
}
```

---

## Next Actions

1. **URGENT**: Fix backend stack overflow
   - Increase stack size OR
   - Fix infinite recursion in code

2. **URGENT**: Start frontend dev server
   - Stop production server
   - Run `npm run dev` in frontend directory

3. **TEST**: Verify signup works end-to-end

4. **MONITOR**: Check backend logs for errors

---

## Related Files

- `backend/start_backend.sh` - Backend startup script (created)
- `backend/.env` - Environment variables (created)
- `frontend/src/services/apiClient/utils.ts` - API client config (fixed)
- `frontend/vite.config.ts` - Vite proxy config (verified)

---

## Notes

- Backend binary exists: `backend/target/debug/reconciliation-backend`
- Backend process running but crashing on requests
- Frontend needs Vite dev server for proxy to work
- Production frontend (nginx) doesn't have proxy configured

