# Production Deployment Guide

**Last Updated**: January 2025  
**Status**: Active

## Overview

This guide covers deploying the Reconciliation Platform to production using Docker and Kubernetes.

## Prerequisites

### Required Tools
- Docker 20.10+
- Docker Compose 2.0+ (or `docker compose`)
- kubectl 1.24+
- kustomize 4.0+ (or `kubectl kustomize`)
- Access to Kubernetes cluster
- Access to container registry (Docker Hub, GitHub Container Registry, etc.)

### Required Access
- Kubernetes cluster admin access
- Container registry push permissions
- Database backup/restore access
- Production secrets management

## Quick Start

### Option 1: Kubernetes Deployment (Recommended)

```bash
# Build and push images, then deploy to Kubernetes
./scripts/deployment/deploy-production.sh kubernetes v1.0.0
```

### Option 2: Docker Compose Deployment

```bash
# Deploy using Docker Compose
./scripts/deployment/deploy-docker-production.sh up
```

## Detailed Deployment Steps

### 1. Build and Push Docker Images

Build and push images to your container registry:

```bash
# Set registry and credentials
export DOCKER_REGISTRY=registry.example.com
export DOCKER_USERNAME=your-username
export DOCKER_PASSWORD=your-password

# Build and push
./scripts/deployment/build-and-push-images.sh v1.0.0 $DOCKER_REGISTRY
```

**Environment Variables:**
- `DOCKER_REGISTRY`: Container registry URL (default: docker.io)
- `DOCKER_USERNAME`: Registry username
- `DOCKER_PASSWORD`: Registry password
- `VERSION`: Image version tag (default: latest)
- `IMAGE_PREFIX`: Image name prefix (default: reconciliation-platform)

### 2. Configure Production Secrets

**Important**: Never commit production secrets to version control.

#### Option A: Using kubectl

```bash
# Create namespace
kubectl create namespace reconciliation-platform

# Create secrets
kubectl create secret generic reconciliation-secrets \
  --from-literal=JWT_SECRET=$(openssl rand -base64 48) \
  --from-literal=JWT_REFRESH_SECRET=$(openssl rand -base64 48) \
  --from-literal=POSTGRES_PASSWORD=$(openssl rand -base64 24) \
  --from-literal=POSTGRES_USER=postgres \
  --from-literal=CSRF_SECRET=$(openssl rand -base64 48) \
  --from-literal=PASSWORD_MASTER_KEY=$(openssl rand -base64 48) \
  --from-literal=DATABASE_URL="postgresql://postgres:$(openssl rand -base64 24)@postgres-service:5432/reconciliation?sslmode=disable" \
  --from-literal=REDIS_URL="redis://redis-service:6379/0" \
  -n reconciliation-platform
```

#### Option B: Using External Secrets Operator

