# Password Manager Guide

## Overview

The Password Manager provides secure storage, retrieval, and automatic rotation of passwords. It includes the following passwords by default:
- `AldiBabi`
- `AldiAnjing`
- `YantoAnjing`
- `YantoBabi`

## Features

- ✅ Secure password storage (encrypted)
- ✅ Automatic password rotation
- ✅ Configurable rotation intervals
- ✅ Password metadata tracking
- ✅ REST API for management
- ✅ Rotation scheduler service

## API Endpoints

### Initialize Default Passwords
```bash
POST /api/passwords/initialize
```

Initializes the four default passwords with 90-day rotation intervals.

### List All Passwords
```bash
GET /api/passwords
```

Returns metadata for all password entries (passwords are masked).

### Get Specific Password
```bash
GET /api/passwords/{name}
```

Returns metadata for a specific password entry.

### Create New Password
```bash
POST /api/passwords/{name}
Content-Type: application/json

{
  "name": "MyPassword",
  "password": "SecurePassword123",
  "rotation_interval_days": 90
}
```

### Rotate Password
```bash
POST /api/passwords/{name}/rotate
Content-Type: application/json

{
  "name": "AldiBabi",
  "new_password": "NewSecurePassword123"  // Optional, auto-generated if omitted
}
```

### Rotate All Due Passwords
```bash
POST /api/passwords/rotate-due
```

Automatically rotates all passwords that are due for rotation.

### Update Rotation Interval
```bash
PUT /api/passwords/{name}/interval
Content-Type: application/json

{
  "name": "AldiBabi",
  "rotation_interval_days": 60
}
```

### Get Rotation Schedule
```bash
GET /api/passwords/schedule
```

Returns the rotation schedule for all passwords.

### Deactivate Password
```bash
POST /api/passwords/{name}/deactivate
```

Deactivates a password entry (stops automatic rotation).

## Password Rotation Service

### Starting the Service

```bash
./scripts/password-rotation-service.sh start
```

The service checks for passwords due for rotation every hour and automatically rotates them.

### Service Management

```bash
# Start service
./scripts/password-rotation-service.sh start

# Stop service
./scripts/password-rotation-service.sh stop

# Restart service
./scripts/password-rotation-service.sh restart

# Check status
./scripts/password-rotation-service.sh status
```

## Storage

Passwords are stored in `data/passwords/` directory as encrypted JSON files. Each password entry includes:
- Encrypted password
- Creation timestamp
- Last rotation timestamp
- Rotation interval
- Next rotation due date
- Active status

## Security Notes

⚠️ **Current Implementation**: Uses XOR encryption with a master key (development mode)

✅ **Production Recommendations**:
1. Use proper AES-GCM or ChaCha20-Poly1305 encryption
2. Store master key in secure key management (AWS Secrets Manager, HashiCorp Vault)
3. Migrate to database storage instead of file-based
4. Add audit logging for password access
5. Implement access control/authentication for API endpoints
6. Use environment variables for master key

## Example Usage

### Initialize Default Passwords
```bash
curl -X POST http://localhost:2000/api/passwords/initialize
```

### List All Passwords
```bash
curl http://localhost:2000/api/passwords
```

### Rotate a Password
```bash
curl -X POST http://localhost:2000/api/passwords/AldiBabi/rotate \
  -H "Content-Type: application/json" \
  -d '{"name": "AldiBabi"}'
```

### Get Rotation Schedule
```bash
curl http://localhost:2000/api/passwords/schedule
```

## Configuration

The password manager requires a master key for encryption. Set it via environment variable:

```bash
export PASSWORD_MASTER_KEY="your-secure-master-key-here"
```

Or in `.env` file:
```
PASSWORD_MASTER_KEY=your-secure-master-key-here
```

## Integration

To use the password manager in your application:

```rust
use crate::services::password_manager::PasswordManager;

// Initialize
let password_manager = Arc::new(PasswordManager::new(
    db.clone(),
    std::env::var("PASSWORD_MASTER_KEY")
        .unwrap_or_else(|_| "default-key-change-in-production".to_string())
));

// Initialize default passwords
password_manager.initialize_default_passwords().await?;

// Get a password
let password = password_manager.get_password_by_name("AldiBabi").await?;

// Rotate a password
password_manager.rotate_password("AldiBabi", None).await?;
```

## Troubleshooting

### Passwords not rotating
- Check if rotation service is running: `./scripts/password-rotation-service.sh status`
- Verify rotation schedule: `curl http://localhost:2000/api/passwords/schedule`
- Check logs: `tail -f data/password-rotation.log`

### Cannot access passwords
- Verify master key is set correctly
- Check file permissions on `data/passwords/` directory
- Ensure backend service is running

### Storage issues
- Ensure `data/passwords/` directory exists and is writable
- Check disk space
- Verify JSON file integrity

