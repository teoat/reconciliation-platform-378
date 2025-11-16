# Password System Implementation Guide

## Current State Analysis

### Current Architecture Issues

1. **Password Manager Handles Too Much**
   - User passwords (encrypted with per-user master keys)
   - Application secrets (DB_PASSWORD, JWT_SECRET, etc.)
   - OAuth master keys (separate system)
   - Rotation scheduling

2. **Complex Key Management**
   - Login password → Master key (PBKDF2)
   - OAuth → OAuth master key (stored encrypted)
   - Global master key (fallback)
   - All stored in memory during session

3. **Mixed Responsibilities**
   - `password_manager.rs`: 672 lines, handles everything
   - `secrets.rs`: AWS Secrets Manager, but not fully utilized
   - `.env`: Still used for development, but also migrated to password manager

### Current Code Locations

**Password Manager Integration Points**:
- `backend/src/handlers/auth.rs:165` - Login sets master key from password
- `backend/src/handlers/auth.rs:304` - Logout clears master key
- `backend/src/handlers/auth.rs:329` - Change password uses password manager
- `backend/src/handlers/auth.rs:410` - Password reset clears master key
- `backend/src/handlers/auth.rs:592` - OAuth creates/gets master key

**Application Secrets in Password Manager**:
- `backend/src/services/password_manager.rs:199` - `initialize_application_passwords()`
- Migrates: DB_PASSWORD, JWT_SECRET, REDIS_PASSWORD, CSRF_SECRET, etc.

## Proposed Architecture

### Three-Tier System

