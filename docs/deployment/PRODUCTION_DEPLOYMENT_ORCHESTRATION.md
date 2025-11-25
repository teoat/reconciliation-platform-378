# Production Deployment Orchestration

**Last Updated:** 2025-01-25  
**Status:** ✅ Complete  
**Purpose:** Master guide for production deployment orchestration

---

## Overview

Complete orchestration system for deploying all services to production. Handles building, deployment, verification, and monitoring in a single automated workflow.

---

## Quick Start

### Full Production Deployment

```bash
# Deploy to production (with staging first)
./scripts/orchestrate-production-deployment.sh v1.0.0 production
```

### Quick Staging Deployment

```bash
# Fast deployment to staging (skips confirmations)
./scripts/quick-deploy-all.sh v1.0.0
```

### Verify Services

```bash
# Verify all services after deployment
./scripts/verify-all-services.sh production https://app.example.com
```

---

## Deployment Scripts

### 1. Master Orchestration Script

**File:** `scripts/orchestrate-production-deployment.sh`

**Purpose:** Complete end-to-end production deployment orchestration

**Features:**
- ✅ Prerequisite verification
- ✅ Builds all services (backend, frontend)
- ✅ Deploys to staging first (optional)
- ✅ Deploys to production
- ✅ Runs database migrations
- ✅ Verifies deployment
- ✅ Starts 24-hour monitoring

**Usage:**
```bash
./scripts/orchestrate-production-deployment.sh [version] [environment]
```

**Options:**
- `DEPLOY_STAGING_FIRST=true` - Deploy to staging first (default: true)
- `SKIP_TESTS=true` - Skip smoke tests (default: false)
- `AUTO_APPROVE=true` - Skip confirmation prompts (default: false)

**Example:**
```bash
# Full deployment with staging first
./scripts/orchestrate-production-deployment.sh v1.0.0 production

# Production only (skip staging)
DEPLOY_STAGING_FIRST=false ./scripts/orchestrate-production-deployment.sh v1.0.0 production

# Auto-approve (no confirmations)
AUTO_APPROVE=true ./scripts/orchestrate-production-deployment.sh v1.0.0 production
```

### 2. Quick Deploy Script

**File:** `scripts/quick-deploy-all.sh`

**Purpose:** Fast deployment for staging/development environments

**Features:**
- ✅ Skips safety checks
- ✅ No confirmation prompts
- ✅ Fast deployment cycle

**Usage:**
```bash
./scripts/quick-deploy-all.sh [version]
```

**Example:**
```bash
ENVIRONMENT=staging ./scripts/quick-deploy-all.sh v1.0.0
```

### 3. Service Verification Script

**File:** `scripts/verify-all-services.sh`

**Purpose:** Comprehensive verification of all deployed services

**Features:**
- ✅ Kubernetes resource checks
- ✅ Pod health verification
- ✅ Health endpoint checks
- ✅ Database connectivity
- ✅ Redis connectivity
- ✅ Smoke tests

**Usage:**
```bash
./scripts/verify-all-services.sh [environment] [base_url]
```

**Example:**
```bash
./scripts/verify-all-services.sh production https://app.example.com
```

---

## Deployment Process

### Phase 1: Prerequisites

The orchestration script verifies:
- ✅ kubectl installed and configured
- ✅ docker installed
- ✅ Kubernetes cluster accessible
- ✅ Namespace exists
- ✅ Secrets configured
- ✅ Environment variables set

### Phase 2: Build Services

**Backend:**
- Builds Docker image with production optimizations
- Tags with version and latest
- Uses release build mode

**Frontend:**
- Runs npm ci and build
- Builds Docker image
- Production optimizations enabled

### Phase 3: Staging Deployment (Optional)

If `DEPLOY_STAGING_FIRST=true`:
1. Creates staging namespace
2. Deploys to staging
3. Runs smoke tests
4. Waits for approval before production

### Phase 4: Production Deployment

1. **Safety Confirmation** (unless AUTO_APPROVE=true)
   - Requires typing 'DEPLOY' to confirm

2. **Backup Creation**
   - Creates database backup
   - Creates Redis backup (if configured)

3. **Backend Deployment**
   - Updates deployment with new image
   - Waits for rollout completion
   - Verifies pods are ready

