#!/bin/bash
# ============================================================================
# COMPREHENSIVE DEPLOYMENT DIAGNOSTIC
# ============================================================================
# Diagnoses all potential issues in the deployment
# - Secret synchronization issues
# - Configuration mismatches
# - Service connectivity problems
# - Resource constraints
# - Missing dependencies
#
# Usage:
#   ./scripts/deployment/diagnose-deployment.sh [namespace]
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

NAMESPACE=${1:-reconciliation-platform}
ISSUES_FOUND=0
WARNINGS_FOUND=0

# ============================================================================
# DIAGNOSTIC FUNCTIONS
# ============================================================================

check_secret_synchronization() {
    log_info "Checking secret synchronization..."
    
    if [[ -f "$SCRIPT_DIR/sync-secrets.sh" ]]; then
        if "$SCRIPT_DIR/sync-secrets.sh" "$NAMESPACE" validate 2>&1 | grep -q "error\|Error\|ERROR"; then
            log_error "Secret synchronization issues found"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
            return 1
        else
            log_success "Secret synchronization OK"
            return 0
        fi
    else
        log_warning "sync-secrets.sh not found, skipping check"
        WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
        return 0
    fi
}

check_configmap_consistency() {
    log_info "Checking ConfigMap consistency..."
    
    local vite_api_url=$(kubectl get configmap reconciliation-config -n "$NAMESPACE" \
        -o jsonpath='{.data.VITE_API_URL}' 2>/dev/null || echo "")
    local vite_ws_url=$(kubectl get configmap reconciliation-config -n "$NAMESPACE" \
        -o jsonpath='{.data.VITE_WS_URL}' 2>/dev/null || echo "")
    
    # Check if URLs match expected service names
    if [[ "$vite_api_url" != *"backend-service"* ]] && [[ "$vite_api_url" != *"localhost"* ]]; then
        log_warning "VITE_API_URL may not match backend service: $vite_api_url"
        WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
    fi
    
    if [[ "$vite_ws_url" != *"backend-service"* ]] && [[ "$vite_ws_url" != *"localhost"* ]]; then
        log_warning "VITE_WS_URL may not match backend service: $vite_ws_url"
        WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
    fi
    
    log_success "ConfigMap consistency check completed"
}

check_service_endpoints() {
    log_info "Checking service endpoints..."
    
    local services=("backend-service" "frontend-service" "postgres-service" "redis-service")
    local missing=0
    
    for service in "${services[@]}"; do
        if kubectl get service "$service" -n "$NAMESPACE" &> /dev/null; then
            local endpoints=$(kubectl get endpoints "$service" -n "$NAMESPACE" \
                -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null || echo "")
            
            if [[ -z "$endpoints" ]]; then
                log_warning "Service $service has no endpoints (pods may not be ready)"
                WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
            else
                log_success "Service $service has endpoints"
            fi
        else
            log_error "Service $service not found"
            missing=$((missing + 1))
        fi
    done
    
    if [[ $missing -gt 0 ]]; then
        ISSUES_FOUND=$((ISSUES_FOUND + $missing))
        return 1
    fi
    
    return 0
}

check_pod_health() {
    log_info "Checking pod health..."
    
    local unhealthy=0
    
    # Check all pods
    while IFS= read -r line; do
        local name=$(echo "$line" | awk '{print $1}')
        local status=$(echo "$line" | awk '{print $3}')
        local restarts=$(echo "$line" | awk '{print $4}')
        
        if [[ "$status" != "Running" ]] && [[ "$status" != "Completed" ]]; then
            log_error "Pod $name is not healthy: $status"
            unhealthy=$((unhealthy + 1))
        fi
        
        if [[ "$restarts" != "0" ]] && [[ "$restarts" != "<none>" ]]; then
            log_warning "Pod $name has restarted $restarts times"
            WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
        fi
    done < <(kubectl get pods -n "$NAMESPACE" --no-headers 2>/dev/null || echo "")
    
    if [[ $unhealthy -gt 0 ]]; then
        ISSUES_FOUND=$((ISSUES_FOUND + $unhealthy))
        return 1
    fi
    
    log_success "All pods are healthy"
    return 0
}

