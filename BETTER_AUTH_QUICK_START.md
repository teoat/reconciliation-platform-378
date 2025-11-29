# Better Auth - Quick Start Guide

**Ready for deployment!** 🚀

## What's Been Implemented

✅ **Agent 1**: Authentication Server (Better Auth on port 3001)  
✅ **Agent 2**: Frontend Integration (Feature flag based switching)  
✅ **Agent 3**: Backend Integration (Dual auth middleware, migrations)

## Quick Deployment (Development/Staging)

### 1. Start Auth Server (5 minutes)

```bash
cd auth-server/

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env (minimum required):
# - DATABASE_URL=postgresql://user:pass@localhost:5432/reconciliation_db
# - JWT_SECRET=<generate with: openssl rand -hex 32>
# - PORT=3001

# Start server
npm run dev

# Verify (in another terminal):
curl http://localhost:3001/health
# Should return: {"status":"ok"}
```

### 2. Run Database Migrations (2 minutes)

```bash
cd backend/

# Review migration
cat migrations/better_auth_compat.sql

# Run migration
psql $DATABASE_URL -f migrations/better_auth_compat.sql

# Verify
psql $DATABASE_URL -c "\dt" | grep better_auth
```

### 3. Update Backend Environment (2 minutes)

```bash
cd backend/

# Add to .env:
AUTH_SERVER_URL=http://localhost:3001
BETTER_AUTH_JWT_SECRET=<same-as-auth-server-JWT_SECRET>
PREFER_BETTER_AUTH=true
ENABLE_DUAL_AUTH=true

# Restart backend
cargo run
# or: systemctl restart reconciliation-backend
```

### 4. Update Frontend Environment (3 minutes)

```bash
cd frontend/

# Add to .env (or .env.local for development):
VITE_AUTH_SERVER_URL=http://localhost:3001
VITE_ENABLE_BETTER_AUTH=true   # Enable Better Auth
VITE_ENABLE_DUAL_AUTH=true      # Support both auth systems
VITE_ENABLE_OAUTH=true
VITE_SHOW_MIGRATION_BANNER=true

# Start frontend
npm run dev

# Or build for production:
npm run build
```

### 5. Test! (5 minutes)

Open browser to `http://localhost:5173` (or your frontend URL):

1. **Register** a new account
2. **Login** with email/password
3. **Check** localStorage has `better-auth-token`
4. **Reload** page - should stay logged in
5. **Logout** - token should be removed

## Feature Flags (Switch Auth Systems)

### Use Better Auth (New System)
```env
VITE_ENABLE_BETTER_AUTH=true
```

### Use Legacy Auth (Current System)
```env
VITE_ENABLE_BETTER_AUTH=false
```

### Support Both (Dual Mode)
```env
VITE_ENABLE_DUAL_AUTH=true
```

## Production Deployment

See: `docs/deployment/BETTER_AUTH_ROLLOUT_GUIDE.md`

**Recommended approach**:
1. **Week 1**: Deploy with `VITE_ENABLE_BETTER_AUTH=false` (zero impact)
2. **Week 2**: Enable for testing `VITE_ENABLE_BETTER_AUTH=true`
3. **Week 3**: Migrate users gradually
4. **Week 4**: Complete migration

## Rollback (If Needed)

**Quick rollback** (5 minutes):

```bash
# Frontend only
cd frontend/
# Set VITE_ENABLE_BETTER_AUTH=false in .env
npm run build
# Redeploy

# System reverts to legacy auth
```

## Validation

```bash
# Run validation script
./scripts/validate-better-auth-implementation.sh

# Should show all checks passing
```

## Monitoring

After deployment, monitor these metrics:

```bash
# Check Prometheus metrics
curl http://localhost:9090/metrics | grep better_auth

# Key metrics:
# - better_auth_success_total
# - better_auth_failures_total  
# - better_auth_active_sessions
# - better_auth_token_validations_total
```

## Troubleshooting

### Auth server won't start
```bash
# Check port 3001 is free
lsof -i :3001

# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check logs
pm2 logs better-auth-server
```

### Users can't login
```bash
# Verify auth server is running
curl http://localhost:3001/health

# Check JWT secrets match
# Backend BETTER_AUTH_JWT_SECRET === Auth Server JWT_SECRET

# Check frontend can reach auth server
curl https://yourdomain.com/api/auth-proxy/introspect \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"token":"test"}'
```

### Frontend shows errors
```bash
# Check browser console
# Open DevTools > Console

# Check environment variables
# Should see VITE_AUTH_SERVER_URL, VITE_ENABLE_BETTER_AUTH

# Clear cache and rebuild
rm -rf node_modules/.vite
npm run build
```

## Getting Help

- **Rollout Guide**: `docs/deployment/BETTER_AUTH_ROLLOUT_GUIDE.md`
- **Environment Setup**: `docs/development/BETTER_AUTH_ENVIRONMENT_SETUP.md`
- **Agent 1 Details**: `docs/architecture/AGENT1_IMPLEMENTATION_SUMMARY.md`
- **Agent 2 Details**: `docs/architecture/AGENT2_IMPLEMENTATION_SUMMARY.md`
- **Agent 3 Details**: `docs/architecture/AGENT3_IMPLEMENTATION_SUMMARY.md`
- **Deployment Checklist**: `BETTER_AUTH_DEPLOYMENT_CHECKLIST.md`

## What's Next?

1. ✅ **Review** validation results
2. ✅ **Test** in development environment
3. ✅ **Deploy** to staging (Better Auth disabled)
4. ✅ **Enable** Better Auth for testing
5. ✅ **Migrate** users gradually
6. ✅ **Monitor** metrics and logs
7. ✅ **Complete** migration
8. 🎉 **Celebrate!**

---

**Status**: Ready for deployment  
**Last Updated**: November 29, 2025  
**Version**: 1.0.0

