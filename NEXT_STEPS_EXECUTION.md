# Better Auth - Next Steps Execution Guide

**Date**: November 29, 2025  
**Status**: Ready to Execute

This guide will walk you through executing the rollout step-by-step.

---

## Step 1: Pre-Flight Validation ✈️

### 1.1 Run Validation Script

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378
./scripts/validate-better-auth-implementation.sh
```

**Expected Result**: All checks should pass  
**If fails**: Fix any errors before proceeding

### 1.2 Check Prerequisites

```bash
# Check Node.js version (need 18+)
node --version

# Check Rust/Cargo installed
cargo --version

# Check PostgreSQL accessible
psql $DATABASE_URL -c "SELECT version();"

# Check ports available
lsof -i :3001  # Should be empty (auth server port)
lsof -i :2000  # Backend should be here
```

---

## Step 2: Development Testing 🧪

### 2.1 Set Up Auth Server Environment

```bash
cd auth-server/

# Create .env file
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://localhost:5432/reconciliation_db

# Server
PORT=3001
NODE_ENV=development

# Security - Generate new secret!
JWT_SECRET=$(openssl rand -hex 32)
BCRYPT_COST=12

# Session
SESSION_TIMEOUT_MINUTES=30

# OAuth (optional for testing)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback/google

# Email (optional for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@yourdomain.com
EOF

echo "✓ Auth server .env created"

# Install dependencies
npm install

echo "✓ Dependencies installed"
```

### 2.2 Run Database Migrations

```bash
cd ../backend/

# Backup database first (important!)
pg_dump $DATABASE_URL > backup_before_better_auth_$(date +%Y%m%d_%H%M%S).sql

echo "✓ Database backed up"

# Review migration
cat migrations/better_auth_compat.sql | head -50

echo "Press Enter to run migration (Ctrl+C to cancel)"
read

# Run migration
psql $DATABASE_URL -f migrations/better_auth_compat.sql

echo "✓ Migration completed"

# Verify tables created
psql $DATABASE_URL -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%better_auth%' OR table_name = 'auth_audit_log'
ORDER BY table_name;
"
```

**Expected Output**:
```
      table_name          
--------------------------
 auth_audit_log
 better_auth_accounts
 better_auth_sessions
 better_auth_verification_tokens
```

### 2.3 Update Backend Configuration

```bash
cd backend/

# Backup current .env
cp .env .env.backup

# Add Better Auth configuration
cat >> .env << 'EOF'

# ============================================================================
# Better Auth Configuration (Added $(date +%Y-%m-%d))
# ============================================================================

# Auth Server URL
AUTH_SERVER_URL=http://localhost:3001

# JWT Secret (MUST match auth-server JWT_SECRET!)
BETTER_AUTH_JWT_SECRET=$(cat ../auth-server/.env | grep JWT_SECRET | cut -d= -f2)

# Feature Flags
PREFER_BETTER_AUTH=true
ENABLE_DUAL_AUTH=true
ENABLE_BETTER_AUTH=true

# Token Cache
TOKEN_CACHE_TTL=300
EOF

echo "✓ Backend .env updated"
```

### 2.4 Update Frontend Configuration

```bash
cd ../frontend/

# Create/update .env.local for development
cat > .env.local << 'EOF'
# API Configuration
VITE_API_BASE_URL=http://localhost:2000
VITE_WS_URL=ws://localhost:2000

# Better Auth Configuration
VITE_AUTH_SERVER_URL=http://localhost:3001

# Feature Flags - Start with Better Auth ENABLED for testing
VITE_ENABLE_BETTER_AUTH=true
VITE_ENABLE_DUAL_AUTH=true
VITE_ENABLE_OAUTH=true
VITE_ENABLE_EMAIL_VERIFICATION=true
VITE_ENABLE_PASSWORD_RESET=true
VITE_SHOW_MIGRATION_BANNER=true

# OAuth (optional)
VITE_GOOGLE_CLIENT_ID=

# Environment
VITE_ENVIRONMENT=development
EOF

echo "✓ Frontend .env.local created"
```

---

## Step 3: Start Services 🚀

### 3.1 Start Auth Server (Terminal 1)

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/auth-server

# Start in development mode
npm run dev

# Watch for: "Server running on http://localhost:3001"
```

**Verify in another terminal**:
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 3.2 Start Backend (Terminal 2)

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/backend

# Build and run
cargo run

# Watch for: "Server running on 0.0.0.0:2000"
```

**Verify**:
```bash
curl http://localhost:2000/health
# Should return health status
```

### 3.3 Start Frontend (Terminal 3)

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/frontend

# Start development server
npm run dev

# Watch for: "Local: http://localhost:5173"
```

---

## Step 4: Manual Testing 🧪

### 4.1 Test Registration

Open browser to http://localhost:5173

1. **Navigate to Register/Signup**
2. **Fill in**:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Name: `Test User`
3. **Click Register**
4. **Expected**: Success message, redirected to dashboard

