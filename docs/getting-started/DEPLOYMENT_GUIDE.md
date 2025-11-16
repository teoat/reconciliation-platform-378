# Deployment Guide
## 378 Reconciliation Platform

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: January 2025

---

## 🚀 Quick Deployment Options

### **Option 1: Docker Compose (Recommended for Development)**

```bash
# Clone repository
git clone <repository-url>
cd 378

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
