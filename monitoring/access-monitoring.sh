#!/bin/bash
# ==============================================================================
# Monitoring Access Script
# ==============================================================================
# Quick access to centralized monitoring services (Prometheus, Grafana, Kibana)
# Usage: ./monitoring/access-monitoring.sh <command>
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$ROOT_DIR/scripts/lib/common-functions.sh"

# ==============================================================================
# Configuration
# ==============================================================================

PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3001}"
KIBANA_URL="${KIBANA_URL:-http://localhost:5601}"
BACKEND_METRICS_URL="${BACKEND_METRICS_URL:-http://localhost:2000/api/metrics}"

# ==============================================================================
# Help
# ==============================================================================

show_help() {
    cat << EOF
Monitoring Access Script for Reconciliation Platform

USAGE:
    $0 <command> [options]

COMMANDS:
    status          Check status of all monitoring services
    logs [service]  View logs for a service (backend, frontend, postgres, redis)
    metrics         Display current application metrics
    alerts          Show active alerts from Prometheus
    grafana         Open Grafana dashboard
    prometheus      Open Prometheus UI
    kibana          Open Kibana UI
    query <promql>  Execute a PromQL query
    health          Check health of all services

EXAMPLES:
    # Check monitoring status
    $0 status

    # View backend logs
    $0 logs backend

    # View all active alerts
    $0 alerts

    # Run a PromQL query
    $0 query 'up'

    # Open Grafana
    $0 grafana

EOF
}

# ==============================================================================
# Status Check
# ==============================================================================

check_status() {
    log_info "Checking monitoring services status..."
    echo ""
    
    # Check Prometheus
    if check_endpoint "$PROMETHEUS_URL/-/ready" "200" 3; then
        log_success "Prometheus: ✓ Running at $PROMETHEUS_URL"
    else
        log_warning "Prometheus: ✗ Not available at $PROMETHEUS_URL"
    fi
    
    # Check Grafana
    if check_endpoint "$GRAFANA_URL/api/health" "200" 3; then
        log_success "Grafana: ✓ Running at $GRAFANA_URL"
    else
        log_warning "Grafana: ✗ Not available at $GRAFANA_URL"
    fi
    
    # Check Kibana
    if check_endpoint "$KIBANA_URL/api/status" "200" 3; then
        log_success "Kibana: ✓ Running at $KIBANA_URL"
    else
        log_warning "Kibana: ✗ Not available at $KIBANA_URL"
    fi
    
    # Check Backend Metrics
    if check_endpoint "$BACKEND_METRICS_URL/health" "200" 3; then
        log_success "Backend Metrics: ✓ Available at $BACKEND_METRICS_URL"
    else
        log_warning "Backend Metrics: ✗ Not available at $BACKEND_METRICS_URL"
    fi
    
    echo ""
}

# ==============================================================================
# View Logs
# ==============================================================================

view_logs() {
    local service="${1:-all}"
    local lines="${2:-100}"
    
    log_info "Viewing logs for: $service (last $lines lines)"
    
    case $service in
        backend)
            docker logs --tail "$lines" -f reconciliation-backend 2>/dev/null || \
            docker compose logs --tail "$lines" -f backend 2>/dev/null || \
            log_error "Backend container not found"
            ;;
        frontend)
            docker logs --tail "$lines" -f reconciliation-frontend 2>/dev/null || \
            docker compose logs --tail "$lines" -f frontend 2>/dev/null || \
            log_error "Frontend container not found"
            ;;
        postgres|db)
            docker logs --tail "$lines" -f reconciliation-postgres 2>/dev/null || \
            docker compose logs --tail "$lines" -f postgres 2>/dev/null || \
            log_error "Postgres container not found"
            ;;
        redis)
            docker logs --tail "$lines" -f reconciliation-redis 2>/dev/null || \
            docker compose logs --tail "$lines" -f redis 2>/dev/null || \
            log_error "Redis container not found"
            ;;
        prometheus)
            docker logs --tail "$lines" -f reconciliation-prometheus 2>/dev/null || \
            docker compose logs --tail "$lines" -f prometheus 2>/dev/null || \
            log_error "Prometheus container not found"
            ;;
        grafana)
            docker logs --tail "$lines" -f reconciliation-grafana 2>/dev/null || \
            docker compose logs --tail "$lines" -f grafana 2>/dev/null || \
            log_error "Grafana container not found"
            ;;
        kibana)
            docker logs --tail "$lines" -f reconciliation-kibana 2>/dev/null || \
            docker compose logs --tail "$lines" -f kibana 2>/dev/null || \
            log_error "Kibana container not found"
            ;;
        all)
            docker compose logs --tail "$lines" -f 2>/dev/null || \
            log_error "No containers found"
            ;;
        *)
            log_error "Unknown service: $service"
            log_info "Available services: backend, frontend, postgres, redis, prometheus, grafana, kibana, all"
            exit 1
            ;;
    esac
}

