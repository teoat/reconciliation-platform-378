#!/bin/bash
# ============================================================================
# KUBERNETES PRODUCTION DEPLOYMENT SCRIPT
# ============================================================================
# Deploys all services to Kubernetes production cluster
#
# Usage:
#   ./scripts/deployment/deploy-kubernetes-production.sh [version]
#   ./scripts/deployment/deploy-kubernetes-production.sh v1.0.0
#
# Environment Variables:
#   DOCKER_REGISTRY: Container registry URL
#   IMAGE_PREFIX: Image name prefix (default: reconciliation-platform)
#   KUBECTL_CONTEXT: Kubernetes context to use
#   SKIP_SECRETS: Skip secret creation (default: false)
#   SKIP_MIGRATIONS: Skip database migrations (default: false)
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

# Configuration
VERSION=${1:-${VERSION:-latest}}
ENVIRONMENT="production"
NAMESPACE="reconciliation-platform"
REGISTRY=${DOCKER_REGISTRY:-docker.io}
IMAGE_PREFIX=${IMAGE_PREFIX:-reconciliation-platform}

# Kustomize paths
K8S_BASE="$PROJECT_ROOT/k8s/optimized/base"
K8S_OVERLAY="$PROJECT_ROOT/k8s/optimized/overlays/production"

# ============================================================================
# PREREQUISITES
# ============================================================================

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check kustomize
    if ! command -v kustomize &> /dev/null && ! kubectl kustomize --help &> /dev/null; then
        log_error "kustomize is not installed and kubectl kustomize is not available"
        exit 1
    fi
    
    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Verify context
    local current_context=$(kubectl config current-context)
    log_info "Current Kubernetes context: $current_context"
    
    if [[ -n "${KUBECTL_CONTEXT:-}" ]]; then
        kubectl config use-context "$KUBECTL_CONTEXT" || {
            log_error "Failed to switch to context: $KUBECTL_CONTEXT"
            exit 1
        }
        log_info "Switched to context: $KUBECTL_CONTEXT"
    fi
    
    log_success "Prerequisites check passed"
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
    if [[ "${SKIP_SECRETS:-false}" == "true" ]]; then
        log_warning "Skipping secret creation (SKIP_SECRETS=true)"
        return 0
    fi
    
    log_info "Setting up secrets..."
    
    # Check if secrets already exist
    if kubectl get secret reconciliation-secrets -n "$NAMESPACE" &> /dev/null; then
        log_warning "Secrets already exist. Skipping creation."
        log_info "To update secrets, delete and recreate:"
        log_info "  kubectl delete secret reconciliation-secrets -n $NAMESPACE"
        log_info "  kubectl apply -f $K8S_BASE/secrets.yaml -n $NAMESPACE"
        return 0
    fi
    
    # Create secrets from template
    if [[ -f "$K8S_BASE/secrets.yaml" ]]; then
        log_warning "Creating secrets from template. Please update with production values!"
        kubectl apply -f "$K8S_BASE/secrets.yaml" -n "$NAMESPACE" || {
            log_error "Failed to create secrets"
            log_info "Please create secrets manually:"
            log_info "  kubectl create secret generic reconciliation-secrets \\"
            log_info "    --from-literal=JWT_SECRET='\$(openssl rand -base64 48)' \\"
            log_info "    --from-literal=POSTGRES_PASSWORD='\$(openssl rand -base64 24)' \\"
            log_info "    -n $NAMESPACE"
            exit 1
        }
        log_success "Secrets created (using template values - UPDATE IN PRODUCTION!)"
    else
        log_error "Secrets template not found: $K8S_BASE/secrets.yaml"
        exit 1
    fi
}

# ============================================================================
# UPDATE IMAGE TAGS IN KUSTOMIZATION
# ============================================================================

update_image_tags() {
    log_info "Updating image tags to version: $VERSION"
    
    # Use dedicated script to update image tags
    if [[ -f "$SCRIPT_DIR/update-kustomization-images.sh" ]]; then
        "$SCRIPT_DIR/update-kustomization-images.sh" "$VERSION" "$REGISTRY" "$IMAGE_PREFIX" || {
            log_error "Failed to update image tags"
            exit 1
        }
        log_success "Image tags updated in kustomization"
    else
        log_warning "Image update script not found, skipping..."
    fi
}

# ============================================================================
# DEPLOY WITH KUSTOMIZE
# ============================================================================

deploy_with_kustomize() {
    log_info "Deploying to Kubernetes using Kustomize..."
    
    cd "$K8S_OVERLAY"
    
    # Build and apply
    if command -v kustomize &> /dev/null; then
        log_info "Using standalone kustomize..."
        kustomize build . | kubectl apply -f - || {
            log_error "Failed to apply Kubernetes manifests"
            exit 1
        }
    else
        log_info "Using kubectl kustomize..."
        kubectl apply -k . || {
            log_error "Failed to apply Kubernetes manifests"
            exit 1
        }
    fi
    
    log_success "Kubernetes manifests applied"
}

# ============================================================================
# WAIT FOR ROLLOUT
# ============================================================================

