# Better Auth Rollout Guide

**Last Updated**: November 29, 2025  
**Version**: 1.0.0  
**Status**: Ready for Deployment

## Overview

This guide provides step-by-step instructions for rolling out the Better Auth migration to production. The rollout is designed for zero-downtime deployment with gradual user migration and easy rollback capability.

## Pre-Deployment Checklist

### ✅ Agent 1: Auth Server

- [ ] Auth server code reviewed and tested
- [ ] Environment variables configured (`.env`)
- [ ] Database connection verified
- [ ] Google OAuth credentials configured
- [ ] Port 3001 available and accessible
- [ ] Health endpoint responding (`/health`)
- [ ] JWT secret generated (32+ bytes)
- [ ] SMTP configured for email verification

### ✅ Agent 2: Frontend

- [ ] Better Auth client configured (port 3001)
- [ ] Feature flags configured in `.env`
- [ ] Build successful (`npm run build`)
- [ ] Environment variables set for production
- [ ] Google Client ID configured
- [ ] Migration banner tested
- [ ] UnifiedAuthProvider integrated

### ✅ Agent 3: Backend

- [ ] Better Auth middleware compiled
- [ ] Dual auth middleware compiled
- [ ] Database migrations reviewed
- [ ] Migration scripts tested
- [ ] CORS configuration updated (port 3001)
- [ ] Monitoring metrics configured
- [ ] Zero-trust middleware updated
- [ ] WebSocket authentication updated

---

## Deployment Steps

### Phase 1: Infrastructure Setup (Day 1)

#### Step 1.1: Deploy Auth Server

```bash
# Navigate to auth server
cd auth-server/

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with production values
nano .env

# Build
npm run build

# Start with PM2 (recommended)
pm2 start npm --name "better-auth-server" -- start
pm2 save
```

**Environment Variables**:
```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/reconciliation_db
JWT_SECRET=<generate-with: openssl rand -hex 32>
PORT=3001
NODE_ENV=production

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://auth.yourdomain.com/api/auth/callback/google

# Email (if using verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@yourdomain.com

# Security
BCRYPT_COST=12
SESSION_TIMEOUT_MINUTES=30
```

**Verify Deployment**:
```bash
# Check if server is running
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

#### Step 1.2: Run Database Migrations

```bash
# Navigate to backend
cd ../backend/

# Review migration
cat migrations/better_auth_compat.sql

# Run migration
psql $DATABASE_URL -f migrations/better_auth_compat.sql

# Verify tables created
psql $DATABASE_URL -c "\dt" | grep better_auth
```

**Expected Tables**:
- `better_auth_sessions`
- `better_auth_accounts`
- `better_auth_verification_tokens`
- `auth_audit_log`

#### Step 1.3: Deploy Backend Updates

```bash
# Build backend
cargo build --release

# Stop current backend
systemctl stop reconciliation-backend
# or: pm2 stop reconciliation-backend

# Update environment
nano /path/to/backend/.env

# Add Better Auth configuration
# AUTH_SERVER_URL=http://localhost:3001
# BETTER_AUTH_JWT_SECRET=<same-as-auth-server-JWT_SECRET>
# PREFER_BETTER_AUTH=true
# ENABLE_DUAL_AUTH=true

# Start backend
systemctl start reconciliation-backend
# or: pm2 start reconciliation-backend

# Verify backend is running
curl http://localhost:2000/health
```

#### Step 1.4: Deploy Frontend Updates

```bash
# Navigate to frontend
cd ../frontend/

# Create production environment file
cp .env.example .env.production

# Edit with production values
nano .env.production
```

**Production Environment**:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
VITE_AUTH_SERVER_URL=https://auth.yourdomain.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Feature Flags - Start with Better Auth DISABLED
VITE_ENABLE_BETTER_AUTH=false
VITE_ENABLE_DUAL_AUTH=true
VITE_ENABLE_OAUTH=true
VITE_SHOW_MIGRATION_BANNER=false
```

```bash
# Build for production
npm run build

# Test production build locally
npm run preview

# Deploy to hosting (example: nginx)
sudo cp -r dist/* /var/www/yourdomain.com/
sudo systemctl reload nginx
```

