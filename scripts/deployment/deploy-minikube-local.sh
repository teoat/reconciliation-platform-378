#!/bin/bash
# ============================================================================
# MINIKUBE LOCAL DEPLOYMENT SCRIPT
# ============================================================================
# Deploys to local Minikube cluster using local Docker images
#
# Usage:
#   ./scripts/deployment/deploy-minikube-local.sh
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

# Configuration
NAMESPACE="reconciliation-platform"
VERSION="local"

# ============================================================================
# CHECK PREREQUISITES
# ============================================================================

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check minikube
    if ! minikube status &> /dev/null; then
        log_error "Minikube is not running. Start it with: minikube start"
        exit 1
    fi
    
    # Check kubectl
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# ============================================================================
# BUILD IMAGES
# ============================================================================

build_images() {
    log_info "Building Docker images locally..."
    
    cd "$PROJECT_ROOT"
    
    # Build backend
    log_info "Building backend image..."
    docker build \
        -f infrastructure/docker/Dockerfile.backend \
        -t reconciliation-backend:local \
        --build-arg BUILD_MODE=release \
        . || {
        log_error "Failed to build backend image"
        exit 1
    }
    
    # Build frontend
    log_info "Building frontend image..."
    docker build \
        -f infrastructure/docker/Dockerfile.frontend \
        -t reconciliation-frontend:local \
        --build-arg NODE_ENV=production \
        . || {
        log_error "Failed to build frontend image"
        exit 1
    }
    
    log_success "Images built successfully"
}

# ============================================================================
# LOAD IMAGES INTO MINIKUBE
# ============================================================================

load_images() {
    log_info "Loading images into Minikube..."
    
    minikube image load reconciliation-backend:local || {
        log_error "Failed to load backend image"
        exit 1
    }
    
    minikube image load reconciliation-frontend:local || {
        log_error "Failed to load frontend image"
        exit 1
    }
    
    log_success "Images loaded into Minikube"
}

# ============================================================================
# CREATE NAMESPACE
# ============================================================================

create_namespace() {
    log_info "Creating namespace: $NAMESPACE"
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_info "Namespace already exists"
    else
        kubectl create namespace "$NAMESPACE" || {
            log_error "Failed to create namespace"
            exit 1
        }
        log_success "Namespace created"
    fi
}

# ============================================================================
# CREATE SECRETS
# ============================================================================

create_secrets() {
    log_info "Setting up secrets..."
    
    if kubectl get secret reconciliation-secrets -n "$NAMESPACE" &> /dev/null; then
        log_warning "Secrets already exist. Skipping creation."
        return 0
    fi
    
    log_info "Creating local development secrets..."
    
    # Generate simple secrets for local development
    local jwt_secret=$(openssl rand -base64 48)
    local postgres_password=$(openssl rand -base64 24)
    
    kubectl create secret generic reconciliation-secrets \
        --from-literal=JWT_SECRET="$jwt_secret" \
        --from-literal=JWT_REFRESH_SECRET="$jwt_secret" \
        --from-literal=POSTGRES_USER=postgres \
        --from-literal=POSTGRES_PASSWORD="$postgres_password" \
        --from-literal=POSTGRES_DB=reconciliation \
        --from-literal=DATABASE_URL="postgresql://postgres:${postgres_password}@postgres-service:5432/reconciliation?sslmode=disable" \
        --from-literal=CSRF_SECRET=$(openssl rand -base64 48) \
        --from-literal=PASSWORD_MASTER_KEY=$(openssl rand -base64 48) \
        --from-literal=REDIS_URL="redis://redis-service:6379/0" \
        -n "$NAMESPACE" || {
        log_error "Failed to create secrets"
        exit 1
    }
    
    log_success "Secrets created"
}

# ============================================================================
# UPDATE KUSTOMIZATION FOR LOCAL IMAGES
# ============================================================================