See [Secrets Management](#secrets-management) section below.

### 3. Deploy to Kubernetes

```bash
# Set environment variables
export DOCKER_REGISTRY=registry.example.com
export IMAGE_PREFIX=reconciliation-platform
export VERSION=v1.0.0

# Deploy
./scripts/deployment/deploy-kubernetes-production.sh $VERSION
```

**Environment Variables:**
- `DOCKER_REGISTRY`: Container registry URL
- `IMAGE_PREFIX`: Image name prefix
- `VERSION`: Image version tag
- `KUBECTL_CONTEXT`: Kubernetes context to use
- `SKIP_SECRETS`: Skip secret creation (default: false)
- `SKIP_MIGRATIONS`: Skip database migrations (default: false)

### 4. Deploy to Docker Compose

```bash
# Start all services
./scripts/deployment/deploy-docker-production.sh up

# View logs
./scripts/deployment/deploy-docker-production.sh logs

# Check status
./scripts/deployment/deploy-docker-production.sh status

# Stop services
./scripts/deployment/deploy-docker-production.sh down
```

## Service Architecture

### Kubernetes Services

- **Backend**: Rust API server (port 2000)
- **Frontend**: React SPA served by nginx (port 80)
- **PostgreSQL**: Database (port 5432)
- **Redis**: Cache and session store (port 6379)
- **Monitoring**: Prometheus, Grafana (optional)

### Docker Compose Services

All services from Kubernetes plus:
- **Elasticsearch**: Log aggregation
- **Logstash**: Log processing
- **Kibana**: Log visualization
- **APM Server**: Application performance monitoring

## Configuration

### Kubernetes Configuration

Configuration is managed via Kustomize:

- **Base**: `k8s/optimized/base/`
- **Production Overlay**: `k8s/optimized/overlays/production/`

Key files:
- `configmap.yaml`: Non-sensitive configuration
- `secrets.yaml`: Secret template (update in production)
- `backend-deployment.yaml`: Backend deployment
- `frontend-deployment.yaml`: Frontend deployment
- `database-deployment.yaml`: PostgreSQL StatefulSet
- `services.yaml`: Service definitions
- `ingress.yaml`: Ingress configuration
- `hpa.yaml`: Horizontal Pod Autoscaler

### Environment Variables

#### Backend Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@postgres-service:5432/reconciliation
REDIS_URL=redis://redis-service:6379/0
JWT_SECRET=<secure-random-string>
JWT_REFRESH_SECRET=<secure-random-string>
RUST_LOG=warn,reconciliation_backend=info
```

#### Frontend Environment Variables

```bash
VITE_API_URL=http://backend-service:2000/api/v1
VITE_WS_URL=ws://backend-service:2000
VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>
```

## Secrets Management

### Required Secrets

1. **JWT_SECRET**: Minimum 32 characters (for JWT token signing)
2. **JWT_REFRESH_SECRET**: Minimum 32 characters (for refresh tokens)
3. **POSTGRES_PASSWORD**: Minimum 16 characters
4. **CSRF_SECRET**: Minimum 32 characters
5. **PASSWORD_MASTER_KEY**: Minimum 32 characters (for password encryption)

### Secret Generation

```bash
# Generate secure secrets
openssl rand -base64 48  # For 32+ char secrets
openssl rand -base64 24   # For 16+ char secrets
```

### External Secrets Management

Recommended tools:
- **External Secrets Operator**: Sync secrets from external systems
- **HashiCorp Vault**: Centralized secret management
- **AWS Secrets Manager**: For AWS deployments
- **Azure Key Vault**: For Azure deployments
- **GCP Secret Manager**: For GCP deployments

## Database Migrations

Migrations run automatically via init container in Kubernetes. For manual execution:

```bash
# Get backend pod
POD_NAME=$(kubectl get pods -n reconciliation-platform -l component=backend -o jsonpath='{.items[0].metadata.name}')

# Run migrations
kubectl exec -n reconciliation-platform $POD_NAME -- /app/reconciliation-backend migrate
```

## Monitoring and Health Checks

### Health Endpoints

- **Backend**: `http://backend-service:2000/health`
- **Frontend**: `http://frontend-service:80/health`

### Monitoring

```bash
# View pod status
kubectl get pods -n reconciliation-platform

# View logs
kubectl logs -f -n reconciliation-platform deployment/backend

# View metrics (if Prometheus enabled)
kubectl port-forward -n reconciliation-platform svc/backend-service 9090:9090
# Access: http://localhost:9090/metrics
```

### Prometheus Metrics

Backend exposes metrics at `/metrics` endpoint:
- HTTP request duration
- Database query duration
- Cache hit/miss rates
- Active connections

## Scaling

### Horizontal Pod Autoscaler (HPA)

HPA is configured in `k8s/optimized/base/hpa.yaml`:

- **Backend**: 2-10 replicas (CPU: 70%, Memory: 80%)
- **Frontend**: 3-20 replicas (CPU: 70%, Memory: 80%)

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n reconciliation-platform

# Scale frontend
kubectl scale deployment frontend --replicas=10 -n reconciliation-platform
```

## Rollback

### Kubernetes Rollback

```bash
# Rollback backend
kubectl rollout undo deployment/backend -n reconciliation-platform

# Rollback frontend
kubectl rollout undo deployment/frontend -n reconciliation-platform

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2 -n reconciliation-platform
```

### Docker Compose Rollback

```bash
# Stop services
./scripts/deployment/deploy-docker-production.sh down

# Rebuild with previous version
VERSION=v1.0.0-previous ./scripts/deployment/deploy-docker-production.sh up
```

## Troubleshooting

### Common Issues

#### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n reconciliation-platform

# Check events
kubectl get events -n reconciliation-platform --sort-by='.lastTimestamp'
```

#### Database Connection Issues

```bash
# Check database pod
kubectl get pods -n reconciliation-platform -l component=postgres

# Check database logs
kubectl logs -n reconciliation-platform statefulset/postgres

# Test connection
kubectl exec -n reconciliation-platform statefulset/postgres -- psql -U postgres -c "SELECT 1"
```

#### Image Pull Errors

```bash
# Check image pull secrets
kubectl get secrets -n reconciliation-platform

# Verify registry access
docker pull registry.example.com/reconciliation-platform-backend:v1.0.0
```

### Debug Commands

```bash
# Get all resources
kubectl get all -n reconciliation-platform

# Describe deployment
kubectl describe deployment backend -n reconciliation-platform

# View ConfigMap
kubectl get configmap reconciliation-config -n reconciliation-platform -o yaml

# View secrets (base64 encoded)
kubectl get secret reconciliation-secrets -n reconciliation-platform -o yaml
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
./scripts/backup-postgresql.sh production

# Restore backup
./scripts/restore-postgresql.sh production backup-file.sql
```

### Kubernetes Backup

```bash
# Backup all resources
kubectl get all -n reconciliation-platform -o yaml > backup.yaml

# Backup secrets (base64 encoded)
kubectl get secret reconciliation-secrets -n reconciliation-platform -o yaml > secrets-backup.yaml
```

## Security Best Practices

1. **Secrets**: Never commit secrets to version control
2. **TLS**: Use TLS/HTTPS in production
3. **Network Policies**: Implement Kubernetes network policies
4. **RBAC**: Use least-privilege service accounts
5. **Image Scanning**: Scan images for vulnerabilities
6. **Updates**: Regularly update base images and dependencies

## Related Documentation

- [Architecture Overview](../architecture/ARCHITECTURE.md)
- [API Reference](../api/API_REFERENCE.md)
- [Security Guide](../security/SECURITY_GUIDE.md)
- [Monitoring Guide](../operations/MONITORING_GUIDE.md)

