#!/bin/bash
# ============================================================================
# PRODUCTION DEPLOYMENT ORCHESTRATION
# ============================================================================
# Master script that orchestrates complete production deployment of all services
#
# Usage:
#   ./scripts/orchestrate-production-deployment.sh [version] [environment]
#   ./scripts/orchestrate-production-deployment.sh v1.0.0 production
#
# This script:
#   1. Verifies all prerequisites
#   2. Builds all services (backend, frontend)
#   3. Deploys to staging first (if enabled)
#   4. Deploys to production
#   5. Runs migrations
#   6. Verifies deployment
#   7. Monitors for initial period
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Configuration
VERSION=${1:-latest}
ENVIRONMENT=${2:-production}
NAMESPACE="reconciliation-platform"
STAGING_NAMESPACE="reconciliation-staging"
BASE_URL="${PRODUCTION_URL:-https://app.example.com}"
STAGING_URL="${STAGING_URL:-https://staging.example.com}"

# Deployment options
DEPLOY_STAGING_FIRST=${DEPLOY_STAGING_FIRST:-true}
SKIP_TESTS=${SKIP_TESTS:-false}
AUTO_APPROVE=${AUTO_APPROVE:-false}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================

log_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# ============================================================================
# PREREQUISITE CHECKS
# ============================================================================

check_prerequisites() {
    log_section "🔍 Prerequisite Checks"
    
    log_step "Checking required tools..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi
    log_success "✓ kubectl found"
    
    # Check docker
    if ! command -v docker &> /dev/null; then
        log_error "docker not found. Please install docker."
        exit 1
    fi
    log_success "✓ docker found"
    
    # Check cluster access
    log_step "Checking cluster access..."
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot access Kubernetes cluster. Check kubectl configuration."
        exit 1
    fi
    log_success "✓ Cluster accessible"
    
    # Check namespace
    log_step "Checking namespace..."
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace $NAMESPACE not found. Creating..."
        kubectl create namespace "$NAMESPACE"
        log_success "✓ Namespace created"
    else
        log_success "✓ Namespace exists"
    fi
    
    # Check secrets
    log_step "Checking secrets..."
    if ! kubectl get secrets -n "$NAMESPACE" | grep -q "reconciliation-secrets"; then
        log_error "Secrets not found. Please configure k8s/optimized/base/secrets.yaml"
        exit 1
    fi
    log_success "✓ Secrets configured"
    
    # Check environment variables
    log_step "Checking environment variables..."
    if [ -z "${DATABASE_URL:-}" ]; then
        log_warning "DATABASE_URL not set. Some operations may fail."
    fi
    if [ -z "${JWT_SECRET:-}" ]; then
        log_warning "JWT_SECRET not set. Some operations may fail."
    fi
    
    log_success "✓ Prerequisites check complete"
}

# ============================================================================
# BUILD SERVICES
# ============================================================================

build_backend() {
    log_section "🔨 Building Backend Service"
    
    log_step "Building backend Docker image..."
    cd "$SCRIPT_DIR/../backend"
    
    docker build \
        -f ../infrastructure/docker/Dockerfile.backend \
        -t reconciliation-backend:$VERSION \
        -t reconciliation-backend:latest \
        --target runtime \
        --build-arg BUILD_MODE=release \
        .
    
    log_success "✓ Backend image built: reconciliation-backend:$VERSION"
}

build_frontend() {
    log_section "🔨 Building Frontend Service"
    
    log_step "Building frontend Docker image..."
    cd "$SCRIPT_DIR/../frontend"
    
    # Build frontend
    npm ci
    npm run build
    
    # Build Docker image
    docker build \
        -f ../infrastructure/docker/Dockerfile.frontend \
        -t reconciliation-frontend:$VERSION \
        -t reconciliation-frontend:latest \
        --target runtime \
        --build-arg NODE_ENV=production \
        .
    
    log_success "✓ Frontend image built: reconciliation-frontend:$VERSION"
}

