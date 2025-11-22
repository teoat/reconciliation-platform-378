# 🚀 Deployment Quick Start Guide

## Quick Deploy (One Command)

```bash
./deploy-all.sh
```

This will:
- ✅ Check all prerequisites
- ✅ Create Docker network if needed
- ✅ Build all Docker images
- ✅ Start all services
- ✅ Run database migrations
- ✅ Verify deployment

## Deployment Options

### Basic Deployment (Development)
```bash
./deploy-all.sh dev
```

### Production Deployment
```bash
./deploy-all.sh production
```

### With Options
```bash
# Skip tests
./deploy-all.sh --skip-tests

# Skip migrations
./deploy-all.sh --skip-migrations

# Rebuild all images from scratch
./deploy-all.sh --rebuild

# Combine options
./deploy-all.sh production --rebuild --skip-tests
```

## What Gets Deployed

### Core Services
- **PostgreSQL** - Database (Port 5432)
- **Redis** - Cache (Port 6379)
- **Backend** - Rust API (Port 2000)
- **Frontend** - React/Vite (Port 1000)

### Monitoring & Logging
- **Prometheus** - Metrics (Port 9090)
- **Grafana** - Dashboards (Port 3001)
- **Elasticsearch** - Search/Logs (Port 9200)
- **Logstash** - Log Processing (Port 5044)
- **Kibana** - Log Visualization (Port 5601)
- **APM Server** - Application Monitoring (Port 8200)

## Access URLs

After deployment, access services at:

- **Frontend**: http://localhost:1000
- **Backend API**: http://localhost:2000
- **Health Check**: http://localhost:2000/health
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Kibana**: http://localhost:5601

## Useful Commands

```bash
# View all service logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend

# Check service status
docker compose ps

# Restart a service
docker compose restart backend

# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

## Troubleshooting

### Services Not Starting
```bash
# Check logs
docker compose logs backend
docker compose logs frontend

# Check if ports are in use
lsof -i :1000
lsof -i :2000
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker compose exec postgres pg_isready -U postgres

# Check database connection from backend
docker compose exec backend env | grep DATABASE_URL
```

### Rebuild Everything
```bash
# Stop and remove everything
docker compose down -v

# Rebuild from scratch
./deploy-all.sh --rebuild
```

## Manual Steps (if needed)

### Run Migrations Manually
```bash
docker compose exec backend diesel migration run
```

### Check Service Health
```bash
# Backend
curl http://localhost:2000/health

# Frontend
curl http://localhost:1000

# Database
docker compose exec postgres pg_isready -U postgres
```

## Environment Variables

The script automatically creates a `.env` file if it doesn't exist. To customize:

1. Edit `.env` file
2. Key variables:
   - `POSTGRES_PASSWORD` - Database password
   - `JWT_SECRET` - JWT signing secret
   - `CORS_ORIGINS` - Allowed CORS origins
   - Port configurations

## First Time Deployment

First deployment takes **5-10 minutes** because:
- Docker images need to be built
- Dependencies need to be downloaded
- Services need to initialize

Subsequent deployments are much faster (1-2 minutes) due to Docker layer caching.

## Next Steps

1. ✅ Deploy services: `./deploy-all.sh`
2. ✅ Verify services are running: `docker compose ps`
3. ✅ Access frontend: http://localhost:1000
4. ✅ Check health: http://localhost:2000/health

## Need Help?

- Check logs: `docker compose logs -f [service]`
- View service status: `docker compose ps`
- Restart services: `docker compose restart`


