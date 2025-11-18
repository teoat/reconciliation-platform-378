# Manual Demo Users Setup Guide

If the automated seeding script doesn't work, you can create demo users manually using the registration form.

## Quick Setup Steps

### Option 1: Use the Registration Form (Easiest)

1. **Start the frontend** (if not already running):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Navigate to the login page**:
   - Open `http://localhost:1000/login` in your browser

3. **Switch to registration mode**:
   - Click "Sign up" or "Register here" at the bottom of the login form

4. **Register each demo account**:

   **Admin Account:**
   - First Name: `Admin`
   - Last Name: `User`
   - Email: `admin@example.com`
   - Password: `AdminPassword123!`
   - Confirm Password: `AdminPassword123!`
   - Click "Create Account"

   **Manager Account:**
   - First Name: `Manager`
   - Last Name: `User`
   - Email: `manager@example.com`
   - Password: `ManagerPassword123!`
   - Confirm Password: `ManagerPassword123!`
   - Click "Create Account"

   **User Account:**
   - First Name: `Demo`
   - Last Name: `User`
   - Email: `user@example.com`
   - Password: `UserPassword123!`
   - Confirm Password: `UserPassword123!`
   - Click "Create Account"

5. **Test login**:
   - After creating accounts, you can use the demo credentials section on the login page
   - Click "Use" next to any account to auto-fill credentials
   - Or use "Quick Login with Demo Account" button

### Option 2: Use Browser Developer Tools

If you prefer to use the API directly from the browser console:

1. **Open the login page** in your browser: `http://localhost:1000/login`

2. **Open Developer Tools** (F12 or Cmd+Option+I)

3. **Go to the Console tab**

4. **Run this code** for each user:

```javascript
// Admin User
fetch('http://localhost:2000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin'
  })
}).then(r => r.json()).then(console.log).catch(console.error);

// Manager User
fetch('http://localhost:2000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'manager@example.com',
    password: 'ManagerPassword123!',
    first_name: 'Manager',
    last_name: 'User',
    role: 'manager'
  })
}).then(r => r.json()).then(console.log).catch(console.error);

// User Account
fetch('http://localhost:2000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'UserPassword123!',
    first_name: 'Demo',
    last_name: 'User',
    role: 'user'
  })
}).then(r => r.json()).then(console.log).catch(console.error);
```

### Option 3: Use curl (Command Line)

If the backend registration endpoint is working, you can use curl:

```bash
# Admin User
curl -X POST http://localhost:2000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPassword123!",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin"
  }'

# Manager User
curl -X POST http://localhost:2000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@example.com",
    "password": "ManagerPassword123!",
    "first_name": "Manager",
    "last_name": "User",
    "role": "manager"
  }'

# User Account
curl -X POST http://localhost:2000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "UserPassword123!",
    "first_name": "Demo",
    "last_name": "User",
    "role": "user"
  }'
```

## Demo Accounts Summary

| Role | Email | Password | First Name | Last Name |
|------|-------|----------|------------|-----------|
| Admin | `admin@example.com` | `AdminPassword123!` | Admin | User |
| Manager | `manager@example.com` | `ManagerPassword123!` | Manager | User |
| User | `user@example.com` | `UserPassword123!` | Demo | User |

## Verification

After creating the accounts, verify they work:

1. Go to `http://localhost:1000/login`
2. You should see the "Demo Credentials" section
3. Click "Use" next to any account
4. Credentials should auto-fill
5. Click "Sign In"
6. You should be logged in successfully

## Troubleshooting

### "User already exists" Error

If you get this error, the user is already created. You can:
- Skip that user and create the others
- Or try logging in with those credentials to verify they work

### Registration Fails

If registration fails:
1. Check that the backend is running: `curl http://localhost:2000/health`
2. Check backend logs for errors
3. Verify the database is accessible
4. Ensure password meets requirements (uppercase, lowercase, number, special char, 8+ chars)

### Can't See Demo Credentials Section

1. Check that `VITE_DEMO_MODE` is set to `true` in `.env` (or unset in development)
2. Restart the frontend after changing `.env`
3. Clear browser cache and reload

## Next Steps

Once demo users are created:
- ✅ Test login with each account
- ✅ Verify different roles have appropriate permissions
- ✅ Test the "Quick Login" functionality
- ✅ Test Google OAuth (if configured)