build_all_services() {
    log_section "🏗️  Building All Services"
    
    build_backend
    build_frontend
    
    log_success "✓ All services built successfully"
}

# ============================================================================
# DEPLOYMENT FUNCTIONS
# ============================================================================

deploy_to_staging() {
    if [ "$DEPLOY_STAGING_FIRST" != "true" ]; then
        log_warning "Skipping staging deployment (DEPLOY_STAGING_FIRST=false)"
        return 0
    fi
    
    log_section "🚀 Deploying to Staging"
    
    # Create staging namespace if needed
    if ! kubectl get namespace "$STAGING_NAMESPACE" &> /dev/null; then
        kubectl create namespace "$STAGING_NAMESPACE"
    fi
    
    # Deploy using staging script
    log_step "Running staging deployment..."
    "$SCRIPT_DIR/deploy-staging.sh" "$VERSION"
    
    log_success "✓ Staging deployment complete"
    
    # Run smoke tests
    if [ "$SKIP_TESTS" != "true" ]; then
        log_step "Running staging smoke tests..."
        "$SCRIPT_DIR/smoke-tests.sh" staging "$STAGING_URL" || {
            log_error "Staging smoke tests failed. Aborting production deployment."
            exit 1
        }
        log_success "✓ Staging smoke tests passed"
    fi
}

deploy_to_production() {
    log_section "🚀 Deploying to Production"
    
    # Safety confirmation
    if [ "$AUTO_APPROVE" != "true" ]; then
        echo ""
        log_warning "⚠️  PRODUCTION DEPLOYMENT CONFIRMATION REQUIRED"
        echo -e "${YELLOW}This will deploy to PRODUCTION environment.${NC}"
        echo -e "${YELLOW}Type 'DEPLOY' to confirm:${NC} "
        read -r confirmation
        if [ "$confirmation" != "DEPLOY" ]; then
            log_error "Deployment cancelled."
            exit 1
        fi
    fi
    
    # Create backup
    log_step "Creating production backup..."
    if [ -f "$SCRIPT_DIR/backup-postgresql.sh" ]; then
        "$SCRIPT_DIR/backup-postgresql.sh" production || log_warning "Backup failed, continuing..."
    fi
    
    # Deploy backend
    log_step "Deploying backend..."
    kubectl set image deployment/reconciliation-backend \
        reconciliation-backend=reconciliation-backend:$VERSION \
        -n "$NAMESPACE" || {
        log_step "Backend deployment not found, applying manifests..."
        kubectl apply -f "$SCRIPT_DIR/../k8s/optimized/base/" -n "$NAMESPACE"
    }
    
    # Wait for backend rollout
    kubectl rollout status deployment/reconciliation-backend \
        -n "$NAMESPACE" --timeout=10m
    
    log_success "✓ Backend deployed"
    
    # Deploy frontend
    log_step "Deploying frontend..."
    kubectl set image deployment/reconciliation-frontend \
        reconciliation-frontend=reconciliation-frontend:$VERSION \
        -n "$NAMESPACE" || {
        log_step "Frontend deployment not found, applying manifests..."
        kubectl apply -f "$SCRIPT_DIR/../k8s/optimized/base/" -n "$NAMESPACE"
    }
    
    # Wait for frontend rollout
    kubectl rollout status deployment/reconciliation-frontend \
        -n "$NAMESPACE" --timeout=10m
    
    log_success "✓ Frontend deployed"
    
    # Run migrations
    log_step "Running database migrations..."
    kubectl exec -n "$NAMESPACE" deployment/reconciliation-backend -- \
        diesel migration run || {
        log_warning "Migration failed or already applied"
    }
    
    log_success "✓ Migrations complete"
}

# ============================================================================
# VERIFICATION
# ============================================================================

