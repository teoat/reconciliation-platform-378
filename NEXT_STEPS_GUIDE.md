# Better Auth - Next Steps Guide

## 🚀 Your Implementation is Ready!

All code is complete. Here's exactly what to do next to get Better Auth running.

---

## Step 1: Install Auth Server Dependencies (5 minutes)

```bash
cd auth-server
npm install
```

**What this does**: Installs Better Auth and all required packages

**Expected output**: 
```
added XX packages
```

✅ **Checkpoint**: No errors during installation

---

## Step 2: Configure Environment (5 minutes)

```bash
cd auth-server
cp env.example .env
```

Now edit `auth-server/.env` with your actual values:

```env
# Required - Get from your existing backend config
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reconciliation

# Required - Must match your backend JWT_SECRET
JWT_SECRET=your-existing-jwt-secret-from-backend

# Required for Google OAuth - Get from Google Console
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional - These have good defaults
PORT=4000
NODE_ENV=development
BCRYPT_COST=12
SESSION_EXPIRY_SECONDS=1800
CORS_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:2000
```

**Where to find values:**
- `DATABASE_URL`: Check `backend/.env` or `config/production.env`
- `JWT_SECRET`: Check `backend/.env` - MUST be the same!
- `GOOGLE_CLIENT_ID`: Check `frontend/.env` or ask team lead

✅ **Checkpoint**: .env file configured

---

## Step 3: Run Database Migrations (2 minutes)

```bash
cd auth-server
npm run db:migrate
```

**What this does**: Creates Better Auth tables (sessions, accounts, verification_tokens)

**Expected output**:
```
Starting database migrations...
Database connected successfully: ...
▶️  Running migration 001_better_auth_compat.sql...
✅ Migration 001_better_auth_compat.sql completed
✅ All migrations completed successfully!
```

**If you get an error**: Check DATABASE_URL is correct

✅ **Checkpoint**: Migrations completed successfully

---

## Step 4: Start Auth Server (1 minute)

```bash
cd auth-server
npm run dev
```

**Expected output**:
```
Starting Better Auth server on port 4000...
Environment: development
CORS origins: http://localhost:3000, http://localhost:2000
Database connected successfully: ...
✅ Better Auth server running at http://localhost:4000
✅ Health check: http://localhost:4000/health
✅ Auth endpoints: http://localhost:4000/api/auth/*
```

**Keep this terminal open** - server is now running!

✅ **Checkpoint**: Auth server running on port 4000

---

## Step 5: Test Auth Server (2 minutes)

Open a **new terminal** and run:

```bash
# Test health endpoint
curl http://localhost:4000/health
```

**Expected response**:
```json
{
  "status": "ok",
  "timestamp": "2024-11-29T...",
  "service": "better-auth-server",
  "version": "1.0.0"
}
```

Now test registration:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "first_name": "Test",
    "last_name": "User"
  }'
```

**Expected response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    ...
  },
  "expires_at": 1234567890
}
```

✅ **Checkpoint**: Auth server accepting requests

---

## Step 6: Configure Frontend (2 minutes)

```bash
cd frontend
cp env.example .env
```

Edit `frontend/.env`:

```env
# Point to auth server
VITE_AUTH_SERVER_URL=http://localhost:4000

# Your existing Google Client ID (same as auth-server)
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Your existing backend URL
VITE_API_BASE_URL=http://localhost:2000
VITE_WS_URL=ws://localhost:2000
```

✅ **Checkpoint**: Frontend configured

---

## Step 7: Install Frontend Dependencies (2 minutes)

```bash
cd frontend
npm install
```

**What this does**: Installs `better-auth` client (already added to package.json)

✅ **Checkpoint**: Frontend dependencies installed

---

## Step 8: Start Frontend (1 minute)

```bash
cd frontend
npm run dev
```

**Expected output**:
```
VITE v5.0.0  ready in XXX ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**Keep this terminal open** - frontend is now running!

✅ **Checkpoint**: Frontend running on port 3000

---

## Step 9: Test Frontend Authentication (5 minutes)

Open your browser to **http://localhost:3000/login**

### Test Registration:
1. Click "Create new account"
2. Fill in the form:
   - Email: `yourtest@example.com`
   - Password: `SecurePass123!`
   - First Name: `Your`
   - Last Name: `Name`
3. Click "Sign Up"

**Expected**: Redirects to dashboard with success message

### Test Login:
1. Go back to `/login`
2. Enter the credentials you just created
3. Click "Sign In"

**Expected**: Redirects to dashboard

### Test Google OAuth:
1. Go back to `/login`
2. Click "Continue with Google"
3. Complete Google authentication

**Expected**: Redirects to dashboard

✅ **Checkpoint**: All authentication flows working

---

## Step 10: Configure Backend (Optional - for full integration)

To make the backend validate Better Auth tokens:

```bash
cd backend

