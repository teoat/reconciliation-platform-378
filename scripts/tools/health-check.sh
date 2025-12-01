#!/bin/bash

# =============================================================================
# Developer Tools - Health Check Script
# =============================================================================
# Comprehensive health checks for all platform services
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:2000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
AUTH_SERVER_URL="${AUTH_SERVER_URL:-http://localhost:4000}"
DATABASE_URL="${DATABASE_URL:-postgres://localhost:5432/reconciliation}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3001}"
ELASTICSEARCH_URL="${ELASTICSEARCH_URL:-http://localhost:9200}"

# Status tracking
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

log_pass() {
    echo -e "${GREEN}✓${NC} $1"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
}

log_fail() {
    echo -e "${RED}✗${NC} $1"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check HTTP endpoint
check_http() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" --fail-with-body "$url" --max-time 10 2>/dev/null || echo "000")
    
    if [ "$status" = "$expected_status" ]; then
        log_pass "$name (HTTP $status)"
        return 0
    elif [ "$status" = "000" ]; then
        log_fail "$name (Connection failed)"
        return 1
    else
        log_fail "$name (HTTP $status, expected $expected_status)"
        return 1
    fi
}

# Check TCP port
check_port() {
    local name="$1"
    local host="$2"
    local port="$3"
    
    if nc -z -w 5 "$host" "$port" 2>/dev/null; then
        log_pass "$name (Port $port open)"
        return 0
    else
        log_fail "$name (Port $port closed)"
        return 1
    fi
}

# Check PostgreSQL
check_postgres() {
    local host="${1:-localhost}"
    local port="${2:-5432}"
    
    if command -v psql &> /dev/null; then
        if PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" psql -h "$host" -p "$port" -U "${POSTGRES_USER:-postgres}" -c "SELECT 1" &> /dev/null; then
            log_pass "PostgreSQL (Connection successful)"
            return 0
        else
            log_fail "PostgreSQL (Connection failed)"
            return 1
        fi
    else
        check_port "PostgreSQL" "$host" "$port"
    fi
}

# Check Redis
check_redis() {
    local host="${1:-localhost}"
    local port="${2:-6379}"
    
    if command -v redis-cli &> /dev/null; then
        if redis-cli -h "$host" -p "$port" ping 2>/dev/null | grep -q "PONG"; then
            log_pass "Redis (PONG received)"
            return 0
        else
            log_fail "Redis (No response)"
            return 1
        fi
    else
        check_port "Redis" "$host" "$port"
    fi
}

# Check Docker service
check_docker_service() {
    local name="$1"
    
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "$name"; then
        local status=$(docker inspect --format='{{.State.Status}}' "$name" 2>/dev/null)
        if [ "$status" = "running" ]; then
            log_pass "Docker: $name (running)"
            return 0
        else
            log_fail "Docker: $name (status: $status)"
            return 1
        fi
    else
        log_warn "Docker: $name (not found)"
        return 2
    fi
}

# Check Kubernetes pod
check_k8s_pod() {
    local namespace="$1"
    local label="$2"
    
    if command -v kubectl &> /dev/null; then
        local ready=$(kubectl get pods -n "$namespace" -l "$label" -o jsonpath='{.items[*].status.containerStatuses[*].ready}' 2>/dev/null)
        if echo "$ready" | grep -q "true"; then
            log_pass "K8s Pod: $label (ready)"
            return 0
        else
            log_fail "K8s Pod: $label (not ready)"
            return 1
        fi
    else
        log_warn "K8s Pod: kubectl not available"
        return 2
    fi
}

# Check disk space
check_disk_space() {
    local threshold="${1:-80}"
    
    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$usage" -lt "$threshold" ]; then
        log_pass "Disk Space: ${usage}% used (threshold: ${threshold}%)"
        return 0
    else
        log_fail "Disk Space: ${usage}% used (exceeds ${threshold}% threshold)"
        return 1
    fi
}

# Check memory usage
check_memory() {
    local threshold="${1:-80}"
    
    local usage=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    
    if [ "$usage" -lt "$threshold" ]; then
        log_pass "Memory: ${usage}% used (threshold: ${threshold}%)"
        return 0
    else
        log_warn "Memory: ${usage}% used (exceeds ${threshold}% threshold)"
        return 0
    fi
}

# Check SSL certificate
check_ssl() {
    local domain="$1"
    local port="${2:-443}"
    
    if command -v openssl &> /dev/null; then
        local expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:$port" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        
        if [ -n "$expiry" ]; then
            local expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry" +%s 2>/dev/null)
            local now=$(date +%s)
            local days_left=$(( (expiry_epoch - now) / 86400 ))
            
            if [ "$days_left" -gt 30 ]; then
                log_pass "SSL Certificate: $domain ($days_left days remaining)"
            elif [ "$days_left" -gt 0 ]; then
                log_warn "SSL Certificate: $domain ($days_left days remaining - renew soon!)"
            else
                log_fail "SSL Certificate: $domain (expired!)"
            fi
            return 0
        else
            log_warn "SSL Certificate: $domain (could not verify)"
            return 2
        fi
    else
        log_warn "SSL Certificate: openssl not available"
        return 2
    fi
}

