# 🐳 Backend Build Commands

**Date**: 2025-01-27  
**Purpose**: Commands for building the Rust backend with Docker Compose

---

## 🚀 Quick Start

### Standard Build
```bash
# Build backend only
docker-compose -f docker-compose.backend.yml build backend

# Or use the build script
./build-backend.sh
```

### Multi-Stage Build (Recommended)
```bash
# Enable BuildKit for optimized multi-stage builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build with multi-stage optimization
docker-compose -f docker-compose.backend.yml build backend

# Or use the build script
./build-backend.sh --multi
```

---

## 📋 Build Options

### 1. Standard Compose Build
```bash
# Build backend service only
docker-compose -f docker-compose.backend.yml build backend

# Build with no cache (fresh build)
docker-compose -f docker-compose.backend.yml build --no-cache backend
```

### 2. Multi-Stage Build with BuildKit
```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build with multi-stage optimization
docker-compose -f docker-compose.backend.yml build backend
```

### 3. Production Build
```bash
# Production build with optimizations
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

docker-compose -f docker-compose.base.yml -f docker-compose.prod.yml build \
  --build-arg BUILD_MODE=release \
  --build-arg RUSTFLAGS="-C target-cpu=native" \
  backend
```

### 4. Using Build Script
```bash
# Standard build
./build-backend.sh

# Multi-stage build
./build-backend.sh --multi

# Production build
./build-backend.sh --prod

# Build without cache
./build-backend.sh --no-cache

# Combine options
./build-backend.sh --multi --no-cache
```

---

## 🔧 Build Details

### Dockerfile Structure
The backend uses a **3-stage multi-stage build**:

1. **Dependency Cache Stage** (`deps`)
   - Builds only dependencies
   - Uses BuildKit cache mounts
   - Only rebuilds when `Cargo.toml`/`Cargo.lock` change

2. **Application Builder Stage** (`builder`)
   - Builds the application with cached dependencies
   - Strips binary for smaller size
   - Uses BuildKit cache mounts for faster rebuilds

3. **Runtime Stage** (`runtime`)
   - Minimal Debian slim image (149MB)
   - Only contains the binary and runtime dependencies
   - Non-root user for security

### BuildKit Cache Mounts
- `/usr/local/cargo/registry` - Cargo package registry
- `/usr/local/cargo/git` - Git dependencies
- `/app/backend/target` - Build artifacts

**Benefits**:
- 75% faster rebuilds when only source code changes
- Dependencies cached separately from application code
- Smaller final image size

---

## 📊 Build Performance

### First Build
- **Time**: ~10-15 minutes (downloads dependencies)
- **Image Size**: ~149MB (runtime) + ~2GB (build layers)

### Subsequent Builds (Source Changes Only)
- **Time**: ~2-5 minutes (with BuildKit cache)
- **Cache Hit**: Dependencies cached, only app rebuilds

### Rebuilds (No Cache)
- **Time**: ~10-15 minutes
- **Use Case**: When dependencies change

---

## 🎯 Build Targets

### Development Build
```bash
docker-compose -f docker-compose.backend.yml build backend
```

### Production Build
```bash
docker-compose -f docker-compose.base.yml -f docker-compose.prod.yml build \
  --build-arg BUILD_MODE=release \
  --build-arg RUSTFLAGS="-C target-cpu=native" \
  backend
```

**Production Optimizations**:
- `opt-level = 3` (maximum optimization)
- `lto = true` (link-time optimization)
- `codegen-units = 1` (better optimization)
- `strip = true` (strip debug symbols)
- `target-cpu=native` (CPU-specific optimizations)

---

## 🔍 Verification

### Check Build Status
```bash
# List built images
docker images | grep reconciliation-backend

# Inspect image
docker inspect reconciliation-backend

# Check image size
docker images reconciliation-backend --format "{{.Size}}"
```

### Test Build
```bash
# Build and start
docker-compose -f docker-compose.backend.yml up -d --build

# Check logs
docker-compose -f docker-compose.backend.yml logs -f backend

# Health check
curl http://localhost:2000/api/health
```

---

## 🐛 Troubleshooting

### Build Fails with "BuildKit required"
```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

### Build is Slow
```bash
# Ensure BuildKit is enabled
export DOCKER_BUILDKIT=1

# Use cache mounts (automatic with BuildKit)
# Check Docker version (requires 18.09+)
docker --version
```

### Out of Memory During Build
```bash
# Increase Docker memory limit
# Docker Desktop: Settings > Resources > Memory
# Minimum recommended: 4GB
```

### Cache Not Working
```bash
# Clear build cache and rebuild
docker builder prune
docker-compose -f docker-compose.backend.yml build backend
```

---

## 📝 Environment Variables

### Build-Time Variables
- `BUILD_MODE`: `debug` (default) or `release`
- `RUSTFLAGS`: Rust compiler flags (e.g., `-C target-cpu=native`)

### Runtime Variables
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `RUST_LOG`: Log level (e.g., `info`, `warn`)
- `PORT`: Server port (default: 2000)

---

## 🚀 Quick Commands Reference

```bash
# Standard build
docker-compose -f docker-compose.backend.yml build backend

# Multi-stage build (BuildKit)
DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 \
  docker-compose -f docker-compose.backend.yml build backend

# Production build
DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 \
  docker-compose -f docker-compose.base.yml -f docker-compose.prod.yml build \
  --build-arg BUILD_MODE=release backend

# Build and start
docker-compose -f docker-compose.backend.yml up -d --build

# View logs
docker-compose -f docker-compose.backend.yml logs -f backend

# Stop and remove
docker-compose -f docker-compose.backend.yml down
```

---

**Last Updated**: 2025-01-27  
**Dockerfile**: `infrastructure/docker/Dockerfile.backend`  
**Status**: ✅ Production Ready

