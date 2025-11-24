# Comprehensive Secret Management Guide

## Overview

This guide covers the complete secret management system for the Reconciliation Platform, including validation, rotation, and Kubernetes integration.

## Architecture

### Secret Sources (Priority Order)

1. **Kubernetes Secrets** (Production)
   - Stored in `reconciliation-secrets` Secret
   - Mounted as environment variables in pods
   - Managed via `manage-secrets.sh` script

2. **Environment Variables** (Development)
   - `.env` files (git-ignored)
   - System environment variables
   - Docker Compose environment

3. **External Secret Managers** (Optional)
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - GCP Secret Manager

### Secret Validation

All secrets are validated on application startup:
- **Required secrets** must be present
- **Minimum lengths** are enforced
- **Format validation** for URLs and keys
- **Production checks** prevent default values

## Secret Categories

### Required Secrets

| Secret | Min Length | Description | Rotation |
|--------|-----------|-------------|----------|
| `JWT_SECRET` | 32 | JWT token signing | 90 days |
| `DATABASE_URL` | 10 | PostgreSQL connection | 180 days |
| `CSRF_SECRET` | 32 | CSRF protection | 180 days |
| `PASSWORD_MASTER_KEY` | 32 | Password manager encryption | 365 days |

### Optional Secrets

| Secret | Min Length | Description | When Needed |
|--------|-----------|-------------|-------------|
| `JWT_REFRESH_SECRET` | 32 | Refresh token signing | If using refresh tokens |
| `POSTGRES_PASSWORD` | 16 | Database password | If not in DATABASE_URL |
| `REDIS_URL` | 10 | Redis connection | If using Redis |
| `REDIS_PASSWORD` | 16 | Redis auth | If Redis requires auth |
| `GOOGLE_CLIENT_ID` | 20 | Google OAuth | If using Google Sign-In |
| `GOOGLE_CLIENT_SECRET` | 20 | Google OAuth | If using Google Sign-In |
| `VITE_GOOGLE_CLIENT_ID` | 20 | Frontend Google OAuth | If using Google Sign-In |
| `SMTP_PASSWORD` | 8 | Email sending | If sending emails |
| `STRIPE_SECRET_KEY` | 32 | Payment processing | If using Stripe |
| `STRIPE_WEBHOOK_SECRET` | 32 | Stripe webhooks | If using Stripe |
| `API_KEY` | 32 | API authentication | If using API keys |
| `GRAFANA_PASSWORD` | 16 | Monitoring | If using Grafana |
| `SENTRY_DSN` | 20 | Error tracking | If using Sentry |
| `BACKUP_ENCRYPTION_KEY` | 32 | Backup encryption | If using backups |
| `AWS_ACCESS_KEY_ID` | 16 | AWS access | If using AWS |
| `AWS_SECRET_ACCESS_KEY` | 32 | AWS secret | If using AWS |

## Quick Start

### 1. Create Secrets (Kubernetes)

```bash
cd k8s/optimized/scripts
./manage-secrets.sh create
```

### 2. Validate Secrets

```bash
./manage-secrets.sh validate
```

### 3. List Secrets (Masked)

```bash
./manage-secrets.sh list
```

## Secret Generation

### Using OpenSSL (Recommended)

```bash
# 32+ character secrets (JWT, CSRF, etc.)
openssl rand -base64 48

# 16+ character secrets (passwords)
openssl rand -base64 24

# 64+ character secrets (master keys)
openssl rand -base64 64
```

### Using the Management Script

```bash
# Generate and set a secret
./manage-secrets.sh rotate JWT_SECRET
```

## Secret Operations

### Create New Secrets

```bash
# Interactive creation with auto-generation
./manage-secrets.sh create

# Manual creation
kubectl create secret generic reconciliation-secrets \
  --from-literal=JWT_SECRET='$(openssl rand -base64 48)' \
  --from-literal=CSRF_SECRET='$(openssl rand -base64 48)' \
  --from-literal=POSTGRES_PASSWORD='$(openssl rand -base64 24)' \
  --from-literal=PASSWORD_MASTER_KEY='$(openssl rand -base64 48)' \
  -n reconciliation-platform
```

### Update a Secret

```bash
# Using the script
./manage-secrets.sh update GOOGLE_CLIENT_ID "your-client-id"

# Using kubectl
kubectl patch secret reconciliation-secrets \
  -p='{"data":{"GOOGLE_CLIENT_ID":"'$(echo -n 'your-client-id' | base64)'"}}' \
  -n reconciliation-platform
```

### Rotate a Secret