# Print summary
print_summary() {
    echo ""
    echo "==========================================="
    echo "Health Check Summary"
    echo "==========================================="
    echo -e "Total Checks: $TOTAL_CHECKS"
    echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
    echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
    echo "==========================================="
    
    if [ $FAILED_CHECKS -gt 0 ]; then
        echo -e "${RED}Status: UNHEALTHY${NC}"
        return 1
    elif [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Status: DEGRADED${NC}"
        return 0
    else
        echo -e "${GREEN}Status: HEALTHY${NC}"
        return 0
    fi
}

# Full health check
run_full_check() {
    echo -e "${CYAN}=== Reconciliation Platform Health Check ===${NC}"
    echo ""
    
    echo "--- Core Services ---"
    check_http "Backend API" "$BACKEND_URL/health"
    check_http "Frontend" "$FRONTEND_URL"
    check_http "Auth Server" "$AUTH_SERVER_URL/health"
    echo ""
    
    echo "--- Database & Cache ---"
    check_postgres "localhost" "5432"
    check_redis "localhost" "6379"
    echo ""
    
    echo "--- Monitoring ---"
    check_http "Prometheus" "$PROMETHEUS_URL/-/healthy"
    check_http "Grafana" "$GRAFANA_URL/api/health"
    check_http "Elasticsearch" "$ELASTICSEARCH_URL/_cluster/health"
    echo ""
    
    echo "--- Docker Services ---"
    check_docker_service "reconciliation-backend"
    check_docker_service "reconciliation-frontend"
    check_docker_service "reconciliation-db"
    check_docker_service "reconciliation-redis"
    echo ""
    
    echo "--- System Resources ---"
    check_disk_space 80
    check_memory 80
    echo ""
    
    print_summary
}

# Quick check (essential services only)
run_quick_check() {
    echo -e "${CYAN}=== Quick Health Check ===${NC}"
    echo ""
    
    check_http "Backend" "$BACKEND_URL/health"
    check_postgres "localhost" "5432"
    check_redis "localhost" "6379"
    
    echo ""
    print_summary
}

# API health check
run_api_check() {
    echo -e "${CYAN}=== API Health Check ===${NC}"
    echo ""
    
    check_http "Health Endpoint" "$BACKEND_URL/health"
    check_http "API Root" "$BACKEND_URL/api"
    check_http "Database Health" "$BACKEND_URL/api/v2/health/database"
    check_http "Redis Health" "$BACKEND_URL/api/v2/health/redis"
    check_http "Metrics" "$BACKEND_URL/metrics"
    
    echo ""
    print_summary
}

# Show help
show_help() {
    cat << EOF
${CYAN}=== Health Check Tool ===${NC}

Usage: $0 [OPTIONS] [COMMAND]

Commands:
    full                Run full health check (default)
    quick               Quick check of essential services
    api                 API endpoints health check
    docker              Check Docker services
    k8s                 Check Kubernetes pods
    resources           Check system resources

Options:
    --backend URL       Backend API URL
    --frontend URL      Frontend URL
    --auth URL          Auth server URL
    -h, --help          Show this help

Examples:
    $0
    $0 quick
    $0 api
    $0 --backend http://api.example.com:2000 full

Environment Variables:
    BACKEND_URL         Backend API URL
    FRONTEND_URL        Frontend URL
    AUTH_SERVER_URL     Auth server URL
    DATABASE_URL        PostgreSQL connection URL
    REDIS_URL           Redis connection URL
    PROMETHEUS_URL      Prometheus URL
    GRAFANA_URL         Grafana URL
    ELASTICSEARCH_URL   Elasticsearch URL
EOF
}

# Main
main() {
    local command="full"
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --backend)    BACKEND_URL="$2"; shift 2;;
            --frontend)   FRONTEND_URL="$2"; shift 2;;
            --auth)       AUTH_SERVER_URL="$2"; shift 2;;
            -h|--help)    show_help; exit 0;;
            full|quick|api|docker|k8s|resources)
                command="$1"
                shift
                ;;
            *)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    case "$command" in
        full)      run_full_check;;
        quick)     run_quick_check;;
        api)       run_api_check;;
        docker)
            echo "--- Docker Services ---"
            check_docker_service "reconciliation-backend"
            check_docker_service "reconciliation-frontend"
            check_docker_service "reconciliation-db"
            check_docker_service "reconciliation-redis"
            print_summary
            ;;
        k8s)
            echo "--- Kubernetes Pods ---"
            check_k8s_pod "reconciliation-platform" "component=backend"
            check_k8s_pod "reconciliation-platform" "component=frontend"
            check_k8s_pod "reconciliation-platform" "component=database"
            print_summary
            ;;
        resources)
            echo "--- System Resources ---"
            check_disk_space 80
            check_memory 80
            print_summary
            ;;
        *)
            run_full_check
            ;;
    esac
}

main "$@"
