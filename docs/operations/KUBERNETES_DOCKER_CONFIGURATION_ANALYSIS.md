# Kubernetes and Docker Configuration Analysis

**Last Updated**: January 2025  
**Status**: Active

## Overview

This document provides a comprehensive analysis of configuration consistency between Kubernetes and Docker Compose deployments, ensuring all secrets and environment variables are properly synchronized.

## Executive Summary

### Findings
- **Missing in Docker**: 13 secrets/environment variables present in Kubernetes but not in Docker Compose
- **Missing in Kubernetes**: 0 (Docker has some dev-only vars not needed in K8s)
- **Inconsistent**: Some variables have different defaults or naming

### Critical Missing Secrets in Docker
1. `CSRF_SECRET` - Required for CSRF protection
2. `PASSWORD_MASTER_KEY` - Required for password manager encryption
3. `GOOGLE_CLIENT_ID` - Optional but should be available
4. `GOOGLE_CLIENT_SECRET` - Optional but should be available
5. `SMTP_PASSWORD` - Optional but should be available
6. `STRIPE_SECRET_KEY` - Optional but should be available
7. `STRIPE_WEBHOOK_SECRET` - Optional but should be available
8. `API_KEY` - Optional but should be available
9. `SOFTCODE_API_KEY` - Optional but should be available
10. `SENTRY_DSN` - Optional but should be available
11. `BACKUP_ENCRYPTION_KEY` - Optional but should be available
12. `AWS_ACCESS_KEY_ID` - Optional but should be available
13. `AWS_SECRET_ACCESS_KEY` - Optional but should be available

## Detailed Comparison

### Required Secrets

| Secret | Kubernetes | Docker Compose | Status |
|--------|-----------|----------------|--------|
| `JWT_SECRET` | ✅ Present | ✅ Present | ✅ Consistent |
| `JWT_REFRESH_SECRET` | ✅ Present | ✅ Present | ✅ Consistent |
| `JWT_EXPIRATION` | ✅ Present | ✅ Present | ✅ Consistent |
| `DATABASE_URL` | ✅ Present | ✅ Present (constructed) | ✅ Consistent |
| `POSTGRES_USER` | ✅ Present | ✅ Present | ✅ Consistent |
| `POSTGRES_PASSWORD` | ✅ Present | ✅ Present | ✅ Consistent |
| `CSRF_SECRET` | ✅ Present | ❌ Missing | ⚠️ **CRITICAL** |
| `PASSWORD_MASTER_KEY` | ✅ Present | ❌ Missing | ⚠️ **CRITICAL** |

### Optional Secrets

| Secret | Kubernetes | Docker Compose | Status |
|--------|-----------|----------------|--------|
| `REDIS_URL` | ✅ Present | ✅ Present (constructed) | ✅ Consistent |
| `REDIS_PASSWORD` | ✅ Present | ✅ Present | ✅ Consistent |
| `GOOGLE_CLIENT_ID` | ✅ Present | ❌ Missing | ⚠️ Missing |
| `GOOGLE_CLIENT_SECRET` | ✅ Present | ❌ Missing | ⚠️ Missing |
| `VITE_GOOGLE_CLIENT_ID` | ✅ Present | ✅ Present (build arg) | ✅ Consistent |
| `SMTP_PASSWORD` | ✅ Present | ❌ Missing | ⚠️ Missing |
| `STRIPE_SECRET_KEY` | ✅ Present | ❌ Missing | ⚠️ Missing |
| `STRIPE_WEBHOOK_SECRET` | ✅ Present | ❌ Missing | ⚠️ Missing |
| `API_KEY` | ✅ Present | ❌ Missing | ⚠️ Missing |
| `SOFTCODE_API_KEY` | ✅ Present | ❌ Missing | ⚠️ Missing |
| `GRAFANA_PASSWORD` | ✅ Present | ✅ Present | ✅ Consistent |
| `SENTRY_DSN` | ✅ Present | ❌ Missing | ⚠️ Missing |
| `BACKUP_ENCRYPTION_KEY` | ✅ Present | ❌ Missing | ⚠️ Missing |
| `AWS_ACCESS_KEY_ID` | ✅ Present | ❌ Missing | ⚠️ Missing |
| `AWS_SECRET_ACCESS_KEY` | ✅ Present | ❌ Missing | ⚠️ Missing |

