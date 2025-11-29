# Better Auth Deployment Guide

## 🚀 Complete Deployment Instructions

This guide covers deploying the Better Auth migration across all three components: Auth Server, Frontend, and Backend.

---

## Prerequisites

- PostgreSQL database running
- Node.js 18+ installed
- Rust/Cargo installed (for backend)
- npm/pnpm installed

---

## Phase 1: Deploy Auth Server

### Step 1: Install Dependencies

```bash
cd auth-server
npm install
```

### Step 2: Configure Environment

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Required
DATABASE_URL=postgresql://user:pass@host:5432/reconciliation
JWT_SECRET=your-secure-jwt-secret-min-32-chars
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional (defaults shown)
PORT=4000
NODE_ENV=production
BCRYPT_COST=12
SESSION_EXPIRY_SECONDS=1800
CORS_ORIGIN=https://your-frontend-domain.com
```

### Step 3: Run Database Migrations

```bash
npm run db:migrate
```

Expected output:
```
▶️  Running migration 001_better_auth_compat.sql...
✅ Migration 001_better_auth_compat.sql completed
✅ All migrations completed successfully!
```

### Step 4: Start Auth Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

**Docker:**
```bash
docker build -f ../docker/auth-server.dockerfile -t auth-server:latest .
docker run -d \
  -p 4000:4000 \
  --env-file .env \
  --name auth-server \
  auth-server:latest
```

### Step 5: Verify Auth Server

```bash
# Health check
curl http://localhost:4000/health

# Expected: {"status":"ok",...}
```

---

## Phase 2: Deploy Frontend

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Configure Environment

```bash
cp env.example .env
```

Edit `.env`:

```env
# Better Auth
VITE_AUTH_SERVER_URL=http://localhost:4000  # or production URL

# Google OAuth (same as before)
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# API (existing)
VITE_API_BASE_URL=http://localhost:2000
```

### Step 3: Build Frontend

```bash
npm run build
```

### Step 4: Test Frontend

```bash
# Development
npm run dev

# Production preview
npm run preview
```

### Step 5: Deploy Frontend

Deploy `frontend/dist/` to your hosting provider (Vercel, Netlify, etc.)

---

## Phase 3: Deploy Backend

### Step 1: Configure Environment

Add to `backend/.env` or environment variables:

```env
# Better Auth Configuration
BETTER_AUTH_SERVER_URL=http://localhost:4000
BETTER_AUTH_ENABLED=true
BETTER_AUTH_DUAL_MODE=true
BETTER_AUTH_CACHE_TTL=300

# Ensure JWT_SECRET matches auth-server
JWT_SECRET=same-secret-as-auth-server
```

### Step 2: Run User Migration

```bash
cd scripts
psql $DATABASE_URL < migrate-users-to-better-auth.sql
```

Expected output:
```
NOTICE:  Total users: XXX
NOTICE:  Verified users: XXX
NOTICE:  Migration check: All existing users marked as verified
```

### Step 3: Build Backend

```bash
cd backend
cargo build --release
```

### Step 4: Run Backend

```bash
./target/release/reconciliation-backend
```

### Step 5: Verify Backend

```bash
# Health check
curl http://localhost:2000/health

# Test authentication with Better Auth token
TOKEN="<token-from-auth-server>"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:2000/api/v1/auth/me
```

---

## Phase 4: Gradual Rollout

### Step 1: Enable Dual Mode

Ensure backend has `BETTER_AUTH_DUAL_MODE=true`

This allows both old JWT tokens and new Better Auth tokens to work simultaneously.

### Step 2: Monitor Logs

Watch for log messages indicating which auth system is being used:
- "Token validated with Better Auth" - New system
- "Token validated with legacy JWT" - Old system

### Step 3: Gradual Migration

**Option A: Feature Flag (Recommended)**
```typescript
// Frontend: Add feature flag
const useBetterAuth = localStorage.getItem('use-better-auth') === 'true';

// Enable for specific users
if (userEmail.endsWith('@your-company.com')) {
  localStorage.setItem('use-better-auth', 'true');
}
```

**Option B: Percentage Rollout**
```typescript
// Enable for X% of users
const rolloutPercentage = 10; // 10%
const hash = hashEmail(userEmail);
const useBetterAuth = (hash % 100) < rolloutPercentage;
```

### Step 4: Monitor Metrics

Track:
- Authentication success rate
- Token validation performance
- Error rates
- User complaints

### Step 5: Full Cutover

When satisfied:
1. Set `BETTER_AUTH_ENABLED=true`
2. Set `BETTER_AUTH_DUAL_MODE=false` (only Better Auth)
3. Remove legacy JWT code in future release

---

## Phase 5: Post-Deployment

### Step 1: Monitoring

Set up monitoring for:
- Auth server health (`/health`)
- Authentication success/failure rates
- Token validation latency
- Session expiration events

### Step 2: Alerts

Configure alerts for:
- Auth server down
- High authentication failure rate (>5%)
- Slow token validation (>100ms)
- Database connection issues

### Step 3: Backup Plan

Keep legacy auth system in place for 30 days:
- Don't remove old auth code immediately
- Keep `BETTER_AUTH_DUAL_MODE=true` for rollback
- Document rollback procedure

---

## Rollback Procedure

If issues arise, rollback quickly:

### Step 1: Backend Rollback

```bash
# Set environment variables
export BETTER_AUTH_ENABLED=false
export BETTER_AUTH_DUAL_MODE=true

