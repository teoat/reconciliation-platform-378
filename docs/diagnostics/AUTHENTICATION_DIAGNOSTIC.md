# Authentication System Diagnostic Report

## Overview

Comprehensive investigation of signup and Google OAuth authentication processes, including database schema verification and issue identification.

## 1. Signup/Registration Flow

### Current Implementation

**Endpoint**: `POST /api/v1/auth/register`

**Flow**:
1. Frontend validates form data (email, password, names)
2. Frontend sends request to backend
3. Backend validates email format
4. Backend validates password strength (8+ chars, uppercase, lowercase, number, special char)
5. Backend hashes password with bcrypt (cost 12)
6. Backend creates user in database (transaction)
7. Backend generates JWT token
8. Backend returns token and user info

**Code Path**:
- `frontend/src/pages/AuthPage.tsx` → `useAuth.register()` 
- `frontend/src/hooks/useAuth.tsx` → `apiClient.register()`
- `backend/src/handlers/auth.rs::register()`
- `backend/src/services/user/mod.rs::create_user()`

### Issues Found

#### ✅ Working Correctly
- Email validation
- Password strength validation
- Password hashing (bcrypt cost 12)
- Transaction-based user creation
- Duplicate email prevention
- JWT token generation

#### ⚠️ Potential Issues
1. **SecretManager Integration**: Signup doesn't initialize secrets
   - **Location**: `backend/src/handlers/auth.rs::register()`
   - **Issue**: Only login initializes secrets, not signup
   - **Impact**: First user via signup won't trigger secret generation
   - **Fix**: Add SecretManager initialization to register handler

2. **Email Verification**: Email marked as verified on signup
   - **Location**: `backend/src/services/user/mod.rs::create_user()`
   - **Issue**: `email_verified: true` set without actual verification
   - **Impact**: Security concern - emails not actually verified
   - **Fix**: Set `email_verified: false` and send verification email

3. **Role Validation**: Role defaults to "user" but status field used
   - **Location**: `backend/src/services/user/mod.rs::create_user()`
   - **Issue**: Role stored in `status` field (confusing)
   - **Impact**: Potential confusion between user status and role
   - **Fix**: Consider separate `role` field or clarify documentation

## 2. Google OAuth Flow

### Current Implementation

**Endpoint**: `POST /api/v1/auth/google`

**Flow**:
1. Frontend loads Google Identity Services script
2. User clicks Google Sign-In button
3. Google returns ID token
4. Frontend sends ID token to backend
5. Backend verifies token with Google's tokeninfo endpoint
6. Backend validates audience (client ID), expiration, email verification
7. Backend extracts user info (email, name)
8. Backend creates or retrieves user
9. Backend generates JWT token
10. Backend returns token and user info

**Code Path**:
- `frontend/src/pages/AuthPage.tsx` → Google button callback
- `frontend/src/hooks/useAuth.tsx` → `googleOAuth()`
- `backend/src/handlers/auth.rs::google_oauth()`
- `backend/src/services/user/mod.rs::create_oauth_user()`

### Issues Found

#### ✅ Working Correctly
- Google token verification via tokeninfo endpoint
- Audience (client ID) validation
- Token expiration check
- Email verification check
- User creation/retrieval logic
- JWT token generation

#### ⚠️ Issues Identified

1. **Tokeninfo Endpoint Deprecation**
   - **Location**: `backend/src/handlers/auth.rs::google_oauth()`
   - **Issue**: Using deprecated `tokeninfo` endpoint
   - **Impact**: Google may deprecate this endpoint
   - **Fix**: Migrate to JWT verification using Google's public keys

2. **SecretManager Integration Missing**
   - **Location**: `backend/src/handlers/auth.rs::google_oauth()`
   - **Issue**: OAuth login doesn't initialize secrets
   - **Impact**: First user via OAuth won't trigger secret generation
   - **Fix**: Add SecretManager initialization

3. **Error Handling**
   - **Location**: `backend/src/handlers/auth.rs::google_oauth()`
   - **Issue**: Network errors not well handled
   - **Impact**: Poor error messages for users
   - **Fix**: Better error messages and retry logic

4. **Client ID Validation**
   - **Location**: `backend/src/handlers/auth.rs::google_oauth()`
   - **Issue**: Uses `env::var()` instead of `SecretsService`
   - **Impact**: Inconsistent secret access
   - **Fix**: Use `SecretsService::get_google_client_id()`

5. **Frontend Google Button Loading**
   - **Location**: `frontend/src/pages/AuthPage.tsx`
   - **Issue**: Previous issues with button not loading
   - **Status**: Should be fixed with recent CSP and script loading changes
   - **Verify**: Test in browser

## 3. Database Schema Analysis

