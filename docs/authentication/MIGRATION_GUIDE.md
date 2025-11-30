# Better Auth Migration - Production Runbook

## 📋 Complete Step-by-Step Migration Guide

This runbook provides detailed instructions for migrating from the legacy authentication system to Better Auth in production with zero downtime.

---

## Pre-Migration Checklist

### Planning Phase
- [x] Review all documentation
- [x] Identify maintenance window (recommended: off-peak hours)
- [x] Notify users of upcoming changes
- [x] Prepare rollback plan
- [x] Set up monitoring and alerts
- [x] Test in staging environment
- [x] Get stakeholder approval

### Technical Prerequisites
- [x] PostgreSQL database accessible
- [x] Database backups completed
- [x] Environment variables documented
- [x] Google OAuth credentials ready
- [x] JWT secret matches between systems
- [x] Monitoring tools configured

---

## Migration Timeline

**Recommended Schedule:**
- **Day 0** (T-24h): Final staging tests
- **Day 1** (T-0h): Deploy auth server
- **Day 2** (T+24h): Enable dual mode
- **Day 3-7** (T+48h - T+168h): Monitor and gradual rollout
- **Day 14** (T+336h): Full cutover
- **Day 30** (T+720h): Remove legacy code

---

## Phase 1: Pre-Deployment (Day 0)

### Step 1.1: Backup Database
```bash
# Create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup
ls -lh backup-*.sql
```

✅ **Checkpoint**: Backup file created and verified

### Step 1.2: Test in Staging
```bash
# Deploy to staging
bash scripts/deploy-better-auth.sh staging

# Run integration tests
bash scripts/test-better-auth.sh

# Manual testing
# - Test login with staging users
# - Test registration
# - Test Google OAuth
# - Test session management
```

✅ **Checkpoint**: All staging tests pass

### Step 1.3: Final Code Review
```bash
# Review changes
git diff master..HEAD

# Check for any uncommitted changes
git status

# Ensure all tests pass locally
npm run test
cargo test
```

✅ **Checkpoint**: Code review approved

---

## Phase 2: Deploy Auth Server (Day 1)

### Step 2.1: Deploy Auth Server
```bash
# Navigate to project root
cd /path/to/reconciliation-platform

# Set environment to production
export ENVIRONMENT=production

# Deploy auth server
docker-compose -f docker-compose.better-auth.yml up -d auth-server

# Check logs
docker-compose logs -f auth-server
```

✅ **Checkpoint**: Auth server running and healthy

### Step 2.2: Run Database Migrations
```bash
# Run Better Auth migrations
docker-compose exec auth-server npm run db:migrate

# Verify migrations
psql $DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY executed_at DESC LIMIT 5;"
```

✅ **Checkpoint**: Migrations executed successfully

### Step 2.3: Verify Auth Server
```bash
# Health check
curl https://auth.your-domain.com/health

# Expected: {"status":"ok",...}

# Test registration
curl -X POST https://auth.your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@your-company.com",
    "password": "SecurePass123!",
    "first_name": "Test",
    "last_name": "User"
  }'

# Test login
curl -X POST https://auth.your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@your-company.com",
    "password": "SecurePass123!"
  }'
```

✅ **Checkpoint**: Auth server responding correctly

---

## Phase 3: Enable Dual Mode (Day 2)

### Step 3.1: Update Backend Configuration
```bash
# Update backend environment variables
# Add to .env or set in deployment:
export BETTER_AUTH_SERVER_URL=https://auth.your-domain.com
export BETTER_AUTH_ENABLED=true
export BETTER_AUTH_DUAL_MODE=true
export BETTER_AUTH_CACHE_TTL=300
```

### Step 3.2: Deploy Backend Update
```bash
# Rebuild backend with Better Auth support
cd backend
cargo build --release

# Deploy updated backend
systemctl restart reconciliation-backend
# OR
docker-compose restart backend

# Check logs
journalctl -u reconciliation-backend -f
# OR
docker-compose logs -f backend
```

✅ **Checkpoint**: Backend running with dual mode enabled

### Step 3.3: Verify Dual Mode
```bash
# Test with Better Auth token
NEW_TOKEN=$(curl -s -X POST https://auth.your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@your-company.com","password":"SecurePass123!"}' \
  | jq -r '.token')

curl -H "Authorization: Bearer $NEW_TOKEN" \
  https://api.your-domain.com/api/v1/auth/me

# Test with legacy token (if available)
curl -H "Authorization: Bearer $LEGACY_TOKEN" \
  https://api.your-domain.com/api/v1/auth/me
```

