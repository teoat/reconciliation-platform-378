# Signup HTTP 500 Fix - Summary

**Date**: November 20, 2025  
**Issue**: Signup returning HTTP 500: Internal Server Error  
**Status**: 🔧 **FIXES APPLIED - TESTING IN PROGRESS**

## Root Causes Identified

1. **Stack Overflow in Backend Workers** - Backend crashing with stack overflow in tokio worker threads
2. **Inefficient User Lookup** - Register handler fetching user by email after creation (extra DB query)
3. **Error Handler Middleware** - Reading response body causing potential stack issues

## Fixes Applied

### 1. Optimized Register Handler
**File**: `backend/src/handlers/auth.rs`
- Changed from `get_user_by_email()` to `get_user_by_id_raw()` 
- More efficient: uses user_id directly instead of email lookup
- Avoids potential race conditions

### 2. Added get_user_by_id_raw Method
**File**: `backend/src/services/user/mod.rs`
- New method that returns `User` struct directly by ID
- Uses `tokio::task::spawn_blocking` for database operations
- More efficient than fetching by email after creation

### 3. Simplified Error Handler Middleware
**File**: `backend/src/middleware/error_handler.rs`
- Removed body reading that could cause stack overflow
- Now only adds correlation ID headers (no body modification)
- Reduces memory usage and potential recursion

### 4. Reduced Worker Threads
**File**: `backend/src/main.rs`
- Set `.workers(1)` to minimize stack usage
- Helps reduce stack overflow issues during development

## Current Status

✅ **Code Changes**: All fixes compiled successfully  
✅ **Backend**: Running (with reduced workers)  
⚠️ **Register Endpoint**: Still experiencing issues (may need further investigation)

## Testing Steps

1. **Test through Frontend UI**:
   - Navigate to `http://localhost:1000`
   - Click "Sign up" 
   - Fill in registration form
   - Submit and verify success

2. **Test via API**:
   ```bash
   curl -X POST http://localhost:2000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123!@#",
       "first_name": "Test",
       "last_name": "User"
     }'
   ```

3. **Create Demo Users**:
   - Admin: `admin@example.com` / `AdminPassword123!`
   - Manager: `manager@example.com` / `ManagerPassword123!`
   - User: `user@example.com` / `UserPassword123!`

## Next Steps

1. ✅ Test signup through frontend UI
2. ✅ Create demo users if register works
3. ✅ Verify login with demo credentials
4. ⚠️ If stack overflow persists, investigate:
   - Database connection pool configuration
   - Middleware chain for infinite recursion
   - Tokio runtime stack size configuration

## Known Issues

- **Stack Overflow**: Backend still experiencing stack overflow in worker threads
- **Register Endpoint**: May be hanging or timing out
- **Rate Limiting**: Register endpoint limited to 3 requests/hour per IP

## Environment Variables

Ensure these are set in `backend/.env`:
```bash
DATABASE_URL=postgresql://reconciliation_user:reconciliation_pass@localhost:5432/reconciliation_app
JWT_SECRET=development_jwt_secret_key_change_in_production_32_chars_minimum_length_for_security
JWT_REFRESH_SECRET=development_jwt_refresh_secret_key_change_in_production_32_chars_minimum_length_for_security
RUST_MIN_STACK=8388608
```

## Related Files

- `backend/src/handlers/auth.rs` - Register endpoint handler
- `backend/src/services/user/mod.rs` - User service with new method
- `backend/src/middleware/error_handler.rs` - Simplified error handler
- `backend/src/main.rs` - Server configuration with reduced workers

