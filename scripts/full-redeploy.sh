#!/bin/bash
# ==============================================================================
# Full Service Redeployment Script
# ==============================================================================
# Kills all running processes, rebuilds, and redeploys all services
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}===================================================================${NC}"
echo -e "${BLUE}Full Service Redeployment${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo ""

# Step 1: Kill all running containers
echo -e "${YELLOW}Step 1: Stopping all running containers...${NC}"
docker-compose down -v 2>/dev/null || true
echo -e "${GREEN}✓${NC} All containers stopped"
echo ""

# Step 2: Clean up any orphaned containers
echo -e "${YELLOW}Step 2: Cleaning up orphaned containers...${NC}"
docker ps -a --filter "name=reconciliation-" --format "{{.Names}}" | while read container; do
    if [ ! -z "$container" ]; then
        echo -e "  Removing: $container"
        docker rm -f "$container" 2>/dev/null || true
    fi
done
echo -e "${GREEN}✓${NC} Cleanup complete"
echo ""

# Step 3: Enable BuildKit for faster builds
echo -e "${YELLOW}Step 3: Enabling BuildKit...${NC}"
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
echo -e "${GREEN}✓${NC} BuildKit enabled"
echo ""

# Step 4: Remove old images (optional, uncomment if needed)
# echo -e "${YELLOW}Step 4: Removing old images...${NC}"
# docker rmi reconciliation-platform-378-backend reconciliation-platform-378-frontend 2>/dev/null || true
# echo -e "${GREEN}✓${NC} Old images removed"
# echo ""

# Step 5: Build all services
echo -e "${YELLOW}Step 5: Building all services with BuildKit cache...${NC}"
echo -e "  This may take several minutes..."
docker-compose build --parallel
echo -e "${GREEN}✓${NC} All services built"
echo ""

# Step 6: Start all services
echo -e "${YELLOW}Step 6: Starting all services...${NC}"
docker-compose up -d
echo -e "${GREEN}✓${NC} All services started"
echo ""

# Step 7: Wait for services to be ready
echo -e "${YELLOW}Step 7: Waiting for services to be ready...${NC}"
sleep 10

# Check service health
echo -e "${YELLOW}Step 8: Checking service health...${NC}"
MAX_WAIT=120
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    HEALTHY=$(docker-compose ps | grep -c "healthy\|Up" || echo "0")
    TOTAL=$(docker-compose ps | grep -c "reconciliation-" || echo "0")
    
    if [ "$HEALTHY" -ge "$TOTAL ] && [ "$TOTAL" -gt "0" ]; then
        echo -e "${GREEN}✓${NC} All services are up"
        break
    fi
    
    echo -e "  Waiting... ($ELAPSED/$MAX_WAIT seconds)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

echo ""

# Step 9: Display service status
echo -e "${YELLOW}Step 9: Service Status${NC}"
docker-compose ps
echo ""

# Step 10: Run health checks
echo -e "${YELLOW}Step 10: Running health checks...${NC}"
if [ -f "./scripts/health-check-all.sh" ]; then
    ./scripts/health-check-all.sh
else
    echo -e "${YELLOW}⚠${NC} Health check script not found, skipping"
fi

echo ""
echo -e "${BLUE}===================================================================${NC}"
echo -e "${GREEN}✓ Redeployment Complete!${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo ""
echo -e "${YELLOW}Service URLs:${NC}"
echo -e "  Frontend:    http://localhost:1000"
echo -e "  Backend API: http://localhost:2000"
echo -e "  Health:      http://localhost:2000/health"
echo -e "  Grafana:     http://localhost:3001"
echo -e "  Prometheus:  http://localhost:9090"
echo -e "  Kibana:      http://localhost:5601"
echo ""

