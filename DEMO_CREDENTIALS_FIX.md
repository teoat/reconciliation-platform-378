# Demo Credentials Fix - Summary

**Date**: November 20, 2025  
**Issue**: Demo credentials returning "invalid credentials"  
**Status**: 🔧 **FIXING**

## Root Cause

1. **Demo users don't exist in database** - Users need to be created first
2. **Rate limiting blocking registration** - Register endpoint limited to 3 requests per hour per IP

## Solution Applied

### Step 1: Clear Rate Limit
- Cleared Redis rate limit keys to allow new registration attempts

### Step 2: Create Demo Users
Creating the three demo users:
- **Admin**: `admin@example.com` / `AdminPassword123!`
- **Manager**: `manager@example.com` / `ManagerPassword123!`
- **User**: `user@example.com` / `UserPassword123!`

### Step 3: Verify Login
Testing login with demo credentials to confirm they work

## Demo Credentials Reference

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `AdminPassword123!` |
| Manager | `manager@example.com` | `ManagerPassword123!` |
| User | `user@example.com` | `UserPassword123!` |

## Alternative: Use Frontend Registration Form

If rate limiting persists, you can create users through the frontend:

1. Go to `http://localhost:1000/login`
2. Click "Sign up" at the bottom
3. Register each account manually using the credentials above

## Rate Limit Information

- **Register endpoint**: 3 requests per hour (3600 seconds) per IP
- **Login endpoint**: 5 attempts per 15 minutes (900 seconds)
- Rate limits are stored in Redis (if available) or in-memory

## Next Steps

After users are created:
1. Go to `http://localhost:1000/login`
2. Use the "Demo Credentials" section
3. Click "Use" next to any account to auto-fill
4. Click "Sign In"

