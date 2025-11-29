# Deployment Guide

**Last Updated**: January 2025  
**Status**: Production Ready  
**SSOT**: This is the single source of truth for all deployment procedures

## Overview

This guide covers deployment procedures for the Reconciliation Platform, including Docker deployment, staging and production deployments, and comprehensive validation. This guide consolidates all deployment documentation into a single source of truth.

## Prerequisites

- **Docker Engine** 20.10+ installed
- **Docker Compose** v2.0+ (or docker-compose v1.29+)
- **Database migrations** script available
- **Required environment variables** set
- **Deployment validation script** available
- **8GB+ RAM** recommended
- **20GB+ free disk space** recommended

## Quick Start

### Docker Deployment (Recommended)

```bash
# 1. Ensure network exists
docker network create reconciliation-network 2>/dev/null || true

# 2. Deploy all services
./scripts/deploy-docker.sh

# 3. View logs
docker compose logs -f
```

### Staging Deployment

```bash
# Deploy to staging
./scripts/deploy-staging.sh

# Validate deployment
./scripts/validate-deployment.sh

# Monitor deployment
./scripts/monitor-deployment.sh
```

### Production Deployment

```bash
# Set production environment
export ENVIRONMENT=production
export API_BASE_URL=https://api.example.com

# Deploy to production
./scripts/deploy-production.sh

# Validate deployment
API_BASE_URL=https://api.example.com ./scripts/validate-deployment.sh
```

## Docker Architecture

The consolidated `docker-compose.yml` includes all services organized into startup groups:

### Group 1: Infrastructure (Parallel)
- **PostgreSQL** (port 5432) - Primary database
- **Redis** (port 6379) - Cache and session store
- **Elasticsearch** (port 9200) - Log storage
- **Prometheus** (port 9090) - Metrics collection

### Group 2: Supporting Services (After Group 1)
- **PgBouncer** (port 6432) - Connection pooler
- **Logstash** (port 5044) - Log processing
- **Kibana** (port 5601) - Log visualization

### Group 3: Application Services (After Group 2)
- **APM Server** (port 8200) - Application monitoring
- **Backend** (port 2000) - Rust API server
- **Frontend** (port 1000) - React/Vite application

### Group 4: Visualization (After Prometheus)
- **Grafana** (port 3001) - Metrics visualization

## Docker Deployment Options

### Standard Deployment
```bash
./scripts/deploy-docker.sh
```

### Force Rebuild
```bash
./scripts/deploy-docker.sh --build
```

### Build Without Cache
```bash
./scripts/deploy-docker.sh --no-cache
```

### Sequential Build (if parallel fails)
```bash
./scripts/deploy-docker.sh --sequential
```

### Pull Latest Base Images
```bash
./scripts/deploy-docker.sh --pull
```

### Clean Before Deploy
```bash
./scripts/deploy-docker.sh --clean
```

### Show Logs After Deploy
```bash
./scripts/deploy-docker.sh --logs
```

## Service URLs

After deployment, services are available at:

- **Frontend**: http://localhost:1000
- **Backend API**: http://localhost:2000
- **API Docs**: http://localhost:2000/api/docs
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Kibana**: http://localhost:5601
- **Elasticsearch**: http://localhost:9200

## Deployment Steps

### 1. Pre-Deployment

#### Verify Environment
```bash
# Check environment variables
env | grep -E "(ENVIRONMENT|DATABASE_URL|JWT_SECRET|CSRF_SECRET)"

# Verify Docker
docker --version
docker-compose --version
```

#### Run Database Migrations
```bash
# Migrations run automatically on startup in production
# Or run manually:
./scripts/execute-migrations.sh
```

### 2. Staging Deployment

#### Deploy Services
```bash
# Build and start services
docker-compose -f docker-compose.staging.yml up -d --build

# Check service status
docker-compose -f docker-compose.staging.yml ps
```

#### Validate Deployment
```bash
# Run validation script
API_BASE_URL=http://localhost:2000 ./scripts/validate-deployment.sh
```

#### Monitor Services
```bash
# Check logs
docker-compose -f docker-compose.staging.yml logs -f backend

# Monitor metrics
curl http://localhost:2000/api/metrics/summary
```

### 3. Production Deployment

#### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Database migrations tested
- [ ] Secrets configured
- [ ] Backup created
- [ ] Rollback plan ready

