#!/bin/bash
# Kubernetes Deployment Script for Reconciliation Platform
# Usage: ./deploy.sh [environment] [action]
# Example: ./deploy.sh production apply

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVIRONMENT=${1:-development}
ACTION=${2:-apply}
KUBECTL_CMD="kubectl"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Use: development, staging, or production${NC}"
    exit 1
fi

# Validate action
if [[ ! "$ACTION" =~ ^(apply|delete|dry-run|diff)$ ]]; then
    echo -e "${RED}Error: Invalid action. Use: apply, delete, dry-run, or diff${NC}"
    exit 1
fi

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  Reconciliation Platform K8s Deploy${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}Environment:${NC} $ENVIRONMENT"
echo -e "${GREEN}Action:${NC} $ACTION"
echo ""

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}Error: kubectl is not installed${NC}"
        exit 1
    fi
    
    if ! command -v kustomize &> /dev/null; then
        echo -e "${YELLOW}Warning: kustomize not found, using kubectl --kustomize${NC}"
        KUBECTL_CMD="kubectl"
    else
        KUBECTL_CMD="kustomize build | kubectl"
    fi
    
    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Prerequisites check passed${NC}"
}

# Build and push images (if needed)
build_images() {
    if [ "$ACTION" != "apply" ]; then
        return
    fi
    
    echo -e "${BLUE}Building Docker images...${NC}"
    
    # Build backend
    echo -e "${YELLOW}Building backend image...${NC}"
    docker build -f infrastructure/docker/Dockerfile.backend \
        -t reconciliation-backend:latest \
        --target runtime \
        .
    
    # Build frontend
    echo -e "${YELLOW}Building frontend image...${NC}"
    docker build -f infrastructure/docker/Dockerfile.frontend \
        -t reconciliation-frontend:latest \
        --build-arg VITE_API_URL=${VITE_API_URL:-http://backend-service:2000/api/v1} \
        --build-arg VITE_WS_URL=${VITE_WS_URL:-ws://backend-service:2000} \
        --build-arg VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID:-} \
        .
    
    echo -e "${GREEN}✓ Images built successfully${NC}"
}

# Deploy to Kubernetes
deploy() {
    local overlay_path="$SCRIPT_DIR/overlays/$ENVIRONMENT"
    
    if [ ! -d "$overlay_path" ]; then
        echo -e "${RED}Error: Overlay directory not found: $overlay_path${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Deploying to $ENVIRONMENT environment...${NC}"
    
    cd "$overlay_path"
    
    case $ACTION in
        apply)
            if command -v kustomize &> /dev/null; then
                kustomize build . | kubectl apply -f -
            else
                kubectl apply -k .
            fi
            echo -e "${GREEN}✓ Deployment applied${NC}"
            ;;
        delete)
            if command -v kustomize &> /dev/null; then
                kustomize build . | kubectl delete -f -
            else
                kubectl delete -k .
            fi
            echo -e "${GREEN}✓ Deployment deleted${NC}"
            ;;
        dry-run)
            if command -v kustomize &> /dev/null; then
                kustomize build . | kubectl apply --dry-run=client -f -
            else
                kubectl apply -k . --dry-run=client
            fi
            echo -e "${GREEN}✓ Dry-run completed${NC}"
            ;;
        diff)
            if command -v kustomize &> /dev/null; then
                kustomize build . > /tmp/k8s-manifests.yaml
                kubectl diff -f /tmp/k8s-manifests.yaml || true
            else
                kubectl diff -k . || true
            fi
            ;;
    esac
}

# Wait for rollout
wait_for_rollout() {
    if [ "$ACTION" != "apply" ]; then
        return
    fi
    
    echo -e "${BLUE}Waiting for deployment rollout...${NC}"
    
    kubectl rollout status deployment/backend -n reconciliation-platform --timeout=5m || true
    kubectl rollout status deployment/frontend -n reconciliation-platform --timeout=5m || true
    
    echo -e "${GREEN}✓ Rollout completed${NC}"
}

# Show status
show_status() {
    if [ "$ACTION" != "apply" ]; then
        return
    fi
    
    echo ""
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Deployment Status${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    
    kubectl get pods -n reconciliation-platform
    echo ""
    kubectl get services -n reconciliation-platform
    echo ""
    kubectl get ingress -n reconciliation-platform
}

# Main execution
main() {
    check_prerequisites
    build_images
    deploy
    wait_for_rollout
    show_status
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
}

main "$@"