```bash
# Interactive rotation
./manage-secrets.sh rotate JWT_SECRET

# Manual rotation
NEW_SECRET=$(openssl rand -base64 48)
./manage-secrets.sh update JWT_SECRET "$NEW_SECRET"
kubectl rollout restart deployment/backend -n reconciliation-platform
```

### Validate Secrets

```bash
# Validate all secrets
./manage-secrets.sh validate

# Check specific secret
kubectl get secret reconciliation-secrets \
  -o jsonpath='{.data.JWT_SECRET}' \
  -n reconciliation-platform | base64 -d | wc -c
```

### List Secrets

```bash
# List all secrets (masked)
./manage-secrets.sh list

# View secret metadata
kubectl describe secret reconciliation-secrets -n reconciliation-platform
```

## Application Integration

### Backend Usage

```rust
use crate::services::secrets::SecretsService;

// Get a secret (validated)
let jwt_secret = SecretsService::get_jwt_secret()?;

// Get with validation
let csrf_secret = SecretsService::get_secret_validated("CSRF_SECRET", 32)?;

// Get with fallback
let api_key = SecretsService::get_secret_or_default("API_KEY", "default-key");

// Validate all required secrets on startup
SecretsService::validate_required_secrets()?;
```

### Frontend Usage

```typescript
// Environment variables are injected at build time
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Or accessed via API
const config = await api.get('/api/config');
```

## Kubernetes Configuration

### Secret Manifest

See `k8s/optimized/base/secrets.yaml` for the complete secret definition.

### Deployment Integration

Secrets are automatically mounted as environment variables:

```yaml
env:
- name: JWT_SECRET
  valueFrom:
    secretKeyRef:
      name: reconciliation-secrets
      key: JWT_SECRET
```

### Updating Secrets

After updating a secret, restart pods:

```bash
kubectl rollout restart deployment/backend -n reconciliation-platform
kubectl rollout restart deployment/frontend -n reconciliation-platform
```

## Secret Rotation Schedule

| Secret | Interval | Priority | Impact |
|--------|----------|----------|--------|
| JWT_SECRET | 90 days | High | Requires token re-issue |
| CSRF_SECRET | 180 days | Medium | Session invalidation |
| DB_PASSWORD | 180 days | High | Database downtime |
| PASSWORD_MASTER_KEY | 365 days | Critical | Re-encryption required |
| API_KEY | 90 days | Medium | API downtime |
| AWS_ACCESS_KEY | 90 days | Medium | Service interruption |

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use different secrets** for each environment
3. **Rotate secrets regularly** according to schedule
4. **Use strong secrets** (32+ characters for critical secrets)
5. **Limit access** using RBAC
6. **Audit secret access** regularly
7. **Encrypt secrets at rest** (Kubernetes default)
8. **Use TLS** for secret transmission
9. **Monitor for leaks** in logs and code
10. **Document all secrets** and their purposes

## Troubleshooting

### Secret Not Found

```bash
# Check if secret exists
kubectl get secret reconciliation-secrets -n reconciliation-platform

# Check pod environment
kubectl exec -it <pod-name> -n reconciliation-platform -- env | grep JWT_SECRET
```

### Secret Too Short

```bash
# Error: "Secret must be at least 32 characters"
# Solution: Generate longer secret
openssl rand -base64 48
```

### Secret Not Updating

```bash
# Restart pods after updating
kubectl rollout restart deployment/backend -n reconciliation-platform
```

### Validation Failures

```bash
# Check validation errors
./manage-secrets.sh validate

# Fix missing secrets
./manage-secrets.sh update <SECRET_NAME> "<value>"
```

## External Secret Management

### AWS Secrets Manager

```bash
# Store secret
aws secretsmanager create-secret \
  --name reconciliation-platform/jwt-secret \
  --secret-string "your-jwt-secret"

# Use External Secrets Operator in Kubernetes
```

### HashiCorp Vault

```bash
# Store secret
vault kv put secret/reconciliation-platform jwt_secret="your-jwt-secret"

# Use Vault Agent or External Secrets Operator
```

## Emergency Procedures

### If a Secret is Compromised

1. **Immediately rotate** the compromised secret
2. **Revoke access** if applicable (JWT tokens, API keys)
3. **Audit logs** for unauthorized access
4. **Notify security team** if data breach suspected
5. **Update incident log**

### Recovery Procedures

1. **Retrieve backup** of previous secret if available
2. **Update secret** in Kubernetes
3. **Restart affected services**
4. **Verify functionality**

## Additional Resources

- [Kubernetes Secrets Documentation](https://kubernetes.io/docs/concepts/configuration/secret/)
- [12-Factor App: Config](https://12factor.net/config)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Backend Secrets Service](../backend/src/services/secrets.rs)


