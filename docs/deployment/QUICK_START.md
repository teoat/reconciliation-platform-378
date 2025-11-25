# Production Deployment Quick Start

**Last Updated**: January 2025  
**Status**: Active

## Quick Reference

### Kubernetes Deployment (Recommended)

```bash
# 1. Set environment variables
export DOCKER_REGISTRY=registry.example.com
export DOCKER_USERNAME=your-username
export DOCKER_PASSWORD=your-password
export VERSION=v1.0.0

# 2. Setup secrets (first time only)
./scripts/deployment/setup-production-secrets.sh create

# 3. Build, push, and deploy
./scripts/deployment/deploy-production.sh kubernetes $VERSION
```

### Docker Compose Deployment

```bash
# Deploy all services
./scripts/deployment/deploy-docker-production.sh up

# View logs
./scripts/deployment/deploy-docker-production.sh logs

# Stop services
./scripts/deployment/deploy-docker-production.sh down
```

## Step-by-Step Guide

### Step 1: Prerequisites

```bash
# Verify tools are installed
docker --version
docker-compose --version  # or: docker compose version
kubectl version --client
kustomize version  # or: kubectl kustomize --help

# Verify cluster access
kubectl cluster-info
```

### Step 2: Configure Registry

```bash
# Set registry credentials
export DOCKER_REGISTRY=registry.example.com
export DOCKER_USERNAME=your-username
export DOCKER_PASSWORD=your-password

# Login to registry
docker login $DOCKER_REGISTRY -u $DOCKER_USERNAME
```

### Step 3: Setup Secrets (Kubernetes Only)

```bash
# Create production secrets
./scripts/deployment/setup-production-secrets.sh create

# Verify secrets
./scripts/deployment/setup-production-secrets.sh verify
```

### Step 4: Deploy

**Kubernetes:**
```bash
export VERSION=v1.0.0
./scripts/deployment/deploy-production.sh kubernetes $VERSION
```

**Docker Compose:**
```bash
./scripts/deployment/deploy-docker-production.sh up
```

### Step 5: Verify Deployment

**Kubernetes:**
```bash
# Check pods
kubectl get pods -n reconciliation-platform

# Check services
kubectl get services -n reconciliation-platform

# View logs
kubectl logs -f -n reconciliation-platform deployment/backend
```

**Docker Compose:**
```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

## Common Commands

### Build and Push Images Only

```bash
./scripts/deployment/build-and-push-images.sh v1.0.0 registry.example.com
```

### Update Secrets

```bash
./scripts/deployment/setup-production-secrets.sh update
```

### Rollback Deployment

```bash
# Kubernetes
kubectl rollout undo deployment/backend -n reconciliation-platform
kubectl rollout undo deployment/frontend -n reconciliation-platform

# Docker Compose
./scripts/deployment/deploy-docker-production.sh down
# Then redeploy with previous version
```

### Scale Services

```bash
# Kubernetes
kubectl scale deployment backend --replicas=5 -n reconciliation-platform
kubectl scale deployment frontend --replicas=10 -n reconciliation-platform
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n reconciliation-platform

# Check events
kubectl get events -n reconciliation-platform --sort-by='.lastTimestamp'
```

### Image Pull Errors

```bash
# Verify registry access
docker pull registry.example.com/reconciliation-platform-backend:v1.0.0

# Check image pull secrets
kubectl get secrets -n reconciliation-platform
```

### Database Connection Issues

```bash
# Check database pod
kubectl get pods -n reconciliation-platform -l component=postgres

# Test connection
kubectl exec -n reconciliation-platform statefulset/postgres -- psql -U postgres -c "SELECT 1"
```

## Next Steps

- Read [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md) for detailed information
- Review [Architecture Overview](../architecture/ARCHITECTURE.md) for system design
- Check [Security Guide](../security/SECURITY_GUIDE.md) for security best practices