**Verification**:
```bash
# Check frontend is accessible
curl https://yourdomain.com

# Check auth endpoints
curl https://api.yourdomain.com/api/auth-proxy/introspect \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"token":"test"}'
```

---

### Phase 2: Beta Testing (Days 2-7)

#### Step 2.1: Enable Better Auth for Testing

**Update Frontend Environment**:
```env
VITE_ENABLE_BETTER_AUTH=true
VITE_ENABLE_DUAL_AUTH=true
VITE_SHOW_MIGRATION_BANNER=true
```

**Rebuild and Deploy**:
```bash
cd frontend/
npm run build
sudo cp -r dist/* /var/www/yourdomain.com/
sudo systemctl reload nginx
```

#### Step 2.2: Test Auth Flows

**Test Checklist**:
```bash
# 1. Test registration
curl https://auth.yourdomain.com/api/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'

# 2. Test login
curl https://auth.yourdomain.com/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# 3. Test token introspection
curl https://api.yourdomain.com/api/auth-proxy/introspect \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"token":"<token-from-login>"}'

# 4. Test token refresh
curl https://api.yourdomain.com/api/auth-proxy/refresh \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh-token>"}'
```

**Manual Testing**:
- [ ] Register new account
- [ ] Login with email/password
- [ ] Login with Google OAuth
- [ ] Session persists across page reload
- [ ] Session timeout works
- [ ] Token refresh works
- [ ] Logout works
- [ ] Rate limiting works (try 6+ failed logins)
- [ ] Password strength validation works
- [ ] Migration banner displays and dismisses

#### Step 2.3: Monitor Metrics

```bash
# Check Prometheus metrics
curl http://localhost:9090/metrics | grep better_auth

# Key metrics to watch:
# - better_auth_attempts_total
# - better_auth_success_total
# - better_auth_failures_total
# - better_auth_token_validations_total
# - better_auth_active_sessions
```

**Set up Grafana Dashboard**:
```json
{
  "panels": [
    {
      "title": "Authentication Success Rate",
      "targets": [
        {
          "expr": "rate(better_auth_success_total[5m]) / rate(better_auth_attempts_total[5m])"
        }
      ]
    },
    {
      "title": "Active Sessions",
      "targets": [
        {
          "expr": "better_auth_active_sessions"
        }
      ]
    },
    {
      "title": "Token Cache Hit Rate",
      "targets": [
        {
          "expr": "rate(better_auth_token_cache_hits_total[5m]) / rate(better_auth_token_validations_total[5m])"
        }
      ]
    }
  ]
}
```

#### Step 2.4: Migrate Beta Users

```bash
# Navigate to scripts directory
cd scripts/

# Install dependencies
npm install

# Dry run migration for beta users
npm run migrate-users -- --dry-run --batch-size=10

# Review output, then run actual migration
npm run migrate-users -- --batch-size=10

# Verify migration
psql $DATABASE_URL -c "SELECT migration_status, COUNT(*) FROM users GROUP BY migration_status;"
```

**Expected Output**:
```
 migration_status | count 
------------------+-------
 pending         |   990
 migrated        |    10
```

---

### Phase 3: Gradual Rollout (Days 8-14)

#### Step 3.1: Increase Migration Batch Size

```bash
# Migrate in larger batches
npm run migrate-users -- --batch-size=100

# Monitor after each batch
psql $DATABASE_URL -c "SELECT 
  COUNT(*) FILTER (WHERE migration_status = 'migrated') as migrated,
  COUNT(*) FILTER (WHERE migration_status = 'pending') as pending,
  COUNT(*) as total
FROM users WHERE deleted_at IS NULL;"
```

#### Step 3.2: Monitor Error Rates

**Check Application Logs**:
```bash
# Backend logs
journalctl -u reconciliation-backend -f | grep -i "auth\|better_auth"

# Auth server logs
pm2 logs better-auth-server

# Watch for errors
tail -f /var/log/nginx/error.log | grep auth
```

**Set Up Alerts** (Example: Prometheus Alertmanager):
```yaml
groups:
  - name: better_auth_alerts
    rules:
      - alert: HighAuthFailureRate
        expr: rate(better_auth_failures_total[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High authentication failure rate"
          
      - alert: LowCacheHitRate
        expr: rate(better_auth_token_cache_hits_total[5m]) / rate(better_auth_token_validations_total[5m]) < 0.8
        for: 10m
        annotations:
          summary: "Token cache hit rate below 80%"
```

