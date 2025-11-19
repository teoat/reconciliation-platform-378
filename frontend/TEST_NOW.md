# 🧪 Test Demo User Creation - Ready Now!

## ✅ Frontend Restarted

The frontend has been restarted with the fix. The API client now uses the Vite proxy (`/api`) instead of direct backend URLs.

## 🎯 Test Now - Choose Your Method

### Method 1: Registration Form (Easiest) ⭐

1. **Open**: `http://localhost:1000/login` in your browser
2. **Click "Sign up"** at the bottom
3. **Fill in the form**:
   ```
   First Name: Admin
   Last Name: User
   Email: admin@example.com
   Password: AdminPassword123!
   Confirm Password: AdminPassword123!
   ```
4. **Click "Create Account"**
5. **Should work now!** ✅

Repeat for:
- Manager: `manager@example.com` / `ManagerPassword123!`
- User: `user@example.com` / `UserPassword123!`

---

### Method 2: Browser Console (Quick - Creates All at Once)

1. **Open**: `http://localhost:1000/login` in your browser
2. **Press F12** (or Cmd+Option+I on Mac) to open Developer Tools
3. **Click "Console" tab**
4. **Copy and paste this code**:

```javascript
const users = [
  { email: 'admin@example.com', password: 'AdminPassword123!', first_name: 'Admin', last_name: 'User', role: 'admin' },
  { email: 'manager@example.com', password: 'ManagerPassword123!', first_name: 'Manager', last_name: 'User', role: 'manager' },
  { email: 'user@example.com', password: 'UserPassword123!', first_name: 'Demo', last_name: 'User', role: 'user' }
];

console.log('🌱 Creating demo users...\n');

users.forEach(async (user, index) => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    
    const data = await response.json();
    
    if (response.ok || response.status === 201) {
      console.log(`✅ [${index + 1}/3] Created: ${user.email} (${user.role})`);
    } else if (response.status === 409 || data.message?.includes('already exists') || data.error?.includes('already exists')) {
      console.log(`ℹ️  [${index + 1}/3] Already exists: ${user.email} (${user.role})`);
    } else {
      console.log(`❌ [${index + 1}/3] Failed: ${user.email} -`, data);
    }
  } catch (error) {
    console.log(`❌ [${index + 1}/3] Error: ${user.email} - ${error.message}`);
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
});

console.log('\n✨ Check results above. Refresh login page to see demo credentials!');
```

5. **Press Enter**
6. **Wait 2-3 seconds** - you should see success messages
7. **Refresh the login page** - you should see "Demo Credentials" section!

---

### Method 3: HTML Page

1. **Open**: `http://localhost:1000/login` in your browser
2. **In another tab**, open: `scripts/create-users-now.html`
   - File → Open → Navigate to `frontend/scripts/create-users-now.html`
3. **Click "Create All Demo Users" button**
4. **Wait for success messages**
5. **Go back to login page and refresh**

---

## ✅ Success Indicators

After creating users, you should see:

1. ✅ No "failed to fetch" errors
2. ✅ Success messages in console/form
3. ✅ "Demo Credentials" section appears on login page
4. ✅ Can click "Use" buttons to auto-fill credentials
5. ✅ Can successfully log in

## 🐛 If Still Having Issues

1. **Check browser console** (F12) for specific errors
2. **Check network tab** - see if requests are going to `/api/auth/register`
3. **Verify backend is running**: 
   ```bash
   curl http://localhost:2000/health
   ```
4. **Check frontend terminal** for any errors

## 🎉 Next Steps After Success

Once users are created:
1. Go to `http://localhost:1000/login`
2. See "Demo Credentials" section
3. Click "Use" next to any account
4. Click "Sign In"
5. You're logged in! 🎊