```
┌─────────────────────────────────────────────────────────┐
│  Tier 1: Application Secrets (Infrastructure)          │
│  - DB_PASSWORD, JWT_SECRET, REDIS_PASSWORD, etc.     │
│  - Source: Environment Variables (.env)                │
│  - No encryption needed (standard 12-Factor App)       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Tier 2: User Passwords (User-Managed Credentials)      │
│  - Stored passwords, API keys, etc.                     │
│  - Source: Database (encrypted with user's master key)   │
│  - Master password separate from login password          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Tier 3: OAuth (No Password Storage)                     │
│  - Google OAuth authentication                          │
│  - Token-based only, no password manager needed         │
└─────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Separate Application Secrets (Week 1)

**Goal**: Move all application secrets out of password manager

**Steps**:

1. **Simplify SecretsService** (`backend/src/services/secrets.rs`)
   ```rust
   // Simple environment variable reader
   pub fn get_secret(name: &str) -> AppResult<String> {
       std::env::var(name)
           .map_err(|_| AppError::NotFound(format!("Secret {} not found in environment", name)))
   }
   
   // Convenience methods for common secrets
   pub fn get_jwt_secret() -> AppResult<String> {
       get_secret("JWT_SECRET")
   }
   
   pub fn get_database_url() -> AppResult<String> {
       get_secret("DATABASE_URL")
   }
   ```

2. **Remove Application Secrets from Password Manager**
   - Comment out `initialize_application_passwords()` call in startup
   - Remove application secrets from password manager database
   - Update all code to use `SecretsService` instead

3. **Update Code That Uses Application Secrets**
   - Database connection: Use `SecretsService::get_database_url()`
   - JWT service: Use `SecretsService::get_jwt_secret()`
   - Redis: Use `SecretsService::get_secret("REDIS_PASSWORD")`
   - etc.

**Files to Modify**:
- `backend/src/services/secrets.rs` - Add application secret methods
- `backend/src/services/password_manager.rs` - Remove `initialize_application_passwords()`
- `backend/src/main.rs` - Remove password manager initialization for app secrets
- All files that use `DB_PASSWORD`, `JWT_SECRET`, etc. directly

### Phase 2: Simplify User Password Manager (Week 2)

**Goal**: Remove per-user master key system, implement separate master password

**Steps**:

1. **Remove Master Key from Login Flow**
   ```rust
   // backend/src/handlers/auth.rs:165
   // REMOVE THIS:
   // if let Some(password_manager) = ... {
   //     password_manager.set_user_master_key(user.id, &req.password).await;
   // }
   ```

2. **Add Master Password Endpoint**
   ```rust
   // backend/src/handlers/password_manager.rs (new file)
   pub async fn set_master_password(
       req: web::Json<SetMasterPasswordRequest>,
       http_req: HttpRequest,
   ) -> Result<HttpResponse, AppError> {
       let user_id = extract_user_id(&http_req)?;
       let password_manager = get_password_manager(&http_req)?;
       
       password_manager
           .set_master_password(user_id, &req.master_password)
           .await?;
       
       Ok(HttpResponse::Ok().json(json!({"success": true})))
   }
   ```

3. **Update PasswordManager**
   ```rust
   // backend/src/services/password_manager.rs
   // REMOVE:
   // - set_user_master_key()
   // - get_or_create_oauth_master_key()
   // - user_master_keys HashMap
   // - get_master_key_for_user()
   
   // ADD:
   // - set_master_password() - stores hashed master password
   // - verify_master_password() - verifies master password
   // - derive_key() - uses Argon2id to derive encryption key
   ```

4. **Update Password Manager Operations**
   - All operations now require master password parameter
   - Key derivation happens on-demand (not stored in memory)
   - Use Argon2id instead of PBKDF2

**Files to Modify**:
- `backend/src/handlers/auth.rs` - Remove master key setting from login
- `backend/src/services/password_manager.rs` - Refactor key management
- `backend/src/handlers/password_manager.rs` - Add master password endpoint
- Frontend - Add UI for setting master password

### Phase 3: Remove OAuth Password Manager Integration (Week 3)

**Goal**: OAuth users don't need password manager

**Steps**:

1. **Remove OAuth Master Key Creation**
   ```rust
   // backend/src/handlers/auth.rs:590
   // REMOVE THIS ENTIRE BLOCK:
   // if let Some(password_manager) = ... {
   //     password_manager.get_or_create_oauth_master_key(...)
   // }
   ```

2. **Simplify OAuth Flow**
   - OAuth users authenticate with Google
   - Generate JWT token
   - No password manager interaction

3. **Update Frontend**
   - OAuth users don't see password manager UI
   - Or: OAuth users can set master password if they want password manager

**Files to Modify**:
- `backend/src/handlers/auth.rs` - Remove OAuth master key code
- `backend/src/services/password_manager.rs` - Remove OAuth methods
- Frontend - Update OAuth user experience

### Phase 4: Refactor Rotation System (Week 4)

**Goal**: Separate rotation for application secrets vs user passwords

**Steps**:

1. **Application Secrets Rotation**
   - Manual rotation: Update .env file and restart application
   - Document rotation schedule and process

2. **User Password Rotation**
   - Keep in PasswordManager
   - Separate scheduler
   - User-initiated or scheduled

**Files to Modify**:
- `backend/src/services/password_manager.rs` - Keep user password rotation
- `backend/src/services/secrets.rs` - Add rotation methods (if needed)
- Rotation scheduler - Separate schedulers

## Code Changes Summary

### Files to Create
- `backend/src/handlers/password_manager.rs` - Password manager endpoints

### Files to Modify
- `backend/src/services/secrets.rs` - Add application secret methods
- `backend/src/services/password_manager.rs` - Simplify, remove app secrets
- `backend/src/handlers/auth.rs` - Remove master key integration
- `backend/src/main.rs` - Update initialization

### Files to Remove/Deprecate
- Application secrets from password manager database
- OAuth master key system
- Per-user master key in-memory storage

## Migration Checklist

### Phase 1: Application Secrets
- [ ] Simplify `SecretsService` to read from environment variables
- [ ] Remove `initialize_application_passwords()` call
- [ ] Update database connection to use environment variables
- [ ] Update JWT service to use environment variables
- [ ] Update Redis connection to use environment variables
- [ ] Update all other services to use environment variables
- [ ] Remove application secrets from password manager database
- [ ] Ensure .env.example is up to date
- [ ] Test all services work with environment variables

### Phase 2: User Password Manager
- [ ] Remove `set_user_master_key()` from login
- [ ] Add `set_master_password()` endpoint
- [ ] Update `PasswordManager` to use Argon2id
- [ ] Remove `user_master_keys` HashMap
- [ ] Update all password manager operations to require master password
- [ ] Add frontend UI for master password
- [ ] Test password manager with new system

### Phase 3: OAuth
- [ ] Remove OAuth master key creation from OAuth handler
- [ ] Remove `get_or_create_oauth_master_key()` method
- [ ] Simplify OAuth flow
- [ ] Update frontend for OAuth users
- [ ] Test OAuth authentication

### Phase 4: Rotation
- [ ] Separate rotation schedulers
- [ ] Test application secret rotation (if manual)
- [ ] Test user password rotation
- [ ] Update documentation

## Testing Strategy

### Unit Tests
- Test `SecretsService` with environment variables
- Test `SecretsService` with AWS Secrets Manager (mocked)
- Test `PasswordManager` with Argon2id key derivation
- Test master password verification

### Integration Tests
- Test application startup with new secret system
- Test login flow without master key setting
- Test OAuth flow without password manager
- Test password manager operations with master password

### End-to-End Tests
- Test full authentication flow
- Test password manager operations
- Test OAuth authentication
- Test secret rotation

## Rollback Plan

If issues arise during migration:

1. **Phase 1 Rollback**: Re-enable `initialize_application_passwords()`
2. **Phase 2 Rollback**: Re-add master key setting in login
3. **Phase 3 Rollback**: Re-add OAuth master key creation
4. **Phase 4 Rollback**: Keep existing rotation system

## Success Criteria

- [ ] All application secrets use `SecretsService`
- [ ] Password manager only handles user passwords
- [ ] OAuth users don't need password manager
- [ ] No master keys stored in memory
- [ ] Argon2id used for key derivation
- [ ] All tests pass
- [ ] Documentation updated

## Next Steps

1. Review this guide with the team
2. Set up AWS Secrets Manager (if not already done)
3. Start with Phase 1 (lowest risk)
4. Test thoroughly before proceeding
5. Document any issues or deviations

