#!/bin/bash
# ============================================================================
# MASTER PRODUCTION DEPLOYMENT SCRIPT
# ============================================================================
# Complete production deployment pipeline for Docker and Kubernetes
#
# Usage:
#   ./scripts/deployment/deploy-production.sh [platform] [version]
#   ./scripts/deployment/deploy-production.sh kubernetes v1.0.0
#   ./scripts/deployment/deploy-production.sh docker v1.0.0
#
# Platforms:
#   kubernetes  - Deploy to Kubernetes cluster (default)
#   docker      - Deploy using Docker Compose
#   all         - Deploy to both platforms
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

# Configuration
PLATFORM=${1:-kubernetes}
VERSION=${2:-${VERSION:-latest}}
REGISTRY=${DOCKER_REGISTRY:-docker.io}
IMAGE_PREFIX=${IMAGE_PREFIX:-reconciliation-platform}

# ============================================================================
# BUILD AND PUSH IMAGES
# ============================================================================

build_and_push() {
    log_info "Building and pushing Docker images..."
    
    "$SCRIPT_DIR/build-and-push-images.sh" "$VERSION" "$REGISTRY" || {
        log_error "Failed to build and push images"
        exit 1
    }
}

# ============================================================================
# DEPLOY TO KUBERNETES
# ============================================================================

deploy_kubernetes() {
    log_info "Deploying to Kubernetes..."
    
    "$SCRIPT_DIR/deploy-kubernetes-production.sh" "$VERSION" || {
        log_error "Failed to deploy to Kubernetes"
        exit 1
    }
}

# ============================================================================
# DEPLOY TO DOCKER
# ============================================================================

deploy_docker() {
    log_info "Deploying to Docker Compose..."
    
    "$SCRIPT_DIR/deploy-docker-production.sh" up || {
        log_error "Failed to deploy to Docker Compose"
        exit 1
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    echo "============================================================================"
    echo "PRODUCTION DEPLOYMENT - MASTER SCRIPT"
    echo "============================================================================"
    echo "Platform: $PLATFORM"
    echo "Version: $VERSION"
    echo "Registry: $REGISTRY"
    echo "Started: $(date)"
    echo ""
    
    # Build and push images first (required for Kubernetes)
    if [[ "$PLATFORM" == "kubernetes" || "$PLATFORM" == "all" ]]; then
        build_and_push
    fi
    
    # Deploy based on platform
    case "$PLATFORM" in
        kubernetes|k8s)
            deploy_kubernetes
            ;;
        docker|compose)
            deploy_docker
            ;;
        all)
            deploy_kubernetes
            echo ""
            log_info "Kubernetes deployment completed. Starting Docker deployment..."
            deploy_docker
            ;;
        *)
            log_error "Unknown platform: $PLATFORM"
            echo "Available platforms: kubernetes, docker, all"
            exit 1
            ;;
    esac
    
    echo ""
    echo "============================================================================"
    log_success "Production deployment completed successfully!"
    echo "============================================================================"
    echo ""
    echo "Deployment Summary:"
    echo "  Platform: $PLATFORM"
    echo "  Version: $VERSION"
    echo "  Registry: $REGISTRY"
    echo ""
    
    if [[ "$PLATFORM" == "kubernetes" || "$PLATFORM" == "all" ]]; then
        echo "Kubernetes:"
        echo "  Check status: kubectl get pods -n reconciliation-platform"
        echo "  View logs: kubectl logs -f -n reconciliation-platform deployment/backend"
    fi
    
    if [[ "$PLATFORM" == "docker" || "$PLATFORM" == "all" ]]; then
        echo "Docker Compose:"
        echo "  Check status: docker-compose ps"
        echo "  View logs: docker-compose logs -f"
    fi
    echo ""
}

# Run main function
main "$@"