#### Step 3.3: Communicate with Users

**Email Template**:
```
Subject: Security Upgrade: Improved Authentication System

Dear [User],

We've upgraded our authentication system to provide you with enhanced 
security and a better experience. Your existing account will continue 
to work seamlessly - no action is required on your part.

What's new:
- Enhanced security with modern encryption
- Faster login experience
- Improved session management
- Better multi-device support

If you experience any issues logging in, please contact support at 
support@yourdomain.com

Thank you,
The Team
```

---

### Phase 4: Complete Migration (Day 15+)

#### Step 4.1: Verify All Users Migrated

```bash
# Check migration status
psql $DATABASE_URL -c "
SELECT 
  migration_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM users 
WHERE deleted_at IS NULL
GROUP BY migration_status
ORDER BY count DESC;
"
```

**Target Output**:
```
 migration_status | count | percentage 
------------------+-------+------------
 migrated        |  1000 |     100.00
```

#### Step 4.2: Disable Legacy Auth

**Update Backend Environment**:
```env
ENABLE_DUAL_AUTH=false
PREFER_BETTER_AUTH=true
```

**Update Frontend Environment**:
```env
VITE_ENABLE_BETTER_AUTH=true
VITE_ENABLE_DUAL_AUTH=false
```

**Restart Services**:
```bash
# Backend
systemctl restart reconciliation-backend

# Frontend (rebuild and redeploy)
cd frontend/
npm run build
sudo cp -r dist/* /var/www/yourdomain.com/
sudo systemctl reload nginx
```

#### Step 4.3: Monitor Post-Cutover

**Watch for Issues** (24-48 hours):
```bash
# Monitor error rates
watch -n 10 'curl -s http://localhost:9090/api/v1/query?query=rate(better_auth_failures_total[5m])'

# Check active sessions
watch -n 30 'curl -s http://localhost:9090/api/v1/query?query=better_auth_active_sessions'

# Monitor application logs
multitail \
  /var/log/reconciliation-backend/app.log \
  <(pm2 logs better-auth-server --lines 50) \
  /var/log/nginx/access.log
```

---

## Rollback Procedures

### Emergency Rollback (if issues detected)

#### Quick Rollback (Frontend Only)

```bash
# Disable Better Auth immediately
cd frontend/

# Update .env.production
sed -i 's/VITE_ENABLE_BETTER_AUTH=true/VITE_ENABLE_BETTER_AUTH=false/' .env.production

# Rebuild and redeploy
npm run build
sudo cp -r dist/* /var/www/yourdomain.com/
sudo systemctl reload nginx

# Verify legacy auth is working
curl https://yourdomain.com
```

**Estimated Time**: 5-10 minutes

#### Full Rollback (if database issues)

```bash
# 1. Disable Better Auth on frontend (as above)

# 2. Rollback user migrations
cd scripts/
npm run migrate-users -- --rollback --batch-size=100

# 3. Verify rollback
psql $DATABASE_URL -c "SELECT migration_status, COUNT(*) FROM users GROUP BY migration_status;"

# 4. Stop auth server (optional)
pm2 stop better-auth-server
```

**Estimated Time**: 15-30 minutes

---

## Post-Deployment Tasks

### Day 30: Cleanup

```bash
# Remove migration banner
# Update .env.production
VITE_SHOW_MIGRATION_BANNER=false

# Rebuild frontend
cd frontend/
npm run build
sudo cp -r dist/* /var/www/yourdomain.com/
```

### Day 60: Remove Legacy Code

**Create cleanup branch**:
```bash
git checkout -b cleanup/remove-legacy-auth

# Remove legacy auth files
rm frontend/src/hooks/useAuth.tsx  # Keep Better Auth version
rm -rf backend/src/middleware/auth.rs  # Keep dual_auth.rs

# Update imports
# ... update all references to use Better Auth

# Test thoroughly
npm run test
cargo test

# Create PR for review
git add .
git commit -s -m "chore: Remove legacy authentication code"
git push origin cleanup/remove-legacy-auth
```

---

## Monitoring and Alerts

### Key Metrics to Track

1. **Authentication Success Rate**
   - Target: >95%
   - Alert if: <90% for 5 minutes