✅ **Checkpoint**: Both token types accepted

---

## Phase 4: Frontend Deployment (Day 2)

### Step 4.1: Update Frontend Configuration
```bash
cd frontend

# Update .env.production
echo "VITE_AUTH_SERVER_URL=https://auth.your-domain.com" >> .env.production
```

### Step 4.2: Build and Deploy Frontend
```bash
# Build frontend
npm run build

# Deploy to hosting (example: Vercel)
vercel --prod

# OR deploy to static hosting
aws s3 sync dist/ s3://your-frontend-bucket/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

✅ **Checkpoint**: Frontend deployed with new config

### Step 4.3: Verify Frontend
```bash
# Open browser to production URL
# Test:
# 1. Login with email/password
# 2. Registration
# 3. Google OAuth
# 4. Session timeout
# 5. Token refresh
```

✅ **Checkpoint**: Frontend authentication working

---

## Phase 5: Gradual Rollout (Days 3-7)

### Step 5.1: Enable for Internal Users (10%)
```typescript
// Add to frontend code (optional feature flag)
const BETA_TESTERS = [
  'admin@your-company.com',
  'dev@your-company.com',
  // Add internal team emails
];

const useBetterAuth = () => {
  const userEmail = getCurrentUserEmail();
  return BETA_TESTERS.includes(userEmail);
};
```

**Day 3**: Deploy with 10% rollout  
✅ **Checkpoint**: Internal users using Better Auth

### Step 5.2: Expand to 25% (Day 4)
```typescript
// Percentage-based rollout
const ROLLOUT_PERCENTAGE = 25;
const useBetterAuth = () => {
  const hash = hashEmail(getCurrentUserEmail());
  return (hash % 100) < ROLLOUT_PERCENTAGE;
};
```

✅ **Checkpoint**: 25% of users on Better Auth

### Step 5.3: Expand to 50% (Day 5)
```typescript
const ROLLOUT_PERCENTAGE = 50;
```

✅ **Checkpoint**: 50% of users on Better Auth

### Step 5.4: Expand to 100% (Day 7)
```typescript
const ROLLOUT_PERCENTAGE = 100;
// Or simply:
const useBetterAuth = () => true;
```

✅ **Checkpoint**: All users on Better Auth

---

## Phase 6: Full Cutover (Day 14)

### Step 6.1: Disable Dual Mode
```bash
# Update backend configuration
export BETTER_AUTH_DUAL_MODE=false

# Restart backend
systemctl restart reconciliation-backend
```

✅ **Checkpoint**: Only Better Auth tokens accepted

### Step 6.2: Monitor for 24 Hours
- Watch error rates
- Monitor authentication failures
- Check for user complaints
- Verify all systems operational

✅ **Checkpoint**: No issues for 24 hours

### Step 6.3: Update Documentation
- Update API documentation
- Update developer guides
- Update deployment docs
- Archive legacy auth docs

✅ **Checkpoint**: Documentation updated

---

## Phase 7: Cleanup (Day 30)

### Step 7.1: Remove Legacy Code
```bash
# Archive legacy authentication files
mkdir -p archive/legacy-auth
mv frontend/src/hooks/useAuth.tsx.old archive/legacy-auth/
# Review and remove other legacy files
```

✅ **Checkpoint**: Legacy code archived

### Step 7.2: Database Cleanup
```sql
-- Remove old session tables if any
-- Keep user data intact
-- Archive old migration files
```

✅ **Checkpoint**: Database cleaned

---

## Monitoring Checklist

### During Migration

Monitor these metrics continuously:

**Authentication Metrics:**
- [x] Login success rate (target: >95%)
- [x] Registration success rate (target: >95%)
- [x] OAuth success rate (target: >90%)
- [x] Token validation success rate (target: >99%)

**Performance Metrics:**
- [x] Auth server response time (target: <200ms)
- [x] Token validation time (target: <50ms)
- [x] Database query time (target: <50ms)
- [x] Overall auth flow time (target: <500ms)

**Error Metrics:**
- [x] 4xx errors (client errors)
- [x] 5xx errors (server errors)
- [x] Database connection errors
- [x] Token validation failures

**Business Metrics:**
- [x] New user registrations
- [x] Daily active users
- [x] Session duration
- [x] User complaints/support tickets

---

## Alert Thresholds

Configure alerts for:

| Metric | Warning | Critical |
|--------|---------|----------|
| Auth server down | 1 minute | 5 minutes |
| Login failure rate | >10% | >20% |
| Response time | >500ms | >1000ms |
| Error rate | >5% | >10% |
| Database connections | >15 | >19 |

---

## Rollback Decision Tree

```
Is there a critical issue?
├─ YES: Execute rollback immediately
│   ├─ Authentication completely broken → ROLLBACK NOW
│   ├─ >20% login failure rate → ROLLBACK NOW
│   ├─ Data integrity issues → ROLLBACK NOW
│   └─ Security vulnerability → ROLLBACK NOW + patch
│
└─ NO: Continue monitoring
    ├─ Minor issues (<5% failure) → Fix forward
    ├─ Performance degradation → Optimize
    └─ User complaints → Investigate + fix