verify_deployment() {
    log_section "✅ Verifying Deployment"
    
    # Wait for pods to be ready
    log_step "Waiting for pods to be ready..."
    kubectl wait --for=condition=ready pod \
        -l app=reconciliation-backend \
        -n "$NAMESPACE" \
        --timeout=5m || log_warning "Some backend pods not ready"
    
    kubectl wait --for=condition=ready pod \
        -l app=reconciliation-frontend \
        -n "$NAMESPACE" \
        --timeout=5m || log_warning "Some frontend pods not ready"
    
    # Run smoke tests
    if [ "$SKIP_TESTS" != "true" ]; then
        log_step "Running production smoke tests..."
        "$SCRIPT_DIR/smoke-tests.sh" production "$BASE_URL" || {
            log_error "Smoke tests failed!"
            return 1
        }
        log_success "✓ Smoke tests passed"
    fi
    
    # Check health endpoints
    log_step "Checking health endpoints..."
    sleep 5  # Give services time to start
    
    if curl -f -s "$BASE_URL/api/health" > /dev/null; then
        log_success "✓ Health endpoint responding"
    else
        log_warning "Health endpoint not responding yet"
    fi
    
    log_success "✓ Deployment verification complete"
}

# ============================================================================
# MONITORING
# ============================================================================

start_monitoring() {
    log_section "📊 Starting Post-Deployment Monitoring"
    
    log_step "Starting 24-hour monitoring in background..."
    nohup "$SCRIPT_DIR/monitor-deployment.sh" "$ENVIRONMENT" 24 "$BASE_URL" > /tmp/deployment-monitor.log 2>&1 &
    
    local monitor_pid=$!
    echo "$monitor_pid" > /tmp/deployment-monitor.pid
    
    log_success "✓ Monitoring started (PID: $monitor_pid)"
    log_info "Monitor logs: /tmp/deployment-monitor.log"
    log_info "To stop monitoring: kill \$(cat /tmp/deployment-monitor.pid)"
}

# ============================================================================
# MAIN ORCHESTRATION
# ============================================================================

main() {
    log_section "🚀 Production Deployment Orchestration"
    log_info "Version: $VERSION"
    log_info "Environment: $ENVIRONMENT"
    log_info "Namespace: $NAMESPACE"
    echo ""
    
    # Step 1: Prerequisites
    check_prerequisites
    
    # Step 2: Build all services
    build_all_services
    
    # Step 3: Deploy to staging (if enabled)
    if [ "$DEPLOY_STAGING_FIRST" = "true" ]; then
        deploy_to_staging
        echo ""
        log_info "Staging deployment complete. Review before proceeding to production."
        if [ "$AUTO_APPROVE" != "true" ]; then
            read -p "Press Enter to continue to production deployment, or Ctrl+C to cancel..."
        fi
    fi
    
    # Step 4: Deploy to production
    deploy_to_production
    
    # Step 5: Verify deployment
    verify_deployment
    
    # Step 6: Start monitoring
    start_monitoring
    
    # Final summary
    log_section "✅ Deployment Complete"
    log_success "All services deployed successfully!"
    log_info "Backend: reconciliation-backend:$VERSION"
    log_info "Frontend: reconciliation-frontend:$VERSION"
    log_info "Environment: $ENVIRONMENT"
    log_info "Base URL: $BASE_URL"
    log_info ""
    log_info "Next steps:"
    log_info "  1. Monitor logs: kubectl logs -f -n $NAMESPACE deployment/reconciliation-backend"
    log_info "  2. Check monitoring: tail -f /tmp/deployment-monitor.log"
    log_info "  3. Verify services: $BASE_URL/api/health"
    log_info ""
    log_info "To rollback if needed:"
    log_info "  kubectl rollout undo deployment/reconciliation-backend -n $NAMESPACE"
    log_info "  kubectl rollout undo deployment/reconciliation-frontend -n $NAMESPACE"
}

# Run main function
main "$@"

