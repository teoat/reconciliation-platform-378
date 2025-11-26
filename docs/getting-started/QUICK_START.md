# Quick Start - Restart Services

## ✅ All Code Fixes Applied

- ✅ Backend CORS middleware added and compiles
- ✅ Frontend API path fixed (removed double `/api/v1`)
- ✅ Google OAuth method added to API client

## 🚀 Restart Instructions

### Step 1: Restart Backend

**In a new terminal window:**

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/backend

# If backend is running, find and stop it:
# Option A: Find the process
ps aux | grep "cargo run" | grep -v grep

# Option B: Kill by port (if needed)
# lsof -ti :2000 | xargs kill -9

# Start backend
cargo run
```

**Wait for these messages:**
- `🚀 Backend starting...`
- `Server running on http://0.0.0.0:2000`

### Step 2: Restart Frontend

**In another new terminal window:**

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/frontend

# If frontend is running, find and stop it:
# Option A: Find the process
ps aux | grep "vite\|npm.*dev" | grep -v grep

# Option B: Kill by port (if needed)
# lsof -ti :1000 | xargs kill -9

# Clear Vite cache (important!)
rm -rf node_modules/.vite dist

# Start frontend
npm run dev
```

**Wait for:**
- `Local: http://localhost:1000/`

### Step 3: Verify Everything Works

**Test Backend:**
```bash
# Health check
curl http://localhost:2000/api/health

# Should return: {"status":"ok"} or similar
```

**Test Login Endpoint:**
```bash
curl -X POST http://localhost:2000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  -v
```

**Test in Browser:**
1. Open: `http://localhost:1000/login`
2. Open DevTools (F12) → Network tab
3. Try to login with: `admin@example.com` / `password123`
4. Check:
   - ✅ Request URL should be: `http://localhost:2000/api/auth/login`
   - ✅ NO double path like `/api/v1/api/v1/auth/login`
   - ✅ NO CORS errors in console
   - ✅ Response received (even if 401/422, endpoint should be reachable)

### Step 4: Run Playwright Test

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/frontend
npx playwright test e2e/auth-diagnostic.spec.ts --reporter=list
```

## 🔧 Troubleshooting

### Backend won't start
- Check if port 2000 is in use: `lsof -i :2000`
- Check database is running (if using Docker: `docker ps`)
- Check `.env` file has `DATABASE_URL`

### Frontend still shows old API path
- Clear browser cache: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Verify Vite cache was cleared: `ls node_modules/.vite` (should be empty or not exist)
- Check browser console for errors

### CORS errors persist
- Verify backend was restarted with new code
- Check backend logs for CORS middleware initialization
- Verify frontend is on `http://localhost:1000` (not `http://127.0.0.1:1000`)

### Backend 500 error
- Check backend logs for detailed error message
- Verify database connection
- Check environment variables in `.env` file