**Verify in browser console**:
```javascript
localStorage.getItem('better-auth-token')
// Should show JWT token
```

### 4.2 Test Login

1. **Logout** (if logged in)
2. **Navigate to Login**
3. **Fill in**:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
4. **Click Login**
5. **Expected**: Success, redirected to dashboard

### 4.3 Test Session Persistence

1. **Reload page** (F5)
2. **Expected**: Still logged in, no redirect to login

### 4.4 Test Logout

1. **Click Logout**
2. **Expected**: Token removed, redirected to login

**Verify**:
```javascript
localStorage.getItem('better-auth-token')
// Should be null
```

### 4.5 Test Rate Limiting

1. **Try to login with wrong password 6 times**
2. **Expected**: After 5 attempts, see rate limit message
3. **Wait 1 minute**, try again
4. **Expected**: Can attempt again

### 4.6 Test Migration Banner

1. **Check if banner appears at top**
2. **Click dismiss (X)**
3. **Reload page**
4. **Expected**: Banner stays dismissed

---

## Step 5: API Testing 🔍

### 5.1 Test Auth Endpoints

```bash
# Test Registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api-test@example.com",
    "password": "TestPassword123!",
    "name": "API Test User"
  }'

# Should return: user object with token

# Save token for next tests
TOKEN="<paste-token-here>"

# Test Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api-test@example.com",
    "password": "TestPassword123!"
  }'

# Test Token Introspection
curl -X POST http://localhost:2000/api/auth-proxy/introspect \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\"}"

# Should return: active=true with user claims

# Test Protected Endpoint
curl -X GET http://localhost:2000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Should return: user information
```

### 5.2 Test Migration

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/scripts

# Install migration script dependencies
npm install

# Dry run migration (test user)
npm run migrate-users -- --dry-run --batch-size=1

# If looks good, migrate test user
npm run migrate-users -- --batch-size=1

# Check migration status
psql $DATABASE_URL -c "
SELECT 
  migration_status,
  last_auth_method,
  COUNT(*) as count
FROM users 
WHERE deleted_at IS NULL
GROUP BY migration_status, last_auth_method;
"
```

---

## Step 6: Monitor Metrics 📊

### 6.1 Check Prometheus Metrics

```bash
# Check Better Auth metrics are being recorded
curl http://localhost:9090/metrics 2>/dev/null | grep better_auth | head -20

# Key metrics to look for:
# - better_auth_attempts_total
# - better_auth_success_total
# - better_auth_failures_total
# - better_auth_active_sessions
# - better_auth_token_validations_total
```

### 6.2 Check Application Logs

```bash
# Backend logs
tail -f backend.log | grep -i "better_auth\|auth"

# Auth server logs (if using PM2)
pm2 logs better-auth-server

# Or check terminal where auth server is running
```

---

## Step 7: Feature Flag Testing 🎚️

### 7.1 Test Disabling Better Auth

```bash
cd frontend/

# Update .env.local
sed -i '' 's/VITE_ENABLE_BETTER_AUTH=true/VITE_ENABLE_BETTER_AUTH=false/' .env.local

# Restart frontend dev server (Ctrl+C, then npm run dev)
```

**Test**: Should fall back to legacy auth

### 7.2 Test Re-enabling Better Auth

```bash
# Update .env.local
sed -i '' 's/VITE_ENABLE_BETTER_AUTH=false/VITE_ENABLE_BETTER_AUTH=true/' .env.local

# Restart frontend
```

**Test**: Should use Better Auth again

---

## Step 8: Deployment Preparation 📦

### 8.1 Create Production Environment Files

```bash
# Auth Server Production
cat > auth-server/.env.production << 'EOF'
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
PORT=3001
NODE_ENV=production
BCRYPT_COST=12
SESSION_TIMEOUT_MINUTES=30
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_REDIRECT_URI=https://auth.yourdomain.com/api/auth/callback/google
EOF

# Backend Production (.env updates)
cat >> backend/.env.production << 'EOF'
AUTH_SERVER_URL=https://auth.yourdomain.com
BETTER_AUTH_JWT_SECRET=${BETTER_AUTH_JWT_SECRET}
PREFER_BETTER_AUTH=true
ENABLE_DUAL_AUTH=true
EOF

# Frontend Production
cat > frontend/.env.production << 'EOF'
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
VITE_AUTH_SERVER_URL=https://auth.yourdomain.com
VITE_ENABLE_BETTER_AUTH=false
VITE_ENABLE_DUAL_AUTH=true
VITE_ENABLE_OAUTH=true
VITE_SHOW_MIGRATION_BANNER=false
EOF

echo "✓ Production environment files created"
echo "⚠️  Update placeholder values with actual production values"
```

### 8.2 Build for Production

```bash
# Build Auth Server
cd auth-server/
npm run build

# Build Backend
cd ../backend/
cargo build --release

