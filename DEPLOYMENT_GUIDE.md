# Deployment Guide
## 378 Reconciliation Platform

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: January 2025

---

## 🚀 Quick Deployment Options

### **Option 1: Docker Compose (Recommended for Development)**

**Prerequisites**:
- Docker Engine 20.10+
- Docker Compose v2.0+
- 4GB+ RAM available
- 10GB+ disk space

#### Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd 378

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# 3. Deploy all services
./deploy.sh

# Or manually:
docker-compose build
docker-compose up -d

# 4. Verify services
docker-compose ps
```

**Service Endpoints**:

| Service | URL | Default Port |
|---------|-----|--------------|
| Backend API | http://localhost:2000 | 2000 |
| Frontend | http://localhost:1000 | 1000 |
| Prometheus | http://localhost:9090 | 9090 |
| Grafana | http://localhost:3001 | 3001 |

**Default Credentials**:
- Grafana: `admin` / `admin` (change via `GRAFANA_PASSWORD` in .env)

#### Step-by-Step Docker Deployment

**1. Environment Configuration**

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

**2. Build Images**

```bash
# Build with BuildKit cache (faster rebuilds)
DOCKER_BUILDKIT=1 docker-compose build --parallel
```

**3. Start Services**

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**4. Apply Database Migrations & Indexes**

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

**5. Verify Deployment**

```bash
# Check backend health
curl http://localhost:2000/health

# Check frontend
curl http://localhost:1000

# Check services status
docker-compose ps
```

#### Common Docker Operations

**View Logs**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

**Restart Services**
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

**Stop Services**
```bash
# Stop (keeps data volumes)
docker-compose stop

# Stop and remove containers (keeps volumes)
docker-compose down

# Stop and remove everything including volumes (⚠️ DESTROYS DATA)
docker-compose down -v
```

**Update Services**
```bash
# Pull latest images (if using pre-built)
docker-compose pull

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

**Access Database**
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d reconciliation_app

# Or from host
psql -h localhost -p 5432 -U postgres -d reconciliation_app
```

**Access Redis**
```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli -a $REDIS_PASSWORD
```

#### Resource Limits

Services are configured with resource limits:

| Service | CPU Limit | Memory Limit |
|---------|-----------|--------------|
| Backend | 1.0 core | 1GB |
| Frontend | 1.0 core | 1GB |
| Postgres | 2.0 cores | 2GB |
| Redis | Default | 512MB |

Adjust in `docker-compose.yml` if needed.

#### Data Persistence

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

#### Docker-Specific Troubleshooting

**Services won't start**
```bash
# Check logs
docker-compose logs

# Check if ports are in use
netstat -tulpn | grep -E ':(2000|1000|5432|6379)'

# Restart Docker daemon (if needed)
sudo systemctl restart docker
```

**Database connection issues**
```bash
# Verify postgres is healthy
docker-compose ps postgres
docker-compose logs postgres

# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:password@postgres:5432/dbname
```

**Redis connection issues**
```bash
# Verify redis is healthy
docker-compose exec redis redis-cli -a $REDIS_PASSWORD ping

# Check REDIS_URL format
echo $REDIS_URL
# Should be: redis://:password@redis:6379
```

**Build failures**
```bash
# Clear Docker build cache
docker builder prune -a

# Rebuild without cache
docker-compose build --no-cache --pull
```

**Permission issues**
```bash
# Fix volume permissions
sudo chown -R $USER:$USER $(docker volume inspect reconciliation-platform_uploads_data | jq -r '.[0].Mountpoint')
```

**Health Checks**
```bash
# Docker health status
docker-compose ps

# Manual health checks
curl http://localhost:2000/health
curl http://localhost:2000/api/health
```

**Security Notes for Docker Deployment**

⚠️ **Important for Production:**

1. **Change all default passwords** in `.env`
2. **Use strong JWT_SECRET** (64+ characters, random)
3. **Restrict CORS_ORIGINS** to your actual domains
4. **Use secrets manager** in production (AWS Secrets Manager, etc.)
5. **Enable HTTPS** via reverse proxy (nginx/traefik)
6. **Firewall rules**: Only expose necessary ports

**Performance Optimization**

The deployment uses:
- ✅ Multi-stage Docker builds (smaller images)
- ✅ BuildKit cache mounts (faster rebuilds)
- ✅ Optimized base images (Alpine Linux)
- ✅ Database connection pooling
- ✅ Redis caching layer
- ✅ Resource limits to prevent OOM

---

### **Option 2: Kubernetes (Production)**

```bash
# Apply all Kubernetes manifests
kubectl apply -f k8s/

# Verify deployment
kubectl get deployments
kubectl get services
kubectl get pods

# Check ingress
kubectl get ingress
```

**Required Files**:
- `k8s/deployment.yaml` - Application deployment
- `k8s/service.yaml` - Service definition
- `k8s/configmap.yaml` - Configuration
- `k8s/ingress.yaml` - Ingress configuration

---

### **Option 3: Terraform (Infrastructure as Code)**

```bash
cd terraform

