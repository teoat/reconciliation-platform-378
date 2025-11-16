# Password Manager Integration Plan

## Overview

This document outlines the complete integration plan to ensure ALL passwords in the application are managed through the password manager.

## Current Status

✅ **Password Manager Created**: Fully functional with AES-256-GCM encryption
✅ **Default Passwords**: AldiBabi, AldiAnjing, YantoAnjing, YantoBabi initialized
✅ **Migration Function**: `initialize_application_passwords()` created to migrate env vars
⚠️ **Routes**: Re-enabled (was temporarily disabled)
❌ **Config Integration**: Not yet integrated (still reads from env vars)

## Complete Password Inventory

### ✅ Managed (4 passwords)
1. AldiBabi
2. AldiAnjing
3. YantoAnjing
4. YantoBabi

### ⚠️ Migrated but Not Integrated (10 passwords)
These are now stored in password manager but code still reads from env vars:
1. DB_PASSWORD (Database password)
2. JWT_SECRET (JWT signing secret)
3. JWT_REFRESH_SECRET (JWT refresh secret)
4. REDIS_PASSWORD (Redis authentication)
5. CSRF_SECRET (CSRF protection)
6. SMTP_PASSWORD (Email service)
7. STRIPE_SECRET_KEY (Payment processing)
8. STRIPE_WEBHOOK_SECRET (Stripe webhooks)
9. API_KEY (External API access)
10. GRAFANA_PASSWORD (Monitoring dashboard)

## Integration Phases

### Phase 1: Enable Password Manager ✅ COMPLETE
- [x] Re-enable password manager routes
- [x] Create migration function
- [x] Initialize application passwords on startup

### Phase 2: Integrate Config Module (HIGH PRIORITY)

#### 2.1 Update Config::from_env()
**File**: `backend/src/config/mod.rs`

**Changes Required**:
```rust
impl Config {
    pub async fn from_env(password_manager: Option<&PasswordManager>) -> Result<Self, AppError> {
        // Try password manager first, fallback to env vars
        let jwt_secret = if let Some(pm) = password_manager {
            pm.get_password_by_name("JWT_SECRET").await
                .unwrap_or_else(|_| env::var("JWT_SECRET")?)
        } else {
            env::var("JWT_SECRET")?
        };
        
        // Similar for other passwords...
    }
}
```

#### 2.2 Update Database Connection
**File**: `backend/src/database/mod.rs`

**Changes Required**:
- Extract password from DATABASE_URL or use DB_PASSWORD from password manager
- Reconstruct DATABASE_URL with password from manager

### Phase 3: Integrate Service Modules

#### 3.1 Auth Service
**File**: `backend/src/services/auth/mod.rs`
- Update to retrieve JWT_SECRET from password manager

#### 3.2 Email Service
**File**: `backend/src/services/email.rs`
- Update to retrieve SMTP_PASSWORD from password manager

#### 3.3 Billing Service
**File**: `backend/src/services/billing.rs`
- Update to retrieve STRIPE_SECRET_KEY from password manager

#### 3.4 Security Middleware
**File**: `backend/src/middleware/security/mod.rs`
- Update to retrieve CSRF_SECRET from password manager

#### 3.5 Cache Service
**File**: `backend/src/services/cache.rs`
- Update to retrieve REDIS_PASSWORD from password manager

### Phase 4: Remove Hardcoded Defaults

**Files to Update**:
1. `backend/src/services/security.rs` - Remove JWT secret fallback
2. `backend/src/middleware/security/mod.rs` - Remove CSRF secret default
3. `backend/src/services/secrets.rs` - Remove database URL fallback
4. `backend/src/config/mod.rs` - Remove all password fallbacks

## Implementation Steps

### Step 1: Update Config to Accept Password Manager
```rust
pub struct Config {
    // ... existing fields
    password_manager: Option<Arc<PasswordManager>>,
}

impl Config {
    pub async fn from_env_with_password_manager(
        password_manager: Option<Arc<PasswordManager>>
    ) -> Result<Self, AppError> {
        // Implementation
    }
}
```

### Step 2: Update Startup Sequence
```rust
// In main.rs
let password_manager = Arc::new(PasswordManager::new(...));
password_manager.initialize_application_passwords().await?;

let config = Config::from_env_with_password_manager(Some(password_manager.clone())).await?;
```

### Step 3: Update Services to Use Config
All services should receive password manager through config or dependency injection.

### Step 4: Remove Environment Variable Dependencies
Once integration is complete, remove direct env::var() calls for passwords.

## Testing Checklist

- [ ] Password manager API accessible
- [ ] All passwords can be retrieved via API
- [ ] Config loads passwords from manager
- [ ] Database connection uses password from manager
- [ ] JWT authentication uses secret from manager
- [ ] Email service uses password from manager
- [ ] All hardcoded defaults removed
- [ ] Application starts without env vars (uses manager)
- [ ] Password rotation works for all passwords
- [ ] Audit logging captures all password access

## Rollback Plan

If integration causes issues:
1. Keep environment variable fallbacks during transition
2. Use feature flag to enable/disable password manager integration
3. Monitor logs for password retrieval failures
4. Have rollback script to restore env var usage

## Security Considerations

1. **Master Key**: Store in AWS Secrets Manager or HashiCorp Vault
2. **Password Rotation**: Set appropriate intervals (90 days for critical, 180 for others)
3. **Audit Logging**: All password access is logged
4. **Encryption**: All passwords encrypted with AES-256-GCM
5. **Access Control**: Add authentication to password manager API endpoints

## Success Criteria

✅ All passwords stored in password manager
✅ No hardcoded passwords in code
✅ No direct env::var() calls for passwords
✅ All services retrieve passwords from manager
✅ Password rotation works for all passwords
✅ Audit logs capture all password access
✅ Application functions normally with password manager

## Timeline

- **Phase 1**: ✅ Complete
- **Phase 2**: 2-3 hours (Config integration)
- **Phase 3**: 4-6 hours (Service integration)
- **Phase 4**: 1-2 hours (Remove defaults)
- **Testing**: 2-3 hours
- **Total**: ~10-14 hours

## Next Immediate Actions

1. ✅ Re-enable password manager routes
2. ✅ Create migration function
3. ⏳ Update Config::from_env() to use password manager
4. ⏳ Update Database::new() to use password manager
5. ⏳ Update AuthService to use password manager
6. ⏳ Remove hardcoded defaults

---

**Status**: Phase 1 Complete, Phase 2 Ready to Start
**Last Updated**: $(date)

