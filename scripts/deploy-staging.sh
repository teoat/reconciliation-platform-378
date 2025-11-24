#!/bin/bash
# ============================================================================
# STAGING DEPLOYMENT SCRIPT
# ============================================================================
# Deploys the application to staging environment with comprehensive checks
#
# Usage:
#   ./scripts/deploy-staging.sh [version]
#   ./scripts/deploy-staging.sh v1.0.0
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Configuration
VERSION=${1:-latest}
ENVIRONMENT="staging"
NAMESPACE="reconciliation-staging"
BASE_URL="${STAGING_URL:-http://staging.example.com}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================================================
# PRE-DEPLOYMENT CHECKS
# ============================================================================

pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if we can connect to cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace $NAMESPACE does not exist, creating..."
        kubectl create namespace "$NAMESPACE"
    fi
    
    # Check if secrets exist
    if ! kubectl get secret reconciliation-staging-secrets -n "$NAMESPACE" &> /dev/null; then
        log_warning "Secrets not found. Please create them first:"
        log_info "  kubectl apply -f k8s/optimized/base/secrets.yaml"
        log_info "  (Update secrets.yaml with staging values first)"
        exit 1
    fi
    
    log_success "Pre-deployment checks passed"
}

# ============================================================================
# BUILD IMAGES
# ============================================================================

build_images() {
    log_info "Building Docker images..."
    
    # Build backend
    log_info "Building backend image..."
    docker build \
        -f infrastructure/docker/Dockerfile.backend \
        -t reconciliation-backend:${VERSION} \
        -t reconciliation-backend:staging \
        --target runtime \
        backend/
    
    # Build frontend
    log_info "Building frontend image..."
    docker build \
        -f infrastructure/docker/Dockerfile.frontend \
        -t reconciliation-frontend:${VERSION} \
        -t reconciliation-frontend:staging \
        --target runtime \
        frontend/
    
    log_success "Images built successfully"
}

# ============================================================================
# DEPLOY TO KUBERNETES
# ============================================================================

deploy_kubernetes() {
    log_info "Deploying to Kubernetes..."
    
    # Apply ConfigMaps
    if [[ -f "k8s/optimized/base/configmap.yaml" ]]; then
        log_info "Applying ConfigMaps..."
        kubectl apply -f k8s/optimized/base/configmap.yaml -n "$NAMESPACE"
    fi
    
    # Apply Deployments
    if [[ -f "infrastructure/kubernetes/staging-deployment.yaml" ]]; then
        log_info "Applying deployments..."
        kubectl apply -f infrastructure/kubernetes/staging-deployment.yaml
    else
        log_warning "Staging deployment file not found, using base deployment..."
        if [[ -f "k8s/optimized/base/deployment.yaml" ]]; then
            kubectl apply -f k8s/optimized/base/deployment.yaml -n "$NAMESPACE"
        fi
    fi
    
    # Wait for rollout
    log_info "Waiting for deployment rollout..."
    kubectl rollout status deployment/reconciliation-backend -n "$NAMESPACE" --timeout=5m || {
        log_error "Backend deployment failed"
        kubectl rollout undo deployment/reconciliation-backend -n "$NAMESPACE"
        exit 1
    }
    
    kubectl rollout status deployment/reconciliation-frontend -n "$NAMESPACE" --timeout=5m || {
        log_error "Frontend deployment failed"
        kubectl rollout undo deployment/reconciliation-frontend -n "$NAMESPACE"
        exit 1
    }
    
    log_success "Deployment completed"
}

# ============================================================================
# RUN MIGRATIONS
# ============================================================================

run_migrations() {
    log_info "Running database migrations..."
    
    # Get backend pod name
    local pod_name=$(kubectl get pods -n "$NAMESPACE" -l app=reconciliation-backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -z "$pod_name" ]]; then
        log_error "Backend pod not found"
        exit 1
    fi
    
    # Run migrations
    kubectl exec -n "$NAMESPACE" "$pod_name" -- \
        diesel migration run || {
        log_error "Migrations failed"
        exit 1
    }
    
    log_success "Migrations completed"
}

# ============================================================================
# POST-DEPLOYMENT VERIFICATION
# ============================================================================

post_deployment_verification() {
    log_info "Running post-deployment verification..."
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Run smoke tests
    if [[ -f "$SCRIPT_DIR/smoke-tests.sh" ]]; then
        log_info "Running smoke tests..."
        "$SCRIPT_DIR/smoke-tests.sh" "$ENVIRONMENT" "$BASE_URL" || {
            log_error "Smoke tests failed"
            exit 1
        }
    else
        log_warning "Smoke test script not found, skipping..."
    fi
    
    log_success "Post-deployment verification passed"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    echo "============================================================================"
    echo "STAGING DEPLOYMENT"
    echo "============================================================================"
    echo "Version: $VERSION"
    echo "Environment: $ENVIRONMENT"
    echo "Namespace: $NAMESPACE"
    echo "Started: $(date)"
    echo ""
    
    pre_deployment_checks
    build_images
    deploy_kubernetes
    run_migrations
    post_deployment_verification
    
    echo ""
    echo "============================================================================"
    log_success "Staging deployment completed successfully!"
    echo "============================================================================"
    echo "Access staging at: $BASE_URL"
    echo "View logs: kubectl logs -f -n $NAMESPACE deployment/reconciliation-backend"
    echo ""
}

# Run main function
main "$@"

