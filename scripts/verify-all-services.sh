#!/bin/bash
# ============================================================================
# VERIFY ALL SERVICES
# ============================================================================
# Comprehensive verification of all deployed services
#
# Usage:
#   ./scripts/verify-all-services.sh [environment] [base_url]
#   ./scripts/verify-all-services.sh production https://app.example.com
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

ENVIRONMENT=${1:-production}
BASE_URL=${2:-${PRODUCTION_URL:-https://app.example.com}}
NAMESPACE="reconciliation-platform"

log_section "🔍 Verifying All Services"

# 1. Kubernetes Resources
log_step "Checking Kubernetes resources..."
kubectl get pods -n "$NAMESPACE"
kubectl get services -n "$NAMESPACE"
kubectl get deployments -n "$NAMESPACE"

# 2. Pod Health
log_step "Checking pod health..."
kubectl get pods -n "$NAMESPACE" -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\t"}{.status.containerStatuses[0].ready}{"\n"}{end}'

# 3. Health Endpoints
log_step "Checking health endpoints..."
curl -f "$BASE_URL/api/health" && log_success "✓ Backend health OK" || log_error "✗ Backend health failed"
curl -f "$BASE_URL/" && log_success "✓ Frontend OK" || log_error "✗ Frontend failed"

# 4. Database Connectivity
log_step "Checking database connectivity..."
kubectl exec -n "$NAMESPACE" deployment/reconciliation-backend -- \
    psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1 && \
    log_success "✓ Database connected" || log_error "✗ Database connection failed"

# 5. Redis Connectivity
log_step "Checking Redis connectivity..."
kubectl exec -n "$NAMESPACE" deployment/reconciliation-backend -- \
    redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1 && \
    log_success "✓ Redis connected" || log_warning "⚠ Redis check skipped"

# 6. Smoke Tests
log_step "Running smoke tests..."
"$SCRIPT_DIR/smoke-tests.sh" "$ENVIRONMENT" "$BASE_URL"

log_success "✓ All services verified"

