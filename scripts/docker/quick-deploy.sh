#!/bin/bash
# ==============================================================================
# Quick Deploy Script - Stop, Build, and Deploy Docker Services
# ==============================================================================
# This script stops any running services, builds optimized images, and starts
# all services with the optimized configuration
# ==============================================================================

set -euo pipefail

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

# Configuration
MODE="${1:-optimized}"
PROFILE="${2:-minimal}"

# Determine compose file
case "$MODE" in
    dev|development)
        COMPOSE_FILE="docker-compose.dev.yml"
        PROFILE=""
        ;;
    optimized|opt)
        COMPOSE_FILE="docker-compose.optimized.yml"
        ;;
    production|prod)
        COMPOSE_FILE="docker-compose.yml"
        PROFILE=""
        ;;
    *)
        log_error "Unknown mode: $MODE"
        log_info "Usage: $0 [dev|optimized|production] [profile]"
        exit 1
        ;;
esac

log_info "Quick Deploy - Reconciliation Platform"
log_info "  Mode: $MODE"
log_info "  Compose file: $COMPOSE_FILE"
[ -n "$PROFILE" ] && log_info "  Profile: $PROFILE"

# Step 1: Stop all running services
log_info "Step 1: Stopping existing services..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true
docker-compose -f docker-compose.dev.yml down 2>/dev/null || docker compose -f docker-compose.dev.yml down 2>/dev/null || true
docker-compose -f docker-compose.optimized.yml down 2>/dev/null || docker compose -f docker-compose.optimized.yml down 2>/dev/null || true
docker ps -q --filter "name=reconciliation" | xargs -r docker stop 2>/dev/null || docker ps -q --filter "name=reconciliation" | xargs docker stop 2>/dev/null || true
log_success "All services stopped"

# Step 2: Build optimized images
log_info "Step 2: Building optimized images..."
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

if [ -f "./scripts/docker/build-optimized.sh" ]; then
    ./scripts/docker/build-optimized.sh "$MODE"
else
    log_warning "Build script not found, using docker-compose build..."
    docker-compose -f "$COMPOSE_FILE" build --parallel || docker compose -f "$COMPOSE_FILE" build --parallel
fi

# Step 3: Start services
log_info "Step 3: Starting services..."
if [ -n "$PROFILE" ] && [ "$MODE" = "optimized" ]; then
    docker-compose -f "$COMPOSE_FILE" --profile "$PROFILE" up -d || \
        docker compose -f "$COMPOSE_FILE" --profile "$PROFILE" up -d
else
    docker-compose -f "$COMPOSE_FILE" up -d || \
        docker compose -f "$COMPOSE_FILE" up -d
fi

# Step 4: Wait for services to be healthy
log_info "Step 4: Waiting for services to be healthy..."
sleep 5

# Step 5: Display status
log_info "Step 5: Service Status:"
docker-compose -f "$COMPOSE_FILE" ps || docker compose -f "$COMPOSE_FILE" ps

echo ""
log_success "Deployment completed!"
echo ""
echo "Service URLs:"
echo "  Frontend:    http://localhost:1000"
echo "  Backend API: http://localhost:2000"
echo "  PostgreSQL:  localhost:5432"
echo "  Redis:       localhost:6379"
echo ""
echo "View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "Stop services: docker-compose -f $COMPOSE_FILE down"