# Add to your .env file:
echo "BETTER_AUTH_SERVER_URL=http://localhost:4000" >> .env
echo "BETTER_AUTH_ENABLED=false" >> .env
echo "BETTER_AUTH_DUAL_MODE=true" >> .env
```

**Note**: Keep `BETTER_AUTH_ENABLED=false` initially. The backend will still use legacy JWT tokens until you're ready to switch.

When you're ready to enable Better Auth validation:
```bash
# Change to true
BETTER_AUTH_ENABLED=true
```

Then rebuild and restart backend:
```bash
cargo build
cargo run
```

✅ **Checkpoint**: Backend configured (optional)

---

## Step 11: Run Automated Tests (3 minutes)

```bash
# From project root
bash scripts/test-better-auth.sh
```

**Expected output**:
```
🧪 Running Better Auth Integration Tests...
Test 1: Health Check ✅ PASS
Test 2: User Registration ✅ PASS
Test 3: User Login ✅ PASS
Test 4: Invalid Credentials ✅ PASS
...
🎉 All tests passed!
```

✅ **Checkpoint**: All tests passing

---

## 🎉 You're Done!

### What You Now Have:

✅ **Auth Server Running**: http://localhost:4000  
✅ **Frontend Running**: http://localhost:3000  
✅ **Authentication Working**: Login, signup, OAuth  
✅ **Tests Passing**: All integration tests green  
✅ **Ready for Production**: When you're ready  

---

## 🔍 Troubleshooting

### Issue: "Database connection failed"

**Solution**: Check DATABASE_URL in `auth-server/.env`

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Issue: "Cannot find module 'better-auth'"

**Solution**: Install dependencies

```bash
cd auth-server
npm install
```

### Issue: "Port 4000 already in use"

**Solution**: Change port or kill existing process

```bash
# Option 1: Change port in auth-server/.env
PORT=4001

# Option 2: Kill process using port 4000
lsof -ti:4000 | xargs kill
```

### Issue: "JWT_SECRET validation failed"

**Solution**: Ensure JWT_SECRET is 32+ characters

```bash
# Generate a new secret
openssl rand -base64 32
```

### Issue: "Google OAuth not working"

**Solution**: 
1. Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in auth-server/.env
2. Ensure frontend has same GOOGLE_CLIENT_ID
3. Check Google Console redirect URIs include `http://localhost:3000`

---

## 🚀 Next Steps After Testing

### When You're Ready for Staging:

```bash
# Deploy to staging environment
bash scripts/deploy-better-auth.sh staging
```

### When You're Ready for Production:

Follow the complete [Migration Runbook](BETTER_AUTH_MIGRATION_RUNBOOK.md)

---

## 📚 Quick Reference

### Start Everything
```bash
# Terminal 1: Auth Server
cd auth-server && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Backend (optional)
cd backend && cargo run
```

### Stop Everything
```bash
# Press Ctrl+C in each terminal

# Or using Docker:
docker-compose -f docker-compose.better-auth.yml down
```

### Run Tests
```bash
bash scripts/test-better-auth.sh
```

### Check Logs
```bash
# Auth server logs (if using Docker)
docker-compose logs -f auth-server

# Or check terminal where npm run dev is running
```

---

## 🎯 Summary

You've completed:
1. ✅ Installed auth server dependencies
2. ✅ Configured environment variables
3. ✅ Run database migrations
4. ✅ Started auth server
5. ✅ Tested auth server API
6. ✅ Configured frontend
7. ✅ Started frontend
8. ✅ Tested authentication flows
9. ✅ Configured backend (optional)
10. ✅ Run automated tests

**Everything is working!** 🎊

---

## 💡 Pro Tips

1. **Keep auth server running**: It's needed for all authentication
2. **Check logs**: Useful for debugging issues
3. **Test often**: Run `scripts/test-better-auth.sh` after changes
4. **Use Docker**: For easier deployment (see docker-compose.better-auth.yml)
5. **Read docs**: See [BETTER_AUTH_INDEX.md](BETTER_AUTH_INDEX.md) for all guides

---

**Need Help?** See [BETTER_AUTH_INDEX.md](BETTER_AUTH_INDEX.md) for complete documentation!

**Ready to Deploy?** See [BETTER_AUTH_DEPLOYMENT_GUIDE.md](BETTER_AUTH_DEPLOYMENT_GUIDE.md)!

---

*Quick Start Guide Version: 1.0*  
*Last Updated: November 29, 2024*