# ==============================================================================
# Metrics
# ==============================================================================

show_metrics() {
    log_info "Fetching application metrics..."
    echo ""
    
    # Try to get metrics from backend
    local metrics_response
    metrics_response=$(curl -sf "${BACKEND_METRICS_URL}/summary" 2>/dev/null) || true
    
    if [ -n "$metrics_response" ]; then
        echo "$metrics_response" | python3 -m json.tool 2>/dev/null || echo "$metrics_response"
    else
        # Fallback to Prometheus metrics
        log_info "Backend metrics not available, trying Prometheus..."
        curl -sf "${PROMETHEUS_URL}/api/v1/query?query=up" 2>/dev/null | python3 -m json.tool 2>/dev/null || \
        log_warning "Unable to fetch metrics"
    fi
}

# ==============================================================================
# Alerts
# ==============================================================================

show_alerts() {
    log_info "Fetching active alerts from Prometheus..."
    echo ""
    
    local alerts_response
    alerts_response=$(curl -sf "${PROMETHEUS_URL}/api/v1/alerts" 2>/dev/null) || true
    
    if [ -n "$alerts_response" ]; then
        echo "$alerts_response" | python3 -m json.tool 2>/dev/null || echo "$alerts_response"
    else
        log_warning "Unable to fetch alerts. Is Prometheus running at $PROMETHEUS_URL?"
    fi
}

# ==============================================================================
# PromQL Query
# ==============================================================================

run_query() {
    local query="$1"
    
    if [ -z "$query" ]; then
        log_error "No query provided"
        log_info "Usage: $0 query '<promql_query>'"
        exit 1
    fi
    
    log_info "Running PromQL query: $query"
    echo ""
    
    local encoded_query
    encoded_query=$(echo "$query" | python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.stdin.read().strip()))")
    
    local result
    result=$(curl -sf "${PROMETHEUS_URL}/api/v1/query?query=${encoded_query}" 2>/dev/null) || true
    
    if [ -n "$result" ]; then
        echo "$result" | python3 -m json.tool 2>/dev/null || echo "$result"
    else
        log_warning "Query failed or returned no results"
    fi
}

# ==============================================================================
# Open UI
# ==============================================================================

open_url() {
    local url="$1"
    local name="$2"
    
    log_info "Opening $name at $url"
    
    if command -v xdg-open &> /dev/null; then
        xdg-open "$url" 2>/dev/null &
    elif command -v open &> /dev/null; then
        open "$url" 2>/dev/null &
    else
        log_info "Please open manually: $url"
    fi
}

# ==============================================================================
# Health Check
# ==============================================================================

check_health() {
    log_info "Performing comprehensive health check..."
    echo ""
    
    local all_healthy=true
    
    # Check Backend
    if check_endpoint "http://localhost:2000/health" "200" 5; then
        log_success "Backend: ✓ Healthy"
    else
        log_error "Backend: ✗ Unhealthy"
        all_healthy=false
    fi
    
    # Check Frontend
    if check_endpoint "http://localhost:1000" "200" 5; then
        log_success "Frontend: ✓ Healthy"
    else
        log_warning "Frontend: ✗ Not available"
        all_healthy=false
    fi
    
    # Check Database (via backend endpoint)
    if check_endpoint "http://localhost:2000/ready" "200" 5; then
        log_success "Database: ✓ Connected"
    else
        log_warning "Database: ✗ Connection issues"
        all_healthy=false
    fi
    
    # Check Redis (via backend endpoint or direct)
    local redis_check
    redis_check=$(docker exec reconciliation-redis redis-cli ping 2>/dev/null) || true
    if [ "$redis_check" = "PONG" ]; then
        log_success "Redis: ✓ Running"
    else
        log_warning "Redis: ✗ Not available"
    fi
    
    echo ""
    if [ "$all_healthy" = true ]; then
        log_success "All core services are healthy!"
    else
        log_warning "Some services need attention"
    fi
}

# ==============================================================================
# Main
# ==============================================================================

main() {
    local command="${1:-help}"
    shift || true
    
    case $command in
        status)
            check_status
            ;;
        logs)
            view_logs "$@"
            ;;
        metrics)
            show_metrics
            ;;
        alerts)
            show_alerts
            ;;
        grafana)
            open_url "$GRAFANA_URL" "Grafana"
            ;;
        prometheus)
            open_url "$PROMETHEUS_URL" "Prometheus"
            ;;
        kibana)
            open_url "$KIBANA_URL" "Kibana"
            ;;
        query)
            run_query "$@"
            ;;
        health)
            check_health
            ;;
        help|-h|--help)
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
