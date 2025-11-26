# Next Steps Execution Guide

**Date:** 2025-01-27  
**Status:** ✅ Ready  
**Purpose:** Step-by-step guide for executing next steps

---

## Quick Start

### Automated Script (Recommended)

```bash
# Run all next steps automatically
./scripts/run-next-steps.sh

# Skip migrations (if already done)
./scripts/run-next-steps.sh skip-migrations

# Skip service start (if already running)
./scripts/run-next-steps.sh skip-migrations skip-start
```

---

## Manual Steps

### Step 1: Verify Environment ✅

**Status:** Already complete

```bash
# Check .env file
cat .env | head -20

# Verify environment variables
export $(grep -v '^#' .env | grep -v '^$' | xargs)
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
```

### Step 2: Run Migrations ⚠️

**Status:** Some migrations pending (tables already exist)

```bash
# Load environment
export $(grep -v '^#' .env | grep -v '^$' | xargs)

# Run migrations
./scripts/execute-migrations.sh

# Or manually
cd backend
diesel migration run
```

**Note:** Some migration errors are expected if tables already exist. The tables are functional.

### Step 3: Start Services ✅

**Status:** Services are running

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d backend frontend

# Check status
docker-compose ps
```

### Step 4: Verify Services ✅

**Status:** Most services verified

```bash
# Verify all services
./scripts/verify-all-services.sh dev http://localhost:2000

# Test backend health
curl http://localhost:2000/api/health

# Test frontend
curl http://localhost:1000

# Check service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## Access URLs

### Services

| Service | URL | Status |
|---------|-----|--------|
| Backend API | http://localhost:2000 | ⚠️ Starting |
| Backend Health | http://localhost:2000/api/health | ⚠️ Starting |
| Frontend | http://localhost:1000 | ✅ Accessible |
| Swagger Docs | http://localhost:2000/api/docs | ⚠️ Starting |
| Grafana | http://localhost:3001 | ✅ Running |
| Kibana | http://localhost:5601 | ✅ Running |
| Prometheus | http://localhost:9090 | ✅ Running |

---

## Common Commands

### Service Management

```bash
# View all services
docker-compose ps

# View logs
docker-compose logs -f [service]

# Restart service
docker-compose restart [service]

# Stop service
docker-compose stop [service]

# Start service
docker-compose start [service]
```

### Database

```bash
# Connect to database
docker exec -it reconciliation-postgres psql -U postgres -d reconciliation_app

# Run SQL query
docker exec reconciliation-postgres psql -U postgres -d reconciliation_app -c "SELECT COUNT(*) FROM users;"

# View tables
docker exec reconciliation-postgres psql -U postgres -d reconciliation_app -c "\dt"
```

### Testing

```bash
# Test backend API
curl http://localhost:2000/api/health

# Test frontend
curl http://localhost:1000

# Run all tests
./scripts/run-all-tests.sh

# Run backend tests
cd backend && cargo test

# Run frontend tests
cd frontend && npm test
```

---

## Troubleshooting

### Backend Not Starting

**Symptoms:**
- Backend container restarting
- Health check failing
- API not accessible

**Solutions:**
```bash
# Check logs
docker-compose logs backend

# Check environment
docker-compose exec backend env | grep DATABASE_URL

# Restart backend
docker-compose restart backend

# Rebuild backend
docker-compose build backend
docker-compose up -d backend
```

### Frontend Not Accessible

**Symptoms:**
- Frontend container unhealthy
- Cannot access http://localhost:1000

**Solutions:**
```bash
# Check logs
docker-compose logs frontend

# Restart frontend
docker-compose restart frontend

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Database Connection Issues

**Symptoms:**
- Migration errors
- Connection refused

**Solutions:**
```bash
# Check database is running
docker ps | grep postgres

# Test connection
docker exec reconciliation-postgres psql -U postgres -d reconciliation_app -c "SELECT 1;"

# Restart database
docker-compose restart postgres
```

---

## Next Actions

### Immediate

1. **Wait for Backend to Start**
   ```bash
   # Monitor backend logs
   docker-compose logs -f backend
   
   # Wait for health check
   while ! curl -f http://localhost:2000/api/health; do
     echo "Waiting for backend..."
     sleep 5
   done
   echo "Backend is ready!"
   ```

2. **Test API**
   ```bash
   # Health check
   curl http://localhost:2000/api/health
   
   # API docs
   curl http://localhost:2000/api/docs
   ```

3. **Access Frontend**
   ```bash
   # Open in browser
   open http://localhost:1000
   # Or
   xdg-open http://localhost:1000  # Linux
   ```

### Short-term

1. **Run Tests**
   ```bash
   ./scripts/run-all-tests.sh
   ```

2. **Verify All Services**
   ```bash
   ./scripts/verify-all-services.sh dev http://localhost:2000
   ```

3. **Begin Phase 1 Implementation**
   - Follow `docs/project-management/PHASED_IMPLEMENTATION_PLAN.md`
   - Execute Week 1 tasks

---

## Related Documentation

- [Environment Ready Summary](./ENVIRONMENT_READY_SUMMARY.md)
- [Phased Implementation Plan](./PHASED_IMPLEMENTATION_PLAN.md)
- [Master TODOs](./MASTER_TODOS.md)
- [Run Next Steps Script](../../scripts/run-next-steps.sh)

---

**Last Updated:** 2025-01-27  
**Status:** ✅ Ready for Execution

