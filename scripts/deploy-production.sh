#!/bin/bash
# ============================================================================
# PRODUCTION DEPLOYMENT SCRIPT
# ============================================================================
# Deploys the application to production with comprehensive safety checks
#
# Usage:
#   ./scripts/deploy-production.sh [version]
#   ./scripts/deploy-production.sh v1.0.0
#
# Requirements:
#   - kubectl configured for production cluster
#   - Production secrets configured in k8s/optimized/base/secrets.yaml
#   - Backup created before deployment
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Configuration
VERSION=${1:-latest}
ENVIRONMENT="production"
NAMESPACE="reconciliation-platform"
BASE_URL="${PRODUCTION_URL:-https://app.example.com}"

# Safety checks
REQUIRE_APPROVAL=${REQUIRE_APPROVAL:-true}
CREATE_BACKUP=${CREATE_BACKUP:-true}

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
# SAFETY CHECKS
# ============================================================================

safety_checks() {
    log_info "Running safety checks..."
    
    # Check if running in production mode
    if [[ "${ENVIRONMENT}" != "production" ]]; then
        log_error "This script is for production deployment only"
        exit 1
    fi
    
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
    
    # Verify we're on the production cluster
    local current_context=$(kubectl config current-context)
    log_info "Current Kubernetes context: $current_context"
    
    if [[ "$REQUIRE_APPROVAL" == "true" ]]; then
        echo ""
        log_warning "⚠️  PRODUCTION DEPLOYMENT WARNING ⚠️"
        echo "You are about to deploy to PRODUCTION environment"
        echo "Version: $VERSION"
        echo "Namespace: $NAMESPACE"
        echo "Context: $current_context"
        echo ""
        read -p "Type 'DEPLOY' to confirm: " confirmation
        
        if [[ "$confirmation" != "DEPLOY" ]]; then
            log_error "Deployment cancelled"
            exit 1
        fi
    fi
    
    # Check if secrets exist and are not using defaults
    if ! kubectl get secret reconciliation-secrets -n "$NAMESPACE" &> /dev/null; then
        log_error "Production secrets not found"
        log_info "Please create secrets first:"
        log_info "  kubectl apply -f k8s/optimized/base/secrets.yaml"
        exit 1
    fi
    
    # Verify secrets are not using default values
    local jwt_secret=$(kubectl get secret reconciliation-secrets -n "$NAMESPACE" -o jsonpath='{.data.JWT_SECRET}' | base64 -d 2>/dev/null || echo "")
    if [[ "$jwt_secret" == *"CHANGE_ME"* ]] || [[ -z "$jwt_secret" ]]; then
        log_error "JWT_SECRET is using default or empty value"
        exit 1
    fi
    
    log_success "Safety checks passed"
}

# ============================================================================
# CREATE BACKUP
# ============================================================================

create_backup() {
    if [[ "$CREATE_BACKUP" != "true" ]]; then
        log_warning "Backup creation skipped (CREATE_BACKUP=false)"
        return 0
    fi
    
    log_info "Creating backup before deployment..."
    
    # Create database backup
    if [[ -f "$SCRIPT_DIR/backup-postgresql.sh" ]]; then
        log_info "Creating database backup..."
        "$SCRIPT_DIR/backup-postgresql.sh" production || {
            log_error "Database backup failed"
            exit 1
        }
    else
        log_warning "Backup script not found, skipping database backup..."
    fi
    
    # Create Redis backup
    if [[ -f "$SCRIPT_DIR/backup-redis.sh" ]]; then
        log_info "Creating Redis backup..."
        "$SCRIPT_DIR/backup-redis.sh" production || {
            log_warning "Redis backup failed (non-critical)"
        }
    fi
    
    log_success "Backup completed"
}

# ============================================================================
# BUILD IMAGES
# ============================================================================

