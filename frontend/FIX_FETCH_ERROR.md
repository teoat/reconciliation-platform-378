# Fix: "Failed to Fetch" Error

## Problem

You're getting "failed to fetch" errors when trying to create users. This is because:

1. **Direct backend requests** are being blocked by CORS
2. **Frontend should use Vite proxy** instead of direct backend URLs

## Solution

I've fixed the scripts to use relative URLs that leverage the Vite proxy. Here's what changed:

### ✅ Fixed Files

1. **`scripts/create-users-now.html`** - Now uses `/api/auth/register` (relative URL)
2. **`create-demo-users.js`** - Now uses `/api/auth/register` (relative URL)

### How Vite Proxy Works

The frontend runs on `http://localhost:1000` and Vite proxies `/api/*` requests to `http://localhost:2000/api/*`.

**Before (Wrong):**
```javascript
fetch('http://localhost:2000/api/auth/register', ...)  // ❌ Direct backend - CORS issues
```

**After (Correct):**
```javascript
fetch('/api/auth/register', ...)  // ✅ Uses Vite proxy - no CORS issues
```

## How to Use

### Method 1: HTML Page (Fixed)

1. **Open**: `http://localhost:1000/login` in your browser
2. **Open the HTML file** in a new tab:
   - File → Open → `frontend/scripts/create-users-now.html`
   - OR navigate to: `file:///path/to/frontend/scripts/create-users-now.html`
3. **Click "Create All Demo Users"**
4. **It should work now!** ✅

### Method 2: Browser Console (Fixed)

1. **Go to**: `http://localhost:1000/login` in your browser
2. **Press F12** → Console tab
3. **Copy and paste** the updated code from `create-demo-users.js`:

```javascript
const users = [
  { email: 'admin@example.com', password: 'AdminPassword123!', first_name: 'Admin', last_name: 'User', role: 'admin' },
  { email: 'manager@example.com', password: 'ManagerPassword123!', first_name: 'Manager', last_name: 'User', role: 'manager' },
  { email: 'user@example.com', password: 'UserPassword123!', first_name: 'Demo', last_name: 'User', role: 'user' }
];

users.forEach(async (user, index) => {
  try {
    // Use relative URL to leverage Vite proxy
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
    console.log(`❌ [${index + 1}/3] Error: ${user.email} -`, error.message);
  }
  await new Promise(r => setTimeout(r, 500));
});
```

4. **Press Enter** - should work now! ✅

### Method 3: Registration Form

The registration form should already work because it uses the API client which is configured correctly. If it's still failing:

1. **Check browser console** (F12) for specific error messages
2. **Verify backend is running**: `curl http://localhost:2000/health`
3. **Check network tab** in DevTools to see the actual request/response

## Why This Happens

- **Vite Dev Server** runs on port 1000
- **Backend** runs on port 2000
- **Browser** blocks cross-origin requests (CORS)
- **Solution**: Use Vite proxy to forward requests (no CORS issues)

## Verification

After creating users, verify:

1. Go to `http://localhost:1000/login`
2. You should see "Demo Credentials" section
3. Click "Use" next to any account
4. Credentials auto-fill
5. Click "Sign In"
6. Should log in successfully! ✅

## Still Having Issues?

1. **Check backend logs** - Look for errors in the terminal where backend is running
2. **Check browser console** - Look for specific error messages
3. **Check network tab** - See the actual HTTP request/response
4. **Verify services are running**:
   ```bash
   lsof -ti:1000 && echo "Frontend running" || echo "Frontend NOT running"
   lsof -ti:2000 && echo "Backend running" || echo "Backend NOT running"
   ```

## Quick Test

Test if the proxy works:

1. Go to `http://localhost:1000/login`
2. Open browser console (F12)
3. Run: `fetch('/api/health').then(r => r.json()).then(console.log)`
4. Should return backend health status

If this works, the proxy is working and user creation should work too!

