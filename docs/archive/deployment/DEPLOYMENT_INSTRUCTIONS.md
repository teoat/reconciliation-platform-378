# 🚀 Quick Start Deployment Instructions
## 378 Reconciliation Platform

**Date**: January 2025
**Status**: Ready to Deploy

---

## ⚡ QUICK START GUIDE

### **Prerequisites Check**
Before starting, ensure you have:
- ✅ Docker installed (we saw version 28.5.1 is installed)
- ✅ Docker daemon running
- ✅ Git repository cloned
- ✅ Required ports available (5432, 6379, 2000, 1000, 9090, 3000)

---

## 🐳 **START DOCKER DAEMON**

### **On macOS** (You're on macOS)
```bash
# Start Docker Desktop
open -a Docker

# Wait for Docker to start (check status)
docker info
```

### **Alternative: Command Line**
```bash
# Check if Docker daemon is running
docker info

# If not running, start it (requires Docker Desktop or Docker Engine)
```

---

## 📦 **DEPLOYMENT OPTIONS**

### **Option 1: Development Deployment (Recommended for Testing)**

#### **Step 1: Start Docker**
```bash
# Ensure Docker is running
docker info
```

#### **Step 2: Deploy Services**
```bash
# Navigate to project directory
cd /Users/Arief/Desktop/378

# Start all services
docker compose up -d

# Or with specific compose file
docker compose -f docker-compose.yml up -d
```

#### **Step 3: Check Status**
```bash
# View all running containers
docker compose ps

# View logs
docker compose logs -f

# Check specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f database
docker compose logs -f redis
```

#### **Step 4: Verify Services**
```bash
# Backend health check
curl http://localhost:2000/health

# Frontend check
curl http://localhost:1000

# Database connection
docker compose exec database psql -U reconciliation_user -d reconciliation_app -c "SELECT version();"

# Redis connection
docker compose exec redis redis-cli ping
```

---

### **Option 2: Production Deployment**

#### **Step 1: Set Environment Variables**
```bash
# Copy example environment file
cp config/production.env .env

# Edit with your production values
# nano .env
```

#### **Step 2: Deploy Production Services**
```bash
# Deploy using production compose file
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d

# Or use the production script
./scripts/deploy-production.sh deploy
```

---

### **Option 3: Kubernetes Deployment**

```bash
# Create namespace
kubectl create namespace reconciliation

# Apply all manifests
kubectl apply -f infrastructure/kubernetes/production-deployment.yaml

# Check deployment status
kubectl get all -n reconciliation

# View logs
kubectl logs -f deployment/backend -n reconciliation
```

---

## 🧪 **VERIFICATION TESTS**

### **1. Service Health Checks**
```bash
# Test backend
curl -X GET http://localhost:2000/health

# Test frontend
curl -X GET http://localhost:1000

# Test database
docker compose exec database pg_isready -U reconciliation_user

# Test redis
docker compose exec redis redis-cli ping
```

### **2. API Endpoint Tests**
```bash
# Register user
curl -X POST http://localhost:2000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "first_name": "Test",
    "last_name": "User"
  }'

# Login
curl -X POST http://localhost:2000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

### **3. Monitoring Dashboard**
```bash
# Access Grafana (if deployed)
open http://localhost:3000

# Access Prometheus
open http://localhost:9090
```

---

## 📊 **MONITORING & LOGS**

### **View Logs**
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f database

# Last 100 lines
docker compose logs --tail=100 backend
```

### **Check Resource Usage**
```bash
# Container stats
docker stats

# Service status
docker compose ps

# Disk usage
docker system df
```

---

## 🔧 **TROUBLESHOOTING**

### **Docker Daemon Not Running**
```bash
# Start Docker Desktop
open -a Docker

# Or check if Docker service is running
sudo launchctl list | grep docker
```

### **Port Already in Use**
```bash
# Check what's using the port
lsof -i :2000
lsof -i :1000

# Kill the process using the port (replace PID)
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### **Services Won't Start**
```bash
# Check logs
docker compose logs

# Rebuild containers
docker compose down
docker compose up -d --build

# Remove volumes and restart
docker compose down -v
docker compose up -d
```

### **Database Connection Issues**
```bash
# Check database is running
docker compose ps database

# Check database logs
docker compose logs database

# Restart database
docker compose restart database

# Connect to database
docker compose exec database psql -U reconciliation_user -d reconciliation_app
```

---

## 🛑 **STOPPING SERVICES**

```bash
# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Stop specific service
docker compose stop backend
```

---

## 📈 **NEXT STEPS AFTER DEPLOYMENT**

1. ✅ Verify all services are running
2. ✅ Test API endpoints
3. ✅ Access frontend at http://localhost:1000
4. ✅ Monitor logs for any errors
5. ✅ Check resource usage
6. ✅ Test user registration and login
7. ✅ Test reconciliation workflows
8. ✅ Set up monitoring dashboards

---

## 🎯 **EXPECTED RESULTS**

After successful deployment, you should see:

```
✅ Database: Running on port 5432
✅ Redis: Running on port 6379
✅ Backend: Running on port 2000
✅ Frontend: Running on port 1000
✅ Monitoring: Running on port 9090 (Prometheus), 3000 (Grafana)
```

---

## 📞 **SUPPORT**

If you encounter issues:
1. Check the logs: `docker compose logs`
2. Verify Docker is running: `docker info`
3. Check port availability: `lsof -i :PORT`
4. Review documentation in `docs/` directory
5. Check troubleshooting guide in `docs/TROUBLESHOOTING.md`

---

**Last Updated**: January 2025
**Version**: 1.0