# Build Frontend
cd ../frontend/
npm run build

echo "✓ All components built for production"
```

### 8.3 Test Production Builds Locally

```bash
# Test auth server production build
cd auth-server/
NODE_ENV=production node dist/server.js &
AUTH_PID=$!

# Test frontend production build
cd ../frontend/
npm run preview &
FRONTEND_PID=$!

# Test endpoints
sleep 5
curl http://localhost:3001/health
curl http://localhost:4173

# Stop test servers
kill $AUTH_PID $FRONTEND_PID
```

---

## Step 9: Deployment Checklist ✅

Print and complete: `BETTER_AUTH_DEPLOYMENT_CHECKLIST.md`

**Quick Checklist**:
- [ ] Validation script passed
- [ ] All manual tests passed
- [ ] API tests passed
- [ ] Migration tested
- [ ] Metrics working
- [ ] Feature flags tested
- [ ] Production builds successful
- [ ] Rollback procedure understood
- [ ] Team briefed
- [ ] Backup taken
- [ ] Monitoring configured
- [ ] Documentation reviewed

---

## Step 10: Deploy to Production 🚀

### 10.1 Deploy Phase 1 (Infrastructure)

**IMPORTANT**: Deploy with Better Auth DISABLED initially!

```bash
# 1. Deploy Auth Server
ssh production-server
cd /opt/better-auth/
git pull
npm install --production
pm2 restart better-auth-server

# 2. Run Migrations
cd /opt/backend/
psql $DATABASE_URL -f migrations/better_auth_compat.sql

# 3. Deploy Backend
cargo build --release
systemctl restart reconciliation-backend

# 4. Deploy Frontend (Better Auth DISABLED)
cd /opt/frontend/
npm run build
# Copy to web server
```

### 10.2 Verify Production

```bash
# Check auth server
curl https://auth.yourdomain.com/health

# Check backend
curl https://api.yourdomain.com/health

# Check frontend
curl https://yourdomain.com

# Check users can still login (legacy auth)
```

### 10.3 Enable Better Auth (Phase 2)

**After verifying everything works with legacy auth**:

```bash
# Update frontend environment
VITE_ENABLE_BETTER_AUTH=true

# Rebuild and redeploy
npm run build
# Redeploy frontend

# Monitor metrics closely for 1 hour
```

---

## Troubleshooting 🔧

### Issue: Auth server won't start

```bash
# Check logs
pm2 logs better-auth-server --lines 50

# Check port
lsof -i :3001

# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Verify .env file
cat auth-server/.env | grep -v PASSWORD
```

### Issue: Users can't login

```bash
# Verify auth server is responding
curl http://localhost:3001/health

# Check JWT secrets match
cat auth-server/.env | grep JWT_SECRET
cat backend/.env | grep BETTER_AUTH_JWT_SECRET
# These MUST be identical!

# Check CORS
curl -I http://localhost:2000/api/auth-proxy/introspect
# Should allow origin from frontend

# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM better_auth_sessions"
```

### Issue: Migration fails

```bash
# Check migration script logs
npm run migrate-users -- --dry-run --batch-size=1

# Check database connection
psql $DATABASE_URL -c "SELECT migration_status, COUNT(*) FROM users GROUP BY migration_status"

# Rollback if needed
npm run migrate-users -- --rollback --batch-size=1
```

---

## Emergency Rollback 🚨

If anything goes wrong:

```bash
# 1. Disable Better Auth immediately
cd frontend/
sed -i 's/VITE_ENABLE_BETTER_AUTH=true/VITE_ENABLE_BETTER_AUTH=false/' .env.production
npm run build
# Redeploy

# 2. Verify legacy auth works
curl https://yourdomain.com

# 3. Investigate issue with dev team
```

---

## Success Criteria ✨

### Development Testing
- [ ] Auth server starts without errors
- [ ] Database migrations successful
- [ ] Registration works
- [ ] Login works
- [ ] OAuth works (if configured)
- [ ] Session persistence works
- [ ] Rate limiting works
- [ ] Migration works
- [ ] Metrics collecting
- [ ] Feature flags work

### Production Deployment
- [ ] Phase 1 deployed (Better Auth disabled)
- [ ] All health checks passing
- [ ] Users can login (legacy auth)
- [ ] Phase 2 enabled (Better Auth active)
- [ ] Beta users migrated
- [ ] Metrics healthy (>95% success rate)
- [ ] No critical errors in logs
- [ ] Rollback tested and ready

---

## Next Actions

1. **Now**: Complete Steps 1-7 (Development Testing)
2. **Tomorrow**: Complete Step 8 (Production Preparation)
3. **Next Week**: Deploy Phase 1 (Infrastructure)
4. **Week After**: Deploy Phase 2 (Enable Better Auth)

---

**Document**: NEXT_STEPS_EXECUTION.md  
**Version**: 1.0  
**Date**: November 29, 2025

