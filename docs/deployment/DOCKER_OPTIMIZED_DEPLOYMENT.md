# Optimized Docker Deployment Guide

**Last Updated**: 2025-11-29  
**Status**: ACTIVE  
**Purpose**: Guide for deploying optimized and synchronized Docker services

---

## Overview

This guide covers deploying the Reconciliation Platform using optimized Docker Compose configuration with proper service synchronization.

---

## Quick Start

### Deploy All Services

```bash
# Option 1: Use deployment script (recommended)
./scripts/deploy-optimized-docker.sh

# Option 2: Manual deployment
docker compose -f docker-compose.optimized.yml up -d
```

### Verify Deployment

```bash
# Check service status
docker compose -f docker-compose.optimized.yml ps

# Check service health
./scripts/verify-health-checks.sh

# View logs
docker compose -f docker-compose.optimized.yml logs -f
```

---

## Service Synchronization

### Startup Order

Services start in the following synchronized order:

1. **Group 1: Infrastructure** (Parallel)
   - PostgreSQL
   - Redis

2. **Group 2: Monitoring Infrastructure** (After Group 1)
   - Elasticsearch
   - Prometheus

3. **Group 3: Supporting Services** (After Group 2)
   - PgBouncer (depends on PostgreSQL)
   - Logstash (depends on Elasticsearch)
   - Kibana (depends on Elasticsearch)
   - APM Server (depends on Elasticsearch + Kibana)

4. **Group 4: Application Services** (After Group 3)
   - Backend (depends on PostgreSQL, Redis, PgBouncer, Logstash, APM)
   - Frontend (depends on Backend, Logstash, APM)

5. **Group 5: Visualization** (After Prometheus)
   - Grafana (depends on Prometheus)

### Health Check Dependencies

All services use health checks to ensure proper startup:
- Services wait for dependencies to be healthy before starting
- Health checks verify service readiness
- Automatic retries on failure

---

## Optimization Features

### Build Optimization

1. **Multi-Stage Builds**
   - Separate dependency and application stages
   - 80-90% faster rebuilds with cache

2. **BuildKit Caching**
   - Persistent cache for dependencies
   - Cache mounts for npm/cargo registries
   - Parallel builds enabled

3. **Image Size Optimization**
   - Backend: ~149MB (minimal runtime)
   - Frontend: ~74MB (nginx-alpine)

### Runtime Optimization

1. **Resource Limits**
   - CPU and memory limits per service
   - Prevents resource exhaustion
   - Ensures fair resource distribution

2. **Connection Pooling**
   - PgBouncer for database connections
   - Redis connection pooling
   - Optimized pool sizes

3. **Caching**
   - Redis for application caching
   - Nginx caching for static assets
   - Build cache for faster rebuilds

---

## Configuration

### Environment Variables

Create `.env` file:

```bash
# Database
POSTGRES_DB=reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_PORT=5432

# Redis
REDIS_PASSWORD=your_secure_redis_password
REDIS_PORT=6379

# Backend
BACKEND_PORT=2000
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
CSRF_SECRET=your_csrf_secret_here
PASSWORD_MASTER_KEY=your_master_key_here
API_KEY=your_api_key_here

# Frontend
FRONTEND_PORT=1000
VITE_API_URL=http://localhost:2000/api/v1
VITE_WS_URL=ws://localhost:2000

# Monitoring
SENTRY_DSN=your_sentry_dsn
VITE_SENTRY_DSN=your_frontend_sentry_dsn
ELASTICSEARCH_PORT=9200
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
KIBANA_PORT=5601
APM_PORT=8200

# Environment
ENVIRONMENT=production
```

### Build Arguments

```bash
# Build with optimizations
docker compose -f docker-compose.optimized.yml build \
  --build-arg BUILD_MODE=release \
  --build-arg RUSTFLAGS="-C target-cpu=native" \
  --build-arg CARGO_BUILD_JOBS=4
```

---

## Deployment Commands

### Start Services