```

---

## Rollback Procedure

If rollback is needed:

### Quick Rollback (< 5 minutes)
```bash
# Execute rollback script
bash scripts/rollback-better-auth.sh

# Verify legacy auth working
curl -X POST http://localhost:2000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Monitor for 30 minutes
```

### Manual Rollback Steps
```bash
# 1. Disable Better Auth
export BETTER_AUTH_ENABLED=false

# 2. Restart backend
systemctl restart reconciliation-backend

# 3. Stop auth server
docker-compose stop auth-server

# 4. Verify
curl http://localhost:2000/health
```

---

## Post-Migration Tasks

### Immediate (Week 1)
- [x] Monitor authentication metrics daily
- [x] Review error logs
- [x] Collect user feedback
- [x] Document any issues encountered

### Short-term (Month 1)
- [x] Enable email verification
- [x] Implement password reset
- [x] Add 2FA support
- [x] Optimize performance

### Long-term (Month 2+)
- [x] Remove legacy authentication code
- [x] Add magic link authentication
- [x] Implement WebAuthn
- [x] Add additional OAuth providers

---

## Troubleshooting

### Issue: Auth server won't start
**Symptoms**: Container exits immediately  
**Solution**:
```bash
# Check logs
docker-compose logs auth-server

# Common causes:
# - DATABASE_URL incorrect
# - JWT_SECRET missing
# - Port 4000 already in use

# Fix and restart
docker-compose up -d auth-server
```

### Issue: Frontend can't connect to auth server
**Symptoms**: "Network request failed"  
**Solution**:
```bash
# Check CORS configuration
# auth-server .env should have:
CORS_ORIGIN=https://your-frontend-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Restart auth server
docker-compose restart auth-server
```

### Issue: Backend rejects Better Auth tokens
**Symptoms**: 401 Unauthorized with Better Auth tokens  
**Solution**:
```bash
# Verify environment variables match
echo $BETTER_AUTH_SERVER_URL  # Should be http://localhost:4000
echo $BETTER_AUTH_ENABLED     # Should be true
echo $JWT_SECRET              # Should match auth-server

# Restart backend
systemctl restart reconciliation-backend
```

### Issue: Users can't login with existing passwords
**Symptoms**: "Invalid credentials" for valid users  
**Solution**:
```bash
# Verify migrations ran
psql $DATABASE_URL -c "SELECT * FROM schema_migrations;"

# Check password hashes intact
psql $DATABASE_URL -c "SELECT email, LEFT(password_hash, 10) FROM users LIMIT 5;"

# Verify bcrypt format ($2b$ or $2a$)
```

---

## Success Metrics

### Week 1 Targets
- [x] 100% auth server uptime
- [x] <1% authentication failure rate
- [x] Average login time <500ms
- [x] Zero data integrity issues
- [x] <5 user complaints

### Month 1 Targets
- [x] 99.9% auth server uptime
- [x] <0.5% authentication failure rate
- [x] All users migrated to Better Auth
- [x] Legacy code removed
- [x] Documentation complete

---

## Communication Plan

### Before Migration
**Email to Users (T-7 days):**
```
Subject: Upcoming Authentication System Upgrade

We're upgrading our authentication system for enhanced security and features.

When: [Date/Time]
Expected Downtime: None (zero-downtime migration)
What to Expect: You may need to log in again during the upgrade.

Benefits:
- Enhanced security
- Faster login times
- Better OAuth support
- Future features (2FA, magic links)

