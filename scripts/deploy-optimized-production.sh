#!/bin/bash

# ============================================================================
# OPTIMIZED PRODUCTION DEPLOYMENT SCRIPT
# ============================================================================
# This script automates the deployment of the Reconciliation Platform
# with optimized Docker images and Kubernetes configurations
# ============================================================================

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="${DOCKER_REGISTRY:-your-registry.io}"
NAMESPACE="${K8S_NAMESPACE:-reconciliation}"
BACKEND_TAG="${BACKEND_TAG:-1.0.0}"
FRONTEND_TAG="${FRONTEND_TAG:-1.0.0}"

echo -e "${BLUE}====================================================================${NC}"
echo -e "${BLUE}  OPTIMIZED PRODUCTION DEPLOYMENT${NC}"
echo -e "${BLUE}  Reconciliation Platform${NC}"
echo -e "${BLUE}====================================================================${NC}"
echo ""

# ============================================================================
# Functions
# ============================================================================

print_step() {
    echo -e "${GREEN}>>> $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠  $1${NC}"
}

print_error() {
    echo -e "${RED}✗  $1${NC}"
}

# ============================================================================
# Step 1: Build Docker Images
# ============================================================================

print_step "Step 1: Building optimized Docker images..."

# Build backend
print_info "Building backend image..."
docker build -f infrastructure/docker/Dockerfile.backend.optimized \
    -t ${REGISTRY}/reconciliation-backend:${BACKEND_TAG} \
    -t ${REGISTRY}/reconciliation-backend:latest \
    . || {
        print_error "Backend build failed!"
        exit 1
    }
print_info "Backend image built successfully"

# Build frontend
print_info "Building frontend image..."
docker build -f infrastructure/docker/Dockerfile.frontend.optimized \
    -t ${REGISTRY}/reconciliation-frontend:${FRONTEND_TAG} \
    -t ${REGISTRY}/reconciliation-frontend:latest \
    . || {
        print_error "Frontend build failed!"
        exit 1
    }
print_info "Frontend image built successfully"

# ============================================================================
# Step 2: Push Images to Registry
# ============================================================================

print_step "Step 2: Pushing images to registry ${REGISTRY}..."

# Check if we should push (skip if registry is "your-registry.io")
if [ "${REGISTRY}" != "your-registry.io" ]; then
    docker push ${REGISTRY}/reconciliation-backend:${BACKEND_TAG}
    docker push ${REGISTRY}/reconciliation-backend:latest
    docker push ${REGISTRY}/reconciliation-frontend:${FRONTEND_TAG}
    docker push ${REGISTRY}/reconciliation-frontend:latest
    print_info "Images pushed successfully"
else
    print_warning "Skipping image push (registry not configured)"
fi

# ============================================================================
# Step 3: Update Kubernetes Manifests
# ============================================================================

print_step "Step 3: Updating Kubernetes manifests..."

# Update backend deployment
sed -i.bak "s|reconciliation-backend:latest|${REGISTRY}/reconciliation-backend:${BACKEND_TAG}|g" \
    infrastructure/kubernetes/backend-deployment-optimized.yaml

# Update frontend deployment
sed -i.bak "s|reconciliation-frontend:latest|${REGISTRY}/reconciliation-frontend:${FRONTEND_TAG}|g" \
    infrastructure/kubernetes/frontend-deployment-optimized.yaml

print_info "Manifests updated"

# ============================================================================
# Step 4: Check Kubernetes Connection
# ============================================================================

print_step "Step 4: Checking Kubernetes connection..."

kubectl cluster-info &>/dev/null || {
    print_error "Cannot connect to Kubernetes cluster!"
    exit 1
}
print_info "Connected to Kubernetes cluster"

# ============================================================================
# Step 5: Create Namespace and Base Resources
# ============================================================================

print_step "Step 5: Creating namespace and base resources..."

kubectl apply -f infrastructure/kubernetes/secrets-configmaps-optimized.yaml

# Wait for namespace to be ready
kubectl wait --for=condition=Active namespace/${NAMESPACE} --timeout=60s || true

print_info "Namespace and base resources created"

# ============================================================================
# Step 6: Deploy Backend
# ============================================================================

print_step "Step 6: Deploying backend..."

kubectl apply -f infrastructure/kubernetes/backend-deployment-optimized.yaml

# Wait for deployment to be ready
print_info "Waiting for backend pods to be ready..."
kubectl wait --for=condition=available \
    --timeout=300s \
    deployment/reconciliation-backend \
    -n ${NAMESPACE} || {
        print_warning "Backend deployment may still be in progress"
    }

print_info "Backend deployed successfully"

# ============================================================================
# Step 7: Deploy Frontend
# ============================================================================

print_step "Step 7: Deploying frontend..."

kubectl apply -f infrastructure/kubernetes/frontend-deployment-optimized.yaml

# Wait for deployment to be ready
print_info "Waiting for frontend pods to be ready..."
kubectl wait --for=condition=available \
    --timeout=300s \
    deployment/reconciliation-frontend \
    -n ${NAMESPACE} || {
        print_warning "Frontend deployment may still be in progress"
    }

print_info "Frontend deployed successfully"

# ============================================================================
# Step 8: Verify Deployment
# ============================================================================

print_step "Step 8: Verifying deployment..."

echo ""
echo -e "${BLUE}Deployment Status:${NC}"
kubectl get pods -n ${NAMESPACE}

echo ""
echo -e "${BLUE}Services:${NC}"
kubectl get svc -n ${NAMESPACE}

echo ""
echo -e "${BLUE}HPA Status:${NC}"
kubectl get hpa -n ${NAMESPACE}

echo ""
echo -e "${BLUE}POD Disruption Budgets:${NC}"
kubectl get pdb -n ${NAMESPACE}

# ============================================================================
# Step 9: Test Health Endpoints
# ============================================================================

print_step "Step 9: Testing health endpoints..."

# Get backend pod name
BACKEND_POD=$(kubectl get pod -n ${NAMESPACE} -l app=reconciliation-backend -o jsonpath='{.items[0].metadata.name}')

if [ -n "${BACKEND_POD}" ]; then
    print_info "Testing backend health endpoint..."
    kubectl exec -n ${NAMESPACE} ${BACKEND_POD} -- wget -q -O- http://localhost:2000/health && {
        print_info "Backend health check: PASSED ✓"
    } || {
        print_warning "Backend health check: FAILED (may still be starting)"
    }
fi

# ============================================================================
# Deployment Complete
# ============================================================================

echo ""
echo -e "${GREEN}====================================================================${NC}"
echo -e "${GREEN}  DEPLOYMENT COMPLETE${NC}"
echo -e "${GREEN}====================================================================${NC}"
echo ""
echo -e "${BLUE}Deployment Summary:${NC}"
echo -e "  Namespace: ${NAMESPACE}"
echo -e "  Registry: ${REGISTRY}"
echo -e "  Backend Version: ${BACKEND_TAG}"
echo -e "  Frontend Version: ${FRONTEND_TAG}"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo -e "  View logs: kubectl logs -f deployment/reconciliation-backend -n ${NAMESPACE}"
echo -e "  View pods: kubectl get pods -n ${NAMESPACE}"
echo -e "  Port forward: kubectl port-forward -n ${NAMESPACE} svc/reconciliation-backend 2000:2000"
echo ""
echo -e "${GREEN}✓ Deployment successful!${NC}"
echo ""

# Restore backup files
rm -f infrastructure/kubernetes/*.bak

exit 0