### Configuration Variables

| Variable | Kubernetes ConfigMap | Docker Compose | Status |
|----------|---------------------|----------------|--------|
| `RUST_LOG` | ✅ Present | ✅ Present | ✅ Consistent |
| `RUST_BACKTRACE` | ✅ Present | ❌ Missing | ⚠️ Missing |
| `DATABASE_POOL_SIZE` | ✅ Present | ❌ Missing | ⚠️ Missing |
| `DATABASE_TIMEOUT` | ✅ Present | ❌ Missing | ⚠️ Missing |
| `REDIS_POOL_SIZE` | ✅ Present | ❌ Missing | ⚠️ Missing |
| `REDIS_TIMEOUT` | ✅ Present | ❌ Missing | ⚠️ Missing |
| `VITE_API_URL` | ✅ Present | ✅ Present (build arg) | ✅ Consistent |
| `VITE_WS_URL` | ✅ Present | ✅ Present (build arg) | ✅ Consistent |
| `CORS_ORIGINS` | ❌ Not in ConfigMap | ✅ Present | ⚠️ Inconsistent |
| `MAX_FILE_SIZE` | ❌ Not in ConfigMap | ✅ Present | ⚠️ Inconsistent |
| `UPLOAD_PATH` | ❌ Not in ConfigMap | ✅ Present | ⚠️ Inconsistent |

## Impact Analysis

### Critical Impact (Application Won't Start)
- `CSRF_SECRET`: Required by backend for CSRF protection. Missing this will cause authentication failures.
- `PASSWORD_MASTER_KEY`: Required by password manager. Missing this will prevent password operations.

### High Impact (Features Won't Work)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Google OAuth won't work
- `SMTP_PASSWORD`: Email sending won't work
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`: Payment processing won't work

### Medium Impact (Optional Features)
- `API_KEY`: External API access won't work
- `SOFTCODE_API_KEY`: SoftCode integration won't work
- `SENTRY_DSN`: Error tracking won't work
- `BACKUP_ENCRYPTION_KEY`: Encrypted backups won't work
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`: AWS S3 backups won't work

## Recommendations

### Immediate Actions
1. ✅ Add all missing secrets to `docker-compose.yml`
2. ✅ Add all missing secrets to `docker-compose.base.yml`
3. ✅ Update environment variable documentation
4. ✅ Add validation to ensure consistency

### Long-term Improvements
1. Create a single source of truth for all environment variables
2. Automate synchronization between K8s and Docker configs
3. Add CI/CD checks to prevent drift
4. Document all environment variables in one place

## Implementation Plan

### Phase 1: Critical Secrets (Required)
- [x] Add `CSRF_SECRET` to Docker Compose
- [x] Add `PASSWORD_MASTER_KEY` to Docker Compose

### Phase 2: High Priority Secrets (Common Features)
- [x] Add `GOOGLE_CLIENT_ID` to Docker Compose
- [x] Add `GOOGLE_CLIENT_SECRET` to Docker Compose
- [x] Add `SMTP_PASSWORD` to Docker Compose
- [x] Add `STRIPE_SECRET_KEY` to Docker Compose
- [x] Add `STRIPE_WEBHOOK_SECRET` to Docker Compose

### Phase 3: Optional Secrets (Nice to Have)
- [x] Add `API_KEY` to Docker Compose
- [x] Add `SOFTCODE_API_KEY` to Docker Compose
- [x] Add `SENTRY_DSN` to Docker Compose
- [x] Add `BACKUP_ENCRYPTION_KEY` to Docker Compose
- [x] Add `AWS_ACCESS_KEY_ID` to Docker Compose
- [x] Add `AWS_SECRET_ACCESS_KEY` to Docker Compose

### Phase 4: Configuration Variables
- [x] Add `RUST_BACKTRACE` to Docker Compose
- [x] Add database/redis pool configuration to Docker Compose

## Related Documentation
- [Secrets Management Guide](../architecture/AUTOMATIC_SECRET_MANAGEMENT.md)
- [Environment Variables Documentation](../deployment/ENVIRONMENT_VARIABLES.md)
- [Kubernetes Deployment Guide](../deployment/PRODUCTION_DEPLOYMENT.md)

