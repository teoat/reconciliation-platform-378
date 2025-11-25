#!/bin/bash
# ============================================================================
# COMPREHENSIVE SECRET FIX SCRIPT
# ============================================================================
# Fixes all secret-related issues across the deployment
# - Synchronizes all derived secrets
# - Validates consistency
# - Fixes placeholder values
# - Restarts affected services
#
# Usage:
#   ./scripts/deployment/fix-all-secrets.sh [namespace] [--restart]
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

NAMESPACE=${1:-reconciliation-platform}
RESTART_SERVICES=${2:-}

# ============================================================================
# FIX PLACEHOLDER VALUES
# ============================================================================

fix_placeholder_secrets() {
    log_info "Checking for placeholder values..."
    
    local fixed=0
    
    # Get all secret keys
    local secret_keys=$(kubectl get secret reconciliation-secrets -n "$NAMESPACE" \
        -o jsonpath='{.data}' | jq -r 'keys[]' 2>/dev/null || echo "")
    
    if [[ -z "$secret_keys" ]]; then
        log_error "Cannot read secrets"
        return 1
    fi
    
    # Check each secret for placeholder values
    while IFS= read -r key; do
        local value=$(kubectl get secret reconciliation-secrets -n "$NAMESPACE" \
            -o jsonpath="{.data.$key}" 2>/dev/null | base64 -d 2>/dev/null || echo "")
        
        if [[ "$value" == *"CHANGE_ME"* ]]; then
            log_warning "Found placeholder value in $key"
            
            # Generate appropriate replacement based on key type
            case "$key" in
                JWT_SECRET|JWT_REFRESH_SECRET|CSRF_SECRET|PASSWORD_MASTER_KEY)
                    local new_value=$(openssl rand -base64 48)
                    log_info "Generating new $key (48 chars)"
                    ;;
                POSTGRES_PASSWORD)
                    local new_value=$(openssl rand -base64 24)
                    log_info "Generating new $key (24 chars)"
                    ;;
                *)
                    log_warning "Unknown secret type: $key, skipping auto-fix"
                    continue
                    ;;
            esac
            
            # Update secret
            if kubectl patch secret reconciliation-secrets -n "$NAMESPACE" --type='json' \
                -p="[{\"op\": \"replace\", \"path\": \"/data/$key\", \"value\": \"$(echo -n "$new_value" | base64)\"}]" 2>/dev/null; then
                log_success "Fixed placeholder in $key"
                fixed=$((fixed + 1))
            else
                log_error "Failed to fix $key"
            fi
        fi
    done <<< "$secret_keys"
    
    if [[ $fixed -gt 0 ]]; then
        log_success "Fixed $fixed placeholder value(s)"
        return 0
    else
        log_info "No placeholder values found"
        return 0
    fi
}

# ============================================================================
# MAIN FIX PROCESS
# ============================================================================

main() {
    echo "============================================================================"
    echo "COMPREHENSIVE SECRET FIX"
    echo "============================================================================"
    echo "Namespace: $NAMESPACE"
    echo ""
    
    # Step 1: Fix placeholder values
    log_info "Step 1: Fixing placeholder values..."
    fix_placeholder_secrets
    
    # Step 2: Synchronize all secrets
    log_info "Step 2: Synchronizing derived secrets..."
    if [[ -f "$SCRIPT_DIR/sync-secrets.sh" ]]; then
        "$SCRIPT_DIR/sync-secrets.sh" "$NAMESPACE" sync || {
            log_warning "Some secrets had synchronization issues"
        }
    else
        log_error "sync-secrets.sh not found"
        exit 1
    fi
    
    # Step 3: Validate all secrets
    log_info "Step 3: Validating all secrets..."
    if [[ -f "$SCRIPT_DIR/validate-secrets.sh" ]]; then
        "$SCRIPT_DIR/validate-secrets.sh" "$NAMESPACE" || {
            log_warning "Some validation checks failed"
        }
    fi
    
    # Step 4: Restart services if requested
    if [[ "$RESTART_SERVICES" == "--restart" ]]; then
        log_info "Step 4: Restarting affected services..."
        
        # Restart backend (uses DATABASE_URL, JWT secrets)
        log_info "Restarting backend pods..."
        kubectl delete pods -n "$NAMESPACE" -l component=backend --wait=false 2>/dev/null || true
        
        # Restart frontend (uses VITE_GOOGLE_CLIENT_ID)
        log_info "Restarting frontend pods..."
        kubectl delete pods -n "$NAMESPACE" -l component=frontend --wait=false 2>/dev/null || true
        
        log_success "Services restart initiated"
    fi
    
    echo ""
    echo "============================================================================"
    log_success "Secret fix completed!"
    echo "============================================================================"
    echo ""
    echo "Next steps:"
    echo "  1. Check pod status: kubectl get pods -n $NAMESPACE"
    echo "  2. View logs: kubectl logs -n $NAMESPACE deployment/backend"
    echo "  3. Validate connectivity: ./scripts/deployment/validate-secrets.sh $NAMESPACE"
    echo ""
}

main "$@"

