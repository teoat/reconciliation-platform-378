# Better Auth Deployment Checklist

**Date**: _______________  
**Deployer**: _______________  
**Environment**: [ ] Staging [ ] Production

---

## Pre-Deployment Review

### Code Review
- [ ] All three agents' code reviewed and approved
- [ ] No lint errors (`npm run lint`, `cargo clippy`)
- [ ] Type checking passes (`npm run type-check`, `cargo check`)
- [ ] All tests passing (`npm test`, `cargo test`)
- [ ] Security audit passed (`npm audit`, `cargo audit`)

### Configuration Review
- [ ] `.env` files reviewed for all components
- [ ] Secrets properly secured (not in git)
- [ ] JWT secrets generated (32+ bytes)
- [ ] OAuth credentials configured
- [ ] Database URLs correct for environment
- [ ] CORS origins configured correctly

### Documentation Review
- [ ] Rollout guide reviewed
- [ ] Environment setup doc reviewed
- [ ] All summaries read and understood
- [ ] Rollback procedure understood

---

## Phase 1: Infrastructure Deployment

### Auth Server (Agent 1)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with production values
- [ ] Build successful (`npm run build`)
- [ ] Server started (PM2/systemd)
- [ ] Health endpoint responding: `curl http://localhost:3001/health`
- [ ] Logs showing no errors: `pm2 logs better-auth-server`

**Auth Server Environment Variables**:
```bash
- [ ] DATABASE_URL set
- [ ] JWT_SECRET set (32+ bytes)
- [ ] PORT=3001
- [ ] NODE_ENV=production
- [ ] GOOGLE_CLIENT_ID set
- [ ] GOOGLE_CLIENT_SECRET set
- [ ] SMTP configured (if using email)
```

### Database Migrations (Agent 3)
- [ ] Migration script reviewed: `backend/migrations/better_auth_compat.sql`
- [ ] Backup taken before migration
- [ ] Migration executed successfully
- [ ] Tables verified:
  - [ ] `better_auth_sessions`
  - [ ] `better_auth_accounts`
  - [ ] `better_auth_verification_tokens`
  - [ ] `auth_audit_log`
- [ ] User table columns added:
  - [ ] `email_verified`
  - [ ] `email_verified_at`
  - [ ] `better_auth_id`
  - [ ] `migration_status`
  - [ ] `last_auth_method`

### Backend Deployment (Agent 3)
- [ ] Code compiled: `cargo build --release`
- [ ] `.env` updated with Better Auth config
- [ ] Backend restarted
- [ ] Health check passing: `curl http://localhost:2000/health`
- [ ] Logs showing no errors

**Backend Environment Variables**:
```bash
- [ ] AUTH_SERVER_URL=http://localhost:3001
- [ ] BETTER_AUTH_JWT_SECRET set (matches auth server)
- [ ] PREFER_BETTER_AUTH=true
- [ ] ENABLE_DUAL_AUTH=true
```

### Frontend Deployment (Agent 2)
- [ ] `.env.production` created
- [ ] Build successful: `npm run build`
- [ ] Preview tested: `npm run preview`
- [ ] Deployed to hosting
- [ ] Frontend accessible
- [ ] No console errors in browser

**Frontend Environment Variables** (Phase 1 - Better Auth DISABLED):
```bash
- [ ] VITE_API_BASE_URL set
- [ ] VITE_AUTH_SERVER_URL=http://localhost:3001 (or https://auth.yourdomain.com)
- [ ] VITE_GOOGLE_CLIENT_ID set
- [ ] VITE_ENABLE_BETTER_AUTH=false  ⚠️ Start disabled
- [ ] VITE_ENABLE_DUAL_AUTH=true
- [ ] VITE_ENABLE_OAUTH=true
- [ ] VITE_SHOW_MIGRATION_BANNER=false
```

### Networking
- [ ] Port 3001 accessible (auth server)
- [ ] Port 2000 accessible (backend)
- [ ] CORS configured (includes port 3001)
- [ ] Load balancer configured (if applicable)
- [ ] SSL certificates valid (if using HTTPS)

---

## Phase 2: Beta Testing

### Enable Better Auth
- [ ] Update frontend `.env.production`:
  - [ ] `VITE_ENABLE_BETTER_AUTH=true`
  - [ ] `VITE_SHOW_MIGRATION_BANNER=true`
