#!/bin/bash

# =============================================================================
# Automated Rollback Script
# =============================================================================
# This script provides automated rollback capabilities for the platform
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
NAMESPACE="${NAMESPACE:-reconciliation-platform}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://prometheus:9090}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
ERROR_THRESHOLD="${ERROR_THRESHOLD:-0.05}"
LATENCY_THRESHOLD="${LATENCY_THRESHOLD:-500}"

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2; }

send_notification() {
    local message="$1"
    local severity="${2:-info}"
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color
        case "$severity" in
            error) color="danger";;
            warning) color="warning";;
            *) color="good";;
        esac
        
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"attachments\":[{\"color\":\"$color\",\"text\":\"$message\",\"footer\":\"Rollback Automation\"}]}"
    fi
    
    log "$message"
}

check_deployment_health() {
    local deployment="$1"
    
    log "Checking health for deployment: $deployment"
    
    # Check if deployment exists and is available
    local available=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.availableReplicas}' 2>/dev/null || echo "0")
    local desired=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
    
    if [ "$available" != "$desired" ]; then
        warn "Deployment $deployment has $available/$desired replicas available"
        return 1
    fi
    
    log "Deployment $deployment has $available/$desired replicas available"
    return 0
}

check_error_rate() {
    local service="$1"
    
    log "Checking error rate for service: $service"
    
    local error_rate=$(curl -s "$PROMETHEUS_URL/api/v1/query" \
        --data-urlencode "query=sum(rate(http_requests_total{service=\"$service\",status=~\"5..\"}[5m]))/sum(rate(http_requests_total{service=\"$service\"}[5m]))" \
        | jq -r '.data.result[0].value[1] // "0"')
    
    log "Current error rate for $service: $error_rate"
    
    if (( $(echo "$error_rate > $ERROR_THRESHOLD" | bc -l) )); then
        warn "Error rate $error_rate exceeds threshold $ERROR_THRESHOLD"
        return 1
    fi
    
    return 0
}

check_latency() {
    local service="$1"
    
    log "Checking latency for service: $service"
    
    local p95_latency=$(curl -s "$PROMETHEUS_URL/api/v1/query" \
        --data-urlencode "query=histogram_quantile(0.95, sum(rate(http_request_duration_milliseconds_bucket{service=\"$service\"}[5m])) by (le))" \
        | jq -r '.data.result[0].value[1] // "0"')
    
    log "Current P95 latency for $service: ${p95_latency}ms"
    
    if (( $(echo "$p95_latency > $LATENCY_THRESHOLD" | bc -l) )); then
        warn "P95 latency ${p95_latency}ms exceeds threshold ${LATENCY_THRESHOLD}ms"
        return 1
    fi
    
    return 0
}

get_previous_revision() {
    local deployment="$1"
    
    kubectl rollout history deployment/"$deployment" -n "$NAMESPACE" | \
        grep -E "^[0-9]+" | tail -2 | head -1 | awk '{print $1}'
}

rollback_deployment() {
    local deployment="$1"
    local revision="${2:-}"
    
    log "Initiating rollback for deployment: $deployment"
    
    if [ -n "$revision" ]; then
        log "Rolling back to revision: $revision"
        kubectl rollout undo deployment/"$deployment" -n "$NAMESPACE" --to-revision="$revision"
    else
        log "Rolling back to previous revision"
        kubectl rollout undo deployment/"$deployment" -n "$NAMESPACE"
    fi
    
    # Wait for rollback to complete
    log "Waiting for rollback to complete..."
    kubectl rollout status deployment/"$deployment" -n "$NAMESPACE" --timeout=300s
    
    send_notification "🔄 Rollback completed for deployment: $deployment" "warning"
}

rollback_argo_rollout() {
    local rollout="$1"
    
    log "Initiating Argo Rollout abort for: $rollout"
    
    kubectl argo rollouts abort "$rollout" -n "$NAMESPACE"
    
    send_notification "🔄 Argo Rollout aborted: $rollout" "warning"
}

