# 🚀 Demo Credentials - Complete Setup Guide

## ✅ Current Status

- ✅ Frontend: Running on port 1000
- ✅ Backend: Running on port 2000
- ✅ Demo credentials UI: Configured and ready
- ✅ Google OAuth: Configured and ready
- ⏳ Demo users: Need to be created (choose method below)

## 🎯 Create Demo Users - Choose Your Method

### Method 1: One-Click HTML Page ⭐ (EASIEST!)

1. **Open this file in your browser:**
   ```
   file:///Users/Arief/Documents/GitHub/reconciliation-platform-378/frontend/scripts/create-users-now.html
   ```
   Or double-click the file: `frontend/scripts/create-users-now.html`

2. **Click the "Create All Demo Users" button**

3. **Wait 2-3 seconds** - you'll see success messages

4. **Done!** Go to `http://localhost:1000/login` and refresh

---

### Method 2: Browser Console (Quick)

1. **Open**: `http://localhost:1000/login` in your browser

2. **Press F12** (or Cmd+Option+I) to open Developer Tools

3. **Click "Console" tab**

4. **Copy and paste this code:**

```javascript
const users = [
  { email: 'admin@example.com', password: 'AdminPassword123!', first_name: 'Admin', last_name: 'User', role: 'admin' },
  { email: 'manager@example.com', password: 'ManagerPassword123!', first_name: 'Manager', last_name: 'User', role: 'manager' },
  { email: 'user@example.com', password: 'UserPassword123!', first_name: 'Demo', last_name: 'User', role: 'user' }
];

users.forEach(async (user, index) => {
  try {
    const response = await fetch('http://localhost:2000/api/auth/register', {
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
      console.log(`❌ [${index + 1}/3] Failed: ${user.email}`);
    }
  } catch (error) {
    console.log(`❌ [${index + 1}/3] Error: ${user.email} - ${error.message}`);
  }
  await new Promise(r => setTimeout(r, 500));
});
```

5. **Press Enter** and wait

6. **Refresh the login page**

---

### Method 3: Registration Form (Manual)

1. **Go to**: `http://localhost:1000/login`

2. **Click "Sign up"** at the bottom

3. **Register each account** (repeat 3 times):

   **Admin:**
   - First Name: `Admin`
   - Last Name: `User`
   - Email: `admin@example.com`
   - Password: `AdminPassword123!`
   - Confirm: `AdminPassword123!`

   **Manager:**
   - First Name: `Manager`
   - Last Name: `User`
   - Email: `manager@example.com`
   - Password: `ManagerPassword123!`
   - Confirm: `ManagerPassword123!`

   **User:**
   - First Name: `Demo`
   - Last Name: `User`
   - Email: `user@example.com`
   - Password: `UserPassword123!`
   - Confirm: `UserPassword123!`

---

## 🧪 Test After Creating Users

1. **Go to**: `http://localhost:1000/login`

2. **You should see**: "Demo Credentials" section with 3 accounts

3. **Test Quick Fill**:
   - Click "Use" next to any account
   - Credentials auto-fill
   - Click "Sign In"

4. **Test Quick Login**:
   - Click "Quick Login with Demo Account"
   - Admin credentials auto-fill
   - Click "Sign In"

## 📋 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `AdminPassword123!` |
| Manager | `manager@example.com` | `ManagerPassword123!` |
| User | `user@example.com` | `UserPassword123!` |

## 🎉 Success Indicators

✅ "Demo Credentials" section appears on login page
✅ "Use" buttons work and auto-fill credentials
✅ "Quick Login" button works
✅ Can successfully log in with all accounts
✅ Google Sign-In button appears (if configured)

## 📁 Help Files

- `STEP_BY_STEP_HELP.md` - Complete step-by-step guide
- `HELP_CREATE_DEMO_USERS.md` - Detailed user creation
- `QUICK_START.md` - Fastest setup
- `create-demo-users.js` - Console script
- `scripts/create-users-now.html` - One-click solution

## 🐛 Troubleshooting

**"Demo Credentials" section not showing?**
- Make sure you're on `/login` page (not `/register`)
- Refresh the page
- Check browser console for errors

**Can't create users?**
- Verify backend is running: `curl http://localhost:2000/health`
- Try a different method (HTML page, console, or form)
- Check backend logs

**Login fails?**
- Verify user was created successfully
- Check password matches exactly (case-sensitive)
- Check browser console for errors

---

## ✨ You're All Set!

Once users are created, everything will work perfectly. The demo credentials UI is already configured and ready to use!