check_resource_constraints() {
    log_info "Checking resource constraints..."
    
    local constrained=0
    
    # Check for pods in Pending state due to resources
    local pending=$(kubectl get pods -n "$NAMESPACE" --field-selector=status.phase=Pending --no-headers 2>/dev/null | wc -l | tr -d ' ')
    
    if [[ "$pending" -gt 0 ]]; then
        log_warning "$pending pod(s) in Pending state (may be resource constraints)"
        WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
        
        # Check events for resource issues
        kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' 2>/dev/null | \
            grep -i "insufficient\|resource" | tail -5 | while read -r line; do
            log_warning "Resource issue: $line"
        done
    fi
    
    return 0
}

check_storage() {
    log_info "Checking storage..."
    
    # Check PVCs
    local pending_pvcs=$(kubectl get pvc -n "$NAMESPACE" --no-headers 2>/dev/null | \
        grep -c "Pending" || echo "0")
    
    if [[ "$pending_pvcs" -gt 0 ]]; then
        log_error "$pending_pvcs PVC(s) in Pending state"
        ISSUES_FOUND=$((ISSUES_FOUND + $pending_pvcs))
        return 1
    fi
    
    log_success "Storage check passed"
    return 0
}

check_network_policies() {
    log_info "Checking network policies..."
    
    # Check if network policies might be blocking traffic
    local network_policies=$(kubectl get networkpolicies -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l | tr -d ' ')
    
    if [[ "$network_policies" -gt 0 ]]; then
        log_info "Found $network_policies network policy/policies (may affect connectivity)"
        WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
    fi
    
    return 0
}

check_image_pull() {
    log_info "Checking image availability..."
    
    local images=("reconciliation-backend:local" "reconciliation-frontend:local" "postgres:15-alpine" "redis:7-alpine")
    local missing=0
    
    for image in "${images[@]}"; do
        local image_name=$(echo "$image" | cut -d: -f1)
        if ! docker images | grep -q "^${image_name}"; then
            log_warning "Image $image not found locally"
            WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
        fi
    done
    
    return 0
}

# ============================================================================
# MAIN DIAGNOSTIC
# ============================================================================

main() {
    echo "============================================================================"
    echo "COMPREHENSIVE DEPLOYMENT DIAGNOSTIC"
    echo "============================================================================"
    echo "Namespace: $NAMESPACE"
    echo "Started: $(date)"
    echo ""
    
    # Run all diagnostic checks
    check_secret_synchronization
    check_configmap_consistency
    check_service_endpoints
    check_pod_health
    check_resource_constraints
    check_storage
    check_network_policies
    check_image_pull
    
    echo ""
    echo "============================================================================"
    echo "DIAGNOSTIC SUMMARY"
    echo "============================================================================"
    echo "Issues Found: $ISSUES_FOUND"
    echo "Warnings: $WARNINGS_FOUND"
    echo ""
    
    if [[ $ISSUES_FOUND -eq 0 && $WARNINGS_FOUND -eq 0 ]]; then
        log_success "No issues found! Deployment looks healthy."
        return 0
    elif [[ $ISSUES_FOUND -eq 0 ]]; then
        log_warning "Deployment has $WARNINGS_FOUND warning(s) but no critical issues"
        return 0
    else
        log_error "Deployment has $ISSUES_FOUND critical issue(s) and $WARNINGS_FOUND warning(s)"
        echo ""
        echo "Recommended actions:"
        echo "  1. Run: ./scripts/deployment/fix-all-secrets.sh $NAMESPACE"
        echo "  2. Check pod logs: kubectl logs -n $NAMESPACE deployment/backend"
        echo "  3. Review events: kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp'"
        return 1
    fi
}

main "$@"

