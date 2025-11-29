# Docker Services Quick Start Guide

**Last Updated**: January 2025  
**Status**: Production Ready ✅

## Quick Commands

### Build All Services

```bash
# Development (minimal services)
./scripts/docker/build-optimized.sh dev

# Production (full stack)
./scripts/docker/build-optimized.sh production

# Optimized (with profiles)
./scripts/docker/build-optimized.sh optimized
```

### Start Services

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d

# Production
docker-compose -f docker-compose.yml up -d

# Optimized with profiles
docker-compose -f docker-compose.optimized.yml --profile minimal up -d
docker-compose -f docker-compose.optimized.yml --profile production up -d
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop Services

```bash
docker-compose down
```

## Service Ports

- **Frontend**: http://localhost:1000
- **Backend API**: http://localhost:2000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
- **Kibana**: http://localhost:5601
- **Elasticsearch**: http://localhost:9200

## Environment Variables

Create a `.env` file or set environment variables:

```bash
# Database
POSTGRES_DB=reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Redis
REDIS_PASSWORD=your_redis_password

# Backend
JWT_SECRET=your_jwt_secret_32_chars_min
JWT_REFRESH_SECRET=your_refresh_secret_32_chars_min
CSRF_SECRET=your_csrf_secret_32_chars_min

# Frontend
VITE_API_URL=http://localhost:2000/api/v1
VITE_WS_URL=ws://localhost:2000
```

## Build Optimizations

All services use:
- ✅ Multi-stage builds
- ✅ BuildKit caching
- ✅ Parallel builds
- ✅ Optimized build context

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
docker builder prune -af
./scripts/docker/build-optimized.sh dev
```

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check health
docker-compose ps
```

### Out of Memory

```bash
# Reduce parallel builds
BUILD_PARALLEL=false ./scripts/docker/build-optimized.sh dev
```

## More Information

- [Docker Services Diagnosis](./DOCKER_SERVICES_DIAGNOSIS.md) - Full service analysis
- [Docker Optimization Summary](./DOCKER_OPTIMIZATION_SUMMARY.md) - Optimization details

