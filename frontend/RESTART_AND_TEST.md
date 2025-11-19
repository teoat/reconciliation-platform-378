# 🔄 Restart Frontend & Test

## ✅ Fix Applied

I've updated the API client to use relative URLs (`/api`) in development mode, which leverages the Vite proxy and fixes the "failed to fetch" error.

## 🔄 Required: Restart Frontend

**You MUST restart the frontend for the fix to take effect:**

```bash
# In the terminal where frontend is running:
# Press Ctrl+C to stop

# Then restart:
cd frontend
npm run dev
```

## 🧪 Test After Restart

### Test 1: Registration Form

1. **Go to**: `http://localhost:1000/login`
2. **Click "Sign up"**
3. **Fill in the form**:
   - First Name: `Admin`
   - Last Name: `User`
   - Email: `admin@example.com`
   - Password: `AdminPassword123!`
   - Confirm: `AdminPassword123!`
4. **Click "Create Account"**
5. **Should work now!** ✅

### Test 2: Browser Console

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
    console.log(`❌ [${index + 1}/3] Error: ${user.email} -`, error.message);
  }
  await new Promise(r => setTimeout(r, 500));
});
```

4. **Press Enter** - should work! ✅

## ✅ Success Indicators

After creating users:
- ✅ No "failed to fetch" errors
- ✅ Users created successfully
- ✅ Can see "Demo Credentials" section on login page
- ✅ Can log in with demo accounts

## 🐛 Still Having Issues?

1. **Verify frontend restarted**: Check terminal shows "VITE ready"
2. **Check browser console**: Look for any errors
3. **Check network tab**: See if requests are going to `/api/auth/register`
4. **Verify backend running**: `curl http://localhost:2000/health`

## 📝 What Changed

- **Before**: API client used `http://localhost:2000/api` (direct backend - CORS issues)
- **After**: API client uses `/api` in development (Vite proxy - no CORS issues)

The Vite proxy forwards `/api/*` requests to `http://localhost:2000/api/*` automatically.

