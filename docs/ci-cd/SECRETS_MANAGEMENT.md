# Secrets Management Guide

## Overview

This guide covers secure management of secrets for the Reconciliation Platform across different environments and deployment scenarios.

## Secret Categories

### 1. Application Secrets
- Database credentials
- API keys
- JWT secrets
- Encryption keys
- OAuth client credentials

### 2. Infrastructure Secrets
- SSH keys
- Cloud provider credentials
- Container registry credentials
- TLS certificates

### 3. Third-Party Service Secrets
- Monitoring service tokens
- Notification service webhooks
- External API keys

## GitHub Actions Secrets

### Setting Up Repository Secrets

1. Navigate to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add secret name and value

### Required Secrets

```yaml
# Docker Registry
DOCKER_USERNAME: your-docker-username
DOCKER_PASSWORD: your-docker-password

# SSH Deployment
# ⚠️ WARNING: These are TEMPLATE values only. Never commit real SSH keys!
# Generate keys using: ssh-keygen -t ed25519 -C "deploy@example.com"
STAGING_HOST: staging.example.com
STAGING_USERNAME: deploy
STAGING_SSH_KEY: |
  -----BEGIN OPENSSH PRIVATE KEY-----
  <YOUR_STAGING_PRIVATE_KEY_HERE - NEVER COMMIT REAL KEYS>
  -----END OPENSSH PRIVATE KEY-----

PRODUCTION_HOST: production.example.com
PRODUCTION_USERNAME: deploy
PRODUCTION_SSH_KEY: |
  -----BEGIN OPENSSH PRIVATE KEY-----
  <YOUR_PRODUCTION_PRIVATE_KEY_HERE - NEVER COMMIT REAL KEYS>
  -----END OPENSSH PRIVATE KEY-----

# Database
DATABASE_URL: postgres://user:password@host:5432/db
REDIS_URL: redis://:password@host:6379

# Security
JWT_SECRET: your-super-secure-jwt-secret-min-32-chars
CSRF_SECRET: your-csrf-secret-key
ENCRYPTION_KEY: your-32-byte-encryption-key

# Monitoring & Notifications
SLACK_WEBHOOK: https://hooks.slack.com/services/xxx/yyy/zzz
SENTRY_DSN: https://xxx@sentry.io/yyy
DATADOG_API_KEY: your-datadog-api-key

# Security Scanning
SNYK_TOKEN: your-snyk-token
SONAR_TOKEN: your-sonarcloud-token
CODECOV_TOKEN: your-codecov-token

# OAuth Providers
GOOGLE_CLIENT_ID: your-google-client-id
GOOGLE_CLIENT_SECRET: your-google-client-secret
GITHUB_CLIENT_ID: your-github-oauth-client-id
GITHUB_CLIENT_SECRET: your-github-oauth-client-secret
```

### Environment-Specific Secrets

Create environment-specific secrets for staging and production:

```yaml
# Staging Environment
STAGING_DATABASE_URL: postgres://user:pass@staging-db:5432/reconciliation
STAGING_REDIS_URL: redis://staging-redis:6379

# Production Environment
PRODUCTION_DATABASE_URL: postgres://user:pass@prod-db:5432/reconciliation
PRODUCTION_REDIS_URL: redis://prod-redis:6379
```

## AWS Secrets Manager

### Setup

1. Create secrets in AWS Secrets Manager:

```bash
# Create secret
aws secretsmanager create-secret \
  --name reconciliation/production/database \
  --secret-string '{"username":"dbuser","password":"dbpass","host":"db.example.com"}'

# Update secret
aws secretsmanager update-secret \
  --secret-id reconciliation/production/database \
  --secret-string '{"username":"dbuser","password":"newpass","host":"db.example.com"}'
```

