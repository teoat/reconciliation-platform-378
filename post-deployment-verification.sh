#!/usr/bin/env bash
# Post-Deployment Verification Script
# Verifies all services are running and accessible

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED++))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
    ((WARNINGS++))
}

echo "============================================================================"
echo "  POST-DEPLOYMENT VERIFICATION"
echo "============================================================================"
echo ""

# 1. Check Docker services status
log_info "Checking Docker services status..."
if docker compose ps &> /dev/null; then
    SERVICES_RUNNING=$(docker compose ps --format json 2>/dev/null | jq -r '.[] | select(.State == "running") | .Name' 2>/dev/null | wc -l || echo "0")
    TOTAL_SERVICES=$(docker compose ps --format json 2>/dev/null | jq -r '.[] | .Name' 2>/dev/null | wc -l || echo "0")
    
    if [[ "$SERVICES_RUNNING" -gt 0 ]]; then
        log_success "$SERVICES_RUNNING services running"
        docker compose ps
    else
        log_error "No services are running"
    fi
else
    log_warning "Could not check service status (docker compose may not be running)"
fi

# 2. Check Backend Health
log_info "Checking backend health endpoint..."
if curl -fsS http://localhost:2000/health >/dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s http://localhost:2000/health)
    log_success "Backend is healthy: $HEALTH_RESPONSE"
else
    log_error "Backend health check failed"
fi

# 3. Check Frontend
log_info "Checking frontend accessibility..."
if curl -fsS http://localhost:1000 >/dev/null 2>&1; then
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1000)
    if [[ "$FRONTEND_STATUS" == "200" ]]; then
        log_success "Frontend is accessible (HTTP $FRONTEND_STATUS)"
    else
        log_warning "Frontend returned HTTP $FRONTEND_STATUS"
    fi
else
    log_error "Frontend is not accessible"
fi

# 4. Check Database Connection
log_info "Checking database connection..."
if docker compose exec -T postgres psql -U postgres -d reconciliation_app -c "SELECT 1;" >/dev/null 2>&1; then
    log_success "Database connection successful"
else
    log_warning "Database connection check failed (may still be starting)"
fi

# 5. Check Redis Connection
log_info "Checking Redis connection..."
if docker compose exec -T redis redis-cli -a "${REDIS_PASSWORD:-redis_pass}" ping >/dev/null 2>&1; then
    log_success "Redis connection successful"
else
    log_warning "Redis connection check failed"
fi

# 6. Check Monitoring Services
log_info "Checking monitoring services..."

# Prometheus
if curl -fsS http://localhost:9090/-/healthy >/dev/null 2>&1; then
    log_success "Prometheus is accessible"
else
    log_warning "Prometheus may not be ready"
fi

# Grafana
if curl -fsS http://localhost:3001/api/health >/dev/null 2>&1; then
    log_success "Grafana is accessible"
else
    log_warning "Grafana may not be ready"
fi

# Elasticsearch
if curl -fsS http://localhost:9200/_cluster/health >/dev/null 2>&1; then
    log_success "Elasticsearch is accessible"
else
    log_warning "Elasticsearch may not be ready"
fi

# 7. Check Service Logs for Errors
log_info "Checking for critical errors in logs..."
ERROR_COUNT=$(docker compose logs --tail=100 2>&1 | grep -i "error\|fatal\|panic" | wc -l || echo "0")
if [[ "$ERROR_COUNT" -eq 0 ]]; then
    log_success "No critical errors found in recent logs"
else
    log_warning "Found $ERROR_COUNT potential errors in logs (review with: docker compose logs)"
fi

# Summary
echo ""
echo "============================================================================"
echo "  VERIFICATION SUMMARY"
echo "============================================================================"
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [[ $FAILED -eq 0 ]]; then
    if [[ $WARNINGS -eq 0 ]]; then
        echo -e "${GREEN}✓ All checks passed! Deployment successful.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠ Deployment successful with warnings. Review warnings above.${NC}"
        exit 0
    fi
else
    echo -e "${RED}✗ Some checks failed. Review errors above.${NC}"
    exit 1
fi