build_images() {
    log_info "Building production Docker images..."
    
    # Build backend with production optimizations
    log_info "Building backend image..."
    docker build \
        -f infrastructure/docker/Dockerfile.backend \
        -t reconciliation-backend:${VERSION} \
        -t reconciliation-backend:latest \
        --target runtime \
        --build-arg BUILD_MODE=release \
        --build-arg RUSTFLAGS="-C target-cpu=native" \
        backend/
    
    # Build frontend with production optimizations
    log_info "Building frontend image..."
    docker build \
        -f infrastructure/docker/Dockerfile.frontend \
        -t reconciliation-frontend:${VERSION} \
        -t reconciliation-frontend:latest \
        --target runtime \
        --build-arg NODE_ENV=production \
        frontend/
    
    log_success "Production images built successfully"
}

# ============================================================================
# DEPLOY TO KUBERNETES
# ============================================================================

deploy_kubernetes() {
    log_info "Deploying to Kubernetes production cluster..."
    
    # Apply ConfigMaps
    if [[ -f "k8s/optimized/base/configmap.yaml" ]]; then
        log_info "Applying ConfigMaps..."
        kubectl apply -f k8s/optimized/base/configmap.yaml -n "$NAMESPACE"
    fi
    
    # Apply Deployments with rolling update
    log_info "Applying deployments (rolling update)..."
    
    # Update image tags
    kubectl set image deployment/reconciliation-backend \
        reconciliation-backend=reconciliation-backend:${VERSION} \
        -n "$NAMESPACE" || {
        log_error "Failed to update backend image"
        exit 1
    }
    
    kubectl set image deployment/reconciliation-frontend \
        reconciliation-frontend=reconciliation-frontend:${VERSION} \
        -n "$NAMESPACE" || {
        log_error "Failed to update frontend image"
        exit 1
    }
    
    # Wait for rollout
    log_info "Waiting for deployment rollout (this may take several minutes)..."
    kubectl rollout status deployment/reconciliation-backend -n "$NAMESPACE" --timeout=10m || {
        log_error "Backend deployment failed, rolling back..."
        kubectl rollout undo deployment/reconciliation-backend -n "$NAMESPACE"
        exit 1
    }
    
    kubectl rollout status deployment/reconciliation-frontend -n "$NAMESPACE" --timeout=10m || {
        log_error "Frontend deployment failed, rolling back..."
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
    log_info "Waiting for services to stabilize..."
    sleep 60
    
    # Run smoke tests
    if [[ -f "$SCRIPT_DIR/smoke-tests.sh" ]]; then
        log_info "Running smoke tests..."
        "$SCRIPT_DIR/smoke-tests.sh" "$ENVIRONMENT" "$BASE_URL" || {
            log_error "Smoke tests failed"
            log_warning "Consider rolling back if critical issues detected"
            exit 1
        }
    else
        log_warning "Smoke test script not found, skipping..."
    fi
    
    # Check pod status
    log_info "Checking pod status..."
    kubectl get pods -n "$NAMESPACE" -l app=reconciliation-backend
    kubectl get pods -n "$NAMESPACE" -l app=reconciliation-frontend
    
    log_success "Post-deployment verification passed"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    echo "============================================================================"
    echo "PRODUCTION DEPLOYMENT"
    echo "============================================================================"
    echo "Version: $VERSION"
    echo "Environment: $ENVIRONMENT"
    echo "Namespace: $NAMESPACE"
    echo "Started: $(date)"
    echo ""
    
    safety_checks
    create_backup
    build_images
    deploy_kubernetes
    run_migrations
    post_deployment_verification
    
    echo ""
    echo "============================================================================"
    log_success "Production deployment completed successfully!"
    echo "============================================================================"
    echo "Access production at: $BASE_URL"
    echo "Monitor logs: kubectl logs -f -n $NAMESPACE deployment/reconciliation-backend"
    echo "Monitor metrics: kubectl port-forward -n $NAMESPACE svc/reconciliation-backend 9090:9090"
    echo ""
    log_warning "Monitor the application closely for the next 24 hours"
    echo ""
}

# Run main function
main "$@"
