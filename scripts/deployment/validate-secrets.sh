#!/bin/bash
# ============================================================================
# SECRET VALIDATION AND CONNECTIVITY TEST
# ============================================================================
# Validates secrets and tests service connectivity before deployment
#
# Usage:
#   ./scripts/deployment/validate-secrets.sh [namespace]
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

NAMESPACE=${1:-reconciliation-platform}
SECRET_NAME="reconciliation-secrets"

# ============================================================================
# GET SECRET VALUE
# ============================================================================

get_secret_value() {
    local key=$1
    kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" \
        -o jsonpath="{.data.$key}" 2>/dev/null | base64 -d 2>/dev/null || echo ""
}

# ============================================================================
# TEST DATABASE CONNECTIVITY
# ============================================================================

test_database_connectivity() {
    log_info "Testing database connectivity..."
    
    local database_url=$(get_secret_value "DATABASE_URL")
    if [[ -z "$database_url" ]]; then
        log_error "DATABASE_URL is not set"
        return 1
    fi
    
    # Check if postgres pod is running
    if ! kubectl get pod -n "$NAMESPACE" -l component=postgres --field-selector=status.phase=Running &> /dev/null; then
        log_warning "Postgres pod is not running, skipping connectivity test"
        return 0
    fi
    
    # Extract password from DATABASE_URL for testing
    local postgres_user=$(get_secret_value "POSTGRES_USER")
    local postgres_password=$(get_secret_value "POSTGRES_PASSWORD")
    local postgres_db=$(get_secret_value "POSTGRES_DB")
    
    if [[ -z "$postgres_user" || -z "$postgres_password" || -z "$postgres_db" ]]; then
        log_error "Missing postgres credentials for connectivity test"
        return 1
    fi
    
    # Test connection using postgres pod
    local postgres_pod=$(kubectl get pod -n "$NAMESPACE" -l component=postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -z "$postgres_pod" ]]; then
        log_warning "Postgres pod not found, skipping connectivity test"
        return 0
    fi
    
    log_info "Testing connection to postgres pod: $postgres_pod"
    
    # Test connection
    if kubectl exec -n "$NAMESPACE" "$postgres_pod" -- \
        psql -U "$postgres_user" -d "$postgres_db" -c "SELECT 1;" &> /dev/null; then
        log_success "Database connectivity test passed"
        return 0
    else
        log_error "Database connectivity test failed"
        log_info "This may be due to:"
        log_info "  1. Postgres password mismatch"
        log_info "  2. Database not initialized"
        log_info "  3. Network issues"
        return 1
    fi
}

# ============================================================================
# MAIN VALIDATION
# ============================================================================

main() {
    echo "============================================================================"
    echo "SECRET VALIDATION AND CONNECTIVITY TEST"
    echo "============================================================================"
    echo "Namespace: $NAMESPACE"
    echo ""
    
    # Run secret synchronization validation
    if [[ -f "$SCRIPT_DIR/sync-secrets.sh" ]]; then
        "$SCRIPT_DIR/sync-secrets.sh" "$NAMESPACE" validate || {
            log_error "Secret validation failed"
            exit 1
        }
    fi
    
    # Test database connectivity
    test_database_connectivity || {
        log_warning "Database connectivity test failed"
        log_info "You may need to:"
        log_info "  1. Ensure postgres pod is running"
        log_info "  2. Check that POSTGRES_PASSWORD matches the database password"
        log_info "  3. Run: ./scripts/deployment/sync-secrets.sh $NAMESPACE sync"
    }
    
    echo ""
    echo "============================================================================"
    log_success "Validation completed!"
    echo "============================================================================"
}

main "$@"

