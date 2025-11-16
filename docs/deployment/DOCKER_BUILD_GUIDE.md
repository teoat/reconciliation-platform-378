# 🐳 Docker Build Optimization Guide

## Quick Start

### Production Build (Optimized)
```bash
# Build all services
docker-compose -f docker-compose.optimized.yml build --parallel

# Start services
docker-compose -f docker-compose.optimized.yml up -d

# View logs
docker-compose -f docker-compose.optimized.yml logs -f
```

## Build Optimizations Applied

### 1. **Multi-Stage Builds**
- Separate build and runtime stages
- Smaller final images
- Better security (build tools not in production)

### 2. **Layer Caching**
- Copy dependency files first
- Use cache mounts for npm/cargo
- Build dependencies before source code

### 3. **Build Cache Strategy**
```bash
# Reuse cached layers
docker-compose build --parallel

# Force rebuild
docker-compose build --no-cache
```

### 4. **Resource Limits**
- CPU and memory limits per service
- Prevents resource exhaustion
- Better multi-service coordination

### 5. **Health Checks**
- All services have health checks
- Proper startup sequencing
- Automatic recovery

## Build Commands

### Backend Only
```bash
cd backend
docker build -f Dockerfile.backend -t reconciliation-backend .
```

### Frontend Only
```bash
cd frontend
docker build -f Dockerfile.frontend -t reconciliation-frontend .
```

### Full Stack
```bash
docker-compose -f docker-compose.optimized.yml build
```

## Performance Tips

1. **Use BuildKit** (Enabled in newer Docker)
```bash
export DOCKER_BUILDKIT=1
docker-compose build
```

2. **Parallel Builds**
```bash
docker-compose build --parallel
```

3. **Cache Mounts**
Already enabled in Dockerfiles for npm and cargo

4. **Build Arguments**
```bash
docker build --build-arg NODE_VERSION=18 -t frontend .
```

## Image Sizes

Expected sizes after optimization:
- **Backend**: ~50-70MB
- **Frontend**: ~30-40MB
- **Total**: ~100MB (vs 500MB+ without optimization)

## Troubleshooting

### Build Fails with "no space left"
```bash
docker system prune -a --volumes
```

### Slow builds
```bash
# Ensure BuildKit is enabled
Sync DOCKER_BUILDKIT=1

# Use cache mounts
Already in Dockerfiles
```

### Port conflicts
```bash
# Check what's using ports
lsof -i :5432
lsof -i :6379
lsof -i :2000
lsof -i :1000
```

## Environment Variables

Create `.env` file:
```env
POSTGRES_PASSWORD=secure_password_here
JWT_SECRET=your_jwt_secret
CORS_ORIGINS=http://localhost:1000
```

## Access

- **Frontend**: http://localhost:1000
- **Backend**: http://localhost:2000
- **Database**: localhost:5432
- **Redis**: localhost:6379

## Monitoring

```bash
# Check running containers
docker-compose ps

# View resource usage
docker stats

# Check logs
docker-compose logs -f [service-name]
```

## Security

✅ Non-root users in containers
✅ Minimal base images (alpine)
✅ No build tools in production
✅ Secrets via environment variables
✅ Health checks enabled

