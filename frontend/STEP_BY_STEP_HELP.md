# Step-by-Step Help Guide

## 🎯 What Do You Need Help With?

### Option 1: Create Demo Users (Most Common)

**EASIEST METHOD - Use Browser Console:**

1. **Open browser**: Go to `http://localhost:1000/login`

2. **Open Developer Tools**: 
   - Press `F12` (Windows/Linux) 
   - Or `Cmd+Option+I` (Mac)
   - Or right-click → "Inspect"

3. **Click "Console" tab**

4. **Copy this code and paste it, then press Enter:**

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
      console.log(`✅ Created: ${user.email}`);
    } else if (response.status === 409 || data.message?.includes('already exists')) {
      console.log(`ℹ️  Already exists: ${user.email}`);
    } else {
      console.log(`❌ Failed: ${user.email} -`, data);
    }
  } catch (error) {
    console.log(`❌ Error: ${user.email} -`, error.message);
  }
  await new Promise(r => setTimeout(r, 500));
});
```

5. **Wait 2-3 seconds** - you should see success messages

6. **Refresh the login page** - you should now see "Demo Credentials" section!

---

### Option 2: Test Demo Credentials

1. **Go to**: `http://localhost:1000/login`

2. **You should see**: "Demo Credentials" section with 3 accounts

3. **Click "Use"** next to any account → credentials auto-fill

4. **Click "Sign In"** → you're logged in!

---

### Option 3: Start Services

**If services aren't running:**

```bash
# Terminal 1 - Backend
cd backend
cargo run

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

### Option 4: Troubleshoot Issues

**Problem: "Demo Credentials" section not showing**
- ✅ Make sure you're on `/login` page (not `/register`)
- ✅ Refresh the page (Ctrl+R or Cmd+R)
- ✅ Check browser console for errors (F12)

**Problem: Can't create users**
- ✅ Make sure backend is running: `curl http://localhost:2000/health`
- ✅ Try the registration form method instead
- ✅ Check backend logs for errors

**Problem: Login fails**
- ✅ Make sure user was created successfully
- ✅ Check password matches exactly (case-sensitive)
- ✅ Check browser console for error messages

---

## 📁 Files I Created For You

- `HELP_CREATE_DEMO_USERS.md` - Detailed user creation guide
- `create-demo-users.js` - Ready-to-use script
- `QUICK_START.md` - Fastest setup method
- `MANUAL_DEMO_SETUP.md` - Manual setup options
- `DEMO_CREDENTIALS_SETUP.md` - Full documentation

---

## 🚀 Quick Commands

```bash
# Check if services are running
lsof -ti:1000 && echo "Frontend running" || echo "Frontend NOT running"
lsof -ti:2000 && echo "Backend running" || echo "Backend NOT running"

# Start frontend
cd frontend && npm run dev

# Start backend  
cd backend && cargo run

# Test backend health
curl http://localhost:2000/health
```

---

## 💡 What Are You Stuck On?

Tell me specifically what you need help with:
- Creating demo users?
- Testing login?
- Starting services?
- Something else?

I'm here to help! 🎯