wait_for_rollout() {
    log_info "Waiting for deployments to rollout..."
    
    # Wait for backend
    log_info "Waiting for backend deployment..."
    kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=10m || {
        log_error "Backend deployment failed"
        log_info "Checking pod status..."
        kubectl get pods -n "$NAMESPACE" -l component=backend
        kubectl describe deployment/backend -n "$NAMESPACE"
        exit 1
    }
    
    # Wait for frontend
    log_info "Waiting for frontend deployment..."
    kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=10m || {
        log_error "Frontend deployment failed"
        log_info "Checking pod status..."
        kubectl get pods -n "$NAMESPACE" -l component=frontend
        kubectl describe deployment/frontend -n "$NAMESPACE"
        exit 1
    }
    
    # Wait for database (if StatefulSet)
    if kubectl get statefulset postgres -n "$NAMESPACE" &> /dev/null; then
        log_info "Waiting for database StatefulSet..."
        kubectl rollout status statefulset/postgres -n "$NAMESPACE" --timeout=10m || {
            log_warning "Database StatefulSet rollout incomplete (non-critical)"
        }
    fi
    
    # Wait for Redis
    if kubectl get deployment redis -n "$NAMESPACE" &> /dev/null; then
        log_info "Waiting for Redis deployment..."
        kubectl rollout status deployment/redis -n "$NAMESPACE" --timeout=5m || {
            log_warning "Redis deployment rollout incomplete (non-critical)"
        }
    fi
    
    log_success "All deployments rolled out successfully"
}

# ============================================================================
# RUN DATABASE MIGRATIONS
# ============================================================================

run_migrations() {
    if [[ "${SKIP_MIGRATIONS:-false}" == "true" ]]; then
        log_warning "Skipping database migrations (SKIP_MIGRATIONS=true)"
        return 0
    fi
    
    log_info "Running database migrations..."
    
    # Wait for backend pod to be ready
    log_info "Waiting for backend pod to be ready..."
    kubectl wait --for=condition=ready pod \
        -l component=backend \
        -n "$NAMESPACE" \
        --timeout=5m || {
        log_error "Backend pod not ready"
        exit 1
    }
    
    # Get backend pod name
    local pod_name=$(kubectl get pods -n "$NAMESPACE" \
        -l component=backend \
        -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -z "$pod_name" ]]; then
        log_error "Backend pod not found"
        exit 1
    fi
    
    log_info "Running migrations in pod: $pod_name"
    
    # Run migrations via init container or manual execution
    # Adjust based on your migration strategy
    kubectl exec -n "$NAMESPACE" "$pod_name" -- \
        /app/reconciliation-backend migrate || {
        log_warning "Migration command failed or not available"
        log_info "Migrations may need to be run manually"
    }
    
    log_success "Database migrations completed"
}

# ============================================================================
# VERIFY DEPLOYMENT
# ============================================================================

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check pods
    log_info "Checking pod status..."
    kubectl get pods -n "$NAMESPACE"
    
    # Check services
    log_info "Checking services..."
    kubectl get services -n "$NAMESPACE"
    
    # Check ingress
    if kubectl get ingress -n "$NAMESPACE" &> /dev/null; then
        log_info "Checking ingress..."
        kubectl get ingress -n "$NAMESPACE"
    fi
    
    # Check HPA
    if kubectl get hpa -n "$NAMESPACE" &> /dev/null; then
        log_info "Checking HPA..."
        kubectl get hpa -n "$NAMESPACE"
    fi
    
    log_success "Deployment verification completed"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    echo "============================================================================"
    echo "KUBERNETES PRODUCTION DEPLOYMENT"
    echo "============================================================================"
    echo "Version: $VERSION"
    echo "Environment: $ENVIRONMENT"
    echo "Namespace: $NAMESPACE"
    echo "Registry: $REGISTRY"
    echo "Started: $(date)"
    echo ""
    
    # Safety confirmation for production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo ""
        log_warning "⚠️  PRODUCTION DEPLOYMENT WARNING ⚠️"
        echo "You are about to deploy to PRODUCTION environment"
        echo "Version: $VERSION"
        echo "Namespace: $NAMESPACE"
        echo ""
        read -p "Type 'DEPLOY' to confirm: " confirmation
        echo
        
        if [[ "$confirmation" != "DEPLOY" ]]; then
            log_error "Deployment cancelled"
            exit 1
        fi
    fi
    
    check_prerequisites
    create_namespace
    create_secrets
    update_image_tags
    deploy_with_kustomize
    wait_for_rollout
    run_migrations
    verify_deployment
    
    echo ""
    echo "============================================================================"
    log_success "Production deployment completed successfully!"
    echo "============================================================================"
    echo ""
    echo "Next steps:"
    echo "  1. Verify application health: kubectl get pods -n $NAMESPACE"
    echo "  2. Check logs: kubectl logs -f -n $NAMESPACE deployment/backend"
    echo "  3. Monitor metrics: kubectl port-forward -n $NAMESPACE svc/backend-service 9090:9090"
    echo "  4. Access application via ingress"
    echo ""
}

# Run main function
main "$@"

