# Migration Guide: Docker Compose → Kubernetes

## Overview

This guide helps you migrate from Docker Compose to Kubernetes deployment.

## Pre-Migration Checklist

- [ ] Backup all data (databases, volumes)
- [ ] Document current environment variables
- [ ] Note current resource usage
- [ ] List all services and dependencies
- [ ] Test Kubernetes cluster access

## Step-by-Step Migration

### 1. Export Data from Docker

```bash
# Export PostgreSQL
docker exec reconciliation-postgres pg_dump -U postgres reconciliation > backup.sql

# Export Redis (if needed)
docker exec reconciliation-redis redis-cli SAVE
docker cp reconciliation-redis:/data/dump.rdb ./redis-backup.rdb
```

### 2. Prepare Kubernetes Secrets

```bash
# Create namespace
kubectl create namespace reconciliation-platform

# Create secrets
kubectl create secret generic reconciliation-secrets \
  --from-literal=DATABASE_URL='postgresql://user:pass@postgres-service:5432/reconciliation' \
  --from-literal=JWT_SECRET='your-secret-here' \
  --from-literal=REDIS_URL='redis://redis-service:6379/0' \
  -n reconciliation-platform
```

### 3. Build and Push Images

```bash
# Build images
docker build -f infrastructure/docker/Dockerfile.backend -t reconciliation-backend:latest .
docker build -f infrastructure/docker/Dockerfile.frontend -t reconciliation-frontend:latest .

# Tag for registry (if using private registry)
docker tag reconciliation-backend:latest registry.example.com/reconciliation-backend:v1.0.0
docker tag reconciliation-frontend:latest registry.example.com/reconciliation-frontend:v1.0.0

# Push to registry
docker push registry.example.com/reconciliation-backend:v1.0.0
docker push registry.example.com/reconciliation-frontend:v1.0.0
```

### 4. Deploy to Kubernetes

```bash
cd k8s/optimized
./deploy.sh development apply
```

### 5. Import Data

```bash
# Import PostgreSQL
kubectl exec -it postgres-0 -n reconciliation-platform -- \
  psql -U postgres -d reconciliation < backup.sql

# Import Redis (if needed)
kubectl cp redis-backup.rdb reconciliation-platform/redis-0:/data/dump.rdb
kubectl exec -it redis-0 -n reconciliation-platform -- redis-cli RESTORE dump.rdb 0
```

### 6. Verify Deployment

```bash
# Check pods
kubectl get pods -n reconciliation-platform

# Check services
kubectl get svc -n reconciliation-platform

# Check ingress
kubectl get ingress -n reconciliation-platform

# Test endpoints
kubectl port-forward svc/backend-service 2000:2000 -n reconciliation-platform
curl http://localhost:2000/health
```

## Rollback Plan

If issues occur:

```bash
# Delete Kubernetes deployment
./deploy.sh development delete

# Restart Docker Compose
cd ..
docker-compose up -d
```

## Differences: Docker Compose vs Kubernetes

| Feature | Docker Compose | Kubernetes |
|---------|---------------|------------|
| Scaling | Manual | Automatic (HPA) |
| Health Checks | Basic | Advanced (3 types) |
| Updates | Recreate | Rolling updates |
| Networking | Bridge | ClusterIP/Ingress |
| Storage | Volumes | PVCs |
| Secrets | .env files | Kubernetes Secrets |

## Post-Migration

1. **Monitor** resource usage
2. **Adjust** HPA thresholds if needed
3. **Set up** monitoring and alerting
4. **Configure** backups for PVCs
5. **Test** disaster recovery procedures

## Troubleshooting

### Pods Not Starting

```bash
kubectl describe pod <pod-name> -n reconciliation-platform
kubectl logs <pod-name> -n reconciliation-platform
```

### Services Not Accessible

```bash
kubectl get endpoints -n reconciliation-platform
kubectl port-forward svc/<service-name> <local-port>:<service-port>
```

### Database Connection Issues

```bash
# Check database pod
kubectl exec -it postgres-0 -n reconciliation-platform -- psql -U postgres

# Check service
kubectl get svc postgres-service -n reconciliation-platform
```