# Initialize Terraform
terraform init

# Review plan
terraform plan

# Apply infrastructure
terraform apply

# Get outputs
terraform output
```

**Required Files**:
- `terraform/main.tf` - Main infrastructure
- `terraform/variables.tf` - Variable definitions
- `terraform/outputs.tf` - Output values

---

## 📋 Pre-Deployment Checklist

### **Environment Variables**

Create `.env` file with:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/reconciliation_app

# Security
JWT_SECRET=your-secret-key-minimum-32-characters
CSRF_SECRET=your-csrf-secret-minimum-32-characters

# Redis
REDIS_URL=redis://host:6379

# Application
NODE_ENV=production
VITE_API_URL=https://api.example.com/api/v1
VITE_WS_URL=wss://api.example.com
```

### **Database Setup**

```bash
# Run migrations
cd backend
diesel migration run

# Verify database
psql -h localhost -U postgres -d reconciliation_app -c "\dt"
```

### **Security Hardening**

1. ✅ Generate strong secrets (32+ characters)
2. ✅ Enable SSL/TLS
3. ✅ Configure CORS origins
4. ✅ Set up rate limiting
5. ✅ Enable audit logging

---

## 🔒 Production Security

### **Required Configurations**

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

## 📊 Monitoring & Observability

### **Prometheus Metrics**

- Available at: `/metrics`
- Endpoints: Request count, latency, errors

### **Grafana Dashboards**

- Pre-configured dashboards available
- Access: http://localhost:3001 (default: admin/admin)

### **Health Checks**

- Frontend: `GET /`
- Backend: `GET /health`
- Database: Connection check
- Redis: PING check

---

## 🔄 Rolling Updates

### **Kubernetes Rolling Update**

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

### **Docker Compose Update**

```bash
# Pull latest images
docker-compose pull

# Restart services
docker-compose up -d

# Verify
docker-compose ps
```

---

## 🚨 Troubleshooting

### **Common Issues**

1. **Database Connection Failed**
   ```bash
   # Check database status
   docker ps | grep postgres
   
   # Test connection
   psql -h localhost -U postgres -d reconciliation_app
   ```

2. **Redis Connection Failed**
   ```bash
   # Check Redis status
   docker ps | grep redis
   
   # Test connection
   redis-cli -h localhost -p 6379 PING
   ```

3. **Port Conflicts**
   ```bash
   # Check port usage
   lsof -i :1000  # Frontend
   lsof -i :2000  # Backend
   
   # Kill process if needed
   kill -9 <PID>
   ```

4. **Build Failures**
   ```bash
   # Clean build
   cd frontend && npm run build:clean
   cd backend && cargo clean && cargo build
   ```

---

## 📈 Scaling

### **Horizontal Scaling**

```bash
# Scale deployment
kubectl scale deployment reconciliation-platform --replicas=5

# Auto-scaling (requires HPA)
kubectl apply -f k8s/hpa.yaml
```

### **Database Scaling**

- Connection pooling configured
- Read replicas for read-heavy workloads
- Partitioning for large datasets

---

## 🔙 Backup & Recovery

### **Database Backups**

```bash
# Create backup
pg_dump -h localhost -U postgres reconciliation_app > backup.sql

# Restore backup
psql -h localhost -U postgres reconciliation_app < backup.sql
```

### **Application State**

- Redis snapshots configured
- File uploads stored in persistent volume
- Export functionality available

---

## 📝 Post-Deployment

### **Verification Steps**

1. ✅ Health checks passing
2. ✅ API endpoints responding
3. ✅ Database connections active
4. ✅ Redis cache working
5. ✅ WebSocket connections established
6. ✅ Monitoring dashboards visible

### **Performance Testing**

```bash
# Load testing
ab -n 1000 -c 10 http://localhost:2000/health

# API testing
curl http://localhost:2000/api/v1/health
```

---

## 🔗 Additional Resources

## 12. Operations & Maintenance
- Daily/weekly/monthly routines: health review, log rotation, security patching, capacity planning, and disaster-recovery drills.
- Monitoring stack: Prometheus scrapes backend metrics at `/metrics`; Grafana dashboards cover application, infrastructure, and business KPIs; Alertmanager drives escalation.
- Backups: PostgreSQL and Redis snapshots automated via CronJobs; verify restores quarterly.
- Maintenance tooling: `kubectl rollout restart`, `docker compose up -d --build`, and `helm upgrade` support zero-downtime updates.
- Security posture: rotate secrets, enforce RBAC, keep fail2ban/network policies aligned with compliance requirements.

For detailed operational procedures, see `docs/TROUBLESHOOTING.md`, `docs/SUPPORT_MAINTENANCE_GUIDE.md`, and `docs/INCIDENT_RESPONSE_RUNBOOKS.md`.
