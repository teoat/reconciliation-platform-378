# Deployment Guide

**Last Updated**: November 26, 2025  
**Status**: Production Ready

## Overview

This guide covers deployment procedures for the Reconciliation Platform, including staging and production deployments with comprehensive validation.

## Prerequisites

- Docker and Docker Compose installed
- Database migrations script available
- Required environment variables set
- Deployment validation script available

## Quick Start

### Staging Deployment

```bash
# Deploy to staging
./scripts/deploy-staging.sh

# Validate deployment
./scripts/validate-deployment.sh

# Monitor deployment
./scripts/monitor-deployment.sh
```

### Production Deployment

```bash
# Set production environment
export ENVIRONMENT=production
export API_BASE_URL=https://api.example.com

# Deploy to production
./scripts/deploy-production.sh

# Validate deployment
API_BASE_URL=https://api.example.com ./scripts/validate-deployment.sh
```

## Deployment Steps

### 1. Pre-Deployment

#### Verify Environment
```bash
# Check environment variables
env | grep -E "(ENVIRONMENT|DATABASE_URL|JWT_SECRET|CSRF_SECRET)"

# Verify Docker
docker --version
docker-compose --version
```

#### Run Database Migrations
```bash
# Migrations run automatically on startup in production
# Or run manually:
./scripts/execute-migrations.sh
```

### 2. Staging Deployment

#### Deploy Services
```bash
# Build and start services
docker-compose -f docker-compose.staging.yml up -d --build

# Check service status
docker-compose -f docker-compose.staging.yml ps
```

#### Validate Deployment
```bash
# Run validation script
API_BASE_URL=http://localhost:2000 ./scripts/validate-deployment.sh
```

#### Monitor Services
```bash
# Check logs
docker-compose -f docker-compose.staging.yml logs -f backend

# Monitor metrics
curl http://localhost:2000/api/metrics/summary
```

### 3. Production Deployment

#### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Database migrations tested
- [ ] Secrets configured
- [ ] Backup created
- [ ] Rollback plan ready

#### Deploy Services
```bash
# Set production environment
export ENVIRONMENT=production

# Deploy
./scripts/deploy-production.sh
```

#### Post-Deployment Validation
```bash
# Health check
curl https://api.example.com/api/health

# Metrics check
curl https://api.example.com/api/metrics/summary

# Full validation
API_BASE_URL=https://api.example.com ./scripts/validate-deployment.sh
```

## Monitoring

### Health Endpoints

- **Health Check**: `GET /api/health`
- **Metrics Health**: `GET /api/metrics/health`
- **Resilience Metrics**: `GET /api/health/resilience`

### Metrics Endpoints

- **All Metrics**: `GET /api/metrics`
- **Metrics Summary**: `GET /api/metrics/summary`
- **Specific Metric**: `GET /api/metrics/{metric_name}`

### Monitoring Script

```bash
# Continuous monitoring
./scripts/monitor-deployment.sh

# With custom API URL
API_BASE_URL=https://api.example.com ./scripts/monitor-deployment.sh

# With custom interval (seconds)
MONITOR_INTERVAL=60 ./scripts/monitor-deployment.sh
```

## Validation

### Automated Validation

The deployment validation script checks:
- Health endpoints
- Metrics endpoints
- Database migration status
- Service availability

```bash
# Run validation
./scripts/validate-deployment.sh

# With custom API URL
API_BASE_URL=https://api.example.com ./scripts/validate-deployment.sh
```

### Manual Validation

```bash
# Health check
curl http://localhost:2000/api/health

# Metrics summary
curl http://localhost:2000/api/metrics/summary

# Specific metric
curl http://localhost:2000/api/metrics/cqrs_command_total
```

## Rollback Procedure

### Quick Rollback

```bash
# Stop current services
docker-compose down

# Restore previous version
docker-compose -f docker-compose.previous.yml up -d

# Verify rollback
./scripts/validate-deployment.sh
```

### Database Rollback

```bash
# Rollback migrations (if needed)
cd backend
diesel migration revert
```

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker-compose logs backend

# Check service status
docker-compose ps

# Restart services
docker-compose restart
```

### Database Connection Issues

```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql "$DATABASE_URL" -c "SELECT 1"
```

### Metrics Not Available

```bash
# Check metrics service
curl http://localhost:2000/api/metrics/health

# Check service logs
docker-compose logs backend | grep metrics
```

## Environment Variables

### Required for Production

```bash
ENVIRONMENT=production
DATABASE_URL=postgres://...
JWT_SECRET=<32+ character secret>
CSRF_SECRET=<32+ character secret>
PASSWORD_MASTER_KEY=<32+ character secret>
```

### Optional

```bash
ZERO_TRUST_REQUIRE_MTLS=true  # Enable mTLS
REDIS_URL=redis://...
API_BASE_URL=https://api.example.com
```

## Security Checklist

- [ ] All secrets set and validated
- [ ] Zero-trust enabled in production
- [ ] Rate limiting configured
- [ ] Database migrations verified
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CORS properly configured

## Performance Checklist

- [ ] Cache warming enabled
- [ ] Query optimization indexes created
- [ ] Bundle size verified (<500KB)
- [ ] Database connection pooling configured
- [ ] Rate limits configured appropriately

## Related Documentation

- [New Features API](../api/NEW_FEATURES_API.md)
- [CQRS Architecture](../architecture/CQRS_AND_EVENT_DRIVEN_ARCHITECTURE.md)
- [Security Hardening](../security/SECURITY_HARDENING_CHECKLIST.md)
