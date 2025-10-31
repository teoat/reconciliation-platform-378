# Deployment Instructions
## Quick Start for 378 Reconciliation Platform

**Date**: January 2025  
**Status**: Ready to Deploy

---

## 🚀 Quick Start (Recommended)

Since `.env` files can't be created directly in this system, please create them manually:

### Step 1: Create Backend Environment File

Create `backend/.env` with:
```bash
# Database
DATABASE_URL=postgresql://reconciliation_user:reconciliation_pass@localhost:5432/reconciliation_db
DB_PASSWORD=reconciliation_pass

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRATION=3600

# Server
HOST=0.0.0.0
PORT=2000
RUST_LOG=info

# CORS
CORS_ORIGINS=http://localhost:1000

# Security
ENABLE_RATE_LIMITING=true
RATE_LIMIT_REQUESTS=1000

# Monitoring
ENABLE_METRICS=true
```

### Step 2: Create Frontend Environment File

Create `frontend/.env` with:
```bash
VITE_API_URL=http://localhost:2000/api/v1
VITE_WS_URL=ws://localhost:2000/ws
VITE_APP_NAME=378 Reconciliation Platform
VITE_APP_VERSION=1.0.0
NODE_ENV=development
```

### Step 3: Deploy

**Option A: Automated Deployment**
```bash
# Make script executable (already done)
chmod +x deploy-staging.sh

# Run deployment
./deploy-staging.sh
```

**Option B: Manual Deployment**
```bash
# Start Docker Desktop first!

# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

---

## ✅ Verification

### Health Checks
```bash
# Backend health
curl http://localhost:2000/health

# Should return:
# {"status":"ok","message":"378 Reconciliation Platform Backend is running"...}
```

### Access Points
- Frontend: http://localhost:1000
- Backend: http://localhost:2000
- Health: http://localhost:2000/health
- Metrics: http://localhost:2000/metrics

---

## 🎯 Next Steps

1. **Start Docker Desktop** (required first!)
2. **Create environment files** (backyard and frontend directories)
3. **Run deployment script** or docker compose
4. **Verify health checks**
5. **Access the application**

---

## 📋 Files Created

✅ `STAGING_DEPLOYMENT_GUIDE.md` - Complete deployment guide
✅ `deploy-staging.sh` - Automated deployment script
✅ `DEPLOYMENT_INSTRUCTIONS.md` - This file

---

## ⚠️ Important Notes

- Docker Desktop must be running before deployment
- Environment files must be created manually (blocked in this system)
- First deployment may take 5-10 minutes (building images)
- Verify all ports are available (2000, 5432, 6379, 1000)

---

## 🆘 Troubleshooting

### Docker Not Running
```
Error: Docker is not running
Solution: Start Docker Desktop application
```

### Port Already in Use
```
Error: Port 2000 is already in use
Solution: Find and stop the process using the port
```

### Environment File Not Found
```
Warning: backend/.env not found
Solution: Create the file using the template above
```

---

**Ready to deploy? Start with Step 1 above!**

