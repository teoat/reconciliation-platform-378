# Password System Simplification - Quick Reference

## Current Problems

1. **Multiple overlapping systems**: .env, password manager, AWS Secrets Manager, rotation system
2. **Complex key management**: Per-user master keys, OAuth master keys, global master keys
3. **Mixed responsibilities**: Password manager handles both user passwords AND application secrets
4. **Security concerns**: Master keys derived from login passwords, stored in memory

## Proposed Solution

### Architecture Overview

```
Application Secrets (DB, JWT, Redis) → Environment Variables (.env)
User Passwords (stored credentials) → Password Manager (database, user-specific encryption)
OAuth Users → No password manager needed (token-based auth)
```

### Key Changes

1. **Application Secrets** → Environment Variables
   - Use .env files for all environments (dev, staging, prod)
   - Remove from password manager
   - Simple, standard approach (12-Factor App)
   - Manual rotation (update .env and restart)

2. **User Passwords** → Simplified Password Manager
   - Separate master password (not login password)
   - Argon2id key derivation (not PBKDF2)
   - Per-user encryption
   - No OAuth integration needed

3. **OAuth** → Token-Based Only
   - No password manager for OAuth users
   - Standard JWT token generation
   - No master keys

## Implementation Steps

### Step 1: Migrate Application Secrets (Priority: High)

**Action**: Move all application secrets from password manager to AWS Secrets Manager

**Secrets to migrate**:
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `REDIS_PASSWORD`
- `CSRF_SECRET`
- `SMTP_PASSWORD`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `API_KEY`
- `GRAFANA_PASSWORD`

**Code changes**:
- Simplify `SecretsService` to read from environment variables
- Remove `initialize_application_passwords()` from password manager
- Update all code that uses these secrets to use `SecretsService` or `std::env::var()` directly

### Step 2: Simplify Password Manager (Priority: High)

**Action**: Remove per-user master key system, implement separate master password

**Changes**:
- Remove `set_user_master_key()` from login flow
- Add endpoint for users to set master password for password manager
- Use Argon2id for key derivation
- Remove OAuth master key system

**Code changes**:
- Update `PasswordManager` to use Argon2id
- Add `set_master_password()` endpoint
- Remove `get_or_create_oauth_master_key()`
- Remove master key storage in memory

### Step 3: Clean Up OAuth (Priority: Medium)

**Action**: Remove password manager integration from OAuth flow

**Changes**:
- Remove password manager calls from OAuth handler
- Use standard JWT token generation
- No special handling for OAuth users

**Code changes**:
- Update `google_oauth()` handler
- Remove password manager integration
- Simplify OAuth user creation

### Step 4: Refactor Rotation System (Priority: Low)

**Action**: Separate rotation for application secrets vs user passwords

**Changes**:
- Application secrets: Use AWS Secrets Manager rotation
- User passwords: Keep password manager rotation
- Separate schedulers

## Quick Wins (Can Do Immediately)

1. **Remove application secrets from password manager**
   - Comment out `initialize_application_passwords()` call
   - Use environment variables directly
   - Ensure .env files are properly git-ignored

2. **Simplify OAuth flow**
   - Remove password manager integration from `google_oauth()` handler
   - OAuth users don't need password manager

3. **Document current state**
   - Create inventory of all secrets
   - Document where each secret is stored
   - Plan migration path

## Security Improvements

| Current | Proposed | Benefit |
|---------|----------|---------|
| PBKDF2 key derivation | Argon2id | Memory-hard, more secure |
| Master key from login password | Separate master password | Better separation |
| OAuth master keys | No password manager for OAuth | Simpler, more secure |
| Application secrets in password manager | Environment variables | Industry standard (12-Factor) |
| Master keys in memory | Key derivation on-demand | No memory storage |

## Migration Timeline

- **Week 1**: Migrate application secrets to environment variables
- **Week 2**: Simplify password manager (remove per-user master keys)
- **Week 3**: Clean up OAuth integration
- **Week 4**: Refactor rotation system

## Files to Modify

### High Priority
- `backend/src/services/secrets.rs` - Simplify to use environment variables
- `backend/src/services/password_manager.rs` - Simplify, remove application secrets
- `backend/src/handlers/auth.rs` - Remove password manager from OAuth

### Medium Priority
- `backend/src/services/auth/password.rs` - Remove master key setting from login
- `backend/src/main.rs` - Update initialization

### Low Priority
- Rotation scheduler
- Tests
- Documentation

## Questions to Answer

1. **Environment variable management**
   - Use .env files for all environments
   - Ensure .env is in .gitignore
   - Document required environment variables
   - Use .env.example as template

2. **Do OAuth users need password manager?**
   - If yes: Implement separate master password system
   - If no: Remove password manager for OAuth users (recommended)

3. **What's the rotation strategy?**
   - Application secrets: Manual rotation (update .env and restart)
   - User passwords: Password manager rotation

## Next Steps

1. Review the detailed architecture document: `docs/architecture/PASSWORD_SYSTEM_ORCHESTRATION.md`
2. Ensure .env files are properly configured and git-ignored
3. Start with Step 1 (migrate application secrets to environment variables)
4. Test thoroughly before proceeding to next steps