# Restart backend
systemctl restart reconciliation-backend
```

### Step 2: Frontend Rollback

```bash
# Revert to previous build
git checkout HEAD~1 frontend/
npm run build
# Deploy previous build
```

### Step 3: Verify

```bash
# Test with old JWT tokens
curl -H "Authorization: Bearer $OLD_TOKEN" \
  http://localhost:2000/api/v1/auth/me
```

---

## Testing Checklist

### Auth Server Tests

- [ ] Health endpoint responds
- [ ] User registration works
- [ ] Email/password login works
- [ ] Google OAuth works
- [ ] Token refresh works
- [ ] Invalid credentials rejected
- [ ] Rate limiting enforced
- [ ] Password validation works

### Frontend Tests

- [ ] Login page loads
- [ ] Registration form works
- [ ] Google OAuth button works
- [ ] Session timeout warning shows
- [ ] Token refresh automatic
- [ ] Logout clears session
- [ ] Protected routes redirect
- [ ] Error messages display

### Backend Tests

- [ ] Better Auth tokens accepted
- [ ] Legacy JWT tokens accepted (dual mode)
- [ ] Expired tokens rejected
- [ ] Invalid tokens rejected
- [ ] WebSocket authentication works
- [ ] Protected endpoints secured
- [ ] Token caching works
- [ ] Performance acceptable

### Integration Tests

- [ ] End-to-end login flow
- [ ] End-to-end registration flow
- [ ] OAuth complete flow
- [ ] Token refresh across services
- [ ] Session timeout across services
- [ ] Logout across services

---

## Performance Benchmarks

Expected performance:

| Metric | Target | Notes |
|--------|--------|-------|
| Auth server response | <100ms | Login/register |
| Token validation | <50ms | Backend validation |
| Token cache hit | <5ms | Cached validation |
| Session management | <20ms | Session ops |
| Database queries | <50ms | Auth queries |

---

## Security Checklist

- [ ] HTTPS enabled in production
- [ ] JWT secret is strong (32+ chars)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] CSRF protection enabled
- [ ] Passwords hashed with bcrypt cost 12
- [ ] Session timeout configured
- [ ] Token expiration set (30 min)
- [ ] Secure cookies in production
- [ ] SQL injection prevention (parameterized queries)

---

## Troubleshooting

### Auth Server Won't Start

**Issue**: "Database connection failed"
**Solution**: Check `DATABASE_URL` in `.env`

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Issue**: "JWT_SECRET must be at least 32 characters"
**Solution**: Generate strong secret

```bash
# Generate random 32-character secret
openssl rand -base64 32
```

### Frontend Can't Connect

**Issue**: "Network request failed"
**Solution**: Check CORS configuration

Auth server `.env`:
```env
CORS_ORIGIN=https://your-frontend-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

**Issue**: "Invalid token"
**Solution**: Ensure `VITE_AUTH_SERVER_URL` points to correct server

### Backend Token Validation Fails

**Issue**: "Token validation failed"
**Solution**: Check `BETTER_AUTH_SERVER_URL` in backend config

```bash
# Test auth server from backend
curl http://localhost:4000/health
```

**Issue**: "JWT secret mismatch"
**Solution**: Ensure `JWT_SECRET` matches between auth-server and backend

---

## Support

For issues:
1. Check logs: `docker logs auth-server`
2. Review this guide
3. Check [BETTER_AUTH_IMPLEMENTATION_STATUS.md](BETTER_AUTH_IMPLEMENTATION_STATUS.md)
4. Contact team lead

---

**Deployment Checklist**:
- [ ] Auth server deployed and healthy
- [ ] Database migrations run
- [ ] Frontend deployed with new config
- [ ] Backend updated with Better Auth support
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Rollback plan documented
- [ ] Team trained on new system

**Estimated Downtime**: Zero (dual mode supports gradual migration)

**Deployment Time**: 2-4 hours

---

*Last Updated: 2024-11-29*  
*Version: 1.0*

