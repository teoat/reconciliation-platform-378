# Secrets Management Guide

This document describes how to manage secrets for the Reconciliation Platform.

## Overview

The platform requires several secrets for secure operation:
- Database passwords
- JWT secrets
- Redis passwords
- CSRF secrets
- Backup encryption keys
- Service account tokens

## Secret Generation

### Requirements

All production secrets must be:
- At least 32 characters long
- Cryptographically random
- Unique per environment
- Stored securely

### Generation Methods

#### Using OpenSSL (Recommended)
```bash
# Generate a 32-character random string
openssl rand -base64 32

# Generate a 64-character random string (recommended)
openssl rand -base64 48
```

#### Using Python
```python
import secrets
secret = secrets.token_urlsafe(32)
print(secret)
```

#### Using Node.js
```javascript
const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('base64');
console.log(secret);
```

## Environment-Specific Secrets

### Development
- Secrets can be stored in `.env` files (NOT committed to git)
- Minimum length: 16 characters (warnings will be logged)
- Auto-generated secrets allowed for non-critical services

### Staging/Production
- Secrets MUST be at least 32 characters
- MUST be stored in Kubernetes Secrets or external secret management
- NEVER stored in code or configuration files committed to git

## Kubernetes Secrets

### Creating Secrets

#### Base64 Encode Secret Value
```bash
echo -n 'your-secret-value' | base64
```

#### Create Secret from Literal
```bash
kubectl create secret generic reconciliation-secrets \
  --from-literal=DB_PASSWORD='your-db-password' \
  --from-literal=JWT_SECRET='your-jwt-secret' \
  --from-literal=REDIS_PASSWORD='your-redis-password' \
  --from-literal=CSRF_SECRET='your-csrf-secret' \
  --from-literal=GRAFANA_PASSWORD='your-grafana-password' \
  --namespace=reconciliation-platform
```

#### Create Secret from File
```bash
kubectl create secret generic reconciliation-secrets \
  --from-file=./secrets/db-password.txt \
  --from-file=./secrets/jwt-secret.txt \
  --namespace=reconciliation-platform
```

#### Create Secret from YAML
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: reconciliation-secrets
  namespace: reconciliation-platform
type: Opaque
data:
  DB_PASSWORD: <base64-encoded-password>
  JWT_SECRET: <base64-encoded-jwt-secret>
  REDIS_PASSWORD: <base64-encoded-redis-password>
  CSRF_SECRET: <base64-encoded-csrf-secret>
  GRAFANA_PASSWORD: <base64-encoded-grafana-password>
  BACKUP_ENCRYPTION_KEY: <base64-encoded-encryption-key>
```

Replace `<base64-encoded-*>` with actual base64-encoded values:
```bash
echo -n 'actual-secret-value' | base64
```

### Updating Secrets

```bash
# Update a specific key
kubectl patch secret reconciliation-secrets \
  -p '{"data":{"JWT_SECRET":"'$(echo -n 'new-secret' | base64)'"}}' \
  --namespace=reconciliation-platform

# Delete and recreate (requires pod restart)
kubectl delete secret reconciliation-secrets --namespace=reconciliation-platform
kubectl create secret generic reconciliation-secrets ... # (see creation above)
```

### Viewing Secrets

```bash
# List secrets
kubectl get secrets --namespace=reconciliation-platform

# View secret metadata (NOT the values)
kubectl describe secret reconciliation-secrets --namespace=reconciliation-platform

# Decode a secret value (for debugging)
kubectl get secret reconciliation-secrets \
  -o jsonpath='{.data.JWT_SECRET}' \
  --namespace=reconciliation-platform | base64 -d
```

## Required Secrets

### Production Environment

| Secret | Minimum Length | Description | Example Command |
|--------|---------------|-------------|-----------------|
| `JWT_SECRET` | 32 | JWT token signing secret | `openssl rand -base64 48` |
| `CSRF_SECRET` | 32 | CSRF protection secret | `openssl rand -base64 48` |
| `DB_PASSWORD` | 16 | PostgreSQL database password | `openssl rand -base64 24` |
| `REDIS_PASSWORD` | 16 | Redis authentication password | `openssl rand -base64 24` |
| `GRAFANA_PASSWORD` | 16 | Grafana admin password | `openssl rand -base64 24` |
| `BACKUP_ENCRYPTION_KEY` | 32 | S3 backup encryption key | `openssl rand -base64 48` |

### Optional Secrets

| Secret | Description | When Required |
|--------|-------------|---------------|
| `SENTRY_DSN` | Sentry error tracking DSN | When error tracking enabled |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 backups | When backups enabled |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for S3 backups | When backups enabled |
| `STRIPE_SECRET_KEY` | Stripe payment integration | When billing enabled |

## Secret Rotation

### Rotation Strategy

1. **Generate new secret** using methods above
2. **Update Kubernetes secret** with new value
3. **Restart pods** to pick up new secret:
   ```bash
   kubectl rollout restart deployment/reconciliation-backend \
     --namespace=reconciliation-platform
   ```
4. **Verify** application is working correctly
5. **Document** rotation date and reason

### Rotation Schedule

- **JWT_SECRET**: Rotate every 90 days or immediately if compromised
- **CSRF_SECRET**: Rotate every 180 days or immediately if compromised
- **DB_PASSWORD**: Rotate every 180 days
- **REDIS_PASSWORD**: Rotate every 180 days
- **BACKUP_ENCRYPTION_KEY**: Rotate every 365 days (ensure backups are accessible first)

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use secret management systems** (AWS Secrets Manager, HashiCorp Vault, etc.)
3. **Rotate secrets regularly** according to schedule
4. **Use different secrets** for each environment
5. **Limit access** to secrets using RBAC
6. **Audit secret access** regularly
7. **Encrypt secrets at rest** (Kubernetes does this automatically)
8. **Use TLS** for secret transmission
9. **Monitor for leaked secrets** in logs and code
10. **Document all secrets** and their purposes

## External Secret Management

### AWS Secrets Manager

```bash
# Store secret
aws secretsmanager create-secret \
  --name reconciliation-platform/jwt-secret \
  --secret-string "your-jwt-secret"

# Retrieve in Kubernetes using External Secrets Operator
```

### HashiCorp Vault

```bash
# Store secret
vault kv put secret/reconciliation-platform jwt_secret="your-jwt-secret"

# Use Vault Agent or External Secrets Operator in Kubernetes
```

## Troubleshooting

### Secret Not Found
```bash
# Check if secret exists
kubectl get secret reconciliation-secrets --namespace=reconciliation-platform

# Check pod environment variables
kubectl exec -it <pod-name> -- env | grep -E 'JWT_SECRET|CSRF_SECRET'
```

### Secret Too Short
- Error: "Secret must be at least 32 characters"
- Solution: Generate a longer secret using methods above

### Secret Not Updating
- Solution: Restart pods after updating secret:
  ```bash
  kubectl rollout restart deployment/reconciliation-backend --namespace=reconciliation-platform
  ```

## Emergency Procedures

### If a Secret is Compromised

1. **Immediately rotate** the compromised secret
2. **Revoke access** if applicable (e.g., JWT tokens may need invalidation)
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
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
