# Production Deployment Guide
## Agent 2: Deployment & Frontend Optimization

**Status**: ✅ Production Ready  
**Last Updated**: January 2025

---

## 📋 Overview

This guide covers production deployment for the 378 Reconciliation Platform. The deployment uses Docker Compose with separate configurations for development and production environments.

---

## 🎯 Prerequisites

- Docker Engine 20.10+ 
- Docker Compose 2.0+
- Production server with minimum 8GB RAM
- Domain name with DNS configured
- SSL certificate (Let's Encrypt recommended)

---

## 📦 Deployment Components

### Core Services
- **Backend**: Rust/Actix-web API server (Port 2000)
- **Frontend**: React/Vite application (Port 1000)
- **PostgreSQL**: Database (Port 5432)
- **Redis**: Cache and session storage (Port 6379)

### Monitoring Services
- **Prometheus**: Metrics collection (Port 9090)
- **Grafana**: Visualization dashboard (Port 3000)

---

## 🚀 Deployment Steps

### 1. Environment Configuration

#### Backend Environment
```bash
# Copy template file
cp backend/.env.production.template backend/.env.production

# Edit and fill in values
nano backend/.env.production
```

**Critical Variables to Set**:
- Modified: `JWT_SECRET` - Generate a strong random secret
- Modified: `DB_PASSWORD` - Strong database password
- Modified: `REDIS_PASSWORD` - Redis password
- Modified: `SENTRY_DSN` - Error tracking URL
- Optional: Analytics tokens

#### Frontend Environment
```bash
# Copy template file
cp frontend/.env.production.template frontend/.env.production

# Edit and fill in values
nano frontend/.env.production
```

**Critical Variables to Set**:
- Modified: `VITE_API_URL` - Production API URL
- Modified: `VITE_WS_URL` - Production WebSocket URL
- Optional: Analytics IDs

### 2. SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificate location:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

#### Option B: Self-Signed (Testing Only)
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

### 3. Deploy with Docker Compose

```bash
# Pull latest images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### 4. Verify Deployment

#### Health Checks
```bash
# Backend health
curl http://localhost:2000/health

# Frontend health
curl http://localhost:1000

# Readiness check
curl http://localhost:2000/api/ready
```

Expected Response:
```json
{
  "status": "ready",
  "services": {
    "database": { "status": "ready", "type": "postgresql" },
    "redis": { "status": "ready", "type": "redis" },
    "sentry": { "status": "enabled" }
  },
  "timestamp": "2025-01-XX...",
  "uptime": "running"
}
```

#### Test API Endpoints
```bash
# Test authentication
curl -X POST http://localhost:2000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 🏥 Health Check Endpoints

### Backend Health Checks

#### `/api/health`
Comprehensive health check with dependency monitoring.

**Response Codes**:
- `200 OK`: All services healthy
- `202 Accepted`: Degraded (some services down but operational)
- `503 Service Unavailable`: Critical services down

**Response**:
```json
{
  "status": "ok",
  "message": "378 Reconciliation Platform Backend is running",
  "timestamp": "2025-01-XX...",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "connected",
      "type": "postgresql"
    },
    "redis": {
      "status": "connected",
      "type": "redis"
    }
  },
  "database_pool": {
    "size": 20,
    "idle": 5,
    "active": 2
  }
}
```

#### `/api/ready`
Kubernetes readiness probe endpoint.

**Response Codes**:
- `200 OK`: Ready to accept traffic
- `503 Service Unavailable`: Not ready

#### `/api/metrics`
Prometheus metrics endpoint.

---

## 📊 Monitoring Setup

### Prometheus Configuration

Prometheus is pre-configured in the production deployment. Access it at:
- **URL**: http://localhost:9090
- **Config**: `infrastructure/monitoring/prometheus.yml`

### Grafana Dashboard

1. Access Grafana: http://localhost:3000
2. Login with credentials from environment variables
3. Default password: `admin` (change on first login)
4. Import pre-configured dashboards from `infrastructure/monitoring/grafana/dashboards/`

### Key Metrics to Monitor

- **Application**: Request rate, response time, error rate
- **Database**: Connection pool usage, query performance
- **Redis**: Memory usage, hit rate
- **Infrastructure**: CPU, memory, disk usage

---

## 🔧 Troubleshooting

### Backend Not Starting
```bash
# Check backend logs
docker-compose logs backend

# Verify database connection
docker-compose exec backend curl http://localhost:2000/health
```

### Frontend Not Loading
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build frontend --no-cache
```

### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready

# View database logs
docker-compose logs postgres
```

### Redis Connection Issues
```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# Expected response: PONG
```

---

## 🔄 Updates and Rollbacks

### Updating Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Verify deployment
curl http://localhost:2000/health
```

### Rolling Back
```bash
# Stop current version
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Checkout previous version
git checkout <previous-commit>

# Restart with previous version
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 🔒 Security Best Practices

1. **Change Default Secrets**: All `CHANGE_ME` values must be updated
2. **SSL/TLS**: Always use HTTPS in production
3. **Firewall**: Only expose necessary ports (80, 443)
4. **Regular Updates**: Keep Docker images updated
5. **Monitoring**: Enable Sentry error tracking
6. **Backups**: Configure automated database backups

---

## 📈 Performance Optimization

### Production Build
```bash
# Frontend production build
cd frontend
npm run build

# Build size optimization already configured in vite.config.ts
```

### Database Optimization
- Connection pooling: Configured (20 max connections)
- Query caching: Redis enabled
- Indexes: Already optimized

### Caching Strategy
- **Redis**: Session storage and query caching
- **Browser**: Static assets cached for 1 year
- **API**: Response caching with TTL of 1 hour

---

## 📝 Deployment Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Docker images built
- [ ] Health checks passing
- [ ] Database migrations run
- [ ] Monitoring configured
- [ ] Backups configured
- [ ] Load testing completed
- [ ] Documentation updated

---

## 🆘 Support

For deployment issues, contact:
- Technical Lead: [Name]
- DevOps Team: [Contact]
- Emergency Hotline: [Number]

---

**Deployment Guide Version**: 1.0  
**Last Updated**: January 2025

