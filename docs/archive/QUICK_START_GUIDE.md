# 378 Reconciliation Platform - Quick Start Guide
## Complete Installation and Setup

**Version**: 1.0.0  
**Status**: Production Ready ✅  
**Last Updated**: January 2025

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start with Docker](#quick-start-with-docker-recommended)
3. [Local Development Setup](#local-development-setup)
4. [Verification](#verification)
5. [Next Steps](#next-steps)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
- **Docker**: 20.10 or higher
- **Docker Compose**: 2.0 or higher

### Optional (for Local Development)
- **Node.js**: 18.x or higher (for frontend development)
- **Rust**: 1.70 or higher (for backend development)
- **PostgreSQL**: 15+ (for local database)
- **Redis**: 7+ (for local cache)

### Verify Prerequisites
```bash
# Check Docker
docker --version
docker-compose --version

# Check Node.js (if installing frontend locally)
node --version

# Check Rust (if installing backend locally)
cargo --version
```

---

## Quick Start with Docker (Recommended)

This is the fastest way to get the platform running.

### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/378-reconciliation-platform.git
cd 378-reconciliation-platform
```

### Step 2: Environment Setup
```bash
# Copy environment templates
cp backend/.env.production.template backend/.env.production
cp frontend/.env.production.template frontend/.env.production

# Edit environment files with your configuration
nano backend/.env.production
nano frontend/.env.production
```

**Minimum Required Configuration**:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret key for JWT tokens (generate a strong one)

### Step 3: Start Services
```bash
# Start all services in detached mode
docker-compose up -d

# Or use production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Step 4: Wait for Services to Start
```bash
# Watch logs
docker-compose logs -f

# Check service status
docker-compose ps

# Services should show "Up" status
```

**Expected Output**:
```
Name                    Status   Ports
postgres              Up       5432/tcp
redis                 Up       6379/tcp
reconciliation-backend Up      2000/tcp
reconciliation-frontend Up     1000/tcp
```

### Step 5: Verify Services
```bash
# Test backend health
curl http://localhost:2000/health

# Test API readiness
curl http://localhost:2000/api/ready

# Test frontend
curl http://localhost:1000
```

---

## Local Development Setup

For development and debugging, you may want to run services locally.

### Backend Setup

```bash
cd backend

# Install dependencies (automatic with Cargo)
cargo check

# Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/reconciliation_app"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="your-secret-key"
export RUST_LOG="info"

# Run database migrations (if needed)
# Diesel migrations are run automatically

# Start backend server
cargo run

# Backend will start on http://localhost:2000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set environment variables
export VITE_API_URL="http://localhost:2000/api"
export VITE_WS_URL="ws://localhost:2000"

# Start development server
npm run dev

# Frontend will start on http://localhost:1000
```

---

## Verification

### Health Checks

#### Backend Health
```bash
curl http://localhost:2000/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "message": "378 Reconciliation Platform Backend is running",
  "timestamp": "2025-01-XX...",
  "version": "1.0.0",
  "services": {
    "database": {"status": "connected", "type": "postgresql"},
    "redis": {"status": "connected", "type": "redis"}
  },
  "database_pool": {
    "size": 20,
    "idle": 5,
    "active": 2
  }
}
```

#### Readiness Check
```bash
curl http://localhost:2000/api/ready
```

**Expected Response**:
```json
{
  "status": "ready",
  "services": {
    "database": {"status": "ready", "type": "postgresql"},
    "redis": {"status": "ready", "type": "redis"},
    "sentry": {"status": "enabled"}
  },
  "timestamp": "2025-01-XX...",
  "uptime": "running"
}
```

#### Metrics Endpoint
```bash
curl http://localhost:2000/api/metrics
```

Returns Prometheus-format metrics.

### Database Verification

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d reconciliation_app

# List tables
\dt

# Should show: users, projects, reconciliation_jobs, etc.
```

### Cache Verification

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Test connection
PING
# Should return: PONG

# Check statistics
INFO stats
```

---

## Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:1000 | User interface |
| Backend API | http://localhost:2000 | API server |
| Health Check | http://localhost:2000/health | Service health |
| Readiness | http://localhost:2000/api/ready | Readiness probe |
| Metrics | http://localhost:2000/api/metrics | Prometheus metrics |
| Database | localhost:5432 | PostgreSQL |
| Redis | localhost:6379 | Redis cache |

---

## Next Steps

### 1. First Login
1. Open http://localhost:1000 in your browser
2. Register a new account
3. Login with your credentials

### 2. Create Your First Project
1. Navigate to Projects
2. Click "Create New Project"
3. Enter project details
4. Upload data files for reconciliation

### 3. Configure Environment
- Set up email notifications
- Configure cloud storage (AWS S3, Azure Blob)
- Enable monitoring and alerts
- Set up SSL certificates

### 4. Review Documentation
- [API Documentation](docs/API.md)
- [Architecture Guide](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT_PRODUCTION.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

---

## Troubleshooting

### Backend Won't Start

**Issue**: Backend container exits immediately
```bash
# Check logs
docker-compose logs backend

# Common causes:
# - Database not accessible
# - Missing environment variables
# - Port conflict
```

**Solution**:
```bash
# Verify database is running
docker-compose ps postgres

# Check environment variables
docker-compose exec backend env | grep DATABASE

# Restart services
docker-compose restart backend
```

### Frontend Shows "Cannot Connect to API"

**Issue**: Frontend loads but shows API connection errors

**Solution**:
```bash
# Verify backend is running
curl http://localhost:2000/health

# Check frontend environment
cat frontend/.env.production

# Should have: VITE_API_URL=http://localhost:2000/api

# Restart frontend
docker-compose restart frontend
```

### Database Connection Errors

**Issue**: Backend logs show database connection errors

**Solution**:
```bash
# Test database connection
docker-compose exec postgres pg_isready

# Check credentials
docker-compose exec backend printenv DATABASE_URL

# Reset database (if needed)
docker-compose down -v
docker-compose up -d postgres
docker-compose up -d backend
```

### Port Already in Use

**Issue**: Error "port already in use"

**Solution**:
```bash
# Find process using port
lsof -i :2000
lsof -i :1000

# Stop conflicting service
# Or change ports in docker-compose.yml
```

---

## Additional Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Stop Services
```bash
# Stop gracefully
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### Restart Services
```bash
# Restart specific service
docker-compose restart backend

# Restart all services
docker-compose restart
```

### Update Services
```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build

# Force rebuild without cache
docker-compose build --no-cache
```

---

## Environment Variables

### Backend (.env.production)
```bash
DATABASE_URL=postgresql://user:pass@postgres:5432/dbname
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=3600
CORS_ORIGINS=http://localhost:1000
RUST_LOG=info
MAX_FILE_SIZE=10485760
```

### Frontend (.env.production)
```bash
VITE_API_URL=http://localhost:2000/api
VITE_WS_URL=ws://localhost:2000
NODE_ENV=production
```

---

## Support

For issues and questions:
- **Documentation**: Check `docs/` directory
- **Troubleshooting**: See `docs/TROUBLESHOOTING.md`
- **API Reference**: See `docs/API.md`
- **Issues**: Open an issue on GitHub

---

**Quick Start Guide Version**: 1.0  
**Last Updated**: January 2025  
**Platform Status**: ✅ Production Ready

