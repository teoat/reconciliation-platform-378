# Deployment Scripts

Production deployment scripts for Docker and Kubernetes.

## Scripts Overview

### Main Deployment Scripts

- **`deploy-production.sh`** - Master deployment script (recommended entry point)
  - Handles both Kubernetes and Docker Compose deployments
  - Builds, pushes, and deploys in one command

### Individual Scripts

- **`build-and-push-images.sh`** - Build and push Docker images to registry
- **`deploy-kubernetes-production.sh`** - Deploy to Kubernetes cluster
- **`deploy-docker-production.sh`** - Deploy using Docker Compose
- **`setup-production-secrets.sh`** - Create and manage Kubernetes secrets
- **`update-kustomization-images.sh`** - Update image tags in kustomization.yaml

## Quick Start

### Kubernetes Deployment

```bash
# 1. Setup secrets (first time only)
./scripts/deployment/setup-production-secrets.sh create

# 2. Deploy
export DOCKER_REGISTRY=registry.example.com
export VERSION=v1.0.0
./scripts/deployment/deploy-production.sh kubernetes $VERSION
```

### Docker Compose Deployment

```bash
./scripts/deployment/deploy-docker-production.sh up
```

## Usage Examples

### Build and Push Images Only

```bash
export DOCKER_REGISTRY=registry.example.com
export DOCKER_USERNAME=your-username
export DOCKER_PASSWORD=your-password

./scripts/deployment/build-and-push-images.sh v1.0.0 $DOCKER_REGISTRY
```

### Deploy to Kubernetes Only

```bash
export DOCKER_REGISTRY=registry.example.com
export VERSION=v1.0.0

./scripts/deployment/deploy-kubernetes-production.sh $VERSION
```

### Manage Secrets

```bash
# Create secrets
./scripts/deployment/setup-production-secrets.sh create

# Update secrets
./scripts/deployment/setup-production-secrets.sh update

# Verify secrets
./scripts/deployment/setup-production-secrets.sh verify

# Generate secure values
./scripts/deployment/setup-production-secrets.sh generate
```

## Environment Variables

### Common Variables

- `DOCKER_REGISTRY` - Container registry URL (default: docker.io)
- `DOCKER_USERNAME` - Registry username
- `DOCKER_PASSWORD` - Registry password
- `VERSION` - Image version tag (default: latest)
- `IMAGE_PREFIX` - Image name prefix (default: reconciliation-platform)
- `KUBECTL_CONTEXT` - Kubernetes context to use
- `SKIP_SECRETS` - Skip secret creation (default: false)
- `SKIP_MIGRATIONS` - Skip database migrations (default: false)

## Script Details

### deploy-production.sh

Master script that orchestrates the entire deployment process.

**Usage:**
```bash
./scripts/deployment/deploy-production.sh [platform] [version]
```

**Platforms:**
- `kubernetes` - Deploy to Kubernetes (default)
- `docker` - Deploy using Docker Compose
- `all` - Deploy to both platforms

### build-and-push-images.sh

Builds Docker images with production optimizations and pushes to registry.

**Usage:**
```bash
./scripts/deployment/build-and-push-images.sh [version] [registry]
```

**Features:**
- Multi-stage builds with BuildKit caching
- Production optimizations
- Image verification
- Optional push confirmation

### deploy-kubernetes-production.sh

Deploys all services to Kubernetes production cluster using Kustomize.

**Usage:**
```bash
./scripts/deployment/deploy-kubernetes-production.sh [version]
```

**Features:**
- Namespace creation
- Secret management
- Image tag updates
- Rolling deployments
- Health checks
- Database migrations

### deploy-docker-production.sh

Deploys all services using Docker Compose.

**Usage:**
```bash
./scripts/deployment/deploy-docker-production.sh [action]
```

**Actions:**
- `up` - Start all services (default)
- `down` - Stop all services
- `restart` - Restart all services
- `logs` - View logs
- `status` - Show status
- `build` - Build images only

### setup-production-secrets.sh

Creates and manages Kubernetes secrets for production.

**Usage:**
```bash
./scripts/deployment/setup-production-secrets.sh [action]
```

**Actions:**
- `create` - Create new secrets (interactive)
- `update` - Update existing secrets
- `verify` - Verify secrets are set correctly
- `generate` - Generate secure random values

## Requirements

### Tools

- Docker 20.10+
- Docker Compose 2.0+ (or `docker compose`)
- kubectl 1.24+
- kustomize 4.0+ (or `kubectl kustomize`)
- openssl (for secret generation)

### Access

- Kubernetes cluster admin access
- Container registry push permissions
- Production namespace access

## Documentation

- [Production Deployment Guide](../../docs/deployment/PRODUCTION_DEPLOYMENT.md) - Comprehensive deployment guide
- [Quick Start Guide](../../docs/deployment/QUICK_START.md) - Quick reference for common tasks
- [Architecture Overview](../../docs/architecture/ARCHITECTURE.md) - System architecture

## Troubleshooting

### Common Issues

1. **Image pull errors**: Verify registry credentials and access
2. **Pod startup failures**: Check logs and resource limits
3. **Secret errors**: Verify secrets are created and not using defaults
4. **Migration failures**: Check database connectivity and permissions

See [Production Deployment Guide](../../docs/deployment/PRODUCTION_DEPLOYMENT.md#troubleshooting) for detailed troubleshooting steps.

## Security Notes

- Never commit production secrets to version control
- Use external secret management tools in production
- Rotate secrets regularly (see secret rotation schedule in secrets.yaml)
- Use TLS/HTTPS for all production traffic
- Implement network policies and RBAC

## Support

For issues or questions:
1. Check the [Production Deployment Guide](../../docs/deployment/PRODUCTION_DEPLOYMENT.md)
2. Review [Troubleshooting](../../docs/deployment/PRODUCTION_DEPLOYMENT.md#troubleshooting) section
3. Check Kubernetes and Docker logs

