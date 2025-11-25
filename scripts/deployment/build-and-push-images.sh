#!/bin/bash
# ============================================================================
# BUILD AND PUSH DOCKER IMAGES FOR PRODUCTION
# ============================================================================
# Builds and pushes Docker images to container registry for production
#
# Usage:
#   ./scripts/deployment/build-and-push-images.sh [version] [registry]
#   ./scripts/deployment/build-and-push-images.sh v1.0.0 registry.example.com
#
# Environment Variables:
#   DOCKER_REGISTRY: Container registry URL (default: docker.io)
#   DOCKER_USERNAME: Registry username
#   DOCKER_PASSWORD: Registry password (or use docker login)
#   VERSION: Image version tag (default: latest)
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

# Configuration
VERSION=${1:-${VERSION:-latest}}
REGISTRY=${2:-${DOCKER_REGISTRY:-docker.io}}
IMAGE_PREFIX=${IMAGE_PREFIX:-reconciliation-platform}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Image names
BACKEND_IMAGE="${REGISTRY}/${IMAGE_PREFIX}-backend"
FRONTEND_IMAGE="${REGISTRY}/${IMAGE_PREFIX}-frontend"

# ============================================================================
# PREREQUISITES
# ============================================================================

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check BuildKit support
    if ! docker buildx version &> /dev/null; then
        log_warning "BuildKit not available, using standard build"
        USE_BUILDKIT=false
    else
        USE_BUILDKIT=true
        log_info "BuildKit available - enabling advanced caching"
    fi
    
    log_success "Prerequisites check passed"
}

# ============================================================================
# DOCKER LOGIN
# ============================================================================

docker_login() {
    if [[ -n "${DOCKER_USERNAME:-}" && -n "${DOCKER_PASSWORD:-}" ]]; then
        log_info "Logging in to Docker registry: $REGISTRY"
        echo "$DOCKER_PASSWORD" | docker login "$REGISTRY" -u "$DOCKER_USERNAME" --password-stdin || {
            log_error "Failed to login to Docker registry"
            exit 1
        }
        log_success "Logged in to Docker registry"
    else
        log_warning "DOCKER_USERNAME and DOCKER_PASSWORD not set"
        log_info "Attempting to use existing Docker credentials..."
        if ! docker info | grep -q "Username"; then
            log_warning "No Docker credentials found. You may need to run: docker login $REGISTRY"
        fi
    fi
}

# ============================================================================
# BUILD BACKEND IMAGE
# ============================================================================

build_backend() {
    log_info "Building backend image: ${BACKEND_IMAGE}:${VERSION}"
    
    cd "$PROJECT_ROOT"
    
    local build_args=(
        -f infrastructure/docker/Dockerfile.backend
        -t "${BACKEND_IMAGE}:${VERSION}"
        -t "${BACKEND_IMAGE}:latest"
        --build-arg BUILD_MODE=release
        --build-arg RUSTFLAGS="-C target-cpu=native"
        --progress=plain
    )
    
    if [[ "$USE_BUILDKIT" == "true" ]]; then
        build_args+=(
            --cache-from type=registry,ref="${BACKEND_IMAGE}:buildcache"
            --cache-to type=registry,ref="${BACKEND_IMAGE}:buildcache",mode=max
        )
    fi
    
    build_args+=(.)
    
    if docker build "${build_args[@]}"; then
        log_success "Backend image built successfully"
    else
        log_error "Failed to build backend image"
        exit 1
    fi
}

# ============================================================================
# BUILD FRONTEND IMAGE
# ============================================================================

