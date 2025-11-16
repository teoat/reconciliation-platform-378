# Password Manager Setup - Complete Guide

## ✅ Setup Steps Completed

### 1. ✅ Module Integration
- Added `password_manager` to `lib.rs` services module
- Module compilation verified
- All handlers properly configured

### 2. ✅ Scripts Prepared
- `scripts/password-rotation-service.sh` - Made executable
- `scripts/setup-password-manager.sh` - Created and made executable
- `backend/.env.example` - Created with all required variables

## 🚀 Quick Start Guide

### Option 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
./scripts/setup-password-manager.sh
```

This script will:
1. Check/create `.env` file from `.env.example`
2. Run database migrations
3. Verify environment variables
4. Make rotation service executable

### Option 2: Manual Setup

#### Step 1: Configure Environment

Create `backend/.env` file (copy from `backend/.env.example`):

```bash
cd backend
cp .env.example .env
# Edit .env and set:
# - DATABASE_URL (your PostgreSQL connection string)
# - PASSWORD_MASTER_KEY (at least 32 characters, secure random string)
# - JWT_SECRET (for authentication)
```

**Important**: Generate a secure master key:
```bash
# Generate a secure 64-character key
openssl rand -hex 32
```

#### Step 2: Run Database Migration

```bash
cd backend
diesel migration run
```

This creates:
- `password_entries` table
- `password_audit_log` table
- Required indexes

#### Step 3: Start Backend Server

```bash
cd backend
cargo run
```

The server will:
- Initialize password manager on startup
- Auto-initialize default passwords (AldiBabi, AldiAnjing, YantoAnjing, YantoBabi)
- Start on `http://localhost:2000`

#### Step 4: Initialize Passwords (if auto-init fails)

```bash
curl -X POST http://localhost:2000/api/passwords/initialize
```

#### Step 5: Start Rotation Service (Optional)

In a separate terminal:

```bash
./scripts/password-rotation-service.sh start
```

To check status:
```bash
./scripts/password-rotation-service.sh status
```

To stop:
```bash
./scripts/password-rotation-service.sh stop
```

## 📋 API Endpoints

Once the server is running, you can use these endpoints:

### List All Passwords
```bash
curl http://localhost:2000/api/passwords
```

### Get Specific Password
```bash
curl http://localhost:2000/api/passwords/{name}
```

### Create New Password
```bash
curl -X POST http://localhost:2000/api/passwords \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MyPassword",
    "password": "secure-password-123",
    "rotation_interval_days": 90
  }'
```

### Rotate Password
```bash
curl -X POST http://localhost:2000/api/passwords/rotate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AldiBabi"
  }'
```

### Get Rotation Schedule
```bash
curl http://localhost:2000/api/passwords/schedule
```

### Deactivate Password
```bash
curl -X DELETE http://localhost:2000/api/passwords/{name}
```

## 🔒 Security Notes

1. **Master Key**: 
   - Must be at least 32 characters
   - Store securely (AWS Secrets Manager, HashiCorp Vault in production)
   - Never commit to version control
   - Rotate periodically

2. **Database**:
   - Use encrypted connections (SSL/TLS)
   - Restrict database access
   - Regular backups

3. **Audit Logging**:
   - All operations are logged
   - Includes user_id, IP address, user_agent
   - Stored in `password_audit_log` table

## 🧪 Testing

### Verify Setup

1. Check migration:
```bash
cd backend
diesel migration list
```

2. Check server health:
```bash
curl http://localhost:2000/api/health
```

3. Test password retrieval:
```bash
curl http://localhost:2000/api/passwords/AldiBabi
```

## 📝 Default Passwords

The system auto-initializes these default passwords:
- `AldiBabi`
- `AldiAnjing`
- `YantoAnjing`
- `YantoBabi`

These are created on server startup if they don't exist.

## 🔧 Troubleshooting

### Migration Fails
- Check `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Verify database user has CREATE TABLE permissions

### Server Won't Start
- Check all required environment variables are set
- Verify `PASSWORD_MASTER_KEY` is set
- Check logs for specific errors

### Passwords Not Initializing
- Check server logs
- Verify database connection
- Manually call `/api/passwords/initialize` endpoint

### Rotation Service Issues
- Check PID file: `data/password-rotation.pid`
- Check logs: `data/password-rotation.log`
- Ensure backend server is running

## 📚 Additional Resources

- `PASSWORD_MANAGER_COMPLETION_STATUS.md` - Implementation status
- `docs/PASSWORD_MANAGER_GUIDE.md` - Detailed documentation
- `backend/src/services/password_manager.rs` - Core implementation
- `backend/src/handlers/password_manager.rs` - API handlers

## ✨ Features

- ✅ AES-256-GCM encryption
- ✅ Database storage with migrations
- ✅ Audit logging
- ✅ Automatic password rotation
- ✅ REST API endpoints
- ✅ Rotation scheduler service
- ✅ Production-ready architecture