2. **Token Validation Latency**
   - Target: <100ms (p95)
   - Alert if: >200ms (p95) for 5 minutes

3. **Active Sessions**
   - Normal range: Track baseline
   - Alert if: Drops >20% suddenly

4. **Cache Hit Rate**
   - Target: >80%
   - Alert if: <70% for 10 minutes

5. **Error Rate**
   - Target: <1%
   - Alert if: >5% for 5 minutes

### Health Check Endpoints

```bash
# Auth server health
curl https://auth.yourdomain.com/health

# Backend health (includes auth check)
curl https://api.yourdomain.com/health

# Frontend (check deployment)
curl https://yourdomain.com
```

---

## Troubleshooting

### Issue: Auth server not starting

**Check**:
```bash
# View logs
pm2 logs better-auth-server

# Common issues:
# 1. Port 3001 already in use
lsof -i :3001

# 2. Database connection failed
psql $DATABASE_URL -c "SELECT 1"

# 3. Missing environment variables
cat auth-server/.env | grep -E "DATABASE_URL|JWT_SECRET|PORT"
```

### Issue: Users can't log in

**Check**:
```bash
# 1. Verify auth server is responding
curl http://localhost:3001/health

# 2. Check CORS configuration
curl -I https://api.yourdomain.com/api/auth-proxy/introspect

# 3. Verify JWT secret matches
echo $BETTER_AUTH_JWT_SECRET  # Backend
cat auth-server/.env | grep JWT_SECRET  # Auth server
# These MUST match!

# 4. Check database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM better_auth_sessions"
```

### Issue: High error rate after migration

**Check**:
```bash
# 1. Check migration status
psql $DATABASE_URL -c "
SELECT migration_status, last_auth_method, COUNT(*) 
FROM users 
WHERE deleted_at IS NULL 
GROUP BY migration_status, last_auth_method;
"

# 2. Check auth audit log
psql $DATABASE_URL -c "
SELECT event_type, auth_method, success, COUNT(*) 
FROM auth_audit_log 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type, auth_method, success
ORDER BY COUNT(*) DESC;
"

# 3. Review application logs
journalctl -u reconciliation-backend --since "1 hour ago" | grep -i error
```

---

## Success Criteria

### Phase 1 (Infrastructure)
- [ ] Auth server running and healthy
- [ ] Database migrations applied
- [ ] Backend restarted with Better Auth config
- [ ] Frontend deployed (Better Auth disabled)

### Phase 2 (Beta Testing)
- [ ] 10+ beta users successfully migrated
- [ ] All auth flows tested and working
- [ ] No critical errors in logs
- [ ] Metrics showing healthy performance

### Phase 3 (Gradual Rollout)
- [ ] 50% of users migrated
- [ ] Auth success rate >95%
- [ ] Token cache hit rate >80%
- [ ] No P1/P2 incidents

### Phase 4 (Complete)
- [ ] 100% of users migrated
- [ ] Legacy auth disabled
- [ ] Monitoring showing stable metrics
- [ ] Zero authentication-related P1 incidents

---

## Support Contacts

### During Rollout

**Technical Lead**: [Name/Email]  
**Backend Team**: [Contact]  
**Frontend Team**: [Contact]  
**Database Admin**: [Contact]  
**DevOps**: [Contact]

### Escalation

**P1 (Critical)**: All auth down - Immediate escalation  
**P2 (High)**: High error rate - Escalate if >1 hour  
**P3 (Medium)**: Performance degradation - Monitor and escalate if worsening  
**P4 (Low)**: Minor issues - Track and fix in next release

---

## Appendix

### A. Environment Variable Reference

See `docs/development/BETTER_AUTH_ENVIRONMENT_SETUP.md`

### B. Database Schema

See `backend/migrations/better_auth_compat.sql`

### C. API Documentation

See `docs/architecture/AGENT1_IMPLEMENTATION_SUMMARY.md`

### D. Frontend Integration

See `docs/architecture/AGENT2_IMPLEMENTATION_SUMMARY.md`

### E. Backend Integration

See `docs/architecture/AGENT3_IMPLEMENTATION_SUMMARY.md`

---

**Document Version**: 1.0.0  
**Last Updated**: November 29, 2025  
**Next Review**: After Phase 4 completion

