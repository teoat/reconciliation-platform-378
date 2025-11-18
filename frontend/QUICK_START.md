# Quick Start - Demo Credentials Setup

## 🚀 Fastest Way to Get Started

### Step 1: Create Demo Users (Choose One Method)

**Method A: Use Registration Form** (Recommended - Easiest)
1. Go to `http://localhost:1000/login`
2. Click "Sign up" at the bottom
3. Register each account:
   - Admin: `admin@example.com` / `AdminPassword123!`
   - Manager: `manager@example.com` / `ManagerPassword123!`
   - User: `user@example.com` / `UserPassword123!`

**Method B: Use Browser Console**
1. Open `http://localhost:1000/login` in browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Copy and paste the code from `MANUAL_DEMO_SETUP.md` (Option 2)

**Method C: Try Automated Script**
```bash
cd frontend
npm run seed-demo-users
# Or use shell script:
./scripts/seed-demo-users.sh
```

### Step 2: Test Login

1. Go to `http://localhost:1000/login`
2. You'll see "Demo Credentials" section
3. Click "Use" next to any account OR
4. Click "Quick Login with Demo Account" button
5. Click "Sign In"

## ✅ That's It!

You're now logged in and ready to test the platform.

For detailed instructions, see:
- `DEMO_CREDENTIALS_SETUP.md` - Full setup guide
- `MANUAL_DEMO_SETUP.md` - Manual setup options
- `DEMO_CREDENTIALS_COMPLETE.md` - Testing checklist