- [ ] Rebuild and redeploy frontend
- [ ] Cache cleared (CDN/browser)

### Manual Testing
- [ ] **Registration**:
  - [ ] Register new account via email/password
  - [ ] Verify account created in database
  - [ ] Verify JWT token received
- [ ] **Login**:
  - [ ] Login with email/password
  - [ ] Verify token stored in localStorage
  - [ ] Verify user data loaded
- [ ] **Google OAuth**:
  - [ ] Click "Sign in with Google"
  - [ ] Complete OAuth flow
  - [ ] Verify logged in
- [ ] **Session Management**:
  - [ ] Reload page, verify still logged in
  - [ ] Wait for session timeout warning (if configured)
  - [ ] Extend session successfully
- [ ] **Token Refresh**:
  - [ ] Wait for token refresh (check network tab)
  - [ ] Verify new token received
- [ ] **Logout**:
  - [ ] Logout successfully
  - [ ] Verify token removed
  - [ ] Verify cannot access protected routes
- [ ] **Rate Limiting**:
  - [ ] Attempt 6 failed logins
  - [ ] Verify rate limit message shown
  - [ ] Wait for timeout, verify can login again
- [ ] **Migration Banner**:
  - [ ] Banner displayed
  - [ ] Banner dismissible
  - [ ] Stays dismissed after page reload

### API Testing
```bash
# Test Registration
- [ ] curl test passed:
curl https://auth.yourdomain.com/api/auth/register \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test"}'

# Test Login
- [ ] curl test passed:
curl https://auth.yourdomain.com/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

# Test Introspection
- [ ] curl test passed:
curl https://api.yourdomain.com/api/auth-proxy/introspect \
  -X POST -H "Content-Type: application/json" \
  -d '{"token":"<token>"}'

# Test Refresh
- [ ] curl test passed:
curl https://api.yourdomain.com/api/auth-proxy/refresh \
  -X POST -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh>"}'
```

### Migration Testing
```bash
# Dry Run Migration
- [ ] cd scripts/
- [ ] npm install
- [ ] npm run migrate-users -- --dry-run --batch-size=5
- [ ] Review output, no errors

# Migrate Beta Users (5-10 users)
- [ ] npm run migrate-users -- --batch-size=10
- [ ] Check migration status in database:
      psql $DATABASE_URL -c "SELECT migration_status, COUNT(*) FROM users GROUP BY migration_status;"
- [ ] Verify migrated users can login
- [ ] Verify legacy users can still login
```

### Monitoring Setup
- [ ] Prometheus metrics accessible: `curl http://localhost:9090/metrics | grep better_auth`
- [ ] Grafana dashboard configured
- [ ] Alerts configured:
  - [ ] High auth failure rate
  - [ ] Low cache hit rate
  - [ ] Auth server down
- [ ] Log aggregation working
- [ ] Error tracking configured (Sentry/etc)

### Metrics Verification
```bash
# Check metrics are being recorded
- [ ] better_auth_attempts_total > 0
- [ ] better_auth_success_total > 0
- [ ] better_auth_token_validations_total > 0
- [ ] better_auth_active_sessions shows current sessions
- [ ] better_auth_token_cache_hits_total > 0
```

---

## Phase 3: Gradual Rollout

### Batch Migration
```bash
# Migrate 10% of users
- [ ] npm run migrate-users -- --batch-size=100
- [ ] Wait 1 hour, monitor metrics
- [ ] Check for errors in logs
- [ ] Verify success rate >95%

# Migrate 25% of users
- [ ] npm run migrate-users -- --batch-size=250
- [ ] Wait 2 hours, monitor metrics
- [ ] Check for errors
- [ ] Verify success rate >95%

# Migrate 50% of users
- [ ] npm run migrate-users -- --batch-size=500
- [ ] Wait 4 hours, monitor metrics
- [ ] Check for errors
- [ ] Verify success rate >95%

# Migrate remaining users
- [ ] npm run migrate-users -- --batch-size=1000
- [ ] Monitor for 24 hours
- [ ] Verify all users migrated
```

### Monitoring During Rollout
- [ ] Auth success rate: >95% ✓ Current: ______%
- [ ] Token validation latency (p95): <200ms ✓ Current: ______ms
- [ ] Cache hit rate: >80% ✓ Current: ______%
- [ ] Active sessions: Normal ✓ Current: ______
- [ ] Error rate: <1% ✓ Current: ______%
- [ ] No P1/P2 incidents ✓

