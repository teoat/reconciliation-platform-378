# Deployment Guide - 378 Reconciliation Platform

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: January 2025

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Docker Deployment](#docker-deployment)
4. [Docker Build Optimization](#docker-build-optimization)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Health Checks](#health-checks)
8. [Service Optimization](#service-optimization)
9. [Go-Live Checklist](#go-live-checklist)
10. [Troubleshooting](#troubleshooting)
11. [Monitoring & Observability](#monitoring--observability)

---

## Quick Start

### Option 1: Docker Compose (Recommended for Development)

```bash
# Clone repository
git clone <repository-url>
cd reconciliation-platform-378

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Start all services
docker-compose up --build -d

# Verify services
docker-compose ps
```

**Access Points**:
- Frontend: http://localhost:1000
- Backend: http://localhost:2000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

### Option 2: Minimal Development Stack

For faster startup and lower resource usage:

```bash
# Start essential services only (4 services, ~700MB RAM)
docker-compose -f docker-compose.dev.yml up -d

# Check status
docker-compose -f docker-compose.dev.yml ps
```

**Services Running**: 4 (postgres, redis, backend, frontend)  
**RAM Usage**: ~700MB  
**Startup Time**: ~30-60 seconds

### Option 3: Development with Monitoring (On-Demand)

```bash
# Start essential + monitoring services
docker-compose -f docker-compose.dev.yml -f docker-compose.monitoring.yml up -d

# Access Grafana
open http://localhost:3001
# Login: admin / admin

# Access Prometheus
open http://localhost:9090
```

**Services Running**: 6  
**RAM Usage**: ~1.4GB  
**When to Use**: Performance testing, debugging metrics

---

## Prerequisites

### Required
- Docker Engine 20.10+
- Docker Compose v2.0+
- 4GB+ RAM available (8GB+ recommended for full stack)
- 10GB+ disk space

### Optional (for Production)
- Kubernetes 1.24+
- kubectl configured
- Helm 3.0+ (optional)
- Terraform (for infrastructure as code)

---

## Docker Deployment

### Step-by-Step Deployment

#### 1. Environment Configuration

Create `.env` file in project root:

```bash
# Required - Change these values!
POSTGRES_PASSWORD=your_strong_db_password
REDIS_PASSWORD=your_strong_redis_password  
JWT_SECRET=generate_with_openssl_rand_hex_32

# Optional - with defaults
POSTGRES_DB=reconciliation_app
POSTGRES_USER=postgres
BACKEND_PORT=2000
FRONTEND_PORT=1000
GRAFANA_PASSWORD=admin
```

**Generate secure secrets:**
```bash
# JWT Secret (64 characters)
openssl rand -hex 32

# Database Password
openssl rand -base64 24

# Redis Password
openssl rand -base64 24
```

#### 2. Build Images

```bash
# Build with BuildKit cache (faster rebuilds)
DOCKER_BUILDKIT=1 docker-compose build --parallel
```

#### 3. Start Services

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

#### 4. Apply Database Migrations & Indexes

```bash
# Wait for postgres to be ready (30 seconds)
sleep 30

# Apply performance indexes
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_DB=reconciliation_app
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=your_password

bash backend/apply-indexes.sh
```

#### 5. Verify Deployment

```bash
# Check backend health
curl http://localhost:2000/health

# Check frontend
curl http://localhost:1000

# Check services status
docker-compose ps
```

### Service Endpoints

| Service | URL | Default Port |
|---------|-----|--------------|
| Backend API | http://localhost:2000 | 2000 |
| Frontend | http://localhost:1000 | 1000 |
| Prometheus | http://localhost:9090 | 9090 |
| Grafana | http://localhost:3001 | 3001 |

**Default Credentials:**
- Grafana: `admin` / `admin` (change via `GRAFANA_PASSWORD` in .env)

### Common Operations

#### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

#### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

#### Stop Services

```bash
# Stop (keeps data volumes)
docker-compose stop

# Stop and remove containers (keeps volumes)
docker-compose down

# Stop and remove everything including volumes (⚠️ DESTROYS DATA)
docker-compose down -v
```

#### Update Services

```bash
# Pull latest images (if using pre-built)
docker-compose pull

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

#### Access Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d reconciliation_app

# Or from host
psql -h localhost -p 5432 -U postgres -d reconciliation_app
```

#### Access Redis

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli -a $REDIS_PASSWORD
```

### Resource Limits

Services are configured with resource limits:

| Service | CPU Limit | Memory Limit |
|---------|-----------|--------------|
| Backend | 1.0 core | 1GB |
| Frontend | 1.0 core | 1GB |
| Postgres | 2.0 cores | 2GB |
| Redis | Default | 512MB |

Adjust in `docker-compose.yml` if needed.

### Data Persistence

Data is stored in Docker volumes:

- `postgres_data`: Database data
- `redis_data`: Redis persistence
- `uploads_data`: File uploads
- `logs_data`: Application logs
- `prometheus_data`: Prometheus metrics
- `grafana_data`: Grafana dashboards

**Backup volumes:**
```bash
docker run --rm -v reconciliation-platform_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

---

## Docker Build Optimization

### Optimization Strategies

#### 1. Multi-Stage Builds

**Benefits:**
- Smaller final images (only runtime dependencies)
- Better layer caching
- Faster builds with cached dependencies

**Implementation:**
- Stage 1: Install/cache dependencies only
- Stage 2: Build application
- Stage 3: Runtime image (minimal)

#### 2. Dependency Caching

**Backend (Rust):**
```dockerfile
# Cache dependencies separately
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src
# Now copy actual source
COPY src ./src
RUN cargo build --release
```

**Frontend (Node.js):**
```dockerfile
# Cache npm dependencies
COPY package*.json ./
RUN npm ci --only=production
# Now copy source
COPY . .
RUN npm run build
```

#### 3. Binary Optimization

**Backend:**
- Strip debug symbols: `strip target/release/reconciliation-backend`
- Reduces binary size by ~30%

**Frontend:**
- Remove source maps: `find dist -name '*.map' -delete`
- Production-only dependencies
- Tree shaking via Vite

#### 4. Minimal Base Images

**Before:**
- Backend: `rust:1.90-bookworm` (1.5GB)
- Frontend: `node:18` (900MB)

**After:**
- Backend: `debian:bookworm-slim` (~120MB)
- Frontend: `nginx:1.27-alpine` (~40MB)

### Build Comparison

| Component | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Backend Image | ~1.8GB | ~180MB | -90% |
| Frontend Image | ~1.2GB | ~60MB | -95% |
| Total Size | 3.0GB | 240MB | -92% |
| Build Time | ~13min | ~8min | -38% |
| Layers | 27 | 18 | -33% |

### Build Commands

```bash
# Production Build (Optimized)
docker-compose -f docker-compose.optimized.yml build --parallel

# Start services
docker-compose -f docker-compose.optimized.yml up -d

# Use BuildKit
export DOCKER_BUILDKIT=1
docker-compose build
```

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

### Rolling Updates

```bash
# Update deployment
kubectl set image deployment/reconciliation-platform \
  frontend=reconciliation-platform-frontend:v1.0.1 \
  backend=reconciliation-platform-backend:v1.0.1

# Monitor rollout
kubectl rollout status deployment/reconciliation-platform

# Rollback if needed
kubectl rollout undo deployment/reconciliation-platform
```

### Scaling

```bash
# Scale deployment
kubectl scale deployment reconciliation-platform --replicas=5

# Auto-scaling (requires HPA)
kubectl apply -f k8s/hpa.yaml
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

### Security Hardening

1. ✅ Generate strong secrets (32+ characters)
2. ✅ Enable SSL/TLS
3. ✅ Configure CORS origins
4. ✅ Set up rate limiting
5. ✅ Enable audit logging

### Production Security

1. **Environment Variables**:
   - All secrets must be environment variables
   - No hardcoded credentials
   - Use secret management (AWS Secrets Manager, etc.)

2. **Database**:
   - Enable SSL connections
   - Use connection pooling
   - Regular backups

3. **API Security**:
   - JWT token expiration
   - Rate limiting
   - Input validation

4. **Network**:
   - Use HTTPS only
   - Configure CORS properly
   - Firewall rules

---

## Health Checks

### Backend Health Endpoints

- `GET /health` - Basic health check
- `GET /api/system/status` - System status
- `GET /api/monitoring/health` - Detailed health metrics
- `GET /health/live` - Liveness endpoint
- `GET /health/ready` - Readiness endpoint

### Frontend Health

- `GET /health` - Frontend health check
- `GET /api/health` - API connectivity check

### Docker Health Status

```bash
# Docker health status
docker-compose ps

# Manual health checks
curl http://localhost:2000/health
curl http://localhost:2000/api/health
```

---

## Service Optimization

### Service Recommendations

#### Essential Services (Always Active)

| Service | Container | Port | RAM | Status |
|---------|-----------|------|-----|--------|
| postgres | reconciliation-postgres-dev | 5432 | ~200MB | ✅ Active |
| redis | reconciliation-redis-dev | 6379 | ~50MB | ✅ Active |
| backend | reconciliation-backend-dev | 2000 | ~300MB | ✅ Active |
| frontend | reconciliation-frontend-dev | 1000 | ~150MB | ✅ Active |

**Total**: 4 services, ~700MB RAM

#### Optional Services (On-Demand)

| Service | Container | Port | RAM | Recommendation |
|---------|-----------|------|-----|----------------|
| pgbouncer | reconciliation-pgbouncer | 6432 | ~20MB | ❌ Inactive (dev) |
| prometheus | reconciliation-prometheus | 9090 | ~500MB | ⚠️ On-demand |
| grafana | reconciliation-grafana | 3001 | ~200MB | ⚠️ On-demand |
| logstash-exporter | reconciliation-logstash-exporter | 9198 | ~50MB | ❌ Inactive |
| elasticsearch | reconciliation-elasticsearch | 9200 | ~1GB+ | ❌ Inactive |
| logstash | reconciliation-logstash | 5044, 9600 | ~400MB | ❌ Inactive |
| kibana | reconciliation-kibana | 5601 | ~300MB | ❌ Inactive |
| apm-server | reconciliation-apm-server | 8200 | ~200MB | ❌ Inactive |

**Total**: 8 services, ~2.8GB RAM savings

### Resource Savings

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| **Services** | 12 | 4 | 67% reduction |
| **RAM Usage** | ~3.5GB | ~700MB | 80% reduction |
| **Startup Time** | ~2-3 min | ~30-60 sec | 50-75% faster |
| **CPU Usage** | High | Low | Significant reduction |

### When to Use Full Stack

Use the full `docker-compose.yml` when:
- **Production deployment**: All services needed
- **Performance testing**: Full monitoring stack required
- **Log analysis**: ELK stack needed for centralized logging
- **APM requirements**: Application performance monitoring needed

### When to Use Minimal Stack

Use `docker-compose.dev.yml` when:
- **Daily development**: Faster startup, lower resource usage
- **Local testing**: Essential services only
- **CI/CD pipelines**: Faster builds and tests
- **Resource-constrained environments**: Limited RAM/CPU

---

## Go-Live Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Security secrets generated and stored securely
- [ ] SSL/TLS certificates configured
- [ ] CORS origins configured
- [ ] Rate limiting configured
- [ ] Backup strategy in place
- [ ] Monitoring and alerting configured
- [ ] Health checks verified
- [ ] Load testing completed

### Deployment

- [ ] All services started successfully
- [ ] Database connections verified
- [ ] Redis connections verified
- [ ] Health endpoints responding
- [ ] API endpoints functional
- [ ] Frontend accessible
- [ ] WebSocket connections working
- [ ] File uploads working
- [ ] Authentication flow tested

### Post-Deployment

- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] Database connections active
- [ ] Redis cache working
- [ ] WebSocket connections established
- [ ] Monitoring dashboards visible
- [ ] Logs being collected
- [ ] Alerts configured
- [ ] Performance metrics baseline established

### Performance Testing

```bash
# Load testing
ab -n 1000 -c 10 http://localhost:2000/health

# API testing
curl http://localhost:2000/api/v1/health
```

---

## Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs

# Check if ports are in use
netstat -tulpn | grep -E ':(2000|1000|5432|6379)'

# Restart Docker daemon (if needed)
sudo systemctl restart docker
```

### Database connection issues

```bash
# Verify postgres is healthy
docker-compose ps postgres
docker-compose logs postgres

# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:password@postgres:5432/dbname
```

### Redis connection issues

```bash
# Verify redis is healthy
docker-compose exec redis redis-cli -a $REDIS_PASSWORD ping

# Check REDIS_URL format
echo $REDIS_URL
# Should be: redis://:password@redis:6379
```

### Build failures

```bash
# Clear Docker build cache
docker builder prune -a

# Rebuild without cache
docker-compose build --no-cache --pull
```

### Permission issues

```bash
# Fix volume permissions
sudo chown -R $USER:$USER $(docker volume inspect reconciliation-platform_uploads_data | jq -r '.[0].Mountpoint')
```

### Port conflicts

```bash
# Check port usage
lsof -i :1000  # Frontend
lsof -i :2000  # Backend

# Kill process if needed
kill -9 <PID>
```

### Build Failures

```bash
# Clean build
cd frontend && npm run build:clean
cd backend && cargo clean && cargo build
```

---

## Monitoring & Observability

### Prometheus Metrics

- Available at: `/metrics`
- Endpoints: Request count, latency, errors

### Grafana Dashboards

- Pre-configured dashboards available
- Access: http://localhost:3001 (default: admin/admin)

### Health Checks

- Frontend: `GET /`
- Backend: `GET /health`
- Database: Connection check
- Redis: PING check

### Backup & Recovery

#### Database Backups

```bash
# Create backup
pg_dump -h localhost -U postgres reconciliation_app > backup.sql

# Restore backup
psql -h localhost -U postgres reconciliation_app < backup.sql
```

#### Application State

- Redis snapshots configured
- File uploads stored in persistent volume
- Export functionality available

---

## Security Notes

⚠️ **Important for Production:**

1. **Change all default passwords** in `.env`
2. **Use strong JWT_SECRET** (64+ characters, random)
3. **Restrict CORS_ORIGINS** to your actual domains
4. **Use secrets manager** in production (AWS Secrets Manager, etc.)
5. **Enable HTTPS** via reverse proxy (nginx/traefik)
6. **Firewall rules**: Only expose necessary ports

---

## Performance Optimization

The deployment uses:
- ✅ Multi-stage Docker builds (smaller images)
- ✅ BuildKit cache mounts (faster rebuilds)
- ✅ Optimized base images (Alpine Linux)
- ✅ Database connection pooling
- ✅ Redis caching layer
- ✅ Resource limits to prevent OOM

---

## Next Steps After Deployment

1. **Apply performance indexes** (if not automated)
2. **Set up monitoring alerts** in Grafana
3. **Configure backup schedule** (if enabled)
4. **Set up reverse proxy** for HTTPS
5. **Configure logging aggregation** (if needed)

---

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review health endpoints
- Verify environment variables
- Check Docker resources (RAM/CPU)

---

**Deployment Complete! 🎉**


