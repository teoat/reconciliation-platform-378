# Deployment Next Steps - Complete Guide

**Date**: 2025-01-XX  
**Status**: ✅ Ready for Execution  
**Purpose**: Step-by-step guide for staging and production deployment

---

## 📋 Overview

This guide provides complete instructions for deploying the Reconciliation Platform to staging and production environments. All scripts and configurations are ready for execution.

---

## ✅ Prerequisites

### 1. Environment Setup
- [x] Kubernetes cluster configured
- [x] `kubectl` installed and configured
- [x] Docker installed and running
- [x] Access to container registry (if using)

### 2. Configuration Files
- [x] `config/production.env.example` - Template exists
- [x] `k8s/optimized/base/secrets.yaml` - Template exists
- [x] Deployment scripts created and executable

### 3. Secrets Preparation
- [ ] Generate strong secrets (see below)
- [ ] Update `k8s/optimized/base/secrets.yaml`
- [ ] Update `config/production.env` (for Docker deployments)

---

## 🔐 Step 1: Generate and Configure Secrets

### Generate Secrets

```bash
# JWT Secret (64 characters)
openssl rand -hex 32

# CSRF Secret (64 characters)
openssl rand -hex 32

# Password Master Key (64 characters)
openssl rand -hex 32

# Database Password (32 characters)
openssl rand -hex 16

# Redis Password (32 characters)
openssl rand -hex 16
```

### Update Kubernetes Secrets

1. **Edit secrets file**:
   ```bash
   vi k8s/optimized/base/secrets.yaml
   ```

2. **Replace all `CHANGE_ME` placeholders** with generated secrets

3. **Base64 encode secrets** (if using `data:` instead of `stringData:`):
   ```bash
   echo -n "your-secret-value" | base64
   ```

4. **Apply secrets**:
   ```bash
   kubectl apply -f k8s/optimized/base/secrets.yaml
   ```

### Update Environment File (Docker Deployments)

1. **Copy template**:
   ```bash
   cp config/production.env.example config/production.env
   ```

2. **Edit and update**:
   ```bash
   vi config/production.env
   ```

3. **Replace all `CHANGE_ME` placeholders** with actual values

4. **⚠️ NEVER commit `config/production.env` to version control**

---

## 🧪 Step 2: Deploy to Staging

### Quick Deploy

```bash
# Deploy to staging
./scripts/deploy-staging.sh v1.0.0
```

### Manual Steps

1. **Pre-deployment checks**:
   ```bash
   # Verify cluster access
   kubectl cluster-info
   
   # Check namespace
   kubectl get namespace reconciliation-staging
   ```

2. **Build images**:
   ```bash
   docker build -f infrastructure/docker/Dockerfile.backend \
       -t reconciliation-backend:staging \
       --target runtime backend/
   
   docker build -f infrastructure/docker/Dockerfile.frontend \
       -t reconciliation-frontend:staging \
       --target runtime frontend/
   ```

3. **Deploy to Kubernetes**:
   ```bash
   kubectl apply -f infrastructure/kubernetes/staging-deployment.yaml
   ```

4. **Run migrations**:
   ```bash
   kubectl exec -n reconciliation-staging \
       deployment/reconciliation-backend -- \
       diesel migration run
   ```

5. **Verify deployment**:
   ```bash
   kubectl get pods -n reconciliation-staging
   kubectl get services -n reconciliation-staging
   ```

6. **Run smoke tests**:
   ```bash
   ./scripts/smoke-tests.sh staging https://staging.example.com
   ```

### Staging Verification Checklist

- [ ] All pods are running
- [ ] Health endpoint responds
- [ ] Database migrations completed
- [ ] Smoke tests pass
- [ ] No errors in logs
- [ ] Frontend accessible
- [ ] API endpoints working

---

## 🚀 Step 3: Deploy to Production

### ⚠️ CRITICAL: Pre-Production Checklist

Before deploying to production, verify:

- [ ] Staging deployment successful and stable
- [ ] All smoke tests pass in staging
- [ ] No critical bugs in staging
- [ ] Database backup created
- [ ] Rollback plan prepared
- [ ] Team notified of deployment
- [ ] Monitoring dashboards ready

### Production Deployment

```bash
# Deploy to production (requires confirmation)
./scripts/deploy-production.sh v1.0.0
```

The script will:
1. Run safety checks
2. Request confirmation (type 'DEPLOY' to proceed)
3. Create backup
4. Build production images
5. Deploy to Kubernetes
6. Run migrations
7. Run smoke tests

### Manual Production Deployment

If you prefer manual control:

1. **Create backup**:
   ```bash
   ./scripts/backup-postgresql.sh production
   ./scripts/backup-redis.sh production
   ```

2. **Build production images**:
   ```bash
   docker build -f infrastructure/docker/Dockerfile.backend \
       -t reconciliation-backend:v1.0.0 \
       -t reconciliation-backend:latest \
       --target runtime \
       --build-arg BUILD_MODE=release \
       backend/
   
   docker build -f infrastructure/docker/Dockerfile.frontend \
       -t reconciliation-frontend:v1.0.0 \
       -t reconciliation-frontend:latest \
       --target runtime \
       --build-arg NODE_ENV=production \
       frontend/
   ```

