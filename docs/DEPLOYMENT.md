# Deployment Guide

**Last Updated**: January 2025  
**Status**: Production Ready

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Health Checks](#health-checks)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

For quick deployment instructions, see [Getting Started Guide](./getting-started/DEPLOYMENT_GUIDE.md).

---

## Docker Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- PostgreSQL 15+
- Redis 7+

### Build and Run

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Production Deployment

For production deployment, use `docker-compose.prod.yml`:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Docker Optimization

For Docker optimization guidelines, see [Docker Optimization Guide](./deployment/docker/OPTIMIZATION_GUIDE.md).

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes 1.24+
- kubectl configured
- Helm 3.0+ (optional)

### Deploy to Kubernetes

```bash
# Apply configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n reconciliation-platform

# View logs
kubectl logs -f deployment/backend -n reconciliation-platform
```

### Health Checks

```bash
# Check backend health
kubectl exec -it deployment/backend -n reconciliation-platform -- curl http://localhost:8080/health

# Check frontend
kubectl exec -it deployment/frontend -n reconciliation-platform -- curl http://localhost:3000/health
```

---

## Environment Configuration

### Required Environment Variables

#### Backend

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/reconciliation
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
BACKUP_S3_BUCKET=your-bucket-name
NODE_ENV=production
```

#### Frontend

```bash
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
NODE_ENV=production
```

### Environment Setup

For detailed environment configuration, see [Environment Setup Guide](./deployment/scripts/README.md).

---

## Health Checks

### Backend Health Endpoints

- `GET /health` - Basic health check
- `GET /api/system/status` - System status
- `GET /api/monitoring/health` - Detailed health metrics

### Frontend Health

- `GET /health` - Frontend health check
- `GET /api/health` - API connectivity check

---

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check database is running and accessible
   - Verify network connectivity

2. **Redis Connection Errors**
   - Verify `REDIS_URL` is correct
   - Check Redis is running
   - Verify network connectivity

3. **Build Failures**
   - Check Docker version compatibility
   - Verify all dependencies are available
   - Check build logs for specific errors

### Deployment Scripts

For deployment automation and troubleshooting, see [Deployment Scripts](./deployment/scripts/README.md).

### Additional Resources

- [Docker Build Guide](./deployment/DOCKER_BUILD_GUIDE.md) (if exists)
- [Go-Live Checklist](./deployment/GO_LIVE_CHECKLIST.md)
- [Troubleshooting Guide](../operations/TROUBLESHOOTING.md)

---

## Deployment Status

For current deployment status, see [Deployment Status](./deployment/DEPLOYMENT_STATUS.md).

---

**Note**: This guide consolidates deployment information from multiple sources. For detailed deployment procedures, refer to the specific guides in the `deployment/` directory.


