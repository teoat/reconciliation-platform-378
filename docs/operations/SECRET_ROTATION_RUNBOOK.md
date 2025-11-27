# Secret Rotation Runbook

**Last Updated**: 2025-01-15  
**Status**: Active

---

## Overview

This runbook provides step-by-step procedures for rotating secrets in the Reconciliation Platform. Regular secret rotation is critical for maintaining security and compliance.

---

## Prerequisites

- Access to Kubernetes cluster (for production)
- Access to secret management system (if used)
- Backup of current secrets (for rollback)
- Maintenance window scheduled
- Team notification sent

---

## Secret Rotation Schedule

### High-Priority Secrets (Rotate Every 90 Days)
- JWT_SECRET
- JWT_REFRESH_SECRET
- PASSWORD_MASTER_KEY
- CSRF_SECRET

### Medium-Priority Secrets (Rotate Every 180 Days)
- DATABASE_PASSWORD
- REDIS_PASSWORD
- BACKUP_ENCRYPTION_KEY

### Low-Priority Secrets (Rotate Annually)
- API_KEY
- GRAFANA_PASSWORD
- SMTP_PASSWORD

---

## Rotation Procedures

### 1. JWT Secret Rotation

#### Step 1: Generate New Secret
```bash
# Generate new JWT secret (64 characters recommended)
openssl rand -base64 48
```

#### Step 2: Update Environment Variables
```bash
# Development
export JWT_SECRET="<new-secret>"
export JWT_REFRESH_SECRET="<new-secret>"

# Production (Kubernetes)
kubectl create secret generic reconciliation-secrets \
  --from-literal=JWT_SECRET="<new-secret>" \
  --from-literal=JWT_REFRESH_SECRET="<new-secret>" \
  --dry-run=client -o yaml | kubectl apply -f -
```

#### Step 3: Rolling Restart
```bash
# Restart backend services to pick up new secrets
kubectl rollout restart deployment/reconciliation-backend -n reconciliation-platform
```

#### Step 4: Verify
- Check application logs for successful startup
- Test authentication endpoints
- Verify existing tokens still work (grace period)
- Monitor for authentication errors

#### Step 5: Grace Period
- Keep old secret active for 24 hours
- Monitor for token validation errors
- After grace period, remove old secret

---

### 2. Database Password Rotation

#### Step 1: Generate New Password
```bash
openssl rand -base64 32
```

#### Step 2: Update Database
```bash
# Connect to PostgreSQL
psql -U postgres -d reconciliation

# Change password
ALTER USER reconciliation_user WITH PASSWORD '<new-password>';
```

#### Step 3: Update Application Secret
```bash
# Update Kubernetes secret
kubectl create secret generic reconciliation-secrets \
  --from-literal=DATABASE_URL="postgresql://reconciliation_user:<new-password>@postgres-service:5432/reconciliation" \
  --from-literal=POSTGRES_PASSWORD="<new-password>" \
  --dry-run=client -o yaml | kubectl apply -f -
```

#### Step 4: Rolling Restart
```bash
kubectl rollout restart deployment/reconciliation-backend -n reconciliation-platform
```

#### Step 5: Verify
- Check database connectivity
- Monitor application logs
- Test database operations

---

### 3. Redis Password Rotation

#### Step 1: Generate New Password
```bash
openssl rand -base64 32
```

#### Step 2: Update Redis
```bash
# Connect to Redis
redis-cli -a <old-password>

# Change password
CONFIG SET requirepass "<new-password>"
CONFIG REWRITE
```

#### Step 3: Update Application Secret
```bash
kubectl create secret generic reconciliation-secrets \
  --from-literal=REDIS_URL="redis://:<new-password>@redis-service:6379/0" \
  --from-literal=REDIS_PASSWORD="<new-password>" \
  --dry-run=client -o yaml | kubectl apply -f -
```

#### Step 4: Rolling Restart
```bash
kubectl rollout restart deployment/reconciliation-backend -n reconciliation-platform
```

---

### 4. CSRF Secret Rotation

#### Step 1: Generate New Secret
```bash
openssl rand -base64 48
```

#### Step 2: Update Secret
```bash
kubectl create secret generic reconciliation-secrets \
  --from-literal=CSRF_SECRET="<new-secret>" \
  --dry-run=client -o yaml | kubectl apply -f -
```

#### Step 3: Rolling Restart
```bash
kubectl rollout restart deployment/reconciliation-backend -n reconciliation-platform
```

