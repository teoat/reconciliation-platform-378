# Automatic Secret Management System

## Overview

The Reconciliation Platform now includes a comprehensive automatic secret management system that:
- **Automatically generates** required secrets on first master user login
- **Stores secrets securely** in encrypted database storage
- **Rotates secrets automatically** based on configured schedules
- **Requires no manual configuration** - users only need to login

## Architecture

### Components

1. **SecretManager** (`backend/src/services/secret_manager.rs`)
   - Automatic secret generation
   - Encrypted storage in database
   - Automatic rotation scheduler
   - Master user management

2. **SecretsService** (`backend/src/services/secrets.rs`)
   - Unified secret access interface
   - Validation and metadata management
   - Environment variable fallback

3. **Database Schema** (`application_secrets` table)
   - Encrypted secret storage
   - Rotation scheduling
   - Audit trail

## How It Works

### 1. First Login (Master User)

When the first user logs in:
1. User becomes the "master user"
2. System automatically generates all required secrets:
   - `JWT_SECRET` (32+ chars)
   - `CSRF_SECRET` (32+ chars)
   - `DATABASE_URL` (if not set)
   - `PASSWORD_MASTER_KEY` (32+ chars)
3. Secrets are encrypted and stored in database
4. Secrets are set in environment for immediate use

### 2. Automatic Rotation

Background scheduler runs every hour:
- Checks for secrets due for rotation
- Generates new secure secrets
- Updates database and environment
- Logs rotation events

### 3. Secret Access

All secrets are accessed via `SecretsService`:
```rust
use crate::services::secrets::SecretsService;

// Get secret (validated)
let jwt_secret = SecretsService::get_jwt_secret()?;

// Get with fallback
let api_key = SecretsService::get_secret_or_default("API_KEY", "default");
```

## Secret Categories

### Required (Auto-Generated)
- `JWT_SECRET` - 90 day rotation
- `CSRF_SECRET` - 180 day rotation
- `DATABASE_URL` - 180 day rotation
- `PASSWORD_MASTER_KEY` - 365 day rotation

### Optional (Manual or Auto)
- OAuth secrets
- Payment processing keys
- Monitoring credentials
- Storage/backup keys

## Integration Points

### Startup (`backend/src/main.rs`)
```rust
// Initialize secret manager
let secret_manager = Arc::new(SecretManager::new(db.clone()));

// Load secrets from database
secret_manager.load_secrets_from_db().await?;

// Start rotation scheduler
secret_manager.start_rotation_scheduler().await;
```

### Login Handler (`backend/src/handlers/auth.rs`)
```rust
// Initialize secrets on master login
if let Some(secret_manager) = req.app_data::<web::Data<Arc<SecretManager>>>() {
    secret_manager.initialize_secrets(user.id).await?;
}
```

## Security Features

1. **Encryption**: All secrets encrypted with AES-256-GCM
2. **Master Key**: Derived from `PASSWORD_MASTER_KEY` environment variable
3. **Validation**: Minimum length and format validation
4. **Rotation**: Automatic rotation prevents secret staleness
5. **Audit**: All secret operations logged

## Migration from Manual Secrets

### Before
- Manual secret generation
- Manual Kubernetes secret creation
- Manual rotation
- Risk of secrets expiring

### After
- Automatic generation on login
- Automatic storage and rotation
- Zero manual configuration
- Always up-to-date secrets

## Database Schema

```sql
CREATE TABLE application_secrets (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    encrypted_value TEXT NOT NULL,
    min_length INTEGER NOT NULL,
    rotation_interval_days INTEGER NOT NULL,
    last_rotated_at TIMESTAMPTZ,
    next_rotation_due TIMESTAMPTZ NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
```

## Configuration

### Environment Variables (Still Required)
- `PASSWORD_MASTER_KEY` - Master encryption key (32+ chars)
- Other secrets are optional (auto-generated if missing)

### Rotation Schedules
Configured in `SecretsService::get_secret_metadata()`:
- JWT secrets: 90 days
- CSRF secrets: 180 days
- Database: 180 days
- Master key: 365 days

## Troubleshooting

### Secrets Not Generating
- Check master user login
- Verify database connection
- Check logs for errors

### Rotation Not Working
- Verify scheduler is running
- Check `next_rotation_due` dates
- Review rotation logs

### Secret Access Failures
- Verify secrets loaded from database
- Check environment variables
- Review `SecretsService` logs

## Best Practices

1. **First Login**: Use a secure account for first login (becomes master)
2. **Backup**: Regularly backup `application_secrets` table
3. **Monitoring**: Monitor rotation logs for issues
4. **Access Control**: Limit access to master user account
5. **Audit**: Review secret access logs regularly

## Future Enhancements

- [ ] External secret manager integration (Vault, AWS Secrets Manager)
- [ ] Secret sharing between environments
- [ ] Secret versioning and rollback
- [ ] Webhook notifications for rotations
- [ ] Secret access analytics