### Users Table Schema

**Migration**: `backend/migrations/20240101000000_create_base_schema/up.sql`

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ,
    password_expires_at TIMESTAMPTZ,
    password_last_changed TIMESTAMPTZ,
    password_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Schema Issues

#### ✅ Correct
- All required fields present
- Proper indexes on email, status, email_verified
- Password expiration fields
- Timestamps

#### ⚠️ Potential Issues

1. **Status Field Confusion**
   - **Issue**: `status` field used for both user status (active/inactive) and role (user/admin/manager)
   - **Impact**: Can't have inactive admin user
   - **Recommendation**: Add separate `role` field or use `status` only for active/inactive

2. **Password Hash Length**
   - **Issue**: `VARCHAR(255)` may be too short for bcrypt hashes (60 chars standard, but some implementations use longer)
   - **Impact**: Potential truncation
   - **Fix**: Increase to `VARCHAR(255)` is actually fine (bcrypt is 60 chars)

3. **OAuth User Identification**
   - **Issue**: No field to identify OAuth users vs password users
   - **Impact**: Can't distinguish authentication method
   - **Recommendation**: Add `auth_provider` field (password/google/etc)

## 4. Integration Points

### SecretManager Integration

**Current State**:
- ✅ Integrated in login handler
- ❌ Missing in register handler
- ❌ Missing in Google OAuth handler

**Impact**: First user via signup or OAuth won't trigger automatic secret generation.

**Fix Required**: Add SecretManager initialization to both handlers.

### SecretsService Usage

**Current State**:
- ✅ Used in config loading
- ✅ Used in email config
- ✅ Used in billing config
- ⚠️ Google OAuth uses `env::var()` directly

**Fix Required**: Update Google OAuth to use `SecretsService`.

## 5. Frontend Integration

### Signup Form
- ✅ Validation with Zod
- ✅ Password strength feedback
- ✅ Error handling
- ✅ Loading states

### Google OAuth
- ✅ Google Identity Services integration
- ✅ Button rendering with retry logic
- ✅ Error handling
- ⚠️ CSP configuration (should be fixed)

## 6. Security Considerations

### ✅ Good Practices
- Password hashing with bcrypt (cost 12)
- Password strength validation
- JWT token expiration
- Email validation
- SQL injection prevention (Diesel ORM)
- Transaction-based user creation

### ⚠️ Security Concerns
1. **Email Verification**: Emails marked verified without actual verification
2. **Token Verification**: Using deprecated Google tokeninfo endpoint
3. **Secret Management**: Some direct env::var() calls instead of SecretsService

## 7. Recommendations

### High Priority
1. Add SecretManager initialization to register and google_oauth handlers
2. Fix email verification flow (don't mark as verified on signup)
3. Update Google OAuth to use SecretsService
4. Consider migrating from tokeninfo to JWT verification

### Medium Priority
1. Add `auth_provider` field to users table
2. Separate `role` from `status` field
3. Improve error messages in OAuth flow
4. Add retry logic for Google token verification

### Low Priority
1. Add OAuth provider metadata (picture URL, etc.)
2. Add OAuth token refresh support
3. Add multi-provider OAuth support

## 8. SQL Setup Required

### Check if migrations are up to date
```sql
-- Verify users table exists and has correct structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users';

-- Verify application_secrets table exists (for SecretManager)
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'application_secrets'
);
```

### Required Migrations
1. ✅ Base schema migration (users table)
2. ✅ Application secrets migration (for SecretManager)
3. ⚠️ Consider: Add `auth_provider` field migration
4. ⚠️ Consider: Add `role` field migration (if separating from status)

## 9. Testing Checklist

### Signup Flow
- [ ] Valid signup with strong password
- [ ] Invalid email format rejected
- [ ] Weak password rejected
- [ ] Duplicate email rejected
- [ ] JWT token generated correctly
- [ ] User created in database
- [ ] SecretManager initialized (if first user)

### Google OAuth Flow
- [ ] Google button loads correctly
- [ ] Valid token accepted
- [ ] Invalid token rejected
- [ ] Expired token rejected
- [ ] Unverified email rejected
- [ ] New user created
- [ ] Existing user retrieved
- [ ] JWT token generated
- [ ] SecretManager initialized (if first user)

### Database
- [ ] Users table exists
- [ ] Application_secrets table exists
- [ ] Indexes created
- [ ] Constraints working

## 10. Next Steps

1. **Immediate**: Add SecretManager to register and google_oauth handlers
2. **Immediate**: Fix email verification flow
3. **Short-term**: Update Google OAuth to use SecretsService
4. **Short-term**: Migrate from tokeninfo to JWT verification
5. **Long-term**: Add auth_provider field and separate role from status

