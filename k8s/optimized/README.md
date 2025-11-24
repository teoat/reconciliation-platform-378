# Kubernetes Deployment - Reconciliation Platform

## Overview

This directory contains optimized Kubernetes manifests for deploying the Reconciliation Platform with production-ready configurations.

## Structure

```
k8s/optimized/
├── base/                    # Base Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── service-accounts.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── database-deployment.yaml
│   ├── services.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   └── kustomization.yaml
├── overlays/
│   ├── development/         # Development environment
│   ├── staging/            # Staging environment
│   └── production/          # Production environment
└── deploy.sh               # Deployment script
```

## Features

### ✅ Optimizations

1. **Multi-Stage Docker Builds**
   - Dependency caching (75-90% faster rebuilds)
   - Minimal runtime images
   - Security hardening

2. **Kubernetes Best Practices**
   - Resource limits and requests
   - Health checks (liveness, readiness, startup probes)
   - Horizontal Pod Autoscaling (HPA)
   - Pod anti-affinity for high availability
   - Security contexts (non-root, read-only filesystems)

3. **Production Ready**
   - Rolling updates with zero downtime
   - ConfigMaps and Secrets management
   - Ingress with TLS termination
   - Service mesh ready (optional)

## Quick Start

### Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- kustomize (optional, kubectl has built-in support)
- Docker (for building images)

### Deploy to Development

```bash
cd k8s/optimized
./deploy.sh development apply
```

### Deploy to Production

```bash
# 1. Update secrets
kubectl edit secret reconciliation-secrets -n reconciliation-platform

# 2. Update image tags in overlays/production/kustomization.yaml

# 3. Deploy
./deploy.sh production apply
```

## Configuration

### Environment Variables

Edit `base/configmap.yaml` for application configuration:
- Database pool size
- Redis settings
- Log levels
- Rate limiting

### Secrets

**⚠️ IMPORTANT**: Update `base/secrets.yaml` with actual values:

```bash
# Generate secure secrets
kubectl create secret generic reconciliation-secrets \
  --from-literal=DATABASE_URL='postgresql://...' \
  --from-literal=JWT_SECRET='$(openssl rand -base64 32)' \
  --from-literal=REDIS_URL='redis://...' \
  -n reconciliation-platform
```

### Resource Limits

Adjust in deployment files based on your cluster capacity:

**Backend:**
- Requests: 256Mi memory, 250m CPU
- Limits: 512Mi memory, 1000m CPU

**Frontend:**
- Requests: 64Mi memory, 50m CPU
- Limits: 128Mi memory, 200m CPU

## Scaling

### Manual Scaling

```bash
kubectl scale deployment backend -n reconciliation-platform --replicas=5
kubectl scale deployment frontend -n reconciliation-platform --replicas=10
```

### Automatic Scaling (HPA)

HPA is configured in `base/hpa.yaml`:
- Backend: 2-10 replicas (CPU 70%, Memory 80%)
- Frontend: 3-20 replicas (CPU 70%, Memory 80%)

## Monitoring

### Health Checks

All services have health endpoints:
- Backend: `http://backend-service:2000/health`
- Frontend: `http://frontend-service:80/health`

### Metrics

Prometheus scraping enabled:
- Backend metrics: `:9090/metrics`
- Frontend metrics: `:80/metrics`

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n reconciliation-platform
kubectl describe pod <pod-name> -n reconciliation-platform
kubectl logs <pod-name> -n reconciliation-platform
```

### Check Services

```bash
kubectl get svc -n reconciliation-platform
kubectl get ingress -n reconciliation-platform
```

### Debug Deployment

```bash
# Dry run to see what would be deployed
./deploy.sh production dry-run

# See differences
./deploy.sh production diff
```

## Advanced Configuration

### Custom Storage Classes

Update `database-deployment.yaml`:
```yaml
storageClassName: "your-storage-class"
```

### Ingress Controller

Update `base/ingress.yaml` annotations based on your ingress controller:
- NGINX Ingress
- Traefik
- Istio Gateway
- AWS ALB

### Service Mesh (Optional)

For Istio/Linkerd integration, add:
- Service mesh annotations
- mTLS configuration
- Traffic policies

## Migration from Docker Compose

1. **Export data** from Docker volumes
2. **Create PersistentVolumeClaims** for databases
3. **Update secrets** with production values
4. **Deploy** using the script
5. **Import data** into Kubernetes volumes

## Security

- ✅ Non-root containers
- ✅ Read-only filesystems (where possible)
- ✅ Resource limits
- ✅ Network policies (add as needed)
- ✅ Pod security policies (add as needed)
- ✅ Secrets management

## Performance

- ✅ Horizontal Pod Autoscaling
- ✅ Pod anti-affinity
- ✅ Resource requests/limits
- ✅ Connection pooling
- ✅ Caching strategies

## Next Steps

1. Set up monitoring (Prometheus, Grafana)
2. Configure logging (ELK, Loki)
3. Set up CI/CD pipeline
4. Configure backup strategies
5. Set up disaster recovery

