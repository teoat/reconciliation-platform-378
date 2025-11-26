# Initial Password Setup Guide

**Last Updated**: January 2025  
**Status**: Active

## Quick Start

This guide explains how to set up and use the initial password system for testing and pre-production environments.

## Prerequisites

1. Database is running and accessible
2. `DATABASE_URL` environment variable is set
3. Backend is built (`cargo build` in `backend/` directory)

## Step 1: Run Database Migration

The migration adds the necessary fields to the `users` table:

```bash
cd backend
diesel migration run
```

If you encounter permission errors, ensure:
- Database user has CREATE/ALTER permissions
- `DATABASE_URL` is correctly set
- Database is running

## Step 2: Verify Migration

Check that the migration was applied:

```sql
-- Connect to your database and run:
\d users

-- You should see:
-- is_initial_password | boolean | not null default false
-- initial_password_set_at | timestamp with time zone |
```

## Step 3: Set Initial Passwords for Existing Users

### Option A: Using the Rust Binary (Recommended)

```bash
cd backend

# Set initial passwords for users without initial passwords
cargo run --bin set-initial-passwords

# Set initial passwords for ALL users (including those with existing passwords)
cargo run --bin set-initial-passwords -- --all

# Save passwords to a file
cargo run --bin set-initial-passwords -- --output passwords.txt
```

### Option B: Using the Shell Script

```bash
# Set initial passwords
./scripts/set-initial-passwords.sh

# Set for all users
./scripts/set-initial-passwords.sh --all

# Save to file
./scripts/set-initial-passwords.sh --output passwords.txt
```

### Option C: Using the API (Programmatic)

If you have admin access, you can use the `create_user_with_initial_password` method:

```rust
use crate::services::user::UserService;

let (user_info, initial_password) = user_service
    .create_user_with_initial_password(create_request)
    .await?;

// Store initial_password securely
println!("Initial password for {}: {}", user_info.email, initial_password);
```

## Step 4: Test the System

Run the test script to verify everything works:

```bash
./scripts/test-initial-password-system.sh
```

Or test manually:

### 4.1. Login with Initial Password

```bash
curl -X POST http://localhost:2000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "<initial_password>"
  }'
```

**Expected Response:**
```json
{
  "token": "...",
  "user": {...},
  "requires_password_change": true,
  "message": "Please change your initial password"
}
```

### 4.2. Change Initial Password

```bash
curl -X POST http://localhost:2000/api/v1/auth/change-initial-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "current_password": "<initial_password>",
    "new_password": "NewSecureP@ss123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Initial password changed successfully. You can now use your new password to login."
}
```

### 4.3. Login with New Password

```bash
curl -X POST http://localhost:2000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "NewSecureP@ss123!"
  }'
```

**Expected Response:**
```json
{
  "token": "...",
  "user": {...},
  "requires_password_change": null,
  "message": null
}
```

## Step 5: Distribute Initial Passwords

**IMPORTANT**: Store and share initial passwords securely:

1. **Secure Storage**: Use encrypted files or password managers
2. **Secure Communication**: Share via encrypted channels (not plain email)
3. **One-Time Use**: Inform users that passwords must be changed on first login
4. **Expiration**: Initial passwords should be changed within a reasonable timeframe

### Example Distribution Email Template

```
Subject: Your Account Credentials - Action Required

Hello,

Your account has been created. Please use the following credentials to log in:

Email: user@example.com
Initial Password: [PASSWORD]

IMPORTANT: You must change this password on your first login.

Steps:
1. Log in with the credentials above
2. You will be prompted to change your password
3. Choose a strong password that meets our requirements:
   - At least 8 characters
   - Contains uppercase, lowercase, number, and special character

If you have any questions, please contact support.

Best regards,
IT Team
```

## Troubleshooting

### Migration Fails

**Error**: `permission denied for schema public`

**Solution**:
- Check database user permissions
- Ensure `DATABASE_URL` uses a user with CREATE/ALTER privileges
- Run migration as database owner or superuser

### Binary Not Found

**Error**: `error: no bin target named 'set-initial-passwords'`

**Solution**:
- Ensure `Cargo.toml` includes the binary definition
- Run `cargo build` in the `backend/` directory
- Check that `backend/src/bin/set-initial-passwords.rs` exists

### Password Generation Fails

**Error**: `Failed to generate initial password`

**Solution**:
- Check that `PasswordManager::generate_initial_password()` is accessible
- Verify all dependencies are installed (`cargo build`)
- Check for compilation errors

### Login Doesn't Require Password Change

**Issue**: Login succeeds but doesn't indicate password change required

**Solution**:
- Verify `is_initial_password` is set to `true` in database
- Check that login handler checks the flag
- Verify API response includes `requires_password_change` field

## Security Best Practices

1. **Never Log Passwords**: Don't log initial passwords in application logs
2. **Secure Distribution**: Use encrypted channels for password distribution
3. **Time Limits**: Set expiration for initial passwords (e.g., 7 days)
4. **Audit Trail**: Log when initial passwords are generated and changed
5. **Production**: Disable initial password generation in production environments

## API Reference

### Endpoints

- `POST /api/v1/auth/login` - Login (checks for initial password)
- `POST /api/v1/auth/change-initial-password` - Change initial password
- `POST /api/v1/auth/change-password` - Change regular password

### Request/Response Examples

See [Initial Password Implementation](INITIAL_PASSWORD_IMPLEMENTATION.md) for detailed API documentation.

## Related Documentation

- [Password System Analysis](../architecture/PASSWORD_SYSTEM_ANALYSIS.md)
- [Initial Password Implementation](INITIAL_PASSWORD_IMPLEMENTATION.md)
- [Security Guidelines](../../.cursor/rules/security.mdc)

## Support

For issues or questions:
1. Check this guide and related documentation
2. Review error logs in `backend/logs/`
3. Check database for `is_initial_password` status
4. Contact the development team

