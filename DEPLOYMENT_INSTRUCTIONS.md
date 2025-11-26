# Deployment Instructions - Optimized Services

**Date:** 2025-11-26  
**Status:** Ready for Deployment

## Quick Deploy Commands

### Option 1: Automated Script (Recommended)
```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378
./scripts/deployment/deploy-optimized.sh dev
```

### Option 2: Manual Deployment
```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378

# Enable BuildKit optimizations
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Stop existing services
docker-compose -f docker-compose.dev.yml down

# Build with parallel builds and optimizations
docker-compose -f docker-compose.dev.yml build --parallel

# Start services
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to initialize
sleep 15

# Check status
docker-compose -f docker-compose.dev.yml ps
```

## Verify Deployment

### Check Service Status
```bash
docker-compose -f docker-compose.dev.yml ps
```

Expected output should show all services as "Up" or "healthy".

### Health Checks
```bash
# Backend health
curl http://localhost:2000/api/health
curl http://localhost:2000/health

# Frontend health
curl http://localhost:1000/health
curl http://localhost:1000

# Database
docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres

# Redis
docker-compose -f docker-compose.dev.yml exec redis redis-cli -a "${REDIS_PASSWORD:-redis_pass}" ping
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
```

### Resource Usage
```bash
docker stats
```

## Service URLs

- **Backend API:** http://localhost:2000
- **Frontend:** http://localhost:1000
- **Backend Health:** http://localhost:2000/api/health
- **Frontend Health:** http://localhost:1000/health

## Troubleshooting

### Services Not Starting
```bash
# Check logs for errors
docker-compose -f docker-compose.dev.yml logs

# Check Docker status
docker ps -a

# Restart services
docker-compose -f docker-compose.dev.yml restart
```

### Build Issues
```bash
# Clean build (no cache)
docker-compose -f docker-compose.dev.yml build --no-cache

# Rebuild specific service
docker-compose -f docker-compose.dev.yml build backend
docker-compose -f docker-compose.dev.yml build frontend
```

### Network Issues
```bash
# Check network
docker network ls | grep reconciliation

# Recreate network if needed
docker network create reconciliation-network-dev
```

## Optimizations Applied

✅ **BuildKit:** Enabled for parallel builds and cache mounts  
✅ **Parallel Builds:** Backend and frontend build simultaneously  
✅ **Resource Limits:** Configured for all services  
✅ **Log Rotation:** 10MB max, 3 files per service  
✅ **Health Checks:** Optimized intervals and timeouts  
✅ **Redis Memory:** 512MB limit with LRU eviction  
✅ **Build Context:** Optimized with .dockerignore  

## Expected Performance

- **Build Time:** ~4-5 minutes (50% faster with parallel builds)
- **Build Context:** ~70% smaller (with .dockerignore)
- **Resource Usage:** Controlled with limits
- **Service Startup:** ~15-20 seconds for all services

## Stop Services

```bash
docker-compose -f docker-compose.dev.yml down
```

## Clean Up (Remove Volumes)

```bash
docker-compose -f docker-compose.dev.yml down -v
```

---

**Ready to deploy!** Run the commands above to start your optimized services.