#### Deploy Services
```bash
# Set production environment
export ENVIRONMENT=production

# Deploy
./scripts/deploy-production.sh
```

#### Post-Deployment Validation
```bash
# Health check
curl https://api.example.com/api/health

# Metrics check
curl https://api.example.com/api/metrics/summary

# Full validation
API_BASE_URL=https://api.example.com ./scripts/validate-deployment.sh
```

## Monitoring

### Health Endpoints

- **Health Check**: `GET /api/health`
- **Metrics Health**: `GET /api/metrics/health`
- **Resilience Metrics**: `GET /api/health/resilience`

### Metrics Endpoints

- **All Metrics**: `GET /api/metrics`
- **Metrics Summary**: `GET /api/metrics/summary`
- **Specific Metric**: `GET /api/metrics/{metric_name}`

### Monitoring Script

```bash
# Continuous monitoring
./scripts/monitor-deployment.sh

# With custom API URL
API_BASE_URL=https://api.example.com ./scripts/monitor-deployment.sh

# With custom interval (seconds)
MONITOR_INTERVAL=60 ./scripts/monitor-deployment.sh
```

## Validation

### Automated Validation

The deployment validation script checks:
- Health endpoints
- Metrics endpoints
- Database migration status
- Service availability

```bash
# Run validation
./scripts/validate-deployment.sh

# With custom API URL
API_BASE_URL=https://api.example.com ./scripts/validate-deployment.sh
```

### Manual Validation

```bash
# Health check
curl http://localhost:2000/api/health

# Metrics summary
curl http://localhost:2000/api/metrics/summary

# Specific metric
curl http://localhost:2000/api/metrics/cqrs_command_total
```

## Rollback Procedure

### Quick Rollback

```bash
# Stop current services
docker-compose down

# Restore previous version
docker-compose -f docker-compose.previous.yml up -d

# Verify rollback
./scripts/validate-deployment.sh
```

### Database Rollback

```bash
# Rollback migrations (if needed)
cd backend
diesel migration revert
```

## Troubleshooting

### Services Not Starting

1. Check logs:
   ```bash
   docker compose logs [service]
   ```

2. Check service status:
   ```bash
   docker compose ps
   ```

3. Check health status:
   ```bash
   docker compose ps
   ```

4. Verify network:
   ```bash
   docker network inspect reconciliation-network
   ```

5. Restart services:
   ```bash
   docker compose restart
   ```

### Build Failures

1. Clear build cache:
   ```bash
   docker compose build --no-cache
   ```

2. Check disk space:
   ```bash
   df -h
   ```

3. Increase Docker memory (Docker Desktop):
   - Settings → Resources → Memory (8GB+ recommended)

### Database Connection Issues

1. Verify PostgreSQL is healthy:
   ```bash
   docker compose exec postgres pg_isready -U postgres
   ```

2. Check connection string:
   ```bash
   docker compose exec backend env | grep DATABASE_URL
   ```

3. Verify DATABASE_URL:
   ```bash
   echo $DATABASE_URL
   ```

4. Test connection:
   ```bash
   psql "$DATABASE_URL" -c "SELECT 1"
   ```

### Port Conflicts

If ports are already in use:

1. Change ports in `.env`:
   ```bash
   BACKEND_PORT=2001
   FRONTEND_PORT=1001
   ```

2. Or stop conflicting services:
   ```bash
   # Find process using port
   lsof -i :2000
   # Kill process
   kill -9 <PID>
   ```

### Metrics Not Available

```bash
# Check metrics service
curl http://localhost:2000/api/metrics/health

# Check service logs
docker compose logs backend | grep metrics
```

## Resource Requirements

### Minimum

- **CPU**: 4 cores
- **RAM**: 8GB
- **Disk**: 20GB free

### Recommended

- **CPU**: 8+ cores
- **RAM**: 16GB+
- **Disk**: 50GB+ free

### Production

- **CPU**: 16+ cores
- **RAM**: 32GB+
- **Disk**: 100GB+ free
- **Network**: 1Gbps+

## Scaling

### Scale Backend

```bash
docker compose up -d --scale backend=3
```

### Scale Frontend

```bash
docker compose up -d --scale frontend=2
```

Note: Use a load balancer (nginx) for multiple frontend instances.

## Backup and Recovery

### Database Backup

```bash
docker compose exec postgres pg_dump -U postgres reconciliation_app > backup.sql
```

