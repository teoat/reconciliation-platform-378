#!/bin/bash
# ==============================================================================
# Optimized Multi-Build Docker Script
# ==============================================================================
# Builds all Docker services with BuildKit optimizations, parallel builds,
# and enhanced caching for maximum performance
# ==============================================================================

set -euo pipefail

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

# Configuration
MODE="${1:-production}"
COMPOSE_FILE="docker-compose.yml"
BUILD_PARALLEL="${BUILD_PARALLEL:-true}"
BUILD_CACHE="${BUILD_CACHE:-true}"
BUILD_PUSH="${BUILD_PUSH:-false}"

# Determine compose file based on mode
case "$MODE" in
    dev|development)
        COMPOSE_FILE="docker-compose.dev.yml"
        ;;
    optimized|opt)
        COMPOSE_FILE="docker-compose.optimized.yml"
        ;;
    production|prod)
        COMPOSE_FILE="docker-compose.yml"
        ;;
    *)
        log_error "Unknown mode: $MODE"
        log_info "Usage: $0 [dev|development|optimized|opt|production|prod]"
        exit 1
        ;;
esac

# Enable BuildKit for optimizations
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export BUILDKIT_PROGRESS=plain

log_info "Building Docker services with optimizations"
log_info "  Mode: $MODE"
log_info "  Compose file: $COMPOSE_FILE"
log_info "  Parallel builds: $BUILD_PARALLEL"
log_info "  Cache enabled: $BUILD_CACHE"

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

# Create buildx builder for advanced caching (if not exists)
if [ "$BUILD_CACHE" = "true" ]; then
    log_info "Setting up BuildKit builder..."
    docker buildx create --name reconciliation-builder --use 2>/dev/null || \
        docker buildx use reconciliation-builder 2>/dev/null || true
    docker buildx inspect --bootstrap &>/dev/null || true
fi

# Build arguments
BUILD_ARGS=()
if [ "$BUILD_CACHE" = "true" ]; then
    BUILD_ARGS+=(--build-arg BUILDKIT_INLINE_CACHE=1)
fi

# Build services
log_info "Building services..."

if [ "$BUILD_PARALLEL" = "true" ]; then
    log_info "  Using parallel builds..."
    if $COMPOSE_CMD -f "$COMPOSE_FILE" build --parallel "${BUILD_ARGS[@]}"; then
        log_success "All services built successfully"
    else
        log_error "Build failed"
        exit 1
    fi
else
    log_info "  Using sequential builds..."
    if $COMPOSE_CMD -f "$COMPOSE_FILE" build "${BUILD_ARGS[@]}"; then
        log_success "All services built successfully"
    else
        log_error "Build failed"
        exit 1
    fi
fi

# Optional: Push images to registry
if [ "$BUILD_PUSH" = "true" ]; then
    log_info "Pushing images to registry..."
    if $COMPOSE_CMD -f "$COMPOSE_FILE" push; then
        log_success "Images pushed successfully"
    else
        log_warning "Failed to push images (non-fatal)"
    fi
fi

# Display build summary
log_info "Build Summary:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | \
    grep -E "(reconciliation|REPOSITORY)" || true

log_success "Build completed successfully"
log_info "To start services: $COMPOSE_CMD -f $COMPOSE_FILE up -d"