#### Step 4: Verify
- Test form submissions
- Check CSRF token validation
- Monitor for CSRF errors

---

### 5. Password Master Key Rotation

**⚠️ CRITICAL**: This requires re-encryption of all stored passwords.

#### Step 1: Generate New Master Key
```bash
openssl rand -base64 48
```

#### Step 2: Backup Current Data
```bash
# Backup password_entries table
pg_dump -t password_entries reconciliation > password_entries_backup.sql
```

#### Step 3: Re-encrypt All Passwords
```bash
# Run migration script to re-encrypt with new key
# This should be done during maintenance window
./scripts/rotate-password-master-key.sh <old-key> <new-key>
```

#### Step 4: Update Secret
```bash
kubectl create secret generic reconciliation-secrets \
  --from-literal=PASSWORD_MASTER_KEY="<new-key>" \
  --dry-run=client -o yaml | kubectl apply -f -
```

#### Step 5: Rolling Restart
```bash
kubectl rollout restart deployment/reconciliation-backend -n reconciliation-platform
```

---

## Automated Rotation Scripts

### Script: `scripts/rotate-secrets.sh`

```bash
#!/bin/bash
# Secret rotation script
# Usage: ./scripts/rotate-secrets.sh <secret-type> [environment]

SECRET_TYPE=$1
ENVIRONMENT=${2:-production}

case $SECRET_TYPE in
  jwt)
    echo "Rotating JWT secrets..."
    # Implementation
    ;;
  database)
    echo "Rotating database password..."
    # Implementation
    ;;
  redis)
    echo "Rotating Redis password..."
    # Implementation
    ;;
  csrf)
    echo "Rotating CSRF secret..."
    # Implementation
    ;;
  *)
    echo "Unknown secret type: $SECRET_TYPE"
    exit 1
    ;;
esac
```

---

## Rollback Procedures

### If Rotation Fails

1. **Immediate Rollback**
   ```bash
   # Restore previous secret
   kubectl create secret generic reconciliation-secrets \
     --from-literal=JWT_SECRET="<old-secret>" \
     --dry-run=client -o yaml | kubectl apply -f -
   
   # Restart services
   kubectl rollout restart deployment/reconciliation-backend
   ```

2. **Database Rollback**
   ```bash
   # Restore database password
   psql -U postgres -d reconciliation -c "ALTER USER reconciliation_user WITH PASSWORD '<old-password>';"
   ```

3. **Verify Rollback**
   - Check application logs
   - Test critical endpoints
   - Monitor error rates

---

## Monitoring and Verification

### Post-Rotation Checklist

- [ ] Application starts successfully
- [ ] No authentication errors in logs
- [ ] Database connections working
- [ ] Redis connections working
- [ ] API endpoints responding
- [ ] No increase in error rates
- [ ] User sessions not disrupted (for JWT rotation with grace period)

### Monitoring Queries

```bash
# Check for authentication errors
kubectl logs -f deployment/reconciliation-backend | grep -i "auth\|token\|unauthorized"

# Check database connectivity
kubectl exec -it deployment/reconciliation-backend -- psql $DATABASE_URL -c "SELECT 1"

# Check Redis connectivity
kubectl exec -it deployment/reconciliation-backend -- redis-cli -u $REDIS_URL PING
```

---

## Best Practices

1. **Always backup secrets** before rotation
2. **Use maintenance windows** for critical rotations
3. **Test in staging** before production
4. **Monitor closely** after rotation
5. **Keep old secrets** for grace period when applicable
6. **Document rotation** in change log
7. **Notify team** before and after rotation

---

## Emergency Procedures

### If Secrets Are Compromised

1. **Immediate Actions**
   - Rotate all compromised secrets immediately
   - Revoke all active tokens (JWT)
   - Force password reset for affected users
   - Review access logs

2. **Investigation**
   - Identify scope of compromise
   - Review security logs
   - Check for unauthorized access
   - Document incident

3. **Communication**
   - Notify security team
   - Update stakeholders
   - Prepare incident report

---

## Related Documentation

- [Secrets Management Guide](../operations/secrets/SECRETS_MANAGEMENT.md)
- [Security Audit Report](../project-management/SECURITY_AUDIT_COMPLETE.md)
- [Kubernetes Secrets Configuration](../../k8s/optimized/base/secrets.yaml)

---

**Last Updated**: 2025-01-15  
**Next Review**: Quarterly