update_kustomization() {
    log_info "Updating kustomization for local images..."
    
    local kustomization_file="$PROJECT_ROOT/k8s/optimized/overlays/production/kustomization.yaml"
    local backup_file="${kustomization_file}.bak"
    
    # Create backup
    cp "$kustomization_file" "$backup_file"
    
    # Update image references to use local images
    sed -i.tmp \
        -e 's|newName:.*reconciliation-backend|newName: reconciliation-backend|g' \
        -e 's|newName:.*reconciliation-frontend|newName: reconciliation-frontend|g' \
        -e "s|newTag:.*|newTag: local|g" \
        "$kustomization_file"
    
    rm -f "${kustomization_file}.tmp"
    
    log_success "Kustomization updated for local images"
    log_info "Backup saved to: $backup_file"
}

# ============================================================================
# DEPLOY TO KUBERNETES
# ============================================================================

deploy_kubernetes() {
    log_info "Deploying to Kubernetes..."
    
    local k8s_overlay="$PROJECT_ROOT/k8s/optimized/overlays/production"
    cd "$k8s_overlay"
    
    # Apply using kubectl kustomize
    kubectl apply -k . || {
        log_error "Failed to apply Kubernetes manifests"
        exit 1
    }
    
    log_success "Kubernetes manifests applied"
}

# ============================================================================
# WAIT FOR ROLLOUT
# ============================================================================

wait_for_rollout() {
    log_info "Waiting for deployments to rollout..."
    
    # Wait for database
    if kubectl get statefulset postgres -n "$NAMESPACE" &> /dev/null; then
        log_info "Waiting for database..."
        kubectl rollout status statefulset/postgres -n "$NAMESPACE" --timeout=5m || {
            log_warning "Database rollout incomplete"
        }
    fi
    
    # Wait for Redis
    if kubectl get deployment redis -n "$NAMESPACE" &> /dev/null; then
        log_info "Waiting for Redis..."
        kubectl rollout status deployment/redis -n "$NAMESPACE" --timeout=3m || {
            log_warning "Redis rollout incomplete"
        }
    fi
    
    # Wait for backend
    log_info "Waiting for backend..."
    kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=10m || {
        log_error "Backend deployment failed"
        kubectl get pods -n "$NAMESPACE" -l component=backend
        exit 1
    }
    
    # Wait for frontend
    log_info "Waiting for frontend..."
    kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=10m || {
        log_error "Frontend deployment failed"
        kubectl get pods -n "$NAMESPACE" -l component=frontend
        exit 1
    }
    
    log_success "All deployments rolled out successfully"
}

# ============================================================================
# SHOW STATUS
# ============================================================================

show_status() {
    echo ""
    log_info "Deployment Status:"
    echo ""
    kubectl get pods -n "$NAMESPACE"
    echo ""
    kubectl get services -n "$NAMESPACE"
    echo ""
    
    # Get service URLs
    log_info "Service URLs:"
    minikube service list -n "$NAMESPACE" 2>/dev/null || {
        log_info "To access services, use:"
        log_info "  minikube service frontend-service -n $NAMESPACE"
        log_info "  minikube service backend-service -n $NAMESPACE"
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    echo "============================================================================"
    echo "MINIKUBE LOCAL DEPLOYMENT"
    echo "============================================================================"
    echo "Namespace: $NAMESPACE"
    echo "Version: $VERSION"
    echo "Started: $(date)"
    echo ""
    
    check_prerequisites
    build_images
    load_images
    create_namespace
    create_secrets
    update_kustomization
    deploy_kubernetes
    wait_for_rollout
    show_status
    
    echo ""
    echo "============================================================================"
    log_success "Deployment completed successfully!"
    echo "============================================================================"
    echo ""
    echo "Next steps:"
    echo "  1. Check pod status: kubectl get pods -n $NAMESPACE"
    echo "  2. View logs: kubectl logs -f -n $NAMESPACE deployment/backend"
    echo "  3. Access services: minikube service list -n $NAMESPACE"
    echo ""
}

# Run main function
main "$@"

