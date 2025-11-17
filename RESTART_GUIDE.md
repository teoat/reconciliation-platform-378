# Restart Guide - Apply Authentication Fixes

## Current Status
- ✅ Backend is running on port 2000 (needs restart to apply CORS fix)
- ✅ Frontend is running on port 1000 (needs restart to apply API path fix)
- ✅ All code changes are complete and compiled

## Quick Restart (Automated)

I've created helper scripts for you. You have two options:

### Option 1: Use Helper Scripts (Easiest)

**Terminal 1 - Restart Backend:**
```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378
./restart-backend.sh
```

**Terminal 2 - Restart Frontend:**
```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378
./restart-frontend.sh
```

### Option 2: Manual Restart (More Control)

**Terminal 1 - Backend:**
```bash
# Stop current backend
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/backend
lsof -ti :2000 | xargs kill -9

# Start backend
cargo run
```

**Terminal 2 - Frontend:**
```bash
# Stop current frontend
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/frontend
lsof -ti :1000 | xargs kill -9

# Clear cache and start
rm -rf node_modules/.vite dist
npm run dev
```

## What to Look For

### Backend Success Indicators:
- ✅ `🚀 Backend starting...`
- ✅ `Server running on http://0.0.0.0:2000`
- ✅ No compilation errors

### Frontend Success Indicators:
- ✅ `Local: http://localhost:1000/`
- ✅ No build errors
- ✅ Vite dev server started

## Verification Steps

### 1. Test Backend Health
```bash
curl http://localhost:2000/api/health
```
Expected: JSON response with status

### 2. Test Login Endpoint
```bash
curl -X POST http://localhost:2000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  -v
```
Expected: Response (401/422 is OK, 404 means endpoint not found)

### 3. Test in Browser
1. Open: `http://localhost:1000/login`
2. Open DevTools (F12) → Network tab
3. Try to login: `admin@example.com` / `password123`
4. Check Network tab:
   - ✅ URL: `http://localhost:2000/api/auth/login` (NOT `/api/v1/api/v1/auth/login`)
   - ✅ Status: Should be 200, 401, or 422 (NOT 404)
   - ✅ No CORS errors in console

### 4. Run Playwright Test
```bash
cd frontend
npx playwright test e2e/auth-diagnostic.spec.ts --reporter=list
```

## Troubleshooting

### "Port already in use" error
- The kill command might not have worked
- Try: `lsof -ti :2000` to see if process still exists
- Force kill: `kill -9 $(lsof -ti :2000)`

### Backend won't compile
- Make sure you're in the backend directory
- Try: `cargo clean && cargo build`

### Frontend shows old API path
- Make sure Vite cache was cleared: `rm -rf node_modules/.vite dist`
- Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Check browser console for errors

### Still seeing CORS errors
- Verify backend was restarted (check logs for "Backend starting")
- Check browser Network tab → Response Headers → should see `Access-Control-Allow-Origin`
- Try clearing browser cache completely

