#!/bin/bash
# ==============================================================================
# Deploy Healthy Services Script
# ==============================================================================
# Quick deployment script that ensures all services are healthy
# ==============================================================================

set -euo pipefail

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

# Configuration
MODE="${1:-dev}"
COMPOSE_FILE="docker-compose.yml"
if [ "$MODE" = "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info "Deploying services in $MODE mode..."

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

if ! docker info &> /dev/null; then
    log_error "Docker daemon is not running"
    exit 1
fi

# Determine compose command
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# Stop existing services
log_info "Stopping existing services..."
$COMPOSE_CMD -f "$COMPOSE_FILE" down 2>&1 || true

# Create network if needed (for production)
if [ "$MODE" = "production" ] || [ "$MODE" = "prod" ]; then
    log_info "Ensuring network exists..."
    docker network create reconciliation-network 2>/dev/null || true
fi

# Start services
log_info "Starting services..."
if DOCKER_BUILDKIT=1 $COMPOSE_CMD -f "$COMPOSE_FILE" up -d; then
    log_success "Services started"
else
    log_error "Failed to start services"
    exit 1
fi

# Wait for services to be ready
log_info "Waiting for services to initialize..."
sleep 15

# Check service status
log_info "Checking service status..."
$COMPOSE_CMD -f "$COMPOSE_FILE" ps

# Health checks
log_info "Performing health checks..."

# Backend health
log_info "Checking backend health..."
for i in {1..30}; do
    if curl -f -s http://localhost:2000/api/health > /dev/null 2>&1 || \
       curl -f -s http://localhost:2000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend health check failed${NC}"
        echo "Backend logs:"
        $COMPOSE_CMD -f "$COMPOSE_FILE" logs --tail=20 backend
    else
        sleep 2
    fi
done

# Frontend health
log_info "Checking frontend health..."
for i in {1..15}; do
    if curl -f -s http://localhost:1000/health > /dev/null 2>&1 || \
       curl -f -s http://localhost:1000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is healthy${NC}"
        break
    fi
    if [ $i -eq 15 ]; then
        echo -e "${YELLOW}⚠️  Frontend health check failed (may need more time)${NC}"
        echo "Frontend logs:"
        $COMPOSE_CMD -f "$COMPOSE_FILE" logs --tail=20 frontend
    else
        sleep 2
    fi
done

# Database health
log_info "Checking database health..."
if $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is ready${NC}"
else
    echo -e "${YELLOW}⚠️  Database check failed (may need more time)${NC}"
fi

# Redis health
log_info "Checking Redis health..."
if $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T redis redis-cli -a "${REDIS_PASSWORD:-redis_pass}" ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is ready${NC}"
else
    echo -e "${YELLOW}⚠️  Redis check failed (may need more time)${NC}"
fi

# Final status
echo ""
log_info "Service deployment complete!"
echo ""
echo "Service URLs:"
echo "  Backend:  http://localhost:2000"
echo "  Frontend: http://localhost:1000"
echo ""
echo "Health Checks:"
echo "  Backend:  curl http://localhost:2000/api/health"
echo "  Frontend: curl http://localhost:1000/health"
echo ""
echo "View logs:"
echo "  $COMPOSE_CMD -f $COMPOSE_FILE logs -f [service-name]"
echo ""
echo "Stop services:"
echo "  $COMPOSE_CMD -f $COMPOSE_FILE down"

