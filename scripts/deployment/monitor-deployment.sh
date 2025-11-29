#!/bin/bash
# ==============================================================================
# Monitor Docker Deployment
# ==============================================================================
# Real-time monitoring of service deployment status
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info "Monitoring service deployment..."
echo ""

# Get all services
SERVICES=$(docker compose -f "$COMPOSE_FILE" config --services 2>/dev/null || echo "")

if [ -z "$SERVICES" ]; then
    log_error "Could not get service list"
    exit 1
fi

# Monitor loop
ITERATION=0
MAX_ITERATIONS=60  # 5 minutes max

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    clear
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Service Deployment Monitor${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Get status
    docker compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || true
    
    echo ""
    echo -e "${BLUE}Health Check Status:${NC}"
    
    # Check health of key services
    if docker exec reconciliation-postgres pg_isready -U postgres &>/dev/null 2>&1; then
        echo -e "  ${GREEN}✅${NC} PostgreSQL: Healthy"
    else
        echo -e "  ${YELLOW}⏳${NC} PostgreSQL: Starting..."
    fi
    
    if docker exec reconciliation-redis redis-cli -a "${REDIS_PASSWORD:-redis_pass}" ping &>/dev/null 2>&1; then
        echo -e "  ${GREEN}✅${NC} Redis: Healthy"
    else
        echo -e "  ${YELLOW}⏳${NC} Redis: Starting..."
    fi
    
    # Count healthy services
    HEALTHY=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | grep -c '"Health":"healthy"' || echo "0")
    TOTAL=$(echo "$SERVICES" | wc -l | tr -d ' ')
    
    echo ""
    echo -e "${BLUE}Progress: $HEALTHY / $TOTAL services healthy${NC}"
    echo ""
    echo "Press Ctrl+C to stop monitoring"
    
    # Check if all are healthy
    if [ "$HEALTHY" -ge "$TOTAL" ]; then
        echo ""
        echo -e "${GREEN}✅ All services are healthy!${NC}"
        break
    fi
    
    sleep 5
    ITERATION=$((ITERATION + 1))
done

echo ""
log_info "Monitoring complete"

