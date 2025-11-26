#!/bin/bash
# ==============================================================================
# Deploy All Services - Complete Deployment Script
# ==============================================================================
# This script deploys all services with optimizations applied
# ==============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Deploying All Services${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Navigate to project directory
cd "$(dirname "$0")"
PROJECT_DIR="$(pwd)"
echo -e "${BLUE}Project directory: ${PROJECT_DIR}${NC}"
echo ""

# Enable BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
echo -e "${GREEN}✅ BuildKit enabled${NC}"

# Determine compose command
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# Step 1: Stop existing services
echo ""
echo -e "${BLUE}Step 1: Stopping existing services...${NC}"
$COMPOSE_CMD -f docker-compose.dev.yml down 2>&1 || true
echo -e "${GREEN}✅ Services stopped${NC}"

# Step 2: Build images
echo ""
echo -e "${BLUE}Step 2: Building images with optimizations...${NC}"
echo -e "${YELLOW}  - BuildKit: Enabled${NC}"
echo -e "${YELLOW}  - Parallel builds: Enabled${NC}"
echo -e "${YELLOW}  - Cache mounts: Enabled${NC}"
echo ""

if $COMPOSE_CMD -f docker-compose.dev.yml build --parallel; then
    echo -e "${GREEN}✅ Images built successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 3: Start services
echo ""
echo -e "${BLUE}Step 3: Starting services...${NC}"
if $COMPOSE_CMD -f docker-compose.dev.yml up -d; then
    echo -e "${GREEN}✅ Services started${NC}"
else
    echo -e "${RED}❌ Failed to start services${NC}"
    exit 1
fi

# Step 4: Wait for services
echo ""
echo -e "${BLUE}Step 4: Waiting for services to initialize...${NC}"
for i in {1..20}; do
    echo -n "."
    sleep 1
done
echo ""
echo -e "${GREEN}✅ Wait complete${NC}"

# Step 5: Check service status
echo ""
echo -e "${BLUE}Step 5: Service Status${NC}"
echo ""
$COMPOSE_CMD -f docker-compose.dev.yml ps
echo ""

# Step 6: Health checks
echo -e "${BLUE}Step 6: Health Checks${NC}"
echo ""

# Backend health
echo -n "Backend health: "
if curl -f -s http://localhost:2000/health > /dev/null 2>&1 || \
   curl -f -s http://localhost:2000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${YELLOW}⏳ Starting... (may need more time)${NC}"
fi

# Frontend health
echo -n "Frontend health: "
if curl -f -s http://localhost:1000/health > /dev/null 2>&1 || \
   curl -f -s http://localhost:1000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${YELLOW}⏳ Starting... (may need more time)${NC}"
fi

# Database health
echo -n "Database health: "
if $COMPOSE_CMD -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Ready${NC}"
else
    echo -e "${YELLOW}⏳ Starting... (may need more time)${NC}"
fi

# Redis health
echo -n "Redis health: "
if $COMPOSE_CMD -f docker-compose.dev.yml exec -T redis redis-cli -a "${REDIS_PASSWORD:-redis_pass}" ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Ready${NC}"
else
    echo -e "${YELLOW}⏳ Starting... (may need more time)${NC}"
fi

# Step 7: Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Service URLs:"
echo "  Backend:  http://localhost:2000"
echo "  Frontend: http://localhost:1000"
echo ""
echo "Health Endpoints:"
echo "  Backend:  curl http://localhost:2000/api/health"
echo "  Frontend: curl http://localhost:1000/health"
echo ""
echo "Useful Commands:"
echo "  View logs:    docker-compose -f docker-compose.dev.yml logs -f"
echo "  Stop:        docker-compose -f docker-compose.dev.yml down"
echo "  Restart:      docker-compose -f docker-compose.dev.yml restart"
echo "  Status:      docker-compose -f docker-compose.dev.yml ps"
echo ""