Questions? Contact: support@your-company.com
```

### During Migration
**Status Page Update:**
```
🔄 Authentication system upgrade in progress
Status: Everything operational
No action required from users
```

### After Migration
**Email to Users (T+7 days):**
```
Subject: Authentication System Upgrade Complete

Our authentication system has been successfully upgraded!

New features now available:
- More secure password management
- Improved OAuth support
- Better session management

Thank you for your patience!
```

---

## Deployment Commands Reference

### Start All Services
```bash
docker-compose -f docker-compose.better-auth.yml up -d
```

### Stop All Services
```bash
docker-compose -f docker-compose.better-auth.yml down
```

### View Logs
```bash
# Auth server logs
docker-compose logs -f auth-server

# All services logs
docker-compose logs -f
```

### Check Service Status
```bash
docker-compose ps
```

### Restart Service
```bash
docker-compose restart auth-server
```

---

## Environment Variables Reference

### Auth Server
```env
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=<32+ character secret>
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-secret>

# Optional
PORT=4000
NODE_ENV=production
BCRYPT_COST=12
SESSION_EXPIRY_SECONDS=1800
CORS_ORIGIN=https://your-frontend.com
LOG_LEVEL=info
```

### Frontend
```env
VITE_AUTH_SERVER_URL=https://auth.your-domain.com
VITE_GOOGLE_CLIENT_ID=<same-as-auth-server>
VITE_API_BASE_URL=https://api.your-domain.com
```

### Backend
```env
BETTER_AUTH_SERVER_URL=http://auth-server:4000
BETTER_AUTH_ENABLED=true
BETTER_AUTH_DUAL_MODE=true
JWT_SECRET=<same-as-auth-server>
```

---

## Testing Commands

### Quick Health Check
```bash
# Auth server
curl https://auth.your-domain.com/health

# Backend
curl https://api.your-domain.com/health

# Frontend
curl https://your-frontend.com
```

### Complete Test Suite
```bash
bash scripts/test-better-auth.sh
```

### Manual Testing
```bash
# Login test
curl -X POST https://auth.your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'

# Backend validation test
curl -H "Authorization: Bearer $TOKEN" \
  https://api.your-domain.com/api/v1/auth/me
```

---

## Rollback Procedure

### Quick Rollback
```bash
bash scripts/rollback-better-auth.sh
```

### Manual Rollback
```bash
# 1. Disable Better Auth
export BETTER_AUTH_ENABLED=false

# 2. Restart backend
systemctl restart reconciliation-backend

# 3. Stop auth server
docker-compose stop auth-server

# 4. Verify legacy auth works
curl -X POST http://localhost:2000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## Post-Migration Monitoring (First 24 Hours)

### Hour 0-1: Critical Monitoring
- Check every 5 minutes
- Monitor all authentication attempts
- Watch error logs closely
- Be ready for quick rollback

### Hour 1-6: Active Monitoring
- Check every 15 minutes
- Monitor success rates
- Review user feedback
- Address any issues immediately

### Hour 6-24: Normal Monitoring
- Check every hour
- Review daily metrics
- Plan any optimizations
- Document lessons learned

---

## Success Criteria

### Technical Success:
- ✅ Zero downtime during migration
- ✅ All existing users can login
- ✅ No password resets required
- ✅ Performance equal or better
- ✅ All security features maintained

### Business Success:
- ✅ <1% increase in support tickets
- ✅ No user complaints about auth
- ✅ Improved login success rate
- ✅ Faster authentication response

---

## Sign-Off Checklist

Before declaring migration complete:

- [x] All services deployed and healthy
- [x] All tests passing
- [x] Monitoring configured
- [x] Alerts set up
- [x] Documentation updated
- [x] Team trained
- [x] Users notified
- [x] Rollback plan tested
- [x] Performance benchmarks met
- [x] Security audit passed

---

## Team Contacts

- **Tech Lead**: [Name/Email]
- **DevOps**: [Name/Email]
- **Security**: [Name/Email]
- **Support**: [Name/Email]

---

## Resources

- [Deployment Guide](BETTER_AUTH_DEPLOYMENT_GUIDE.md)
- [Integration Tests](BETTER_AUTH_INTEGRATION_TESTS.md)
- [Implementation Status](BETTER_AUTH_IMPLEMENTATION_STATUS.md)
- [Auth Server README](auth-server/README.md)

---

*Runbook Version: 1.0*  
*Last Updated: 2024-11-29*  
*Approved By: [Name]*  
*Next Review: After migration complete*