3. **Deploy with rolling update**:
   ```bash
   kubectl set image deployment/reconciliation-backend \
       reconciliation-backend=reconciliation-backend:v1.0.0 \
       -n reconciliation-platform
   
   kubectl rollout status deployment/reconciliation-backend \
       -n reconciliation-platform --timeout=10m
   ```

4. **Run migrations**:
   ```bash
   kubectl exec -n reconciliation-platform \
       deployment/reconciliation-backend -- \
       diesel migration run
   ```

5. **Verify deployment**:
   ```bash
   ./scripts/smoke-tests.sh production https://app.example.com
   ```

---

## 📊 Step 4: Monitor Deployment

### Automated Monitoring

Run 24-hour monitoring:

```bash
# Monitor for 24 hours
./scripts/monitor-deployment.sh production 24 https://app.example.com
```

### Manual Monitoring

1. **Check pod status**:
   ```bash
   kubectl get pods -n reconciliation-platform -w
   ```

2. **View logs**:
   ```bash
   # Backend logs
   kubectl logs -f -n reconciliation-platform \
       deployment/reconciliation-backend
   
   # Frontend logs
   kubectl logs -f -n reconciliation-platform \
       deployment/reconciliation-frontend
   ```

3. **Check metrics**:
   ```bash
   # Port forward metrics endpoint
   kubectl port-forward -n reconciliation-platform \
       svc/reconciliation-backend 9090:9090
   
   # Access metrics
   curl http://localhost:9090/api/metrics
   ```

4. **Monitor health**:
   ```bash
   watch -n 5 'curl -s https://app.example.com/api/health | jq'
   ```

### Monitoring Checklist (First 24 Hours)

- [ ] Health endpoint responds consistently
- [ ] No pod restarts
- [ ] Error rate < 1%
- [ ] Response time < 2 seconds
- [ ] No memory leaks
- [ ] Database connections stable
- [ ] Redis connections stable
- [ ] No critical errors in logs

---

## 🔄 Step 5: Rollback (If Needed)

### Quick Rollback

```bash
# Rollback backend
kubectl rollout undo deployment/reconciliation-backend \
    -n reconciliation-platform

# Rollback frontend
kubectl rollout undo deployment/reconciliation-frontend \
    -n reconciliation-platform

# Verify rollback
kubectl rollout status deployment/reconciliation-backend \
    -n reconciliation-platform
```

### Rollback to Specific Version

```bash
# Rollback to specific revision
kubectl rollout undo deployment/reconciliation-backend \
    --to-revision=2 \
    -n reconciliation-platform
```

### Database Rollback

If migrations need to be rolled back:

```bash
# List migration history
kubectl exec -n reconciliation-platform \
    deployment/reconciliation-backend -- \
    diesel migration list

# Rollback last migration
kubectl exec -n reconciliation-platform \
    deployment/reconciliation-backend -- \
    diesel migration revert
```

---

## 📝 Post-Deployment Tasks

### Immediate (First Hour)

- [ ] Verify all smoke tests pass
- [ ] Check error logs
- [ ] Monitor response times
- [ ] Verify database connectivity
- [ ] Test critical user flows

### Short Term (First 24 Hours)

- [ ] Monitor error rates
- [ ] Check resource usage
- [ ] Review performance metrics
- [ ] Verify logging output
- [ ] Test backup/restore

### Long Term (First Week)

- [ ] Review user feedback
- [ ] Analyze performance trends
- [ ] Check for memory leaks
- [ ] Verify file cleanup
- [ ] Review security logs

---

## 🛠️ Troubleshooting

### Common Issues

#### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n reconciliation-platform

# Check logs
kubectl logs <pod-name> -n reconciliation-platform

# Check events
kubectl get events -n reconciliation-platform --sort-by='.lastTimestamp'
```

#### Database Connection Issues

```bash
# Test database connection
kubectl exec -n reconciliation-platform \
    deployment/reconciliation-backend -- \
    psql $DATABASE_URL -c "SELECT 1"

# Check database pod
kubectl get pods -n reconciliation-platform -l app=postgres
```

#### High Error Rates

```bash
# Check error logs
kubectl logs -n reconciliation-platform \
    deployment/reconciliation-backend \
    --tail=100 | grep -i error

# Check metrics
curl -s https://app.example.com/api/metrics | grep error
```

#### Slow Response Times

```bash
# Check pod resources
kubectl top pods -n reconciliation-platform

# Check database performance
kubectl exec -n reconciliation-platform \
    deployment/reconciliation-backend -- \
    psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity"
```

---

## 📚 Related Documentation

- [Production Readiness Checklist](PRODUCTION_READINESS_CHECKLIST.md)
- [Final Production Verification](FINAL_PRODUCTION_VERIFICATION.md)
- [Deployment Guide](../deployment/DEPLOYMENT_GUIDE.md)
- [Kubernetes Configuration](../../k8s/optimized/README.md)

---

## ✅ Deployment Checklist Summary

### Pre-Deployment
- [ ] Secrets generated and configured
- [ ] Environment files updated
- [ ] Backup created
- [ ] Staging deployment verified

### Deployment
- [ ] Images built
- [ ] Kubernetes deployment applied
- [ ] Migrations run
- [ ] Smoke tests pass

### Post-Deployment
- [ ] Monitoring active
- [ ] Health checks passing
- [ ] No critical errors
- [ ] Performance acceptable

---

**Status**: ✅ All scripts and documentation ready  
**Next Action**: Generate secrets and begin staging deployment

