# 🚀 Start Both Services - Complete Guide

## Current Status

- ✅ **Frontend**: Running on `http://localhost:1000`
- ⏳ **Backend**: Starting... (or needs to be started manually)

## The Problem

The "failed to fetch" error happens because the **backend is not running**. The frontend tries to make API requests, but there's no backend server to handle them.

## Solution: Start Backend

### Option 1: I Started It For You (Background)

I've started the backend in the background. Wait 10-15 seconds, then test:

```bash
# Check if backend is running
curl http://localhost:2000/health
```

If it returns JSON, the backend is running! ✅

### Option 2: Start Manually (Recommended)

**Open a NEW terminal window** and run:

```bash
cd backend
cargo run
```

**Wait for this message:**
```
Listening on http://0.0.0.0:2000
```

**Keep this terminal open** - the backend needs to keep running.

## After Backend Starts

### Test User Creation

1. **Go to**: `http://localhost:1000/login`
2. **Press F12** → Console tab
3. **Paste this code**:

```javascript
const users = [
  { email: 'admin@example.com', password: 'AdminPassword123!', first_name: 'Admin', last_name: 'User', role: 'admin' },
  { email: 'manager@example.com', password: 'ManagerPassword123!', first_name: 'Manager', last_name: 'User', role: 'manager' },
  { email: 'user@example.com', password: 'UserPassword123!', first_name: 'Demo', last_name: 'User', role: 'user' }
];

users.forEach(async (user, index) => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    const data = await response.json();
    if (response.ok || response.status === 201) {
      console.log(`✅ [${index + 1}/3] Created: ${user.email}`);
    } else if (response.status === 409 || data.message?.includes('already exists')) {
      console.log(`ℹ️  [${index + 1}/3] Already exists: ${user.email}`);
    } else {
      console.log(`❌ [${index + 1}/3] Failed: ${user.email} -`, data);
    }
  } catch (error) {
    console.log(`❌ [${index + 1}/3] Error: ${user.email} - ${error.message}`);
  }
  await new Promise(r => setTimeout(r, 500));
});
```

4. **Press Enter**
5. **Should work now!** ✅

## Quick Status Check

```bash
# Check frontend
lsof -ti:1000 && echo "✅ Frontend running" || echo "❌ Frontend NOT running"

# Check backend
lsof -ti:2000 && echo "✅ Backend running" || echo "❌ Backend NOT running"

# Test backend health
curl http://localhost:2000/health
```

## What You Need

**Two terminals running:**

1. **Terminal 1 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   Should show: `VITE ready in XXX ms`

2. **Terminal 2 - Backend:**
   ```bash
   cd backend
   cargo run
   ```
   Should show: `Listening on http://0.0.0.0:2000`

## Troubleshooting

**Backend won't start?**
- Check for compilation errors in terminal
- Make sure database is running (if required)
- Check `backend/.env` file exists
- Try: `cd backend && cargo build` to see errors

**Backend starts but crashes?**
- Check backend terminal for error messages
- Verify database connection
- Check backend logs

**Still getting "failed to fetch"?**
- Make sure BOTH services are running
- Wait 10 seconds after starting backend
- Check browser console for specific errors
- Check network tab in DevTools

## Success!

Once both are running:
- ✅ Frontend: `http://localhost:1000`
- ✅ Backend: `http://localhost:2000`
- ✅ User creation should work!
- ✅ Registration form should work!
- ✅ Demo credentials will appear after creating users!

