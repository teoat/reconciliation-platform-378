# Staging Deployment Guide
## Step-by-Step Implementation

**Date**: January 2025  
**Project**: 378 Reconciliation Platform  
**Status**: Ready to Deploy

---

## 🚀 Prerequisites

### System Requirements
- Docker Desktop installed and running
- Minimum 8GB RAM
- Minimum 50GB disk space

### Check Docker Status
```bash
# Check if Docker is running
docker info

# If not running, start Docker Desktop
```

---

## 📋 Step 1: Create Environment Files

### Backend Environment

Create `backend/.env`:
```bash
# Database
DATABASE_URL=postgresql://reconciliation_user:reconciliation_pass@localhost:5432/reconciliation_db
DB_PASSWORD=reconciliation_pass

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=86400

# Server
HOST=0.0.0.0
PORT=2000
RUST_LOG=info

# CORS
CORS_ORIGIN=http://localhost:1000

# Security
ENABLE_RATE_LIMITING=true
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=3600

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

### Frontend Environment

Create `frontend/.env`:
```bash
VITE_API_URL=http://localhost:2000/api/v1
VITE_WS_URL=ws://localhost:2000/ws
VITE_APP_NAME=378 Reconciliation Platform
VITE_APP_VERSION=1.0.0
NODE_ENV=development
```

---

## 📋 Step 2: Start Services

### Option A: Docker Compose (Recommended)

```bash
# Navigate to project root
cd /Users/Arief/Desktop/378

# Start all services
docker compose up -d

# Or with production config
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Option B: Individual Services

#### 1. Start Database
```bash
docker run -d \
  --name reconciliation-postgres \
  -e POSTGRES_USER=reconciliation_user \
  -e POSTGRES_PASSWORD=reconciliation_pass \
  -e POSTGRES_DB=reconciliation_db \
  -p 5432:5432 \
  postgres:15-alpine
```

#### 2. Start Redis
```bash
docker run -d \
  --name reconciliation-redis \
  -p 6379:6379 \
  redis:7-alpine
```

#### 3. Start Backend
```bash
cd backend
cargo run
```

#### 4. Start Frontend
```bash
cd frontend
npm run dev
```

---

## 📋 Step 3: Verify Services

### Check Docker Containers
```bash
# List running containers
docker compose ps

# Check logs
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
docker compose logs redis
```

### Health Checks

```bash
# Backend health
curl http://localhost:2000/health

# Backend readiness
curl http://localhost:2000/ready

# Backend metrics
curl http://localhost:2000/metrics

# Database connection
curl http://localhost:2000/health | jq '.services.database'

# Redis connection
curl http://localhost:2000/health | jq '.services.redis'
```

### Expected Responses

#### Health Check Success
```json
{
  "status": "ok",
  "message": "378 Reconciliation Platform Backend is running",
  "timestamp": "2025-01-27T12:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "connected",
      "type": "postgresql"
    },
    "redis": {
      "status": "connected",
      "type": "redis"
    }
  },
  "database_pool": {
    "size": 20,
    "idle": 18,
    "active": 2
  }
}
```

---

## 📋 Step 4: Access Services

### Web Access
- **Frontend**: http://localhost:1000
- **Backend API**: http://localhost:2000
- **API Documentation**: http://localhost:2000/api/docs (if configured)

### Monitoring
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)

### Database
- **Host**: localhost
- **Port**: 5432
- **Database**: reconciliation_db
- **User**: reconciliation_user
- **Password**: reconciliation_pass

---

## 📋 Step 5: Run Basic Tests

### API Tests
```bash
# Get health status
curl http://localhost:2000/health

# Get metrics
curl http://localhost:2000/metrics

# Test authentication (if implemented)
curl -X POST http://localhost:2000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend
cargo test --lib
cargo test --test integration_tests
```

---

## 🛠️ Troubleshooting

### Issue: Docker Not Running
```bash
# Start Docker Desktop manually
# Or restart Docker service
sudo systemctl start docker  # Linux
```

### Issue: Port Already in Use
```bash
# Find process using port
lsof -i :2000
lsof -i :5432
lsof -i :6379

# Kill process
kill -9 <PID>
```

### Issue: Database Connection Error
```bash
# Check database is running
docker ps | grep postgres

# Check database logs
docker logs reconciliation-postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Issue: Redis Connection Error
```bash
# Check Redis is running
docker ps | grep redis

# Check Redis logs
docker logs reconciliation-redis

# Test Redis
docker exec -it reconciliation-redis redis-cli ping
```

### Issue: Backend Compilation Errors
```bash
# Clean build
cd backend
cargo clean
cargo build

# Check for specific errors
cargo build 2>&1 | grep error
```

---

## ✅ Deployment Checklist

- [ ] Docker Desktop is running
- [ ] Environment files created
- [ ] Database container started
- [ ] Redis container started
- [ ] Backend service started
- [ ] Frontend service started
- [ ] Health checks passing
- [ ] All endpoints accessible
- [ ] Basic tests passing
- [ ] Monitoring active
- [ ] Logs available

---

## 🎯 Next Steps After Staging Deployment

1. **Load Testing** (1-2 hours)
   - Install k6: `brew install k6`
   - Create load test script
   - Run performance tests
   - Analyze results

2. **Security Audit** (1-2 hours)
   - Run vulnerability scanner
   - Check security headers
   - Verify rate limiting
   - Test authentication

3. **Production Deployment** (2-4 hours)
   - Configure production environment
   - Set up SSL certificates
   - Deploy to production servers
   - Monitor initial operation

---

## 📊 Success Indicators

### Service Health
- ✅ All containers running
- ✅ Health checks returning "ok"
- ✅ Database connection working
- ✅ Redis connection working

### Performance
- ✅ Backend response time < 200ms
- ✅ Frontend load time < 3s
- ✅ Database query time < 100ms
- ✅ Redis response time < 1ms

### Functionality
- ✅ All API endpoints responding
- ✅ Authentication working
- ✅ File upload working (if configured)
- ✅ WebSocket connecting (if configured)

---

**Ready to Deploy?** Follow the steps above and verify each checkpoint!

