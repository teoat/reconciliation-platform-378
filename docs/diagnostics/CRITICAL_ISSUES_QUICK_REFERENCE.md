# Critical Issues - Quick Reference

**Last Updated**: 2025-11-29  
**Status**: Action Required

---

## 🔴 CRITICAL: Must Fix Immediately

### 1. API Version Mismatch
**Impact**: All API calls will fail with 404 errors

**Problem**:
- Frontend uses `/api/` endpoints
- Backend serves `/api/v1/` endpoints

**Quick Fix**:
```typescript
// frontend/src/config/AppConfig.ts
API_URL: getEnvVar('VITE_API_URL', 'http://localhost:2000/api/v1'), // Add /v1
```

```typescript
// frontend/src/constants/api.ts
AUTH: {
  LOGIN: '/api/v1/auth/login',  // Add /v1 to all endpoints
  // ...
}
```

**Files to Update**:
- `frontend/src/config/AppConfig.ts` (line 43)
- `frontend/src/constants/api.ts` (all endpoints)

---

### 2. Duplicate Port Variables
**Impact**: Configuration confusion, potential conflicts

**Problem**:
- Both `PORT` and `BACKEND_PORT` set to 2000

**Quick Fix**:
```yaml
# docker-compose.yml - Remove PORT, keep only BACKEND_PORT
BACKEND_PORT: 2000  # Keep this
# PORT: 2000  # Remove this
```

**Files to Update**:
- `docker-compose.yml` (line 154)
- `create-env.py` (line 44)
- `scripts/setup-environment.sh` (line 154)
- `config/production.env.example` (line 16)

---

### 3. Unused API_PORT Variable
**Impact**: Dead configuration, confusion

**Quick Fix**: Remove `API_PORT=2000` from:
- `create-env.py` (line 46)

---

## 🟡 HIGH: Fix Soon

### 4. Inconsistent API URL Defaults
**Impact**: Different defaults in different files

**Problem**:
- `AppConfig.ts`: `http://localhost:2000/api` (missing /v1)
- `docker-compose.yml`: `http://localhost:2000/api/v1` (correct)
- `setup-environment.sh`: `http://localhost:2000/api` (missing /v1)

**Quick Fix**: Update all defaults to include `/v1`:
```typescript
// frontend/src/config/AppConfig.ts
API_URL: getEnvVar('VITE_API_URL', 'http://localhost:2000/api/v1'),
```

```bash
# scripts/setup-environment.sh
VITE_API_URL=http://localhost:2000/api/v1  # Add /v1
```

---

### 5. Legacy Environment Variables
**Impact**: Unnecessary code, potential confusion

**Problem**: Code checks for `NEXT_PUBLIC_API_URL` (Next.js pattern, not used)

**Quick Fix**: Remove `NEXT_PUBLIC_API_URL` checks from:
- `frontend/src/config/AppConfig.ts` (lines 23-27)
- `frontend/src/services/apiClient/utils.ts` (lines 41-42)

---

## ✅ Verification Commands

After fixes, test:

```bash
# 1. Check API endpoint
curl http://localhost:2000/api/v1/health

# 2. Test authentication
curl -X POST http://localhost:2000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# 3. Verify frontend can connect
# Open browser console at http://localhost:1000
# Check for API errors
```

---

## Files Summary

**Critical Fixes Required**:
1. `frontend/src/config/AppConfig.ts` - Add `/v1` to API_URL default
2. `frontend/src/constants/api.ts` - Add `/v1` to all endpoints
3. `docker-compose.yml` - Remove `PORT` variable
4. `create-env.py` - Remove `API_PORT` and `PORT`

**High Priority Fixes**:
5. `scripts/setup-environment.sh` - Add `/v1` to VITE_API_URL
6. `frontend/src/config/AppConfig.ts` - Remove `NEXT_PUBLIC_API_URL` checks
7. `frontend/src/services/apiClient/utils.ts` - Remove `NEXT_PUBLIC_API_URL` checks

---

**See Full Report**: [COMPREHENSIVE_DIAGNOSTIC_REPORT.md](./COMPREHENSIVE_DIAGNOSTIC_REPORT.md)

