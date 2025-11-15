# Docker Deployment Guide

**Deployment Method**: Docker Compose Only  
**Status**: ✅ Production Ready  
**Last Updated**: January 2025

---

## Quick Start

```bash
# 1. Set up environment variables
cp config/production.env.example .env
# Edit .env with your actual values

# 2. Deploy all services
./deploy.sh

# Or manually:
docker-compose build
docker-compose up -d
```

---

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- 4GB+ RAM available
- 10GB+ disk space

---

## Step-by-Step Deployment

### 1. Environment Configuration

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

### 2. Build Images

```bash
# Build with BuildKit cache (faster rebuilds)
DOCKER_BUILDKIT=1 docker-compose build --parallel
```

### 3. Start Services

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Apply Database Migrations & Indexes

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

### 5. Verify Deployment

```bash
# Check backend health
curl http://localhost:2000/health

# Check frontend
curl http://localhost:1000

# Check services status
docker-compose ps
```

---

## Service Endpoints

| Service | URL | Default Port |
|---------|-----|--------------|
| Backend API | http://localhost:2000 | 2000 |
| Frontend | http://localhost:1000 | 1000 |
| Prometheus | http://localhost:9090 | 9090 |
| Grafana | http://localhost:3001 | 3001 |

**Default Credentials:**
- Grafana: `admin` / `admin` (change via `GRAFANA_PASSWORD` in .env)

---

## Common Operations

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stop Services

```bash
# Stop (keeps data volumes)
docker-compose stop

# Stop and remove containers (keeps volumes)
docker-compose down

# Stop and remove everything including volumes (⚠️ DESTROYS DATA)
docker-compose down -v
```

### Update Services

```bash
# Pull latest images (if using pre-built)
docker-compose pull

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

### Access Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d reconciliation_app

# Or from host
psql -h localhost -p 5432 -U postgres -d reconciliation_app
```

### Access Redis

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli -a $REDIS_PASSWORD
```

---

## Resource Limits

Services are configured with resource limits:

| Service | CPU Limit | Memory Limit |
|---------|-----------|--------------|
| Backend | 1.0 core | 1GB |
| Frontend | 1.0 core | 1GB |
| Postgres | 2.0 cores | 2GB |
| Redis | Default | 512MB |

Adjust in `docker-compose.yml` if needed.

---

## Data Persistence

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

---

## Health Checks

All services include health checks. Check status:

```bash
# Docker health status
docker-compose ps

# Manual health checks
curl http://localhost:2000/health
curl http://localhost:2000/api/health
```

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

