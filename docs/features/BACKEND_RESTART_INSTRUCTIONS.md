# Backend Restart Instructions

## Why Restart is Needed

After fixing the blocking database calls in `backend/src/services/user/mod.rs`, the backend **must be restarted** to load the new code.

## Steps to Restart Backend

### 1. Stop Current Backend

In the terminal where the backend is running:
- Press `Ctrl+C` to stop the backend
- Wait for it to fully stop (you'll see the prompt return)

### 2. Rebuild and Start Backend

```bash
cd backend
cargo run
```

This will:
- Compile the new code with the fixes
- Start the backend server
- Load the fixed `get_user_by_id()` and `get_user_by_email()` functions

### 3. Verify Backend is Running

In another terminal, check health:

```bash
curl http://localhost:2000/health
```

Should return: `{"success":true,"data":{"status":"healthy"...}}`

### 4. Test Register Endpoint

```bash
curl -X POST http://localhost:2000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@example.com",
    "password":"AdminPassword123!",
    "first_name":"Admin",
    "last_name":"User",
    "role":"admin"
  }'
```

**Expected Response (201 Created):**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin",
    "is_active": true
  },
  "expires_at": 1234567890
}
```

### 5. Run Seed Script

Once register works, create all demo users:

```bash
cd frontend
npm run seed-demo-users
```

## What Was Fixed

The register endpoint was crashing because:
- `get_user_by_id()` was making blocking database calls in async functions
- `get_user_by_email()` had the same issue

**Fix Applied:**
- Wrapped blocking calls in `tokio::task::spawn_blocking()`
- This moves blocking work off async runtime threads
- Prevents runtime blocking and crashes

## Troubleshooting

### Backend Won't Start

1. Check for compilation errors:
   ```bash
   cd backend
   cargo check
   ```

2. Check if port 2000 is in use:
   ```bash
   lsof -ti:2000
   # If something is using it, kill it:
   kill -9 $(lsof -ti:2000)
   ```

### Register Still Fails After Restart

1. Check backend logs for errors
2. Verify database is running and accessible
3. Check database connection string in `.env` file
4. Try a simpler test:
   ```bash
   curl -X POST http://localhost:2000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test"}'
   ```

### Connection Refused

- Backend might not be running
- Check: `curl http://localhost:2000/health`
- If it fails, start backend: `cd backend && cargo run`

