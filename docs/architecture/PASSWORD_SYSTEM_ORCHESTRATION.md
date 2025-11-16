# Password System Orchestration - Best Practice Architecture

## Executive Summary

This document proposes a simplified, industry-standard password and secrets management system that consolidates the current fragmented approach into a unified, secure, and maintainable architecture.

## Current State Analysis

### Existing Components

1. **Password Manager Service** (`backend/src/services/password_manager.rs`)
   - Encrypted password storage in database
   - Per-user master keys (derived from login passwords)
   - OAuth master keys (separate system)
   - Automatic rotation scheduling
   - Migration from .env files

2. **OAuth Google Integration** (`backend/src/handlers/auth.rs`)
   - Google ID token validation
   - OAuth user creation/retrieval
   - Integration with password manager

3. **Secrets Management** (`backend/src/services/secrets.rs`)
   - Environment variable reader
   - Simple, standard approach

4. **Environment Variables (.env)**
   - Development configuration
   - Source for password migration

5. **Rotation System**
   - Built into password manager
   - Scheduled automatic rotation

### Current Issues

1. **Multiple Sources of Truth**
   - Secrets exist in .env and password manager
   - No clear hierarchy or precedence
   - Risk of inconsistency

2. **Complex Key Management**
   - Per-user master keys vs global master keys
   - OAuth users have separate key derivation
   - Master keys stored in memory (session-based)

3. **Overlapping Responsibilities**
   - Password manager handles both user passwords AND application secrets
   - Rotation system mixed with storage system
   - No clear separation of concerns

4. **Security Concerns**
   - Master keys derived from user passwords (PBKDF2, but still)
   - OAuth master keys stored encrypted with system master key
   - No key rotation for master keys themselves

## Proposed Architecture

### Core Principles

1. **Separation of Concerns**
   - **Application Secrets**: Infrastructure secrets (DB, JWT, etc.) → Environment variables
   - **User Passwords**: User-managed credentials → Password manager with proper encryption
   - **OAuth**: Use OAuth provider's security model, minimal local storage

2. **Single Source of Truth**
   - Application secrets: Environment variables (.env)
   - User passwords: Database with proper encryption
   - OAuth: Google's token validation, no local password storage

3. **Zero-Trust Master Keys**
   - Application secrets: Stored in environment variables (standard 12-Factor App)
   - User passwords: Key derivation from user's master password (not login password)
   - OAuth: No master keys needed (token-based auth)

4. **Industry Standards**
   - Follow 12-Factor App principles
   - OWASP Secrets Management guidelines
   - NIST password guidelines

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Auth       │    │   Password    │    │   Secrets    │ │
│  │   Service    │    │   Manager    │    │   Service    │ │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘ │
│         │                   │                   │          │
└─────────┼───────────────────┼───────────────────┼──────────┘
          │                   │                   │
          │                   │                   │
┌─────────▼───────────────────▼───────────────────▼──────────┐
│                    Storage Layer                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Database   │    │   Environment │    │   OAuth      │ │
│  │   (User      │    │   Variables   │    │   Provider   │ │
│  │   Passwords) │    │   (.env)      │    │   (Google)   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Design

### 1. Application Secrets Management

**Purpose**: Infrastructure secrets (database, JWT, Redis, etc.)

**Implementation**:
- **All Environments**: `.env` file (git-ignored)
- **Standard 12-Factor App approach**
- Simple environment variable access

**Key Features**:
- No local encryption needed (standard environment variables)
- Manual rotation (update .env and restart)
- Environment-specific .env files
- Simple and straightforward

**Code Structure**:
```rust
pub struct SecretsService;

impl SecretsService {
    // Simple environment variable reader
    pub fn get_secret(name: &str) -> AppResult<String> {
        std::env::var(name)
            .map_err(|_| AppError::NotFound(format!("Secret {} not found", name)))
    }
    
    // Convenience methods
    pub fn get_jwt_secret() -> AppResult<String> {
        get_secret("JWT_SECRET")
    }
    
    pub fn get_database_url() -> AppResult<String> {
        get_secret("DATABASE_URL")
    }
}
```

**Benefits**:
- Single source of truth (environment variables)
- Simple and standard (12-Factor App)
- No encryption/decryption overhead
- Easy to understand and maintain

### 2. User Password Management

**Purpose**: User-managed credentials (stored passwords, API keys, etc.)

