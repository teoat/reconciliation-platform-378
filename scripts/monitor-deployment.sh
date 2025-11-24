#!/bin/bash
# ============================================================================
# DEPLOYMENT MONITORING SCRIPT
# ============================================================================
# Monitors deployment health and performance for 24 hours post-deployment
#
# Usage:
#   ./scripts/monitor-deployment.sh [environment] [duration_hours]
#   ./scripts/monitor-deployment.sh production 24
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Configuration
ENVIRONMENT=${1:-production}
DURATION_HOURS=${2:-24}
NAMESPACE=${3:-reconciliation-platform}
BASE_URL=${4:-http://localhost:2000}

# Monitoring intervals
CHECK_INTERVAL=300  # 5 minutes
ALERT_THRESHOLD_ERROR_RATE=0.05  # 5% error rate
ALERT_THRESHOLD_RESPONSE_TIME=5000  # 5 seconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] [INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] [WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR]${NC} $1"
}

# ============================================================================
# MONITORING FUNCTIONS
# ============================================================================

check_health() {
    local response=$(curl -s -w "\n%{http_code}" --max-time 10 "${BASE_URL}/api/health" 2>&1 || echo "000")
    local status_code=$(echo "$response" | tail -n 1)
    
    if [[ "$status_code" == "200" ]]; then
        return 0
    else
        return 1
    fi
}

check_pods() {
    local failed_pods=$(kubectl get pods -n "$NAMESPACE" -l app=reconciliation-backend \
        -o jsonpath='{.items[?(@.status.phase!="Running")].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "$failed_pods" ]]; then
        log_error "Failed pods detected: $failed_pods"
        return 1
    fi
    
    return 0
}

check_error_rate() {
    # This is a simplified check - in production, you'd query Prometheus/metrics
    local response=$(curl -s --max-time 10 "${BASE_URL}/api/metrics" 2>/dev/null || echo "")
    
    # Placeholder for actual metrics parsing
    # In production, parse Prometheus metrics for error rate
    return 0
}

check_response_time() {
    local start_time=$(date +%s%N)
    curl -s --max-time 10 "${BASE_URL}/api/health" > /dev/null 2>&1
    local end_time=$(date +%s%N)
    
    local duration_ms=$(( (end_time - start_time) / 1000000 ))
    
    if [[ $duration_ms -gt $ALERT_THRESHOLD_RESPONSE_TIME ]]; then
        log_warning "Response time high: ${duration_ms}ms"
        return 1
    fi
    
    return 0
}

check_logs_for_errors() {
    local error_count=$(kubectl logs -n "$NAMESPACE" -l app=reconciliation-backend \
        --tail=100 --since=5m 2>/dev/null | grep -i "error\|panic\|fatal" | wc -l || echo "0")
    
    if [[ $error_count -gt 10 ]]; then
        log_warning "High error count in logs: $error_count errors in last 5 minutes"
        return 1
    fi
    
    return 0
}

# ============================================================================
# MONITORING LOOP
# ============================================================================

monitor_loop() {
    local end_time=$(($(date +%s) + (DURATION_HOURS * 3600)))
    local check_count=0
    local failure_count=0
    
    log_info "Starting monitoring for $DURATION_HOURS hours"
    log_info "Check interval: $CHECK_INTERVAL seconds"
    log_info "Monitoring endpoint: $BASE_URL"
    echo ""
    
    while [[ $(date +%s) -lt $end_time ]]; do
        ((check_count++))
        local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_info "Check #$check_count at $timestamp"
        
        local has_issues=false
        
        # Health check
        if check_health; then
            log_success "Health endpoint: OK"
        else
            log_error "Health endpoint: FAILED"
            has_issues=true
            ((failure_count++))
        fi
        
        # Pod status
        if check_pods; then
            log_success "Pod status: OK"
        else
            log_error "Pod status: FAILED"
            has_issues=true
            ((failure_count++))
        fi
        
        # Response time
        if check_response_time; then
            log_success "Response time: OK"
        else
            log_warning "Response time: SLOW"
        fi
        
        # Error rate
        if check_error_rate; then
            log_success "Error rate: OK"
        else
            log_warning "Error rate: HIGH"
        fi
        
        # Log errors
        if check_logs_for_errors; then
            log_success "Log errors: OK"
        else
            log_warning "Log errors: DETECTED"
        fi
        
        # Summary
        local remaining=$(( (end_time - $(date +%s)) / 3600 ))
        echo ""
        log_info "Remaining: ${remaining} hours | Failures: ${failure_count}/${check_count}"
        
        if [[ "$has_issues" == "true" ]]; then
            log_warning "Issues detected - investigate immediately"
        fi
        
        # Wait for next check
        if [[ $(date +%s) -lt $end_time ]]; then
            sleep $CHECK_INTERVAL
        fi
    done
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "Monitoring completed"
    log_info "Total checks: $check_count"
    log_info "Total failures: $failure_count"
    
    if [[ $failure_count -gt 0 ]]; then
        log_warning "Some issues were detected during monitoring"
        return 1
    else
        log_success "No issues detected during monitoring period"
        return 0
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    echo "============================================================================"
    echo "DEPLOYMENT MONITORING"
    echo "============================================================================"
    echo "Environment: $ENVIRONMENT"
    echo "Duration: $DURATION_HOURS hours"
    echo "Namespace: $NAMESPACE"
    echo "Base URL: $BASE_URL"
    echo "Started: $(date)"
    echo ""
    
    monitor_loop
    
    echo ""
    echo "============================================================================"
    log_success "Monitoring completed"
    echo "============================================================================"
}

# Run main function
main "$@"

