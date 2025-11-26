# Initial Password System - Quick Reference

## Overview

The initial password system allows automatic generation of secure passwords for testing and pre-production environments. Users must change these passwords on first login.

## Quick Setup

### 1. Run Migration

```bash
cd backend
diesel migration run
```

### 2. Set Initial Passwords

```bash
# For users without initial passwords
cd backend
cargo run --bin set-initial-passwords

# For all users
cargo run --bin set-initial-passwords -- --all

# Save to file
cargo run --bin set-initial-passwords -- --output passwords.txt
```

### 3. Test the System

```bash
./scripts/test-initial-password-system.sh
```

## Usage Flow

1. **User logs in with initial password**
   - API returns `requires_password_change: true`
   - User is prompted to change password

2. **User changes password**
   - POST `/api/v1/auth/change-initial-password`
   - Password is marked as non-initial

3. **User logs in with new password**
   - Normal login flow
   - No password change required

## API Endpoints

- `POST /api/v1/auth/login` - Login (checks initial password status)
- `POST /api/v1/auth/change-initial-password` - Change initial password
- `POST /api/v1/auth/change-password` - Change regular password

## Documentation

- [Setup Guide](docs/development/INITIAL_PASSWORD_SETUP_GUIDE.md)
- [Implementation Details](docs/development/INITIAL_PASSWORD_IMPLEMENTATION.md)
- [System Analysis](docs/architecture/PASSWORD_SYSTEM_ANALYSIS.md)

## Security Notes

⚠️ **IMPORTANT**:
- Store initial passwords securely
- Share via encrypted channels only
- Users must change passwords on first login
- For testing/pre-production only

