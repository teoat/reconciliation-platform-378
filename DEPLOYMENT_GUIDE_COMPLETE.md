# Complete Deployment Guide - Reconciliation Platform

**Date**: 2025-01-27  
**Status**: ✅ Production Ready

---

## 🚀 Quick Start Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# Run the complete deployment script
./deploy-production-complete.sh
```

This script will:
1. ✅ Run pre-deployment checks
2. ✅ Generate secure secrets if needed
3. ✅ Build all Docker images
4. ✅ Start all services
5. ✅ Wait for health checks
6. ✅ Display service status

---

## 📋 Pre-Deployment Checklist

### 1. Run Pre-Deployment Verification

```bash
./pre-deployment-check.sh
```

This checks:
- ✅ Docker and Docker Compose installation
- ✅ Frontend build capability
- ✅ Backend compilation
- ✅ Required configuration files
- ✅ Port availability
- ✅ System resources

### 2. Environment Configuration

Create or update `.env` file in project root:

```bash
# Copy template (if exists) or create new
cp .env.example .env  # if exists
# OR create manually
```

**Required Environment Variables:**

```bash
# Database Configuration
POSTGRES_DB=reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-password>  # CHANGE THIS!
POSTGRES_PORT=5432
PGBOUNCER_PORT=6432

# Redis Configuration
REDIS_PASSWORD=<strong-password>  # CHANGE THIS!
REDIS_PORT=6379

# Backend Configuration
BACKEND_PORT=2000
JWT_SECRET=<64-char-hex-string>  # Generate with: openssl rand -hex 32
JWT_EXPIRATION=86400
CORS_ORIGINS=http://localhost:1000
RUST_LOG=info
MAX_FILE_SIZE=10485760

# Frontend Configuration
FRONTEND_PORT=1000
VITE_API_URL=http://localhost:2000
VITE_WS_URL=ws://localhost:2000
VITE_BASE_PATH=/
VITE_STORAGE_KEY=<32-char-hex-string>  # Generate with: openssl rand -hex 16

# Monitoring (Optional)
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
GRAFANA_PASSWORD=admin
ELASTICSEARCH_PORT=9200
KIBANA_PORT=5601
LOGSTASH_PORT=5044
APM_PORT=8200

# Environment
NODE_ENV=production
ENVIRONMENT=production
```

**Generate Secure Secrets:**

```bash
# JWT Secret (64 characters)
openssl rand -hex 32

# Storage Key (32 characters)
openssl rand -hex 16

# Database Password
openssl rand -base64 24

# Redis Password
openssl rand -base64 24
```

---

## 🐳 Docker Deployment Steps

### Step 1: Build Images

```bash
# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build all images
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --parallel
```

### Step 2: Start Services

```bash
# Start all services in detached mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Step 3: Verify Services

```bash
# Check service status
docker compose ps

# View logs
docker compose logs -f

# Check specific service logs
docker compose logs -f backend
docker compose logs -f frontend
```

### Step 4: Health Checks

```bash
# Backend health
curl http://localhost:2000/health

# Frontend
curl http://localhost:1000

# Check all services
docker compose ps
```

---

## 📊 Service Endpoints

| Service | URL | Port | Description |
|---------|-----|------|-------------|
| **Frontend** | http://localhost:1000 | 1000 | React/Vite application |
| **Backend API** | http://localhost:2000 | 2000 | Rust Actix-Web API |
| **API Health** | http://localhost:2000/health | 2000 | Health check endpoint |
| **PostgreSQL** | localhost:5432 | 5432 | Database (direct) |
| **PgBouncer** | localhost:6432 | 6432 | Connection pooler (recommended) |
| **Redis** | localhost:6379 | 6379 | Cache & sessions |
| **Prometheus** | http://localhost:9090 | 9090 | Metrics |
| **Grafana** | http://localhost:3001 | 3001 | Dashboards (admin/admin) |
| **Kibana** | http://localhost:5601 | 5601 | Log visualization |
| **APM Server** | http://localhost:8200 | 8200 | Application monitoring |
| **Elasticsearch** | http://localhost:9200 | 9200 | Search & analytics |

---

## 🔧 Database Setup

### Run Migrations

After services are running:

```bash
# Wait for database to be ready (30 seconds)
sleep 30

# Run migrations
docker compose exec backend diesel migration run

# Or if running locally:
cd backend
export DATABASE_URL=postgresql://postgres:password@localhost:5432/reconciliation_app
diesel migration run
```