### User Communication
- [ ] Email sent to users about upgrade
- [ ] Support team briefed
- [ ] FAQ updated
- [ ] Status page updated (if applicable)

---

## Phase 4: Complete Migration

### Verify Full Migration
```bash
- [ ] Check all users migrated:
      psql $DATABASE_URL -c "
      SELECT migration_status, COUNT(*) 
      FROM users WHERE deleted_at IS NULL 
      GROUP BY migration_status;"
      
      Expected: 100% migrated
```

### Disable Legacy Auth
- [ ] Update backend `.env`:
  - [ ] `ENABLE_DUAL_AUTH=false`
- [ ] Restart backend
- [ ] Update frontend `.env.production`:
  - [ ] `VITE_ENABLE_DUAL_AUTH=false`
- [ ] Rebuild and redeploy frontend
- [ ] Verify legacy auth no longer works (expected)
- [ ] Verify Better Auth still works ✓

### Post-Cutover Monitoring (24-48 hours)
- [ ] Hour 1: No critical errors
- [ ] Hour 4: Metrics stable
- [ ] Hour 12: Auth success rate >95%
- [ ] Hour 24: No incidents
- [ ] Hour 48: All systems normal

---

## Rollback Procedures

### Quick Rollback (if needed)
Documented: [ ] Yes  
Tested: [ ] Yes  
Ready: [ ] Yes

**Steps**:
1. [ ] Set `VITE_ENABLE_BETTER_AUTH=false` in frontend
2. [ ] Rebuild and redeploy frontend
3. [ ] Verify legacy auth works
4. [ ] Estimated time: 5-10 minutes

### Full Rollback (if major issues)
Documented: [ ] Yes  
Tested: [ ] Yes  
Ready: [ ] Yes

**Steps**:
1. [ ] Quick rollback (above)
2. [ ] Run migration rollback: `npm run migrate-users -- --rollback`
3. [ ] Verify users rolled back
4. [ ] Stop auth server (optional)
5. [ ] Estimated time: 15-30 minutes

---

## Post-Deployment

### Immediate (Day 1)
- [ ] All systems operational
- [ ] No critical errors in logs
- [ ] Monitoring dashboards reviewed
- [ ] Team debriefed
- [ ] Incident log started (if any issues)

### Short Term (Week 1)
- [ ] Daily metrics review
- [ ] User feedback collected
- [ ] Performance baseline established
- [ ] No major incidents
- [ ] Documentation updated (if needed)

### Medium Term (Week 2-4)
- [ ] Metrics trending positive
- [ ] User satisfaction maintained
- [ ] Performance within targets
- [ ] Migration banner can be removed

### Long Term (Month 2+)
- [ ] Legacy code cleanup planned
- [ ] Final metrics analysis
- [ ] Lessons learned documented
- [ ] Celebration! 🎉

---

## Sign-Off

### Deployment Approval

**Phase 1 (Infrastructure)**:
- Deployer: _______________  Date: ______  Signature: _______________
- Reviewer: _______________  Date: ______  Signature: _______________

**Phase 2 (Beta Testing)**:
- Deployer: _______________  Date: ______  Signature: _______________
- Reviewer: _______________  Date: ______  Signature: _______________

**Phase 3 (Gradual Rollout)**:
- Deployer: _______________  Date: ______  Signature: _______________
- Reviewer: _______________  Date: ______  Signature: _______________

**Phase 4 (Complete)**:
- Deployer: _______________  Date: ______  Signature: _______________
- Reviewer: _______________  Date: ______  Signature: _______________

---

## Notes / Issues Encountered

```
[Space for notes during deployment]










```

---

**Checklist Version**: 1.0.0  
**Date Created**: November 29, 2025  
**Related Documents**:
- `docs/deployment/BETTER_AUTH_ROLLOUT_GUIDE.md`
- `docs/development/BETTER_AUTH_ENVIRONMENT_SETUP.md`
- `docs/architecture/AGENT1_IMPLEMENTATION_SUMMARY.md`
- `docs/architecture/AGENT2_IMPLEMENTATION_SUMMARY.md`
- `docs/architecture/AGENT3_IMPLEMENTATION_SUMMARY.md`

