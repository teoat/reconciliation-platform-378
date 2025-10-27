# Environment Setup Guide

## Production Deployment

### 1. Environment Variables

Copy and configure production environment:

```bash
cp .env.production .env.production.local
nano .env.production.local
```

**CRITICAL**: Change all secrets in `.env.production.local`

### 2. Build and Deploy

```bash
# Build for production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

### 3. Health Checks

Verify services are healthy:

```bash
# Backend health
curl http://localhost:2000/health

# Backend readiness
curl http://localhost:2000/ready

# Metrics
curl http://localhost:2000/metrics
```

### 4. Monitoring

Access monitoring dashboards:

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)

### 5. Scaling

Scale backend services:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale backend=3
```

## Performance Optimization

The production configuration includes:

- Database connection pooling (20 connections)
- Redis connection pooling (50 connections)
- Multi-level caching (2000 entry L1 cache)
- Health check endpoints
- Metrics export
- Resource limits and reservations