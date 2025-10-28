# 🚀 DEPLOYMENT GUIDE - 378 Reconciliation Platform

**Date**: January 2025  
**Status**: ✅ Production Ready  
**Version**: 1.0.0

---

## 📋 QUICK START DEPLOYMENT

### Prerequisites
- Docker & Docker Compose installed
- 4GB+ RAM available
- 50GB+ disk space

---

## 🎯 STEP 1: Environment Configuration

### Create Backend Environment File
```bash
cd /Users/Arief/Desktop/378/backend
cp ENVIRONMENT_SETUP.md .env
```

Edit `.env` with your configuration:
```bash
# Database
DATABASE_URL=postgresql://postgres:your_password@postgres:5432/reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=reconciliation_app

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key_here

# Server
HOST=0.0.0.0
PORT=2000

# CORS
CORS_ORIGINS=http://localhost:1000,http://localhost:5173

# Environment
ENV=production
RUST_LOG=warn,reconciliation_backend=info
```

### Create Frontend Environment File
```bash
cd /Users/Arief/Desktop/378/frontend
cat > .env << EOF
VITE_API_URL=http://localhost:2000
VITE_WS_URL=ws://localhost:2000
VITE_ENV=production
EOF
```

---

## 🎯 STEP 2: Database Migration

### Run All Migrations
```bash
cd /Users/Arief/Desktop/378

# Start PostgreSQL temporarily
docker run -d --name temp-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=reconciliation_app \
  -p 5432:5432 \
  postgres:15-alpine

# Wait for PostgreSQL to start
sleep 5

# Run migrations
docker run --rm --network host \
  -v $(pwd)/backend/migrations:/migrations \
  postgres:15-alpine \
  psql postgresql://postgres:your_password@localhost:5432/reconciliation_app \
  -f /migrations/2024-01-01-000001_initial_schema/up.sql

docker run --rm --network host \
  -v $(pwd)/backend/migrations:/migrations \
  postgres:15-alpine \
  psql postgresql://postgres:your_password@localhost:5432/reconciliation_app \
  -f /migrations/2024-01-01-000002_websocket_features/up.sql

docker run --rm --network host \
  -v $(pwd)/backend/migrations:/migrations \
  postgres:15-alpine \
  psql postgresql://postgres:your_password@localhost:5432/reconciliation_app \
  -f /migrations/2024-01-01-000003_security_features/up.sql

docker run --rm --network host \
  -v $(pwd)/backend/migrations:/migrations \
  postgres:15-alpine \
  psql postgresql://postgres:your_password@localhost:5432/reconciliation_app \
  -f /migrations/2024-01-01-000004_performance_monitoring/up.sql

docker run --rm --network host \
  -v $(pwd)/backend/migrations:/migrations \
  postgres:15-alpine \
  psql postgresql://postgres:your_password@localhost:5432/reconciliation_app \
  -f /migrations/2024-01-01-000005_user_analytics/up.sql

docker run --rm --network host \
  -v $(pwd)/backend/migrations:/migrations \
  postgres:15-alpine \
  psql postgresql://postgres:your_password@localhost:5432/reconciliation_app \
  -f /migrations/2024-01-01-000006_performance_indexes/up.sql

# Stop temporary PostgreSQL
docker stop temp-postgres
docker rm temp-postgres
```

---

## 🎯 STEP 3: Build Services

### Build Backend (Release Mode)
```bash
cd /Users/Arief/Desktop/378/backend

# Build release
cargo build --release

# This creates: target/release/reconciliation_backend
```

### Build Frontend
```bash
cd /Users/Arief/Desktop/378/frontend

# Install dependencies
npm install

# Build production
npm run build

# This creates: dist/ folder
```

---

## 🎯 STEP 4: Deploy with Docker Compose

### Start All Services
```bash
cd /Users/Arief/Desktop/378

# Build and start
docker-compose up -d --build

# Or use production overrides
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Check Service Status
```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🎯 STEP 5: Verify Deployment

### Health Checks
```bash
# Backend health
curl http://localhost:2000/health

# Expected response:
# {"status":"ok","timestamp":"2025-01-27T12:00:00Z"}

# Frontend
curl http://localhost:1000

# PostgreSQL
docker-compose exec postgres pg_isready

# Redis
docker-compose exec redis redis-cli ping
# Expected: PONG
```

### API Test
```bash
# Test API endpoints
curl http://localhost:2000/api/health

# Expected: {"status":"ok"...}
```

---

## 🎯 STEP 6: Access Application

### Application URLs
- **Frontend**: http://localhost:1000
- **Backend API**: http://localhost:2000
- **API Docs**: http://localhost:2000/api/docs
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)

---

## 🔧 TROUBLESHOOTING

### Service Not Starting
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Restart service
docker-compose restart backend

# Rebuild service
docker-compose up -d --build backend
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check database exists
docker-compose exec postgres psql -U postgres -l

# Run migrations again
docker-compose exec backend diesel migration run
```

### Port Conflicts
```bash
# Check what's using ports
lsof -i :1000
lsof -i :2000
lsof -i :5432
lsof -i :6379

# Edit docker-compose.yml to change ports if needed
```

---

## 📊 MONITORING

### View Metrics
```bash
# Prometheus metrics
curl http://localhost:9090/api/v1/query?query=up

# Grafana dashboards
open http://localhost:3000
```

### Application Logs
```bash
# Tail all logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🔄 UPDATES & ROLLBACKS

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Or specific service
docker-compose up -d --build backend
```

### Rollback
```bash
# Stop all services
docker-compose down

# Checkout previous version
git checkout <previous-tag>

# Restart
docker-compose up -d --build
```

---

## 🛡️ SECURITY CHECKLIST

- ✅ Strong JWT secret set
- ✅ Database password secure
- ✅ CORS origins restricted
- ✅ HTTPS configured (if applicable)
- ✅ Rate limiting active
- ✅ Security headers enabled

---

## 📝 POST-DEPLOYMENT

### Verify Everything Works
1. Access frontend at http://localhost:1000
2. Create test user account
3. Upload test file
4. Run reconciliation
5. Check metrics in Grafana

### Create Admin User (if needed)
```bash
# Use the API or directly in database
curl -X POST http://localhost:2000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secure_password","first_name":"Admin","last_name":"User"}'
```

---

## 🎉 DEPLOYMENT COMPLETE!

Your 378 Reconciliation Platform is now running!

**Next Steps**:
1. Set up SSL/HTTPS for production
2. Configure backup strategy
3. Set up monitoring alerts
4. Scale services as needed

---

**Questions?** Check documentation in `/docs` folder.

