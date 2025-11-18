# Help: Create Demo Users - Step by Step

## Current Status Check

Let me help you create the demo users. First, let's make sure everything is running.

## Step 1: Check Services

**Frontend should be running on:** `http://localhost:1000`
**Backend should be running on:** `http://localhost:2000`

If not running, start them:
```bash
# Terminal 1 - Backend
cd backend
cargo run

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## Step 2: Create Users - EASIEST METHOD

### Option A: Use Registration Form (Recommended)

1. **Open your browser** and go to: `http://localhost:1000/login`

2. **Click "Sign up"** at the bottom of the login form

3. **Fill in the form for Admin account:**
   ```
   First Name: Admin
   Last Name: User
   Email: admin@example.com
   Password: AdminPassword123!
   Confirm Password: AdminPassword123!
   ```
   Click **"Create Account"**

4. **After successful registration, you'll be logged in. Log out and repeat for Manager:**
   - Click your profile/logout
   - Go back to login page
   - Click "Sign up"
   - Fill in:
   ```
   First Name: Manager
   Last Name: User
   Email: manager@example.com
   Password: ManagerPassword123!
   Confirm Password: ManagerPassword123!
   ```
   Click **"Create Account"**

5. **Log out and create User account:**
   - Log out
   - Go to login page
   - Click "Sign up"
   - Fill in:
   ```
   First Name: Demo
   Last Name: User
   Email: user@example.com
   Password: UserPassword123!
   Confirm Password: UserPassword123!
   ```
   Click **"Create Account"**

### Option B: Use Browser Console (Faster)

1. **Open** `http://localhost:1000/login` in your browser

2. **Press F12** (or Cmd+Option+I on Mac) to open Developer Tools

3. **Click the "Console" tab**

4. **Copy and paste this code** (it will create all 3 users at once):

```javascript
// Create all demo users
const users = [
  { email: 'admin@example.com', password: 'AdminPassword123!', first_name: 'Admin', last_name: 'User', role: 'admin' },
  { email: 'manager@example.com', password: 'ManagerPassword123!', first_name: 'Manager', last_name: 'User', role: 'manager' },
  { email: 'user@example.com', password: 'UserPassword123!', first_name: 'Demo', last_name: 'User', role: 'user' }
];

users.forEach(async (user) => {
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
});
```

5. **Press Enter** and wait a few seconds

6. **Check the console output** - you should see:
   - ✅ Created: admin@example.com
   - ✅ Created: manager@example.com
   - ✅ Created: user@example.com

## Step 3: Test the Demo Credentials

1. **Go to** `http://localhost:1000/login`

2. **You should see** a "Demo Credentials" section with all three accounts

3. **Test Quick Fill:**
   - Click "Use" next to "admin"
   - Email and password should auto-fill
   - Click "Sign In"
   - You should be logged in!

4. **Test Quick Login:**
   - Log out
   - Go back to login page
   - Click "Quick Login with Demo Account" button
   - Admin credentials auto-fill
   - Click "Sign In"

## Step 4: Verify All Accounts Work

Test each account:
- Admin: `admin@example.com` / `AdminPassword123!`
- Manager: `manager@example.com` / `ManagerPassword123!`
- User: `user@example.com` / `UserPassword123!`

## Troubleshooting

### "User already exists" Error
✅ **This is GOOD!** It means the user is already created. Skip that one.

### Registration Form Not Showing
- Make sure frontend is running: `npm run dev` in frontend directory
- Check browser console for errors (F12)

### Can't See Demo Credentials Section
- Check that you're on the login page (not register page)
- Demo mode should be enabled by default in development
- Try refreshing the page

### Backend Connection Issues
- Make sure backend is running: `cargo run` in backend directory
- Check: `curl http://localhost:2000/health`
- Should return: `{"success":true,...}`

## Success Indicators

✅ You see "Demo Credentials" section on login page
✅ "Use" buttons work and auto-fill credentials
✅ "Quick Login" button works
✅ You can successfully log in with all three accounts
✅ Google Sign-In button appears (if VITE_GOOGLE_CLIENT_ID is set)

## Need More Help?

- See `QUICK_START.md` for fastest setup
- See `MANUAL_DEMO_SETUP.md` for detailed manual options
- See `DEMO_CREDENTIALS_SETUP.md` for full documentation

