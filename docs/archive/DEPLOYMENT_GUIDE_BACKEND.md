# 🚀 Complete Backend Deployment Guide

## Deployment Status Analysis

### Current State
- ✅ **Backend Compiles**: 0 errors
- ✅ **Dockerfile Exists**: `infrastructure/docker/Dockerfile.backend`
- ✅ **Migrations Ready**: 7 migrations in place
- ⚠️ **PostgreSQL**: Not currently running (needs setup)
- ⚠️ **.env File**: Missing (needs creation)

---

## Quick Start: Local Development Deployment

### Step 1: Create Environment File

```bash
# Copy the example file
cp env.example .env

# Edit .env with your settings
nano .env
```

**Minimum Required Variables**:
```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/reconciliation_app
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
HOST=0.0.0.0
PORT=2000
```

### Step 2: Start PostgreSQL

**Option A: Using Docker (Recommended)**
```bash
# Start PostgreSQL in Docker
docker run -d \
  --name reconciliation-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=reconciliation_app \
  -p 5432:5432 \
  postgres:15-alpine

# Start Redis
docker run -d \
  --name reconciliation-redis \
  -p 6379ord:6379 \
  redis:7-alpine
```

**Option B: Install PostgreSQL Locally**
- **macOS**: `brew install postgresql@15`
- **Linux**: `sudo apt-get install postgresql`
- **Windows**: Download from postgresql.org

### Step 3: Run Migrations

```bash
cd backend

# Install Diesel CLI if not installed
cargo install diesel_cli --no-default-features --features postgres

# Run migrations
diesel migration run
```

### Step 4: Build and Run

```bash
cd backend

# Development mode
cargo run

# Production mode
cargo build --release
./target/release/reconciliation-backend
```

The backend will start on `http://localhost:2000`

---

## Docker Deployment (Production-Ready)

### Step 1: Copy and Use Dockerfile

```bash
# Copy the optimized Dockerfile
cp infrastructure/docker/Dockerfile.backend backend/Dockerfile
```

### Step 2: Create .env for Production

```bash
# .env.production
DATABASE_URL=postgres://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=production_secret_key
SENTRY_DSN=your_sentry_dsn_here
```

### Step 3: Build Docker Image

```bash
cd backend

# Build the image
docker build -t reconciliation-backend:latest .

# Run the container
docker run -d \
  --name reconciliation-backend \
  --env-file ../.env \
  -p 2000:2000 \
  -p 9091:9091 \
  reconciliation-backend:latest
```

### Step 4: Verify Deployment

```bash
# Check health
curl http://localhost:2000/api/health

# Expected response:
# {"status":"ok","message":"378 Reconciliation Platform Backend is running",...}
```

---

## Verification Checklist

### Backend Health
- [ ] Health check: `curl http://localhost:2000/api/health`
- [ ] Metrics: `curl http://localhost:2000/api/metrics`
- [ ] Ready check: `curl http://localhost:2000/api/ready`

### Database Connection
- [ ] PostgreSQL accessible
- [ ] Migrations applied
- [ ] Tables created

### Redis Connection
- [ ] Redis accessible
- [ ] Cache working

### Monitoring (Optional)
- [ ] Sentry DSN configured
- [ ] Prometheus metrics available
- [ ] Logs visible

---

## Troubleshooting

### Issue: "Connection refused"
**Solution**: Check if PostgreSQL is running
```bash
docker ps | grep postgres
```

### Issue: "Database does not exist"
**Solution**: Create the database
```bash
docker exec -it reconciliation-postgres psql -U postgres -c "CREATE DATABASE reconciliation_app;"
```

### Issue: "Migration failed"
**Solution**: Reset and retry
```bash
cargo run --bin reconciliation-backend -- --migrate
```

### Issue: "Port 2000 already in use"
**Solution**: Change port in .env
```bash
PORT=3000
```

---

## Production Deployment Steps

### 1. Environment Setup
- Set strong JWT_SECRET
- Configure production DATABASE_URL
- Set SENTRY_DSN for monitoring
- Configure email SMTP settings

### 2. Security Hardening
- Use HTTPS (reverse proxy like nginx)
- Set secure environment variables
- Enable rate limiting
- Configure CORS properly

### 3. Monitoring
- Enable Sentry error tracking
- Set up Prometheus metrics
- Configure log aggregation
- Set up alerting

### 4. Scale Considerations
- Use connection pooling
- Enable database sharding
- Set up load balancing
- Configure CDN for static assets

---

## Quick Deployment Script

```bash
#!/bin/bash
# deploy_backend.sh

echo "🚀 Starting Backend Deployment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "✅ Please edit .env with your configuration"
    exit 1
fi

# Start PostgreSQL
echo "🐘 Starting PostgreSQL..."
docker-compose up -d postgres || \
docker run -d \
  --name reconciliation-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=reconciliation_app \
  -p 5432:5432 \
  postgres:15-alpine

# Wait for PostgreSQL
sleep 5

# Run migrations
echo "📊 Running migrations..."
cd backend
cargo run --bin reconciliation-backend -- --migrate || \
diesel migration run

# Build and run
echo "🔨 Building backend..."
cargo build --release

echo "✅ Starting backend server..."
./target/release/reconciliation-backend

echo "🎉 Backend deployed successfully!"
```

---

## Next Steps

1. ✅ Complete deployment using steps above
2. ⏳ Test API endpoints
3. ⏳ Configure frontend to connect
4. ⏳ Set up monitoring
5. ⏳ Deploy to production

**Status**: Ready for deployment 🚀

