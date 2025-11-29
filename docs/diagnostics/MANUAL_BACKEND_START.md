# Manual Backend Start Instructions

## ⚠️ Backend Not Starting Automatically

The backend needs to be started manually in a terminal. Here's how:

## Step 1: Open a Terminal

Open a new terminal window/tab.

## Step 2: Navigate to Backend Directory

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/backend
```

## Step 3: Start Backend

```bash
cargo run --bin reconciliation-backend
```

## Step 4: Wait for Startup

You should see:
- ✅ "🔗 Binding server to 0.0.0.0:2000..."
- ✅ "Server running on http://0.0.0.0:2000"
- ✅ No errors

**Keep this terminal open** - the backend needs to keep running.

## Step 5: Test in Another Terminal

Once backend is running, open **another terminal** and test:

```bash
# Test health
curl http://localhost:2000/health

# Test registration
curl -X POST http://localhost:2000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"email":"admin@example.com","password":"AdminPassword123!","first_name":"Admin","last_name":"User","role":"admin"}'
```

## Expected Results

**Health endpoint** should return:
```json
{"success":true,"data":{"status":"healthy",...}}
```

**Registration** should return:
```json
{"success":true,"data":{...user data...}}
```

**NOT** "Identity verification failed"

---

## After Backend Starts

Once the backend is running successfully, let me know and I'll:
1. ✅ Create all demo users
2. ✅ Test login API
3. ✅ Test frontend authentication
4. ✅ Verify everything works

---

**Start the backend in a terminal and let me know when it's running!**