monitor_and_rollback() {
    local deployment="$1"
    local check_interval="${2:-30}"
    local max_failures="${3:-3}"
    
    log "Starting continuous monitoring for: $deployment"
    log "Check interval: ${check_interval}s, Max failures: $max_failures"
    
    local failure_count=0
    
    while true; do
        local has_failure=false
        
        if ! check_deployment_health "$deployment"; then
            has_failure=true
        fi
        
        if ! check_error_rate "$deployment"; then
            has_failure=true
        fi
        
        if ! check_latency "$deployment"; then
            has_failure=true
        fi
        
        if [ "$has_failure" = true ]; then
            failure_count=$((failure_count + 1))
            warn "Health check failure $failure_count/$max_failures"
            
            if [ $failure_count -ge $max_failures ]; then
                error "Max failures reached, initiating rollback"
                send_notification "🚨 Auto-rollback triggered for $deployment after $failure_count failures" "error"
                rollback_deployment "$deployment"
                exit 1
            fi
        else
            failure_count=0
            log "Health check passed"
        fi
        
        sleep "$check_interval"
    done
}

show_rollout_history() {
    local deployment="$1"
    
    log "Rollout history for: $deployment"
    kubectl rollout history deployment/"$deployment" -n "$NAMESPACE"
}

show_help() {
    cat << EOF
${BLUE}=== Automated Rollback Script ===${NC}

Usage: $0 COMMAND [OPTIONS]

Commands:
    check <deployment>              Check deployment health
    rollback <deployment> [rev]     Rollback to previous or specific revision
    monitor <deployment>            Monitor and auto-rollback on failures
    history <deployment>            Show rollout history
    abort <rollout>                 Abort Argo Rollout

Options:
    --namespace, -n NAMESPACE       Kubernetes namespace (default: reconciliation-platform)
    --error-threshold RATE          Error rate threshold (default: 0.05)
    --latency-threshold MS          P95 latency threshold in ms (default: 500)
    --check-interval SEC            Health check interval (default: 30)
    --max-failures NUM              Max failures before rollback (default: 3)
    --help, -h                      Show this help

Examples:
    $0 check backend
    $0 rollback backend
    $0 rollback backend 5
    $0 monitor backend --check-interval 60 --max-failures 5
    $0 abort backend-canary

Environment Variables:
    NAMESPACE                       Kubernetes namespace
    PROMETHEUS_URL                  Prometheus server URL
    SLACK_WEBHOOK_URL               Slack webhook for notifications
    ERROR_THRESHOLD                 Error rate threshold
    LATENCY_THRESHOLD               P95 latency threshold
EOF
}

# Parse arguments
main() {
    local command=""
    local deployment=""
    local revision=""
    local check_interval=30
    local max_failures=3
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -n|--namespace)       NAMESPACE="$2"; shift 2;;
            --error-threshold)    ERROR_THRESHOLD="$2"; shift 2;;
            --latency-threshold)  LATENCY_THRESHOLD="$2"; shift 2;;
            --check-interval)     check_interval="$2"; shift 2;;
            --max-failures)       max_failures="$2"; shift 2;;
            -h|--help)            show_help; exit 0;;
            check|rollback|monitor|history|abort)
                command="$1"
                deployment="$2"
                revision="${3:-}"
                shift $#
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    if [ -z "$command" ]; then
        show_help
        exit 1
    fi
    
    case "$command" in
        check)
            check_deployment_health "$deployment" && \
            check_error_rate "$deployment" && \
            check_latency "$deployment"
            ;;
        rollback)
            rollback_deployment "$deployment" "$revision"
            ;;
        monitor)
            monitor_and_rollback "$deployment" "$check_interval" "$max_failures"
            ;;
        history)
            show_rollout_history "$deployment"
            ;;
        abort)
            rollback_argo_rollout "$deployment"
            ;;
        *)
            error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