```bash
# Start all services
docker compose -f docker-compose.optimized.yml up -d

# Start specific service
docker compose -f docker-compose.optimized.yml up -d backend

# Start with build
docker compose -f docker-compose.optimized.yml up -d --build
```

### Stop Services

```bash
# Stop all services
docker compose -f docker-compose.optimized.yml down

# Stop and remove volumes
docker compose -f docker-compose.optimized.yml down -v

# Stop specific service
docker compose -f docker-compose.optimized.yml stop backend
```

### View Logs

```bash
# All services
docker compose -f docker-compose.optimized.yml logs -f

# Specific service
docker compose -f docker-compose.optimized.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.optimized.yml logs --tail=100 backend
```

### Restart Services

```bash
# Restart all
docker compose -f docker-compose.optimized.yml restart

# Restart specific service
docker compose -f docker-compose.optimized.yml restart backend
```

---

## Service URLs

After deployment, services are available at:

- **Frontend**: http://localhost:1000
- **Backend API**: http://localhost:2000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
- **Kibana**: http://localhost:5601
- **Elasticsearch**: http://localhost:9200
- **APM Server**: http://localhost:8200

---

## Verification

### Check Service Status

```bash
# Service status
docker compose -f docker-compose.optimized.yml ps

# Health checks
./scripts/verify-health-checks.sh

# Service synchronization
./scripts/sync-docker-services.sh
```

### Test Endpoints

```bash
# Backend health
curl http://localhost:2000/api/v1/health

# Frontend
curl http://localhost:1000/health

# Prometheus
curl http://localhost:9090/-/healthy

# Grafana
curl http://localhost:3001/api/health
```

---

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker compose -f docker-compose.optimized.yml logs [service]

# Check health status
docker compose -f docker-compose.optimized.yml ps

# Restart service
docker compose -f docker-compose.optimized.yml restart [service]
```

### Build Failures

```bash
# Clean build (no cache)
docker compose -f docker-compose.optimized.yml build --no-cache

# Rebuild specific service
docker compose -f docker-compose.optimized.yml build --no-cache backend
```

### Port Conflicts

```bash
# Check port usage
lsof -i :2000
lsof -i :1000

# Change ports in .env
BACKEND_PORT=2001
FRONTEND_PORT=1001
```

---

## Performance Tuning

### Resource Limits

Adjust in `docker-compose.optimized.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '1.0'
      memory: 1G
```

### Database Optimization

PostgreSQL is pre-configured with:
- Connection pooling (PgBouncer)
- Optimized memory settings
- Query performance tuning

### Cache Optimization

- Redis: 512MB memory limit
- LRU eviction policy
- Connection pooling enabled

---

## Security

### Secrets Management

- Use `.env` file for secrets (not committed to git)
- Use Kubernetes secrets in production
- Rotate secrets regularly

### Network Isolation

- All services on `reconciliation-network`
- Internal communication only
- External ports only for required services

### Non-Root Users

- Backend runs as non-root user
- Frontend uses nginx (non-root)
- Security best practices applied

---

## Monitoring

### Health Checks

All services have health checks:
- Automatic restart on failure
- Health status monitoring
- Dependency verification

### Logging

- JSON logging enabled
- Log aggregation via Logstash
- Centralized in Elasticsearch

### Metrics

- Prometheus for metrics collection
- Grafana for visualization
- APM for performance monitoring

---

## Backup and Recovery

### Database Backup

```bash
# Backup database
docker exec reconciliation-postgres pg_dump -U postgres reconciliation_app > backup.sql

# Restore database
docker exec -i reconciliation-postgres psql -U postgres reconciliation_app < backup.sql
```

### Volume Backup

```bash
# Backup volumes
docker run --rm -v reconciliation-postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

---

## Related Documentation

- [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md)
- [Common Issues Runbook](../operations/COMMON_ISSUES_RUNBOOK.md)
- [Network Segmentation](../operations/NETWORK_SEGMENTATION.md)
- [Docker SSOT Enforcement](./DOCKER_SSOT_ENFORCEMENT.md)

---

**Last Updated**: 2025-11-29  
**Maintained By**: DevOps Team

