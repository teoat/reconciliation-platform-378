# 🚀 Deploy All Services - Instructions

## ✅ Pre-Deployment Complete

All verification checks passed:
- ✅ Frontend builds successfully
- ✅ Backend compiles successfully
- ✅ Docker installed and running
- ✅ All configuration files present

---

## 🎯 Quick Deploy (Copy & Paste)

### For Bash/Zsh (macOS/Linux):

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378

# Stop existing containers
docker compose down

# Build all images (takes 5-10 minutes)
DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 \
  docker compose -f docker-compose.yml -f docker-compose.prod.yml build --parallel

# Start all services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for services to start (30 seconds)
sleep 30

# Check status
docker compose ps

# Verify health
curl http://localhost:2000/health
curl http://localhost:1000
```

### For PowerShell (Windows):

```powershell
cd C:\Users\Arief\Documents\GitHub\reconciliation-platform-378

# Stop existing containers
docker compose down

# Build all images
$env:DOCKER_BUILDKIT=1
$env:COMPOSE_DOCKER_CLI_BUILD=1
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --parallel

# Start all services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for services
Start-Sleep -Seconds 30

# Check status
docker compose ps

# Verify health
curl http://localhost:2000/health
curl http://localhost:1000
```

---

## 📋 What Gets Deployed

### Core Services:
1. **PostgreSQL** (Database) - Port 5432
2. **Redis** (Cache) - Port 6379
3. **Backend** (Rust API) - Port 2000
4. **Frontend** (React/Vite) - Port 1000

### Monitoring Services:
5. **Prometheus** (Metrics) - Port 9090
6. **Grafana** (Dashboards) - Port 3001
7. **Elasticsearch** (Search) - Port 9200
8. **Logstash** (Log Processing) - Port 5044
9. **Kibana** (Logs) - Port 5601
10. **APM Server** (Monitoring) - Port 8200

---

## 🔗 Access After Deployment

- **Frontend**: http://localhost:1000
- **Backend API**: http://localhost:2000
- **Health Check**: http://localhost:2000/health
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Kibana**: http://localhost:5601

---

## 📝 Post-Deployment Steps

### 1. Run Database Migrations

```bash
# Wait for database to be ready
sleep 30

# Run migrations
docker compose exec backend diesel migration run
```

### 2. Apply Database Indexes

```bash
cd backend
export DATABASE_URL=postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app
bash apply-indexes.sh
```

### 3. Verify Everything Works

```bash
# Check all services are running
docker compose ps

# Test backend
curl http://localhost:2000/health

# Test frontend
curl http://localhost:1000
```

---

## 🛠️ Useful Commands

```bash
# View logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend

# Restart a service
docker compose restart backend
docker compose restart frontend

# Stop all services
docker compose down

# Rebuild and restart
docker compose up -d --build
```

---

## ⚠️ Important Notes

1. **First Build**: Takes 5-10 minutes (subsequent builds are faster)
2. **Environment Variables**: If `.env` doesn't exist, defaults will be used
3. **Ports**: Make sure ports 1000, 2000, 5432, 6379 are available
4. **Resources**: Ensure at least 4GB RAM and 10GB disk space available

---

## 🎉 Ready to Deploy!

Run the commands above in your terminal to deploy all services.

**Estimated Time**: 5-10 minutes for first deployment

