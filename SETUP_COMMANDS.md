# Better Auth - Setup Commands

**Run these commands in order** ⬇️

## ✅ Step 1: Auth Server Environment (Already done: Dependencies installed!)

Create `.env` file in `auth-server/`:

```bash
cd auth-server/

# Create .env file
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://localhost:5432/reconciliation_db

# Server Configuration
PORT=3001
NODE_ENV=development

# Security - Generated JWT Secret
JWT_SECRET=41fe6db62ba4e7d6ecec1fbb04b507bcf348e53ab021589cc818a98a9dfec67a
BCRYPT_COST=12

# Session Configuration
SESSION_TIMEOUT_MINUTES=30

# OAuth (Optional - leave empty if not using)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback/google

# Email (Optional - leave empty if not using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@yourdomain.com

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Features
ENABLE_EMAIL_VERIFICATION=false
ENABLE_PASSWORD_RESET=false
ENABLE_OAUTH=false
LOG_LEVEL=info
EOF

echo "✓ Auth server .env created"
```

---

## ✅ Step 2: Backend Environment

Update `backend/.env` with Better Auth config:

```bash
cd ../backend/

# Add Better Auth configuration to .env
cat >> .env << 'EOF'

# ============================================================================
# Better Auth Configuration
# ============================================================================
AUTH_SERVER_URL=http://localhost:3001
BETTER_AUTH_JWT_SECRET=41fe6db62ba4e7d6ecec1fbb04b507bcf348e53ab021589cc818a98a9dfec67a
PREFER_BETTER_AUTH=true
ENABLE_DUAL_AUTH=true
ENABLE_BETTER_AUTH=true
TOKEN_CACHE_TTL=300
EOF

echo "✓ Backend .env updated"
```

---

## ✅ Step 3: Frontend Environment

Create `.env.local` in `frontend/`:

```bash
cd ../frontend/

# Create .env.local for development
cat > .env.local << 'EOF'
# API Configuration
VITE_API_BASE_URL=http://localhost:2000
VITE_WS_URL=ws://localhost:2000

# Better Auth Configuration
VITE_AUTH_SERVER_URL=http://localhost:3001

# Feature Flags
VITE_ENABLE_BETTER_AUTH=true
VITE_ENABLE_DUAL_AUTH=true
VITE_ENABLE_OAUTH=false
VITE_ENABLE_EMAIL_VERIFICATION=false
VITE_ENABLE_PASSWORD_RESET=false
VITE_SHOW_MIGRATION_BANNER=true

# Environment
VITE_ENVIRONMENT=development
EOF

echo "✓ Frontend .env.local created"
```

---

## ✅ Step 4: Run Database Migrations

```bash
cd ../backend/

# Check if DATABASE_URL is set
echo $DATABASE_URL

# If not set, export it:
# export DATABASE_URL=postgresql://localhost:5432/reconciliation_db

# IMPORTANT: Backup database first!
pg_dump $DATABASE_URL > "backup_$(date +%Y%m%d_%H%M%S).sql"

# Run migration
psql $DATABASE_URL -f migrations/better_auth_compat.sql

# Verify tables created
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%better_auth%' OR table_name = 'auth_audit_log' ORDER BY table_name;"
```

**Expected Output**:
```
      table_name          
--------------------------
 auth_audit_log
 better_auth_accounts
 better_auth_sessions
 better_auth_verification_tokens
(4 rows)
```

---

## ✅ Step 5: Start Services (3 Terminals)

### Terminal 1: Auth Server

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/auth-server
npm run dev
```

**Expected**: `Server running on http://localhost:3001`

**Verify in another terminal**:
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Terminal 2: Backend

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/backend
cargo run
```

**Expected**: `Server running on 0.0.0.0:2000`

### Terminal 3: Frontend

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/frontend
npm run dev
```

**Expected**: `Local: http://localhost:5173`

---

## ✅ Step 6: Test in Browser

1. Open: **http://localhost:5173**

2. **Register** a test account:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Name: `Test User`

3. **Check browser console** (F12):
   ```javascript
   localStorage.getItem('better-auth-token')
   // Should show JWT token
   ```

4. **Reload page** - should stay logged in

5. **Logout** - token should be removed

6. **Login again** - should work

---

## ✅ Step 7: Test API Endpoints

```bash
# Test Registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api-test@example.com",
    "password": "TestPassword123!",
    "name": "API Test"
  }'

# Save the token from response, then test introspection
curl -X POST http://localhost:2000/api/auth-proxy/introspect \
  -H "Content-Type: application/json" \
  -d '{"token":"<paste-token-here>"}'
```

---

## ✅ Step 8: Verify Feature Flags

In browser console:

```javascript
// Check current flags
window.__featureFlags.current()

// Disable Better Auth (test fallback to legacy)
window.__featureFlags.set('enableBetterAuth', false)

// Reload page - should use legacy auth

// Re-enable Better Auth
window.__featureFlags.set('enableBetterAuth', true)

// Reload page - should use Better Auth
```

---

## 🎉 Success Criteria

- [ ] Auth server running on port 3001
- [ ] Backend running on port 2000  
- [ ] Frontend running on port 5173
- [ ] Health checks passing for all services
- [ ] Registration works
- [ ] Login works
- [ ] Token in localStorage
- [ ] Session persists across reload
- [ ] Logout works
- [ ] Migration banner shows and dismisses

---

## 🆘 If Something Goes Wrong

**Auth server errors**:
```bash
# Check logs in Terminal 1
# Common issues:
# - Database connection: Check DATABASE_URL
# - Port in use: Check with: lsof -i :3001
```

**Backend errors**:
```bash
# Check if JWT secrets match
grep JWT_SECRET auth-server/.env
grep BETTER_AUTH_JWT_SECRET backend/.env
# These MUST be identical!
```

**Frontend errors**:
```bash
# Check browser console (F12)
# Check network tab for API calls
# Verify .env.local created correctly
```

---

## 📞 Quick Reference

| Component | Port | Health Check | Logs |
|-----------|------|--------------|------|
| Auth Server | 3001 | `curl localhost:3001/health` | Terminal 1 |
| Backend | 2000 | `curl localhost:2000/health` | Terminal 2 |
| Frontend | 5173 | Open in browser | Browser Console |

---

**Run these commands in order and you're done!** 🚀

