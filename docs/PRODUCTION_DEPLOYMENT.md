# Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Reconciliation Platform to a production environment. The deployment includes all necessary components for a scalable, secure, and monitored production system.

## Prerequisites

### Required Tools

- **kubectl** - Kubernetes command-line tool
- **Docker** - Container runtime
- **Helm** - Kubernetes package manager
- **jq** - JSON processor for scripts

### Required Access

- Kubernetes cluster with admin privileges
- Docker registry access
- DNS configuration for external access
- SSL/TLS certificates

### System Requirements

- **Minimum Cluster Resources:**
  - 4 CPU cores
  - 8GB RAM
  - 50GB storage

- **Recommended Cluster Resources:**
  - 8 CPU cores
  - 16GB RAM
  - 100GB storage

## Deployment Architecture

### Components

1. **Backend Service** - Rust-based API server
2. **Frontend Service** - React-based web application
3. **PostgreSQL Database** - Primary data storage
4. **Redis Cache** - Session and cache storage
5. **Monitoring Stack** - Prometheus, Grafana, AlertManager
6. **Logging Stack** - Elasticsearch, Kibana
7. **Ingress Controller** - Nginx-based load balancer
8. **Backup System** - Velero for disaster recovery

### Network Architecture

```
Internet
    ↓
Load Balancer (Ingress)
    ↓
Frontend Service (React)
    ↓
Backend Service (Rust)
    ↓
Database (PostgreSQL) + Cache (Redis)
```

## Step-by-Step Deployment

### 1. Environment Setup

Create the production environment configuration:

```bash
# Copy the production environment template
cp config/production.env .env.production

# Edit the configuration with your values
vim .env.production
```

### 2. Docker Registry Setup

Build and push Docker images:

```bash
# Set your registry URL
export REGISTRY="your-registry.com"

# Build and push images
docker build -t $REGISTRY/reconciliation-backend:latest -f infrastructure/docker/Dockerfile.backend .
docker build -t $REGISTRY/reconciliation-frontend:latest -f infrastructure/docker/Dockerfile.frontend .

docker push $REGISTRY/reconciliation-backend:latest
docker push $REGISTRY/reconciliation-frontend:latest
```

### 3. Kubernetes Cluster Setup

Deploy to Kubernetes:

```bash
# Make the deployment script executable
chmod +x scripts/deploy-production.sh

# Deploy the application
./scripts/deploy-production.sh deploy
```

### 4. DNS Configuration

Configure DNS records for external access:

```
reconciliation.example.com → Load Balancer IP
api.reconciliation.example.com → Load Balancer IP
ws.reconciliation.example.com → Load Balancer IP
```

### 5. SSL/TLS Setup

Configure SSL certificates:

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create Let's Encrypt issuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@reconciliation.example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## Configuration

### Environment Variables

Key environment variables for production:

```bash
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/reconciliation_db
DB_POOL_SIZE=20
DB_MAX_CONNECTIONS=50

# Redis
REDIS_URL=redis://redis:6379
REDIS_POOL_SIZE=10

# Security
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://reconciliation.example.com

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090

# Performance
ENABLE_COMPRESSION=true
ENABLE_CACHING=true
CACHE_TTL=3600
```

### Kubernetes Configuration

The deployment uses the following Kubernetes resources:

- **Namespace**: `reconciliation`
- **ConfigMap**: Application configuration
- **Secrets**: Sensitive data (passwords, keys)
- **Deployments**: Application pods
- **Services**: Internal networking
- **Ingress**: External access
- **HPA**: Auto-scaling
- **NetworkPolicy**: Security

## Monitoring and Alerting

### Prometheus Metrics

The application exposes metrics at `/metrics` endpoint:

- HTTP request metrics
- Database connection metrics
- Memory and CPU usage
- Custom business metrics

### Grafana Dashboards

Pre-configured dashboards:

1. **System Overview** - High-level system health
2. **Backend Performance** - API performance metrics
3. **Frontend Performance** - Web application metrics
4. **Database Performance** - PostgreSQL metrics
5. **Cache Performance** - Redis metrics

### Alert Rules

Critical alerts configured:

- High error rate (>10%)
- High response time (>1s)
- High memory usage (>80%)
- High CPU usage (>80%)
- Database connection failure
- Redis connection failure
- Pod crash looping
- Pod not ready

## Security

### Network Security

- Network policies restrict pod-to-pod communication
- Ingress controller enforces SSL/TLS
- Rate limiting prevents abuse
- CORS configured for specific origins

### Application Security

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Infrastructure Security

- Secrets stored in Kubernetes secrets
- RBAC configured for service accounts
- Pod security policies enforced
- Regular security updates

## Backup and Recovery

### Database Backup

Automated daily backups:

```bash
# Create backup job
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: reconciliation
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:15-alpine
            command:
            - /bin/bash
            - -c
            - |
              pg_dump -h postgres-service -U reconciliation_user reconciliation_db > /backup/backup-$(date +%Y%m%d).sql
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: reconciliation-secrets
                  key: DB_PASSWORD
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
EOF
```

### Disaster Recovery

Velero-based backup:

```bash
# Install Velero
helm install velero vmware-tanzu/velero -n velero --create-namespace

# Create backup schedule
velero schedule create daily-backup --schedule="0 2 * * *" --selector app=reconciliation
```

## Scaling

### Horizontal Pod Autoscaler

Configured for automatic scaling:

- **Backend**: 2-10 replicas based on CPU/memory
- **Frontend**: 2-5 replicas based on CPU/memory
- **Target CPU**: 70%
- **Target Memory**: 80%

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n reconciliation

# Scale frontend
kubectl scale deployment frontend --replicas=3 -n reconciliation
```

## Maintenance

### Rolling Updates

```bash
# Update backend image
kubectl set image deployment/backend backend=$REGISTRY/reconciliation-backend:v1.1.0 -n reconciliation

# Update frontend image
kubectl set image deployment/frontend frontend=$REGISTRY/reconciliation-frontend:v1.1.0 -n reconciliation
```

### Database Migrations

```bash
# Run migrations
kubectl exec -n reconciliation deployment/backend -- /app/migrate up
```

### Health Checks

```bash
# Check pod health
kubectl get pods -n reconciliation

# Check service health
kubectl get services -n reconciliation

# Check ingress
kubectl get ingress -n reconciliation
```

## Troubleshooting

### Common Issues

1. **Pod Crash Looping**
   ```bash
   kubectl logs -n reconciliation deployment/backend
   kubectl describe pod -n reconciliation -l app=backend
   ```

2. **Database Connection Issues**
   ```bash
   kubectl exec -n reconciliation deployment/postgres -- psql -U reconciliation_user -d reconciliation_db
   ```

3. **Redis Connection Issues**
   ```bash
   kubectl exec -n reconciliation deployment/redis -- redis-cli ping
   ```

4. **Ingress Issues**
   ```bash
   kubectl describe ingress -n reconciliation
   kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
   ```

### Log Analysis

```bash
# Backend logs
kubectl logs -n reconciliation -l app=backend --tail=100

# Frontend logs
kubectl logs -n reconciliation -l app=frontend --tail=100

# All logs
kubectl logs -n reconciliation --all-containers=true --tail=100
```

## Performance Optimization

### Database Optimization

- Connection pooling configured
- Query optimization enabled
- Index usage monitoring
- Slow query logging

### Cache Optimization

- Redis clustering for high availability
- Cache warming strategies
- TTL optimization
- Memory usage monitoring

### Application Optimization

- Gzip compression enabled
- Static asset caching
- API response caching
- Database query optimization

## Support and Maintenance

### Monitoring

- 24/7 monitoring with Prometheus
- Alert notifications via email/Slack
- Performance dashboards in Grafana
- Log analysis with Kibana

### Updates

- Automated security updates
- Rolling deployments for zero downtime
- Database migration automation
- Configuration management

### Support

- Documentation and runbooks
- Incident response procedures
- Performance tuning guides
- Troubleshooting guides

## Conclusion

This production deployment provides a robust, scalable, and secure platform for the Reconciliation application. The comprehensive monitoring, alerting, and backup systems ensure high availability and quick recovery from issues.

For additional support or customization, refer to the individual component documentation or contact the development team.