build_frontend() {
    log_info "Building frontend image: ${FRONTEND_IMAGE}:${VERSION}"
    
    cd "$PROJECT_ROOT"
    
    local build_args=(
        -f infrastructure/docker/Dockerfile.frontend
        -t "${FRONTEND_IMAGE}:${VERSION}"
        -t "${FRONTEND_IMAGE}:latest"
        --build-arg NODE_ENV=production
        --build-arg VITE_API_URL="${VITE_API_URL:-http://backend-service:2000}/api/v1"
        --build-arg VITE_WS_URL="${VITE_WS_URL:-ws://backend-service:2000}"
        --build-arg VITE_GOOGLE_CLIENT_ID="${VITE_GOOGLE_CLIENT_ID:-}"
        --progress=plain
    )
    
    if [[ "$USE_BUILDKIT" == "true" ]]; then
        build_args+=(
            --cache-from type=registry,ref="${FRONTEND_IMAGE}:buildcache"
            --cache-to type=registry,ref="${FRONTEND_IMAGE}:buildcache",mode=max
        )
    fi
    
    build_args+=(.)
    
    if docker build "${build_args[@]}"; then
        log_success "Frontend image built successfully"
    else
        log_error "Failed to build frontend image"
        exit 1
    fi
}

# ============================================================================
# PUSH IMAGES
# ============================================================================

push_images() {
    log_info "Pushing images to registry: $REGISTRY"
    
    # Push backend
    log_info "Pushing backend image..."
    if docker push "${BACKEND_IMAGE}:${VERSION}" && docker push "${BACKEND_IMAGE}:latest"; then
        log_success "Backend image pushed successfully"
    else
        log_error "Failed to push backend image"
        exit 1
    fi
    
    # Push frontend
    log_info "Pushing frontend image..."
    if docker push "${FRONTEND_IMAGE}:${VERSION}" && docker push "${FRONTEND_IMAGE}:latest"; then
        log_success "Frontend image pushed successfully"
    else
        log_error "Failed to push frontend image"
        exit 1
    fi
}

# ============================================================================
# VERIFY IMAGES
# ============================================================================

verify_images() {
    log_info "Verifying images..."
    
    # Check backend image
    if docker inspect "${BACKEND_IMAGE}:${VERSION}" &> /dev/null; then
        local backend_size=$(docker inspect "${BACKEND_IMAGE}:${VERSION}" --format='{{.Size}}' | numfmt --to=iec-i --suffix=B)
        log_success "Backend image verified (Size: $backend_size)"
    else
        log_error "Backend image not found"
        exit 1
    fi
    
    # Check frontend image
    if docker inspect "${FRONTEND_IMAGE}:${VERSION}" &> /dev/null; then
        local frontend_size=$(docker inspect "${FRONTEND_IMAGE}:${VERSION}" --format='{{.Size}}' | numfmt --to=iec-i --suffix=B)
        log_success "Frontend image verified (Size: $frontend_size)"
    else
        log_error "Frontend image not found"
        exit 1
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    echo "============================================================================"
    echo "BUILD AND PUSH DOCKER IMAGES"
    echo "============================================================================"
    echo "Version: $VERSION"
    echo "Registry: $REGISTRY"
    echo "Backend Image: ${BACKEND_IMAGE}:${VERSION}"
    echo "Frontend Image: ${FRONTEND_IMAGE}:${VERSION}"
    echo "Started: $(date)"
    echo ""
    
    check_prerequisites
    docker_login
    build_backend
    build_frontend
    verify_images
    
    # Ask for confirmation before pushing
    if [[ "${SKIP_PUSH:-false}" != "true" ]]; then
        echo ""
        read -p "Push images to registry? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            push_images
        else
            log_warning "Skipping push. Images are available locally."
        fi
    else
        push_images
    fi
    
    echo ""
    echo "============================================================================"
    log_success "Build and push completed successfully!"
    echo "============================================================================"
    echo "Backend Image: ${BACKEND_IMAGE}:${VERSION}"
    echo "Frontend Image: ${FRONTEND_IMAGE}:${VERSION}"
    echo ""
    echo "To deploy to Kubernetes, run:"
    echo "  ./scripts/deployment/deploy-kubernetes.sh production $VERSION"
    echo ""
}

# Run main function
main "$@"

