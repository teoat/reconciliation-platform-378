# Better Auth Legacy Code Cleanup Guide

## 📌 Overview

This guide documents which legacy authentication files can be archived or removed after the Better Auth migration is complete and stable (recommended: 30 days after full cutover).

---

## ⚠️ Important Notes

**DO NOT remove legacy code until:**
- ✅ Better Auth has been running in production for 30+ days
- ✅ Zero authentication issues reported
- ✅ All users successfully migrated
- ✅ Rollback no longer needed
- ✅ Stakeholder approval received

**Recommendation**: Archive instead of delete for 90 days

---

## Files to Archive (Not Delete)

### Frontend Files

#### Authentication Hooks (Deprecated)
```bash
# Old useAuth implementation (now replaced by useBetterAuth)
frontend/src/hooks/useAuth.tsx
frontend/src/hooks/api/useAuth.ts

# Action: Rename to .tsx.legacy
mv frontend/src/hooks/useAuth.tsx frontend/src/hooks/useAuth.tsx.legacy
mv frontend/src/hooks/api/useAuth.ts frontend/src/hooks/api/useAuth.ts.legacy
```

#### API Client Auth Methods (Deprecated)
```bash
# Old API client authentication methods (now using Better Auth endpoints)
# Keep file but mark specific methods as deprecated

# Files to review:
frontend/src/services/api/auth.ts
frontend/src/services/apiClient/index.ts (auth methods only)
```

**Action**: Add deprecation comments
```typescript
/**
 * @deprecated Use Better Auth client instead
 * This method will be removed in version 2.0
 */
```

### Backend Files

#### Legacy JWT Handlers (Keep for dual mode)
```bash
# These files should be kept during dual mode period
# Can be archived after dual mode disabled (Day 30+)

backend/src/handlers/auth/login.rs      # Keep for reference
backend/src/handlers/auth/oauth.rs      # Keep for reference
backend/src/handlers/auth/token.rs      # Keep for reference
backend/src/services/auth/jwt.rs        # Keep for dual mode
```

**Action**: Mark as deprecated but keep until Day 30

---

## Files to Keep (Do Not Remove)

### Frontend - Keep These
```bash
# Session management (still used)
frontend/src/services/authSecurity.ts   # Rate limiting, session timeout

# Secure storage (still used)
frontend/src/services/secureStorage.ts  # Token storage

# Error handling (still used)
frontend/src/utils/errorMessages.ts     # User-friendly errors

# Security utilities (still used)
frontend/src/utils/security.ts          # Password validation
```

### Backend - Keep These
```bash
# Core auth services (used by Better Auth integration)
backend/src/services/auth/mod.rs        # Auth service trait
backend/src/services/auth/types.rs      # Shared types
backend/src/services/auth/password.rs   # Password utilities
backend/src/services/auth/validation.rs # Validation utils

# Middleware (enhanced for Better Auth)
backend/src/middleware/auth.rs          # Auth middleware
backend/src/middleware/better_auth.rs   # Better Auth integration
backend/src/middleware/security.rs      # Security middleware

# Models (still needed)
backend/src/models/user.rs              # User model
```

---

## Cleanup Timeline

### Day 30 (After Full Cutover)
**Can Archive:**
- [ ] Old useAuth hook implementations
- [ ] Legacy API auth methods  
- [ ] Old OAuth integration code
- [ ] Deprecated test files

**Action**: Move to `archive/legacy-auth/frontend/`

### Day 60 (After Dual Mode Disabled)
**Can Archive:**
- [ ] Legacy JWT handlers (backend)
- [ ] Old token validation middleware
- [ ] Deprecated auth routes

**Action**: Move to `archive/legacy-auth/backend/`

### Day 90 (Final Cleanup)
**Can Delete:**
- [ ] Archived files (if no issues)
- [ ] Old documentation
- [ ] Legacy test files
- [ ] Backup configurations

**Action**: Review archive, delete if approved

---

## Cleanup Procedure

### Step 1: Create Archive Directory
```bash
mkdir -p archive/legacy-auth/{frontend,backend,docs}
```

### Step 2: Archive Frontend Files
```bash
# Move deprecated files
mv frontend/src/hooks/useAuth.tsx.old \
   archive/legacy-auth/frontend/

# Keep reference copy
cp frontend/src/hooks/useAuth.tsx \
   archive/legacy-auth/frontend/useAuth.tsx.reference
```

### Step 3: Archive Backend Files
```bash
# Move deprecated handlers
mv backend/src/handlers/auth/login.rs.old \
   archive/legacy-auth/backend/
```

### Step 4: Update Imports
```bash
# Find all imports of old auth hooks
rg "from.*useAuth" frontend/src/

# Update to use useBetterAuth
# (Should already be done, but verify)
```

### Step 5: Remove Deprecated Comments
```typescript
// Remove old comments like:
// TODO: Migrate to Better Auth
// DEPRECATED: Use Better Auth instead
```

### Step 6: Update Documentation
```bash
# Archive old auth documentation
mv docs/authentication/OLD_AUTH_GUIDE.md \
   archive/legacy-auth/docs/

# Update README
# Update API docs
# Update architecture diagrams
```

