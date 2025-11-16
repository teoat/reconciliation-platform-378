#!/bin/bash
# scripts/deployment/check-health.sh
# Comprehensive health check for all services

set -e

BACKEND_URL=${BACKEND_URL:-http://localhost:2000}
FRONTEND_URL=${FRONTEND_URL:-http://localhost:1000}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_endpoint() {
    local url=$1
    local name=$2
    
    if curl -f -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name: Healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: Unhealthy${NC}"
        return 1
    fi
}

check_backend_health() {
    echo "Checking backend health endpoints..."
    
    check_endpoint "$BACKEND_URL/health" "Backend Health"
    check_endpoint "$BACKEND_URL/health/dependencies" "Backend Dependencies"
    check_endpoint "$BACKEND_URL/health/metrics" "Backend Metrics"
}

check_frontend() {
    echo "Checking frontend..."
    check_endpoint "$FRONTEND_URL" "Frontend"
}

check_docker_services() {
    echo "Checking Docker services..."
    
    local compose_cmd="docker-compose"
    if ! command -v docker-compose &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    local services=$($compose_cmd ps --services 2>/dev/null || echo "")
    
    if [ -z "$services" ]; then
        echo -e "${YELLOW}⚠️  No Docker services found (may not be running)${NC}"
        return 1
    fi
    
    for service in $services; do
        local status=$($compose_cmd ps "$service" 2>/dev/null | tail -1 | awk '{print $4}' || echo "unknown")
        if [ "$status" = "Up" ] || [ "$status" = "running" ]; then
            echo -e "${GREEN}✅ $service: Running${NC}"
        else
            echo -e "${RED}❌ $service: $status${NC}"
        fi
    done
}

main() {
    echo "🔍 Running comprehensive health checks..."
    echo ""
    
    local errors=0
    
    check_backend_health || errors=$((errors + 1))
    echo ""
    
    check_frontend || errors=$((errors + 1))
    echo ""
    
    check_docker_services || errors=$((errors + 1))
    echo ""
    
    if [ $errors -eq 0 ]; then
        echo -e "${GREEN}✅ All health checks passed${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some health checks failed${NC}"
        exit 1
    fi
}

main "$@"

