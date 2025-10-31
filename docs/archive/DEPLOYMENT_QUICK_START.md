# 🚀 Quick Start - Optimized Production Deployment

## Prerequisites

- Docker installed and running
- Kubernetes cluster configured (`kubectl` access)
- Container registry credentials configured (optional)

## 1️⃣ One-Command Deployment

```bash
# Deploy with default settings
./deploy-optimized-production.sh
```

## 2️⃣ Custom Registry Deployment

```bash
# Set your registry and deploy
export DOCKER_REGISTRY="your-registry.io"
export BACKEND_TAG="1.0.0"
export FRONTEND_TAG="1.0.0"

./deploy-optimized-production.sh
```

## 3️⃣ What Gets Deployed

### Docker Images
- **Backend**: `reconciliation-backend:1.0.0` (~60MB)
- **Frontend**: `reconciliation-frontend:1.0.0` (~25MB)

### Kubernetes Resources
- Namespace: `reconciliation`
- Backend Deployment (3 replicas)
- Frontend Deployment (3 replicas)
- Services (ClusterIP/LoadBalancer)
- HPA (Horizontal Pod Autoscaler)
- PDB (Pod Disruption Budget)
- Secrets & ConfigMaps
- Network Policies

## 4️⃣ Verify Deployment

```bash
# Check pods
kubectl get pods -n reconciliation

# Check services
kubectl get svc -n reconciliation

# Check HPA
kubectl get hpa -n reconciliation

# View logs
kubectl logs -f deployment/reconciliation-backend -n reconciliation
```

## 5️⃣ Access Your Application

### Port Forward (Local Testing)
```bash
# Backend
kubectl port-forward -n reconciliation svc/reconciliation-backend 2000:2000

# Frontend
kubectl port-forward -n reconciliation svc/reconciliation-frontend 8080:80
```

### Production Access
- Frontend: https://your-domain.com
- Backend API: https://api.your-domain.com

## 📊 Resource Usage

### Backend
- Memory: 256MB - 350MB per pod
- CPU: 250m - 350m per pod
- Replicas: 3 (min) - 15 (max)

### Frontend
- Memory: 128MB - 175MB per pod
- CPU: 100m - 175m per pod
- Replicas: 3 (min) - 10 (max)

## 🛠️ Troubleshooting

### Pods Not Starting
```bash
kubectl describe pod <pod-name> -n reconciliation
kubectl logs <pod-name> -n reconciliation
```

### Secret Issues
```bash
# Verify secrets exist
kubectl get secrets -n reconciliation

# Check secret values (base64 encoded)
kubectl get secret reconciliation-secrets -n reconciliation -o yaml
```

### Update Secrets
```bash
# Edit secrets file
vi infrastructure/kubernetes/secrets-configmaps-optimized.yaml

# Apply changes
kubectl apply -f infrastructure/kubernetes/secrets-configmaps-optimized.yaml

# Restart pods to pick up new secrets
kubectl rollout restart deployment/reconciliation-backend -n reconciliation
```

## 📈 Scaling

HPA automatically scales based on CPU (70%) and Memory (80%) usage.

Manual scaling:
```bash
# Scale backend
kubectl scale deployment reconciliation-backend --replicas=5 -n reconciliation

# Scale frontend
kubectl scale deployment reconciliation-frontend --replicas=5 -n reconciliation
```

## 🔄 Rolling Updates

```bash
# Update to new version
kubectl set image deployment/reconciliation-backend \
  backend=your-registry/reconciliation-backend:1.0.1 \
  -n reconciliation

# Monitor rollout
kubectl rollout status deployment/reconciliation-backend -n reconciliation

# Rollback if needed
kubectl rollout undo deployment/reconciliation-backend -n reconciliation
```

## 📚 More Information

- Full Documentation: `PRODUCTION_DEPLOYMENT_CERTIFICATION.md`
- Backend Dockerfile: `infrastructure/docker/Dockerfile.backend.optimized`
- Frontend Dockerfile: `infrastructure/docker/Dockerfile.frontend.optimized`
- Kubernetes Manifests: `infrastructure/kubernetes/`

---

**🚀 Your application is ready for production!**

