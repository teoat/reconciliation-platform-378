# Quick Start - Kubernetes Deployment

## 🚀 Deploy in 5 Minutes

### 1. Prerequisites

```bash
# Check kubectl
kubectl version --client

# Check cluster access
kubectl cluster-info
```

### 2. Set Up Secrets

```bash
# Create namespace
kubectl create namespace reconciliation-platform

# Create secrets (update with your values)
kubectl create secret generic reconciliation-secrets \
  --from-literal=DATABASE_URL='postgresql://postgres:password@postgres-service:5432/reconciliation' \
  --from-literal=POSTGRES_USER='postgres' \
  --from-literal=POSTGRES_PASSWORD='your-secure-password' \
  --from-literal=JWT_SECRET='$(openssl rand -base64 32)' \
  --from-literal=REDIS_URL='redis://redis-service:6379/0' \
  --from-literal=VITE_GOOGLE_CLIENT_ID='your-google-client-id' \
  -n reconciliation-platform
```

### 3. Build Images

```bash
# Build backend
docker build -f infrastructure/docker/Dockerfile.backend \
  -t reconciliation-backend:latest .

# Build frontend
docker build -f infrastructure/docker/Dockerfile.frontend \
  --build-arg VITE_API_URL=http://backend-service:2000/api/v1 \
  --build-arg VITE_WS_URL=ws://backend-service:2000 \
  --build-arg VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID} \
  -t reconciliation-frontend:latest .
```

### 4. Deploy

```bash
cd k8s/optimized
./deploy.sh development apply
```

### 5. Verify

```bash
# Check pods
kubectl get pods -n reconciliation-platform

# Check services
kubectl get svc -n reconciliation-platform

# Port forward to test
kubectl port-forward svc/backend-service 2000:2000 -n reconciliation-platform
kubectl port-forward svc/frontend-service 1000:80 -n reconciliation-platform
```

## 📊 What Gets Deployed

- **Backend**: 2 replicas (scales 2-10)
- **Frontend**: 3 replicas (scales 3-20)
- **PostgreSQL**: 1 replica (StatefulSet)
- **Redis**: 1 replica
- **Ingress**: TLS-enabled routing
- **HPA**: Automatic scaling

## 🔧 Customization

### Change Replicas

Edit `overlays/<environment>/kustomization.yaml`:
```yaml
replicas:
  - name: backend
    count: 5
```

### Change Resources

Edit `overlays/<environment>/production-patch.yaml`:
```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "1000m"
```

## 🎯 Next Steps

1. Set up monitoring (Prometheus/Grafana)
2. Configure ingress domain
3. Set up TLS certificates
4. Configure backups
5. Set up CI/CD pipeline

See [README.md](./README.md) for detailed documentation.

