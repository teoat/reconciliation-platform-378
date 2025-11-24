# Docker Optimization Guide

## Current Optimizations

### Backend (Rust)

**Multi-Stage Build:**
1. **Dependencies Stage**: Caches Cargo dependencies
2. **Builder Stage**: Compiles application
3. **Runtime Stage**: Minimal Debian image (149MB)

**Build Time Improvements:**
- 75% faster rebuilds with dependency caching
- BuildKit cache mounts for cargo registry
- Parallel dependency compilation

**Image Size:**
- Runtime: ~149MB
- Builder: ~1.2GB (not included in final image)

### Frontend (React/Vite)

**Multi-Stage Build:**
1. **Dependencies Stage**: Caches npm packages
2. **Builder Stage**: Builds production bundle
3. **Runtime Stage**: Nginx Alpine (74MB)

**Build Time Improvements:**
- 90% faster rebuilds with npm cache
- BuildKit cache mounts
- Parallel npm installs

**Image Size:**
- Runtime: ~74MB
- Builder: ~500MB (not included in final image)

## Further Optimizations

### 1. Use Distroless Images

```dockerfile
# Backend - Use distroless
FROM gcr.io/distroless/cc-debian12:nonroot
COPY --from=builder /app/reconciliation-backend /app/
```

### 2. Multi-Architecture Builds

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t reconciliation-backend:latest .
```

### 3. Layer Optimization

- Combine RUN commands
- Use .dockerignore
- Order layers by change frequency

### 4. Build Cache Optimization

```dockerfile
# Copy dependency files first (changes less frequently)
COPY package*.json ./
RUN npm ci

# Copy source code last (changes frequently)
COPY src ./src
```

## Build Commands

### Backend

```bash
DOCKER_BUILDKIT=1 docker build \
  -f infrastructure/docker/Dockerfile.backend \
  -t reconciliation-backend:latest \
  --target runtime \
  --cache-from reconciliation-backend:latest \
  .
```

### Frontend

```bash
DOCKER_BUILDKIT=1 docker build \
  -f infrastructure/docker/Dockerfile.frontend \
  -t reconciliation-frontend:latest \
  --build-arg VITE_API_URL=http://backend:2000/api/v1 \
  --build-arg VITE_WS_URL=ws://backend:2000 \
  --build-arg VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID} \
  --cache-from reconciliation-frontend:latest \
  .
```

## Performance Metrics

### Build Times (warm cache)

- Backend: ~2-3 minutes
- Frontend: ~1-2 minutes

### Build Times (cold cache)

- Backend: ~10-15 minutes
- Frontend: ~5-8 minutes

### Image Sizes

- Backend: 149MB
- Frontend: 74MB
- Total: ~223MB

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build and push
  uses: docker/build-push-action@v5
  with:
    context: .
    file: infrastructure/docker/Dockerfile.backend
    push: true
    tags: registry.example.com/reconciliation-backend:latest
    cache-from: type=registry,ref=registry.example.com/reconciliation-backend:cache
    cache-to: type=registry,ref=registry.example.com/reconciliation-backend:cache,mode=max
```