### Restore Database

```bash
docker compose exec -T postgres psql -U postgres reconciliation_app < backup.sql
```

### Volume Backup

```bash
docker run --rm -v reconciliation-platform_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz /data
```

## Maintenance

### Update Services

```bash
# Pull latest images
docker compose pull

# Rebuild application images
docker compose build --pull

# Restart services
docker compose up -d
```

### Clean Up

```bash
# Remove stopped containers
docker compose down

# Remove volumes (WARNING: deletes data)
docker compose down -v

# Prune unused images
docker image prune -a
```

## Environment Configuration

### Using .env File

1. Copy example environment file:
   ```bash
   cp config/dev.env.example .env
   ```

2. Edit `.env` with your configuration:
   ```bash
   # Database
   POSTGRES_PASSWORD=your_secure_password
   POSTGRES_DB=reconciliation_app
   
   # Redis
   REDIS_PASSWORD=your_redis_password
   
   # Security (IMPORTANT: Change in production!)
   JWT_SECRET=your_jwt_secret_32_chars_min
   JWT_REFRESH_SECRET=your_refresh_secret_32_chars_min
   CSRF_SECRET=your_csrf_secret_32_chars_min
   PASSWORD_MASTER_KEY=your_master_key_32_chars_min
   
   # Ports
   BACKEND_PORT=2000
   FRONTEND_PORT=1000
   ```

3. Deploy with environment:
   ```bash
   docker compose up -d
   ```

### Environment Variables

#### Required for Production

```bash
ENVIRONMENT=production
DATABASE_URL=postgres://...
JWT_SECRET=<32+ character secret>
CSRF_SECRET=<32+ character secret>
PASSWORD_MASTER_KEY=<32+ character secret>
```

#### Optional

```bash
ZERO_TRUST_REQUIRE_MTLS=true  # Enable mTLS
REDIS_URL=redis://...
API_BASE_URL=https://api.example.com
```

#### Key Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_PASSWORD` | `postgres_pass` | PostgreSQL password |
| `REDIS_PASSWORD` | `redis_pass` | Redis password |
| `JWT_SECRET` | (required) | JWT signing secret |
| `JWT_REFRESH_SECRET` | (required) | JWT refresh secret |
| `BACKEND_PORT` | `2000` | Backend API port |
| `FRONTEND_PORT` | `1000` | Frontend port |
| `ENVIRONMENT` | `production` | Environment name |

## Multi-Stage Build Optimization

The Dockerfiles use optimized multi-stage builds:

### Backend Build Stages

1. **Dependency Cache** - Builds dependencies only when `Cargo.toml` changes
2. **Application Builder** - Builds application with cached dependencies
3. **Runtime** - Minimal Debian image with only the binary

### Frontend Build Stages

1. **Dependency Cache** - Installs npm packages only when `package.json` changes
2. **Application Builder** - Builds production bundle
3. **Runtime** - Nginx serving static files

### Build Cache Benefits

- **80-90% faster rebuilds** when only source code changes
- **Persistent cache** across builds using BuildKit
- **Parallel builds** for backend and frontend

## Security Checklist

- [ ] All secrets set and validated
- [ ] Zero-trust enabled in production
- [ ] Rate limiting configured
- [ ] Database migrations verified
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CORS properly configured

## Performance Checklist

- [ ] Cache warming enabled
- [ ] Query optimization indexes created
- [ ] Bundle size verified (<500KB)
- [ ] Database connection pooling configured
- [ ] Rate limits configured appropriately

## Health Checks

All services include health checks:

```bash
# Check service health
docker compose ps

# View health check logs
docker compose logs backend | grep health
```

## Related Documentation

- [New Features API](../api/NEW_FEATURES_API.md)
- [CQRS Architecture](../architecture/CQRS_AND_EVENT_DRIVEN_ARCHITECTURE.md)
- [Security Hardening](../security/SECURITY_HARDENING_CHECKLIST.md)
- [Database Migration Guide](../operations/DATABASE_MIGRATION_GUIDE.md)
- [Monitoring Setup](../operations/MONITORING_GUIDE.md)
- [Troubleshooting Guide](../operations/TROUBLESHOOTING.md)

---

**Note**: This guide consolidates the previous Docker Deployment Guide. For Docker-specific details, see the Docker Architecture and Docker Deployment Options sections above.