2. Configure IAM policy for access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:123456789:secret:reconciliation/*"
      ]
    }
  ]
}
```

### GitHub Actions Integration

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1

- name: Get secrets from AWS Secrets Manager
  uses: aws-actions/aws-secretsmanager-get-secrets@v2
  with:
    secret-ids: |
      ,reconciliation/production/database
      ,reconciliation/production/api-keys
    parse-json-secrets: true

- name: Use secrets
  run: |
    echo "Database host: $RECONCILIATION_PRODUCTION_DATABASE_HOST"
```

### Kubernetes Integration

Use External Secrets Operator:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: reconciliation-secrets
  namespace: reconciliation-platform
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: reconciliation-secrets
    creationPolicy: Owner
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: reconciliation/production/database
        property: connection_string
    - secretKey: REDIS_URL
      remoteRef:
        key: reconciliation/production/redis
        property: url
    - secretKey: JWT_SECRET
      remoteRef:
        key: reconciliation/production/auth
        property: jwt_secret
```

## HashiCorp Vault

### Setup

```bash
# Enable KV secrets engine
vault secrets enable -path=reconciliation kv-v2

# Store secret
vault kv put reconciliation/production/database \
  username=dbuser \
  password=dbpass \
  host=db.example.com

# Read secret
vault kv get reconciliation/production/database
```

### Kubernetes Integration

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: vault-secrets
spec:
  provider: vault
  parameters:
    vaultAddress: "https://vault.example.com"
    roleName: "reconciliation-app"
    objects: |
      - objectName: "database-creds"
        secretPath: "reconciliation/data/production/database"
        secretKey: "password"
```

## Kubernetes Secrets

### Creating Secrets

```bash
# From literal values
kubectl create secret generic reconciliation-secrets \
  --namespace=reconciliation-platform \
  --from-literal=JWT_SECRET=your-secret \
  --from-literal=DATABASE_URL=postgres://...

# From file
kubectl create secret generic tls-certs \
  --namespace=reconciliation-platform \
  --from-file=tls.crt=./cert.pem \
  --from-file=tls.key=./key.pem

# From env file
kubectl create secret generic app-secrets \
  --namespace=reconciliation-platform \
  --from-env-file=./secrets.env
```

### Sealed Secrets

For GitOps workflows, use Bitnami Sealed Secrets:

```bash
# Install kubeseal CLI
brew install kubeseal

# Create sealed secret
kubectl create secret generic my-secret \
  --dry-run=client \
  --from-literal=password=mysecret \
  -o yaml | kubeseal -o yaml > sealed-secret.yaml

# Apply sealed secret (safe to commit to Git)
kubectl apply -f sealed-secret.yaml
```

## Secret Rotation

### Automated Rotation Policy

```yaml
# AWS Secrets Manager rotation
resource "aws_secretsmanager_secret_rotation" "database" {
  secret_id           = aws_secretsmanager_secret.database.id
  rotation_lambda_arn = aws_lambda_function.rotation.arn

  rotation_rules {
    automatically_after_days = 30
  }
}
```

### Manual Rotation Procedure

1. Generate new secret value
2. Update in secrets manager
3. Deploy application to pick up new secret
4. Verify application works
5. Revoke old secret value

```bash
# Rotation script
./scripts/rotate-secrets.sh --secret database-password
```

## Best Practices

### DO:
- ✅ Use secrets managers (AWS, HashiCorp Vault)
- ✅ Rotate secrets regularly (every 30-90 days)
- ✅ Use different secrets per environment
- ✅ Audit secret access
- ✅ Use short-lived tokens where possible
- ✅ Encrypt secrets at rest and in transit

### DON'T:
- ❌ Commit secrets to Git
- ❌ Log secrets in application output
- ❌ Share secrets between environments
- ❌ Use weak or predictable secrets
- ❌ Store secrets in environment variables in Dockerfiles

## Secret Templates

### `.env.example`
```bash
# Database
DATABASE_URL=postgres://user:password@localhost:5432/reconciliation

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret-min-32-characters
JWT_EXPIRATION=86400

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Security
CSRF_SECRET=your-csrf-secret
ENCRYPTION_KEY=your-32-byte-encryption-key
PASSWORD_MASTER_KEY=your-password-master-key

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/yyy

# External Services
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

## Auditing & Monitoring

### AWS CloudTrail

Monitor secret access:

```json
{
  "eventName": "GetSecretValue",
  "eventSource": "secretsmanager.amazonaws.com",
  "userIdentity": {
    "arn": "arn:aws:iam::123456789:role/reconciliation-app"
  }
}
```

### Alerts

Set up alerts for:
- Unusual secret access patterns
- Failed secret retrieval attempts
- Secret rotation failures
- Secret expiration warnings

## Emergency Procedures

### Secret Compromise Response

1. **Identify** - Determine which secrets were compromised
2. **Rotate** - Immediately rotate affected secrets
3. **Deploy** - Deploy applications with new secrets
4. **Audit** - Review access logs for unauthorized use
5. **Notify** - Inform relevant stakeholders
6. **Document** - Record incident and remediation steps

### Emergency Contacts

- Security Team: security@example.com
- DevOps On-Call: +1-xxx-xxx-xxxx
- Incident Response: incident@example.com