**Implementation**:
- Database storage with AES-256-GCM encryption
- Master key derived from user's master password (separate from login)
- Per-user encryption keys
- No OAuth-specific handling (OAuth users don't need password manager)

**Key Features**:
- User sets a master password for password manager (separate from login)
- Master key derived using Argon2id (not PBKDF2)
- Per-user encryption (users can't decrypt each other's passwords)
- Automatic rotation for stored passwords
- Audit logging

**Code Structure**:
```rust
pub struct PasswordManager {
    db: Arc<Database>,
    // No global master key - all encryption is user-specific
}

impl PasswordManager {
    // User sets master password for password manager
    async fn set_master_password(&self, user_id: Uuid, master_password: &str) -> AppResult<()>;
    
    // Derive encryption key from master password
    fn derive_key(&self, user_id: Uuid, master_password: &str) -> [u8; 32];
    
    // Store encrypted password
    async fn store_password(&self, user_id: Uuid, name: &str, password: &str) -> AppResult<()>;
    
    // Retrieve and decrypt password
    async fn get_password(&self, user_id: Uuid, name: &str, master_password: &str) -> AppResult<String>;
}
```

**Benefits**:
- Users control their own encryption
- No dependency on login password
- OAuth users don't need password manager (they use OAuth tokens)
- Clear separation from application secrets

### 3. OAuth Integration

**Purpose**: Google OAuth authentication

**Implementation**:
- Token-based authentication (no passwords)
- No password manager integration needed
- JWT tokens for session management

**Key Features**:
- Validate Google ID tokens
- Create/retrieve OAuth users
- Generate application JWT tokens
- No master keys or password storage

**Code Structure**:
```rust
pub struct OAuthService {
    google_client_id: String,
    jwt_service: Arc<JwtService>,
}

impl OAuthService {
    async fn authenticate_google(&self, id_token: &str) -> AppResult<AuthResult>;
    // No password manager integration needed
}
```

**Benefits**:
- Simpler architecture
- No password management for OAuth users
- Industry-standard OAuth flow
- Better security (no password storage)

### 4. Rotation System

**Purpose**: Automatic rotation of application secrets and user passwords

**Implementation**:
- **Application Secrets**: Manual rotation (update .env and restart)
- **User Passwords**: Scheduled rotation via password manager

**Key Features**:
- Separate rotation for application secrets vs user passwords
- Configurable rotation intervals
- Audit logging
- Notification system

**Code Structure**:
```rust
pub struct RotationService {
    secrets_service: Arc<SecretsService>,
    password_manager: Arc<PasswordManager>,
    scheduler: Arc<RotationScheduler>,
}

impl RotationService {
    // Application secrets rotation (manual - update .env and restart)
    // Note: Manual process, not automated
    
    // User password rotation
    async fn rotate_user_password(&self, user_id: Uuid, password_name: &str) -> AppResult<()>;
    
    // Scheduled rotation
    async fn start_scheduler(&self);
}
```

## Migration Plan

### Phase 1: Consolidate Application Secrets (Week 1)

1. **Migrate all application secrets to environment variables**
   - DB_PASSWORD
   - JWT_SECRET
   - REDIS_PASSWORD
   - CSRF_SECRET
   - etc.

2. **Simplify SecretsService to use environment variables**
   - Remove password manager integration for application secrets
   - Simple environment variable reader

3. **Remove application secrets from password manager**
   - Clean up `initialize_application_passwords()`
   - Remove application secrets from password manager database

### Phase 2: Simplify User Password Management (Week 2)

1. **Remove per-user master key from login password**
   - Remove `set_user_master_key()` from login flow
   - Remove master key derivation from login password

2. **Implement separate master password for password manager**
   - Add endpoint for users to set master password
   - Use Argon2id for key derivation
   - Store master password hash (not plaintext)

3. **Remove OAuth master key system**
   - OAuth users don't need password manager
   - Remove `get_or_create_oauth_master_key()`

### Phase 3: Clean Up OAuth Integration (Week 3)

1. **Simplify OAuth flow**
   - Remove password manager integration from OAuth
   - Use standard JWT token generation
   - No special handling for OAuth users

2. **Update authentication handlers**
   - Separate login flow from password manager
   - OAuth flow doesn't touch password manager

### Phase 4: Rotation System Refactoring (Week 4)

1. **Separate rotation systems**
   - Application secrets: Manual rotation (update .env and restart)
   - User passwords: Password manager rotation

2. **Implement rotation scheduler**
   - Separate schedulers for different secret types
   - Proper error handling and logging

## Implementation Details

### 1. SecretsService Refactoring

```rust
// backend/src/services/secrets.rs

pub enum SecretSource {
    AwsSecretsManager(SecretsManagerClient),
    Environment,
}

pub struct SecretsService {
    source: SecretSource,
    cache: Arc<RwLock<HashMap<String, CachedSecret>>>,
    ttl: Duration,
}

impl SecretsService {
    /// Get secret from environment variable
    pub fn get_secret(name: &str) -> AppResult<String> {
        std::env::var(name)
            .map_err(|_| AppError::NotFound(format!("Secret {} not found in environment", name)))
    }
    
    /// Get JWT secret
    pub fn get_jwt_secret() -> AppResult<String> {
        Self::get_secret("JWT_SECRET")
    }
    
    /// Get database URL
    pub fn get_database_url() -> AppResult<String> {
        Self::get_secret("DATABASE_URL")
    }
    
    /// Get Redis password
    pub fn get_redis_password() -> AppResult<String> {
        Self::get_secret("REDIS_PASSWORD")
    }
}
```

### 2. PasswordManager Simplification

```rust
// backend/src/services/password_manager.rs

pub struct PasswordManager {
    db: Arc<Database>,
    // No global master key
    // No per-user master keys in memory
}

impl PasswordManager {
    /// User sets master password for password manager
    /// This is separate from their login password
    pub async fn set_master_password(
        &self,
        user_id: Uuid,
        master_password: &str,
    ) -> AppResult<()> {
        // Derive key using Argon2id
        let key = self.derive_key(user_id, master_password);
        
        // Hash master password for verification
        let hashed = bcrypt::hash(master_password, 12)?;
        
        // Store hash in database (for verification)
        self.store_master_password_hash(user_id, &hashed).await?;
        
        Ok(())
    }
    
    /// Derive encryption key from master password
    fn derive_key(&self, user_id: Uuid, master_password: &str) -> [u8; 32] {
        use argon2::Argon2;
        use argon2::password_hash::{PasswordHasher, SaltString};
        use rand::rngs::OsRng;
        
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let mut key = [0u8; 32];
        
        argon2
            .hash_password_into(
                master_password.as_bytes(),
                user_id.as_bytes(),
                &mut key,
            )
            .expect("Key derivation should not fail");
        
        key
    }
    
    /// Store encrypted password (requires master password for encryption)
    pub async fn store_password(
        &self,
        user_id: Uuid,
        name: &str,
        password: &str,
        master_password: &str,
    ) -> AppResult<()> {
        // Verify master password
        self.verify_master_password(user_id, master_password).await?;
        
        // Derive key
        let key = self.derive_key(user_id, master_password);
        
        // Encrypt password
        let encrypted = self.encrypt_with_key(&key, password)?;
        
        // Store in database
        self.store_encrypted_password(user_id, name, &encrypted).await?;
        
        Ok(())
    }
    
    /// Retrieve and decrypt password (requires master password)
    pub async fn get_password(
        &self,
        user_id: Uuid,
        name: &str,
        master_password: &str,
    ) -> AppResult<String> {
        // Verify master password
        self.verify_master_password(user_id, master_password).await?;
        
        // Load encrypted password
        let encrypted = self.load_encrypted_password(user_id, name).await?;
        
        // Derive key
        let key = self.derive_key(user_id, master_password);
        
        // Decrypt
        let password = self.decrypt_with_key(&key, &encrypted)?;
        
        Ok(password)
    }
}
```

### 3. OAuth Service Simplification

```rust
// backend/src/services/auth/oauth.rs

pub struct OAuthService {
    google_client_id: String,
    jwt_service: Arc<JwtService>,
    user_service: Arc<UserService>,
}

impl OAuthService {
    pub async fn authenticate_google(&self, id_token: &str) -> AppResult<AuthResult> {
        // Validate Google token
        let token_info = self.validate_google_token(id_token).await?;
        
        // Extract user info
        let email = token_info.email
            .ok_or_else(|| AppError::Authentication("Email not found in token".to_string()))?;
        
        // Create or get user
        let user = self.user_service
            .get_or_create_oauth_user(&email, &token_info)
            .await?;
        
        // Generate JWT token
        let jwt_token = self.jwt_service.generate_token(&user).await?;
        
        // No password manager integration needed
        Ok(AuthResult {
            user,
            token: jwt_token,
        })
    }
}
```

## Security Improvements

### 1. Key Derivation

**Current**: PBKDF2 with 100,000 iterations
**Proposed**: Argon2id (winner of Password Hashing Competition)

**Benefits**:
- Memory-hard function (resistant to GPU/ASIC attacks)
- Configurable parameters
- Industry standard

### 2. Master Key Management

**Current**: Derived from login password, stored in memory
**Proposed**: Separate master password, hashed and stored

**Benefits**:
- Separation of concerns
- No memory storage of keys
- Better security model

### 3. OAuth Security

**Current**: OAuth master keys stored encrypted
**Proposed**: No password manager for OAuth users

**Benefits**:
- Simpler architecture
- No password storage for OAuth users
- Industry-standard OAuth flow

## Benefits of Proposed Architecture

1. **Simplified Architecture**
   - Clear separation of concerns
   - Single source of truth for each secret type
   - Easier to understand and maintain

2. **Better Security**
   - Industry-standard practices
   - Proper key derivation (Argon2id)
   - No password storage for OAuth users
   - External secret management for application secrets

3. **Improved Maintainability**
   - Less code complexity
   - Clear responsibilities
   - Easier to test and debug

4. **Scalability**
   - Simple environment variable access
   - No master key management overhead
   - Better performance (no encryption for application secrets)

5. **Compliance**
   - Follows 12-Factor App principles
   - OWASP guidelines
   - Industry best practices

## Migration Checklist

- [ ] Phase 1: Migrate application secrets to environment variables
- [ ] Phase 2: Simplify user password management
- [ ] Phase 3: Clean up OAuth integration
- [ ] Phase 4: Refactor rotation system
- [ ] Update documentation
- [ ] Update tests
- [ ] Security audit
- [ ] Performance testing

## Conclusion

The proposed architecture simplifies the current system while improving security and maintainability. It follows industry best practices and provides a clear separation between application secrets and user passwords.

