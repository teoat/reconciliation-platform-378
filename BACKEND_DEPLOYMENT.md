# Backend Docker Compose Deployment Guide

**Last Updated**: January 2025  
**Status**: Production Ready ✅

---

## Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
# Run the deployment script
./deploy-backend.sh
```

This script will:
- ✅ Check Docker and Docker Compose
- ✅ Create/verify `.env` file
- ✅ Build the backend Docker image
- ✅ Start backend, postgres, and redis services
- ✅ Wait for health checks
- ✅ Show deployment status

### Option 2: Manual Docker Compose

```bash
# Using backend-only compose file
docker compose -f docker-compose.backend.yml up -d --build

# Or using main compose file (includes all services)
docker compose up -d backend
```

---

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- 2GB+ RAM available
- 5GB+ disk space

---

## Environment Configuration

The deployment script will create a `.env` file if it doesn't exist. For production, you should customize these values:

```bash
# Database Configuration
POSTGRES_DB=reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_strong_password_here
POSTGRES_PORT=5432

# Redis Configuration
REDIS_PASSWORD=your_strong_redis_password
REDIS_PORT=6379

# Backend Configuration
BACKEND_PORT=2000
HOST=0.0.0.0
PORT=2000

# Security (REQUIRED - Change in production!)
JWT_SECRET=generate_with_openssl_rand_hex_32
JWT_EXPIRATION=86400

# CORS
CORS_ORIGINS=http://localhost:1000,http://localhost:3000

# Logging
RUST_LOG=info
LOG_FORMAT=json

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads

# Environment
ENVIRONMENT=production
```

### Generate Secure Secrets

```bash
# JWT Secret (64 characters)
openssl rand -hex 32

# Database Password
openssl rand -base64 24

# Redis Password
openssl rand -base64 24
```

---

## Deployment Options

### Backend-Only Deployment

Uses `docker-compose.backend.yml` which includes only:
- Backend service
- PostgreSQL database
- Redis cache

```bash
docker compose -f docker-compose.backend.yml up -d --build
```

### Full Stack Deployment

Uses main `docker-compose.yml` which includes all services:
- Backend
- Frontend
- PostgreSQL
- Redis
- Monitoring (Prometheus, Grafana)
- Logging (Elasticsearch, Logstash, Kibana)
- APM Server

```bash
docker compose up -d backend
```

---

## Service Endpoints

After deployment, the backend will be available at:

| Service | URL | Port |
|---------|-----|------|
| Backend API | http://localhost:2000 | 2000 |
| Health Check | http://localhost:2000/api/health | 2000 |
| Metrics | http://localhost:2000/metrics | 2000 |
| PostgreSQL | localhost:5432 | 5432 |
| Redis | localhost:6379 | 6379 |

---

## Health Checks

### Check Backend Health

```bash
curl http://localhost:2000/api/health
```

### Check Container Status

```bash
# Using backend-only compose
docker compose -f docker-compose.backend.yml ps

# Using main compose
docker compose ps backend
```

### View Logs

```bash
# Backend logs
docker compose -f docker-compose.backend.yml logs -f backend

# All services
docker compose -f docker-compose.backend.yml logs -f
```

---

## Common Operations

### Stop Services

```bash
# Stop all backend services
docker compose -f docker-compose.backend.yml stop

# Stop only backend
docker compose -f docker-compose.backend.yml stop backend
```

### Restart Services

```bash
# Restart backend
docker compose -f docker-compose.backend.yml restart backend

# Restart all
docker compose -f docker-compose.backend.yml restart
```

### Remove Services

```bash
# Stop and remove containers (keeps volumes)
docker compose -f docker-compose.backend.yml down

# Remove containers and volumes
docker compose -f docker-compose.backend.yml down -v
```

### Rebuild Backend

```bash
# Rebuild backend image
docker compose -f docker-compose.backend.yml build --no-cache backend

# Rebuild and restart
docker compose -f docker-compose.backend.yml up -d --build backend
```

---

## Troubleshooting

### Backend Won't Start

1. **Check Docker is running:**
   ```bash
   docker info
   ```

2. **Check logs:**
   ```bash
   docker compose -f docker-compose.backend.yml logs backend
   ```

3. **Verify environment variables:**
   ```bash
   docker compose -f docker-compose.backend.yml config
   ```

4. **Check database connection:**
   ```bash
   docker compose -f docker-compose.backend.yml exec postgres psql -U postgres -d reconciliation_app -c "SELECT 1;"
   ```

### Health Check Failing

1. **Wait longer** - Backend may need 40+ seconds to start
2. **Check port conflicts:**
   ```bash
   lsof -i :2000
   ```
3. **Verify backend is running:**
   ```bash
   docker compose -f docker-compose.backend.yml ps backend
   ```

### Database Connection Issues

1. **Check PostgreSQL is healthy:**
   ```bash
   docker compose -f docker-compose.backend.yml exec postgres pg_isready -U postgres
   ```

2. **Verify DATABASE_URL in .env matches container settings**

3. **Check network connectivity:**
   ```bash
   docker compose -f docker-compose.backend.yml exec backend ping postgres
   ```

### Build Failures

1. **Clear Docker build cache:**
   ```bash
   docker builder prune
   ```

2. **Rebuild without cache:**
   ```bash
   docker compose -f docker-compose.backend.yml build --no-cache backend
   ```

3. **Check disk space:**
   ```bash
   df -h
   docker system df
   ```

---

## Production Deployment

For production, use the production compose override:

```bash
# Build with production settings
docker compose -f docker-compose.yml -f docker-compose.prod.yml build backend

# Start with production settings
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend
```

Production settings include:
- Resource limits
- Optimized logging
- Production environment variables
- Enhanced health checks

---

## Next Steps

After backend deployment:

1. **Run database migrations:**
   ```bash
   docker compose -f docker-compose.backend.yml exec backend /app/reconciliation-backend migrate
   ```

2. **Verify API endpoints:**
   ```bash
   curl http://localhost:2000/api/health
   ```

3. **Check metrics:**
   ```bash
   curl http://localhost:2000/metrics
   ```

---

## Support

For issues or questions:
- Check logs: `docker compose -f docker-compose.backend.yml logs -f`
- Review health: `curl http://localhost:2000/api/health`
- Check container status: `docker compose -f docker-compose.backend.yml ps`

