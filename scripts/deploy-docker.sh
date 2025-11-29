#!/bin/bash
# ============================================================================
# Docker Deployment Script - Reconciliation Platform
# ============================================================================
# Purpose: Deploy all services using optimized multi-stage Docker builds
# ============================================================================
# Usage:
#   ./scripts/deploy-docker.sh [options]
#   Options:
#     --build          Force rebuild all images
#     --no-cache       Build without cache
#     --parallel       Build images in parallel (default)
#     --sequential     Build images sequentially
#     --pull           Pull latest base images
#     --clean          Clean up before deployment
#     --logs            Show logs after deployment
# ============================================================================

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source shared functions
source "$SCRIPT_DIR/lib/common-functions.sh" 2>/dev/null || {
    log_warning "Shared functions not found, using basic logging"
    log_info() { echo "[INFO] $*"; }
    log_success() { echo "[SUCCESS] $*"; }
    log_warning() { echo "[WARNING] $*"; }
    log_error() { echo "[ERROR] $*"; }
}

# Configuration (SSOT)
# docker-compose.yml is SSOT (see SSOT_LOCK.yml)
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
BUILD_MODE="${BUILD_MODE:-parallel}"
FORCE_BUILD="${FORCE_BUILD:-false}"
NO_CACHE="${NO_CACHE:-false}"
PULL_IMAGES="${PULL_IMAGES:-false}"
CLEAN_BEFORE="${CLEAN_BEFORE:-false}"
SHOW_LOGS="${SHOW_LOGS:-false}"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            FORCE_BUILD=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            FORCE_BUILD=true
            shift
            ;;
        --parallel)
            BUILD_MODE=parallel
            shift
            ;;
        --sequential)
            BUILD_MODE=sequential
            shift
            ;;
        --pull)
            PULL_IMAGES=true
            shift
            ;;
        --clean)
            CLEAN_BEFORE=true
            shift
            ;;
        --logs)
            SHOW_LOGS=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Usage: $0 [--build] [--no-cache] [--parallel|--sequential] [--pull] [--clean] [--logs]"
            exit 1
            ;;
    esac
done

cd "$PROJECT_ROOT"

# SSOT Validation (optional, can be skipped with --skip-ssot)
if [ "${SKIP_SSOT_VALIDATION:-false}" != "true" ]; then
    if [ -f "$SCRIPT_DIR/validate-docker-ssot.sh" ]; then
        log_info "Validating Docker SSOT compliance..."
        "$SCRIPT_DIR/validate-docker-ssot.sh" || log_warning "SSOT validation found issues (continuing anyway)"
    fi
fi

# Check prerequisites
log_info "Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi

# Use docker compose (v2) if available, otherwise docker-compose (v1)
if command -v docker compose &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Check if network exists, create if not
log_info "Ensuring Docker network exists..."
if ! docker network inspect reconciliation-network &> /dev/null; then
    log_info "Creating reconciliation-network..."
    docker network create reconciliation-network
    log_success "Network created"
else
    log_info "Network already exists"
fi

# Clean up if requested
if [ "$CLEAN_BEFORE" = "true" ]; then
    log_info "Cleaning up before deployment..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" down -v 2>/dev/null || true
    log_success "Cleanup complete"
fi

# Pull base images if requested
if [ "$PULL_IMAGES" = "true" ]; then
    log_info "Pulling latest base images..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" pull postgres redis elasticsearch prometheus grafana kibana logstash apm-server pgbouncer || true
    log_success "Base images pulled"
fi

# Build images
log_info "Building Docker images..."
BUILD_ARGS=()
if [ "$NO_CACHE" = "true" ]; then
    BUILD_ARGS+=(--no-cache)
fi

if [ "$BUILD_MODE" = "parallel" ]; then
    log_info "Building images in parallel (this may take several minutes)..."
    DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 $DOCKER_COMPOSE -f "$COMPOSE_FILE" build --parallel "${BUILD_ARGS[@]}" backend frontend
    log_success "Images built in parallel"
else
    log_info "Building images sequentially..."
    DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 $DOCKER_COMPOSE -f "$COMPOSE_FILE" build "${BUILD_ARGS[@]}" backend frontend
    log_success "Images built sequentially"
fi

# Start services
log_info "Starting all services..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
MAX_WAIT=300  # 5 minutes
ELAPSED=0
INTERVAL=5

while [ $ELAPSED -lt $MAX_WAIT ]; do
    # Check critical services
    BACKEND_HEALTHY=$($DOCKER_COMPOSE -f "$COMPOSE_FILE" ps backend | grep -q "healthy\|Up" && echo "true" || echo "false")
    POSTGRES_HEALTHY=$($DOCKER_COMPOSE -f "$COMPOSE_FILE" ps postgres | grep -q "healthy\|Up" && echo "true" || echo "false")
    REDIS_HEALTHY=$($DOCKER_COMPOSE -f "$COMPOSE_FILE" ps redis | grep -q "healthy\|Up" && echo "true" || echo "false")
    
    if [ "$BACKEND_HEALTHY" = "true" ] && [ "$POSTGRES_HEALTHY" = "true" ] && [ "$REDIS_HEALTHY" = "true" ]; then
        log_success "Critical services are healthy"
        break
    fi
    
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    log_info "Waiting for services... (${ELAPSED}s/${MAX_WAIT}s)"
done

# Show service status
log_info "Service status:"
$DOCKER_COMPOSE -f "$COMPOSE_FILE" ps

# Show logs if requested
if [ "$SHOW_LOGS" = "true" ]; then
    log_info "Showing logs (Ctrl+C to exit)..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" logs -f
else
    log_info "To view logs, run: $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f [service]"
fi

# Print service URLs
log_success "Deployment complete!"
echo ""
echo "Service URLs:"
echo "  Frontend:     http://localhost:${FRONTEND_PORT:-1000}"
echo "  Backend API:  http://localhost:${BACKEND_PORT:-2000}"
echo "  Prometheus:   http://localhost:${PROMETHEUS_PORT:-9090}"
echo "  Grafana:      http://localhost:${GRAFANA_PORT:-3001} (admin/${GRAFANA_PASSWORD:-admin})"
echo "  Kibana:       http://localhost:${KIBANA_PORT:-5601}"
echo "  Elasticsearch: http://localhost:${ELASTICSEARCH_PORT:-9200}"
echo ""
echo "Useful commands:"
echo "  View logs:    $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f [service]"
echo "  Stop all:     $DOCKER_COMPOSE -f $COMPOSE_FILE down"
echo "  Restart:      $DOCKER_COMPOSE -f $COMPOSE_FILE restart [service]"
echo "  Status:       $DOCKER_COMPOSE -f $COMPOSE_FILE ps"