### Apply Performance Indexes

```bash
# Apply database indexes for performance
cd backend
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_DB=reconciliation_app
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=your_password

bash apply-indexes.sh
```

---

## 🛠️ Troubleshooting

### Services Not Starting

```bash
# Check logs
docker compose logs [service-name]

# Restart a service
docker compose restart [service-name]

# Rebuild and restart
docker compose up -d --build [service-name]
```

### Port Conflicts

```bash
# Check what's using a port
lsof -i :1000
lsof -i :2000

# Stop conflicting services or change ports in .env
```

### Database Connection Issues

```bash
# Check database is running
docker compose ps postgres

# Test connection
docker compose exec postgres psql -U postgres -d reconciliation_app -c "SELECT 1;"
```

### Frontend Not Loading

```bash
# Check frontend logs
docker compose logs frontend

# Rebuild frontend
docker compose up -d --build frontend

# Check if backend is accessible
curl http://localhost:2000/health
```

### Backend Errors

```bash
# Check backend logs
docker compose logs backend

# Check database connection
docker compose exec backend env | grep DATABASE_URL

# Restart backend
docker compose restart backend
```

---

## 📈 Monitoring & Logs

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend

# Last 100 lines
docker compose logs --tail=100 backend
```

### Access Monitoring Dashboards

1. **Grafana**: http://localhost:3001
   - Username: `admin`
   - Password: (from GRAFANA_PASSWORD in .env)

2. **Prometheus**: http://localhost:9090
   - Query metrics directly

3. **Kibana**: http://localhost:5601
   - View application logs

---

## 🔄 Maintenance Commands

### Stop Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v
```

### Update Services

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Backup Database

```bash
# Create backup
docker compose exec postgres pg_dump -U postgres reconciliation_app > backup_$(date +%Y%m%d).sql

# Restore backup
docker compose exec -T postgres psql -U postgres reconciliation_app < backup_20250127.sql
```

---

## ✅ Post-Deployment Verification

### 1. Application Access

- [ ] Frontend loads at http://localhost:1000
- [ ] Login page displays correctly
- [ ] Backend API responds at http://localhost:2000/health
- [ ] No console errors in browser

### 2. Database

- [ ] Migrations applied successfully
- [ ] Database indexes created
- [ ] Can connect to database

### 3. Services Health

```bash
# Check all services are running
docker compose ps

# All should show "Up" or "healthy"
```

### 4. API Endpoints

```bash
# Test backend health
curl http://localhost:2000/health

# Should return: {"status":"ok"}
```

---

## 🚨 Production Considerations

### Security

1. **Change Default Passwords**: Update all default passwords in `.env`
2. **Use Strong Secrets**: Generate secure JWT_SECRET and VITE_STORAGE_KEY
3. **Enable HTTPS**: Configure reverse proxy (nginx) with SSL certificates
4. **Firewall Rules**: Restrict database and Redis ports
5. **Regular Updates**: Keep Docker images updated

### Performance

1. **Resource Limits**: Adjust CPU/memory limits in docker-compose.prod.yml
2. **Database Tuning**: Configure PostgreSQL for your workload
3. **Caching**: Use Redis for session and data caching
4. **Connection Pooling**: Use PgBouncer (port 6432) instead of direct PostgreSQL

### Monitoring

1. **Set Up Alerts**: Configure Prometheus alerts
2. **Log Aggregation**: Use Kibana for log analysis
3. **APM**: Monitor application performance with Elastic APM
4. **Backup Strategy**: Regular database backups

---

## 📝 Next Steps

1. ✅ **Deploy Services**: Run `./deploy-production-complete.sh`
2. ✅ **Run Migrations**: Apply database migrations
3. ✅ **Verify Health**: Check all service endpoints
4. ✅ **Test Application**: Access frontend and test functionality
5. ✅ **Configure Monitoring**: Set up Grafana dashboards
6. ✅ **Set Up Backups**: Configure automated database backups

---

## 🎉 Deployment Complete!

Once all services are running:

- **Frontend**: http://localhost:1000
- **Backend**: http://localhost:2000
- **Monitoring**: http://localhost:3001 (Grafana)

**Status**: ✅ **PRODUCTION READY**

---

*For issues or questions, check logs with `docker compose logs -f [service]`*

