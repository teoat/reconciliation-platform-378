#!/bin/bash
# ==============================================================================
# Optimized Multi-Build Deployment Script
# ==============================================================================
# Deploys services with BuildKit optimizations, parallel builds, and low-risk
# runtime optimizations
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

# Enable BuildKit for optimizations
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

log_info "Deploying services with optimizations in $MODE mode..."

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

# Build with optimizations
log_info "Building images with BuildKit optimizations..."
log_info "  - Parallel builds enabled"
log_info "  - Cache mounts enabled"
log_info "  - Multi-stage optimization"

# Build services in parallel
if $COMPOSE_CMD -f "$COMPOSE_FILE" build --parallel; then
    log_success "Images built successfully"
else
    log_error "Build failed"
    exit 1
fi

# Start services
log_info "Starting optimized services..."
if $COMPOSE_CMD -f "$COMPOSE_FILE" up -d; then
    log_success "Services started"
else
    log_error "Failed to start services"
    exit 1
fi

# Wait for services to be ready
log_info "Waiting for services to initialize..."
sleep 15

# Check service status
log_info "Service status:"
$COMPOSE_CMD -f "$COMPOSE_FILE" ps

# Health checks
log_info "Performing health checks..."

# Backend health
log_info "Checking backend health..."
for i in {1..30}; do
    if curl -f -s http://localhost:2000/api/health > /dev/null 2>&1 || \
       curl -f -s http://localhost:2000/health > /dev/null 2>&1; then
        log_success "Backend is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        log_warning "Backend health check failed - checking logs..."
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
        log_success "Frontend is healthy"
        break
    fi
    if [ $i -eq 15 ]; then
        log_warning "Frontend health check failed - checking logs..."
        $COMPOSE_CMD -f "$COMPOSE_FILE" logs --tail=20 frontend
    else
        sleep 2
    fi
done

# Database health
log_info "Checking database health..."
if $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    log_success "Database is ready"
else
    log_warning "Database check failed (may need more time)"
fi

# Redis health
log_info "Checking Redis health..."
if $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T redis redis-cli -a "${REDIS_PASSWORD:-redis_pass}" ping > /dev/null 2>&1; then
    log_success "Redis is ready"
else
    log_warning "Redis check failed (may need more time)"
fi

# Resource usage summary
log_info "Resource usage summary:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" \
    $($COMPOSE_CMD -f "$COMPOSE_FILE" ps -q) 2>/dev/null || log_info "Stats unavailable"

# Final status
echo ""
log_success "Optimized deployment complete!"
echo ""
echo "Optimizations applied:"
echo "  ✅ BuildKit enabled (parallel builds, cache mounts)"
echo "  ✅ Resource limits configured"
echo "  ✅ Log rotation enabled"
echo "  ✅ Health checks configured"
echo "  ✅ Redis memory limits configured"
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

