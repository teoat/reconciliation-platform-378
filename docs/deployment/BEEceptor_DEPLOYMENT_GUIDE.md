# Beeceptor Deployment Guide

**Last Updated**: January 2025  
**Status**: Ready for Deployment - SSOT  
**Beeceptor URL**: https://378to492.free.beeceptor.com  
**Version**: 2.0.0

---

## Overview

This guide walks you through deploying the Reconciliation Platform with Beeceptor webhook integration. All webhook notifications will be sent to your Beeceptor endpoint for testing and monitoring. This guide consolidates setup and deployment instructions into a single source of truth.

---

## ✅ Pre-Deployment Checklist

- [x] Beeceptor webhook URL configured: `https://378to492.free.beeceptor.com`
- [x] `.env` file configured with `WEBHOOK_URL`
- [x] AlertManager configuration updated
- [x] Production monitoring configuration updated
- [ ] Docker Desktop installed and running
- [ ] Environment variables set (auto-generated if missing)

---

## 🚀 Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
# Start Docker Desktop manually first, then run:
./scripts/setup-and-deploy-beeceptor.sh
```

### Option 2: Step-by-Step Manual Deployment

```bash
# 1. Start Docker Desktop
# Open Docker Desktop application and wait for it to start

# 2. Configure Beeceptor (already done, but can re-run)
./scripts/configure-beeceptor.sh

# 3. Deploy with Beeceptor
./scripts/deploy-beeceptor.sh
```

---

## 📋 Detailed Steps

### Step 1: Start Docker Desktop

1. Open Docker Desktop application
2. Wait for Docker to fully start (whale icon in menu bar should be steady)
3. Verify Docker is running:
   ```bash
   docker info
   ```

### Step 2: Verify Beeceptor Configuration

The Beeceptor webhook is already configured. Verify:

```bash
# Check .env file
grep WEBHOOK_URL .env

# Should show:
# WEBHOOK_URL=https://378to492.free.beeceptor.com
```

### Step 3: Run Deployment

```bash
# This script will:
# - Set up all environment variables (auto-generate secrets if needed)
# - Build Docker images
# - Start all services
# - Run database migrations
# - Perform health checks
./scripts/setup-and-deploy-beeceptor.sh
```

---

## 🔧 Environment Variables

The deployment script automatically sets up required environment variables:

| Variable | Auto-Generated | Default/Generated Value |
|----------|----------------|------------------------|
| `POSTGRES_DB` | ✅ | `reconciliation_app` |
| `POSTGRES_USER` | ✅ | `postgres` |
| `POSTGRES_PASSWORD` | ✅ | Random 25-char password |
| `DATABASE_URL` | ✅ | Built from above values |
| `JWT_SECRET` | ✅ | Random base64 string |
| `CSRF_SECRET` | ✅ | Random base64 string |
| `WEBHOOK_URL` | ✅ | `https://378to492.free.beeceptor.com` |
| `ENVIRONMENT` | ✅ | `staging` |

**Note**: All generated values are saved to `.env` file.

---

## 📡 Webhook Configuration

### Beeceptor Endpoint
- **URL**: https://378to492.free.beeceptor.com
- **Dashboard**: https://beeceptor.com/dashboard
- **Purpose**: Receive and monitor webhook notifications

### Configured Webhooks
1. **AlertManager Webhooks** - All monitoring alerts
2. **Production Monitoring** - System health alerts
3. **Application Events** - Business logic alerts

### Testing Webhooks

```bash
# Test Beeceptor endpoint
curl https://378to492.free.beeceptor.com

# Send test webhook (from application)
curl -X POST https://378to492.free.beeceptor.com \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook", "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'
```

---

## 🌐 Service Endpoints

After deployment, services will be available at:

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:2000 | Main API endpoint |
| Health Check | http://localhost:2000/api/health | Health status |
| Metrics | http://localhost:2000/api/metrics/summary | Performance metrics |
| Database | localhost:5432 | PostgreSQL (if exposed) |
| Redis | localhost:6379 | Redis cache (if exposed) |

---

## ✅ Verification

### 1. Check Service Status

```bash
# View all services
docker-compose ps

# Check specific service logs
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### 2. Health Checks

```bash
# Backend health
curl http://localhost:2000/api/health

# Expected response: {"status":"healthy",...}
```

### 3. Test Webhook

```bash
# Test Beeceptor endpoint
curl https://378to492.free.beeceptor.com

# Check Beeceptor dashboard for incoming requests
# Visit: https://beeceptor.com/dashboard
```

---

## 🔍 Troubleshooting

### Docker Not Starting

**Problem**: Docker Desktop won't start or takes too long

**Solutions**:
1. Check Docker Desktop is installed: `/Applications/Docker.app`
2. Restart Docker Desktop manually
3. Check system resources (Docker needs sufficient memory)
4. Try: `killall Docker && open -a Docker`

### Database Connection Issues

**Problem**: Services can't connect to database

**Solutions**:
```bash
# Check database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify DATABASE_URL in .env
grep DATABASE_URL .env
```

### Webhook Not Receiving Requests

**Problem**: Beeceptor not receiving webhooks

**Solutions**:
1. Verify WEBHOOK_URL in `.env`:
   ```bash
   grep WEBHOOK_URL .env
   ```

2. Check AlertManager configuration:
   ```bash
   grep -A 2 "webhook_configs" infrastructure/monitoring/alertmanager.yml
   ```

3. Test endpoint manually:
   ```bash
   curl -X POST https://378to492.free.beeceptor.com \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

4. Check Beeceptor dashboard: https://beeceptor.com/dashboard

### Build Failures

**Problem**: Docker build fails

**Solutions**:
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check for specific error
docker-compose build 2>&1 | tail -50
```

---

## 📊 Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Check Metrics

```bash
# API metrics
curl http://localhost:2000/api/metrics/summary

# Health status
curl http://localhost:2000/api/health
```

### Monitor Webhooks

1. Visit Beeceptor dashboard: https://beeceptor.com/dashboard
2. Select your endpoint: `378to492`
3. View incoming webhook requests in real-time

---

## 🛠️ Useful Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Rebuild and restart
docker-compose up -d --build

# Clean everything (WARNING: removes data)
docker-compose down -v
```

---

## 🔄 Re-deployment

To re-deploy with updated configuration:

```bash
# Stop existing services
docker-compose down

# Update configuration (if needed)
./scripts/configure-beeceptor.sh

# Re-deploy
./scripts/setup-and-deploy-beeceptor.sh
```

---

## 📝 Next Steps

After successful deployment:

1. **Verify Services**: Check all endpoints are responding
2. **Monitor Webhooks**: Watch Beeceptor dashboard for incoming requests
3. **Test Functionality**: Run integration tests
4. **Review Logs**: Check for any warnings or errors
5. **Performance**: Monitor metrics endpoint for performance data

---

## 📚 Related Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - General deployment procedures
- [Environment Variables](../deployment/ENVIRONMENT_VARIABLES.md) - Complete environment variable reference
- [Production Testing Guide](../project-management/PHASE_7_PRODUCTION_TESTING_GUIDE.md) - Production testing procedures

---

## 🆘 Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify configuration: `grep WEBHOOK_URL .env`
3. Test endpoints: `curl http://localhost:2000/api/health`
4. Review this guide's troubleshooting section

---

**Deployment Status**: ✅ Configuration Complete | ⏳ Waiting for Docker

**Last Updated**: November 27, 2025

