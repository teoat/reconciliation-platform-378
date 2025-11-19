# Demo Credentials Troubleshooting Guide

## Error: "Invalid credentials" when using demo credentials

This error occurs when:
1. Demo users don't exist in the database
2. Demo users exist but passwords don't match
3. Backend authentication service is not working correctly

## Quick Fix Steps

### Step 1: Verify Backend is Running

```bash
# Check if backend is running
curl http://localhost:2000/health

# Should return: {"status":"ok"}
```

If backend is not running:
```bash
cd backend
cargo run
```

### Step 2: Create Demo Users

The demo users need to be created in the database before you can use them.

**Option A: Use the Seed Script (Recommended)**

```bash
cd frontend
npm run seed-demo-users
```

Or directly:
```bash
cd frontend
tsx scripts/seed-demo-users.ts
```

**Option B: Manual Registration via API**

```bash
# Register admin user
curl -X POST http://localhost:2000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPassword123!",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin"
  }'

# Register manager user
curl -X POST http://localhost:2000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@example.com",
    "password": "ManagerPassword123!",
    "first_name": "Manager",
    "last_name": "User",
    "role": "manager"
  }'

# Register user
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

### Step 3: Verify Users Were Created

Check if users exist in the database:

```bash
# If you have psql access
psql -h localhost -U your_user -d your_database -c "SELECT email, status FROM users WHERE email IN ('admin@example.com', 'manager@example.com', 'user@example.com');"
```

Or test login via API:

```bash
# Test admin login
curl -X POST http://localhost:2000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPassword123!"
  }'

# Should return a token if successful
```

### Step 4: Check Password Hashing

The backend uses **bcrypt** for password hashing. If users were created with a different method, passwords won't match.

**Verify password hash format in database:**
- Bcrypt hashes start with `$2a$`, `$2b$`, or `$2y$`
- Example: `$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5`

If you see a different format, the user was created incorrectly.

## Common Issues

### Issue 1: Users Don't Exist

**Symptoms:**
- "Invalid credentials" error
- Seed script shows "Failed to create" messages

**Solution:**
1. Run the seed script: `npm run seed-demo-users`
2. Check backend logs for errors
3. Verify database connection

### Issue 2: Password Mismatch

**Symptoms:**
- Users exist but login fails
- Different password hash format in database

**Solution:**
1. Delete existing demo users from database
2. Re-run seed script to create users with correct password hashes
3. Or manually update password hashes (not recommended)

### Issue 3: User Status Not Active

**Symptoms:**
- Login returns "Account is deactivated"

**Solution:**
```sql
-- Update user status to active
UPDATE users SET status = 'active' WHERE email = 'admin@example.com';
```

### Issue 4: Backend Not Using Bcrypt

**Symptoms:**
- Password verification always fails
- Backend logs show password verification errors

**Solution:**
1. Check `backend/src/services/auth/mod.rs` - should use `PasswordManager::hash_password` and `PasswordManager::verify_password`
2. Verify bcrypt dependency in `backend/Cargo.toml`
3. Restart backend after changes

## Demo Credentials Reference

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `AdminPassword123!` |
| Manager | `manager@example.com` | `ManagerPassword123!` |
| User | `user@example.com` | `UserPassword123!` |

## Verification Checklist

After fixing, verify:

- [ ] Backend is running at `http://localhost:2000`
- [ ] Seed script ran successfully
- [ ] Users exist in database with correct emails
- [ ] Password hashes are bcrypt format (start with `$2`)
- [ ] User status is "active" (not "inactive" or "deactivated")
- [ ] Can login via API with demo credentials
- [ ] Can login via frontend with demo credentials

## Testing Login

### Via API

```bash
# Test admin login
curl -X POST http://localhost:2000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPassword123!"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin",
    "is_active": true
  },
  "expires_at": 1234567890
}
```

### Via Frontend

1. Go to `http://localhost:1000/login`
2. Click "Use" next to any demo account
3. Click "Sign In"
4. Should redirect to dashboard

## Still Not Working?

### Check Backend Logs

```bash
cd backend
cargo run
# Look for authentication errors in logs
```

### Check Database

```sql
-- Check if users exist
SELECT id, email, status, password_hash FROM users 
WHERE email IN ('admin@example.com', 'manager@example.com', 'user@example.com');

-- Check password hash format
SELECT email, 
       CASE 
         WHEN password_hash LIKE '$2%' THEN 'bcrypt'
         ELSE 'unknown'
       END as hash_type
FROM users 
WHERE email IN ('admin@example.com', 'manager@example.com', 'user@example.com');
```

### Recreate Users

If users exist but passwords don't work:

1. **Delete existing users:**
   ```sql
   DELETE FROM users WHERE email IN ('admin@example.com', 'manager@example.com', 'user@example.com');
   ```

2. **Re-run seed script:**
   ```bash
   cd frontend
   npm run seed-demo-users
   ```

3. **Test login again**

## Related Documentation

- [Demo Credentials Setup](../DEMO_CREDENTIALS_SETUP.md)
- [Authentication Troubleshooting](../AUTHENTICATION_TROUBLESHOOTING.md)
- [Backend Authentication Handler](../../backend/src/handlers/auth.rs)