---

## Testing After Cleanup

### Verify No Broken Imports
```bash
cd frontend
npm run type-check
# Should have zero errors

cd ../backend
cargo check
# Should compile without errors
```

### Verify All Tests Pass
```bash
# Frontend tests
npm run test

# Backend tests
cargo test

# Integration tests
bash scripts/test-better-auth.sh
```

### Verify Application Works
```bash
# Start all services
docker-compose up -d

# Test authentication flows
# - Login
# - Registration
# - Google OAuth
# - Token refresh
# - Session timeout
# - Logout
```

---

## Deprecated Code Markers

### Frontend
```typescript
/**
 * @deprecated Since v2.0 - Use useBetterAuth instead
 * This file will be removed in v3.0
 * Migration guide: docs/BETTER_AUTH_MIGRATION.md
 */
export const useAuth = () => {
  // Old implementation
};
```

### Backend
```rust
/// DEPRECATED: Legacy JWT authentication
/// 
/// This module is deprecated and will be removed in version 2.0.
/// Use Better Auth integration instead (middleware/better_auth.rs)
#[deprecated(
    since = "2.0.0",
    note = "Use Better Auth integration via middleware/better_auth.rs"
)]
pub mod legacy_jwt {
    // Old implementation
}
```

---

## Archive Structure

```
archive/legacy-auth/
├── frontend/
│   ├── hooks/
│   │   ├── useAuth.tsx.old
│   │   └── api/
│   │       └── useAuth.ts.old
│   ├── services/
│   │   └── api/
│   │       └── auth.ts.old
│   └── README.md
├── backend/
│   ├── handlers/
│   │   └── auth/
│   │       ├── login.rs.old
│   │       ├── oauth.rs.old
│   │       └── token.rs.old
│   ├── services/
│   │   └── auth/
│   │       └── jwt.rs.old
│   └── README.md
├── docs/
│   ├── OLD_AUTH_GUIDE.md
│   └── LEGACY_API_DOCS.md
└── ARCHIVE_INFO.md
```

---

## Verification Checklist

After cleanup, verify:

### Code Quality
- [ ] No TypeScript errors
- [ ] No Rust compilation errors
- [ ] No linting warnings about missing imports
- [ ] All tests pass
- [ ] Build succeeds

### Functionality
- [ ] Login works
- [ ] Registration works
- [ ] Google OAuth works
- [ ] Token refresh works
- [ ] Session timeout works
- [ ] Logout works
- [ ] Protected routes work

### Documentation
- [ ] README updated
- [ ] API docs updated
- [ ] Architecture docs updated
- [ ] Deployment docs updated
- [ ] No references to deprecated code

---

## Final Cleanup Script

**DO NOT run until Day 90+:**

```bash
#!/bin/bash
# Final cleanup script (run after 90 days)

echo "⚠️  This will permanently delete legacy auth code"
read -p "Are you absolutely sure? (type 'DELETE' to confirm): " CONFIRM

if [ "$CONFIRM" != "DELETE" ]; then
    echo "Cleanup cancelled"
    exit 0
fi

echo "Deleting archived legacy auth code..."

# Delete archived files
rm -rf archive/legacy-auth/

# Clean git history (optional, use with caution)
# git filter-branch --tree-filter 'rm -rf archive/legacy-auth' HEAD

echo "✅ Legacy code deleted"
echo "Make sure to:"
echo "1. Run all tests"
echo "2. Deploy and verify"
echo "3. Update documentation"
```

---

## Documentation Updates After Cleanup

### Update These Files:
1. **README.md**: Remove references to old auth
2. **API_GUIDE.md**: Update auth endpoint documentation
3. **DEPLOYMENT_GUIDE.md**: Remove legacy deployment steps
4. **ARCHITECTURE.md**: Update auth architecture diagrams
5. **CONTRIBUTING.md**: Update auth development guide

### Archive These Files:
1. Old authentication guides
2. Legacy API documentation
3. Old troubleshooting guides
4. Deprecated configuration examples

---

## Risk Mitigation

### Before Cleanup:
1. ✅ Create full backup
2. ✅ Tag current release
3. ✅ Document rollback procedure
4. ✅ Test in staging first
5. ✅ Get team approval

### During Cleanup:
1. ✅ Archive, don't delete
2. ✅ Test after each step
3. ✅ Keep git history
4. ✅ Document changes
5. ✅ Monitor production

### After Cleanup:
1. ✅ Run full test suite
2. ✅ Deploy to staging
3. ✅ Verify in production
4. ✅ Monitor for 48 hours
5. ✅ Update documentation

---

## Rollback from Cleanup

If issues found after cleanup:

```bash
# Restore from git
git checkout HEAD~1 -- frontend/src/hooks/useAuth.tsx

# OR restore from archive
cp archive/legacy-auth/frontend/hooks/useAuth.tsx \
   frontend/src/hooks/useAuth.tsx

# Rebuild and deploy
npm run build
deploy
```

---

*Cleanup Status: PENDING (Wait for Day 30)*  
*Next Review: 30 days after Better Auth deployment*  
*Archive Period: 90 days before deletion*