4. **Frontend Deployment**
   - Updates deployment with new image
   - Waits for rollout completion
   - Verifies pods are ready

5. **Database Migrations**
   - Runs pending migrations
   - Verifies migration success

### Phase 5: Verification

1. **Pod Health**
   - Waits for all pods to be ready
   - Checks pod status

2. **Health Endpoints**
   - Tests backend health endpoint
   - Tests frontend accessibility

3. **Smoke Tests**
   - Runs comprehensive smoke test suite
   - Verifies critical functionality

### Phase 6: Monitoring

- Starts 24-hour background monitoring
- Logs to `/tmp/deployment-monitor.log`
- Monitors health, errors, and performance

---

## Environment Variables

### Required

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `REDIS_URL` - Redis connection string (optional)

### Optional

- `PRODUCTION_URL` - Production base URL
- `STAGING_URL` - Staging base URL
- `DEPLOY_STAGING_FIRST` - Deploy to staging first (default: true)
- `SKIP_TESTS` - Skip smoke tests (default: false)
- `AUTO_APPROVE` - Skip confirmations (default: false)

---

## Rollback Procedure

If deployment fails or issues are detected:

```bash
# Rollback backend
kubectl rollout undo deployment/reconciliation-backend -n reconciliation-platform

# Rollback frontend
kubectl rollout undo deployment/reconciliation-frontend -n reconciliation-platform

# Check rollout status
kubectl rollout status deployment/reconciliation-backend -n reconciliation-platform
kubectl rollout status deployment/reconciliation-frontend -n reconciliation-platform
```

---

## Monitoring

### View Monitoring Logs

```bash
tail -f /tmp/deployment-monitor.log
```

### Stop Monitoring

```bash
kill $(cat /tmp/deployment-monitor.pid)
```

### Manual Monitoring

```bash
# Watch pods
kubectl get pods -n reconciliation-platform -w

# View backend logs
kubectl logs -f -n reconciliation-platform deployment/reconciliation-backend

# View frontend logs
kubectl logs -f -n reconciliation-platform deployment/reconciliation-frontend

# Check health
curl https://app.example.com/api/health
```

---

## Troubleshooting

### Deployment Fails

1. **Check prerequisites:**
   ```bash
   kubectl cluster-info
   kubectl get namespace reconciliation-platform
   ```

2. **Check secrets:**
   ```bash
   kubectl get secrets -n reconciliation-platform
   ```

3. **Check pod status:**
   ```bash
   kubectl get pods -n reconciliation-platform
   kubectl describe pod <pod-name> -n reconciliation-platform
   ```

4. **Check logs:**
   ```bash
   kubectl logs <pod-name> -n reconciliation-platform
   ```

### Services Not Responding

1. **Check service endpoints:**
   ```bash
   kubectl get services -n reconciliation-platform
   ```

2. **Check ingress:**
   ```bash
   kubectl get ingress -n reconciliation-platform
   ```

3. **Test connectivity:**
   ```bash
   kubectl exec -n reconciliation-platform deployment/reconciliation-backend -- curl localhost:2000/api/health
   ```

### Migration Failures

1. **Check migration status:**
   ```bash
   kubectl exec -n reconciliation-platform deployment/reconciliation-backend -- diesel migration list
   ```

2. **Run migrations manually:**
   ```bash
   kubectl exec -n reconciliation-platform deployment/reconciliation-backend -- diesel migration run
   ```

---

## Best Practices

1. **Always deploy to staging first** - Test in staging before production
2. **Create backups** - Automatic backups are created, but verify
3. **Monitor closely** - Watch logs and metrics for first hour
4. **Have rollback plan** - Know how to rollback before deploying
5. **Test smoke tests** - Ensure smoke tests pass in staging
6. **Verify secrets** - Double-check production secrets before deployment
7. **Coordinate with team** - Notify team before production deployment

---

## Related Documentation

- [Master Status and Checklist](../project-management/MASTER_STATUS_AND_CHECKLIST.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Go-Live Checklist](./GO_LIVE_CHECKLIST.md)
- [Production Readiness Checklist](../operations/PRODUCTION_READINESS_CHECKLIST.md)

---

**Last Updated:** 2025-01-25  
**Status:** ✅ Production Ready

