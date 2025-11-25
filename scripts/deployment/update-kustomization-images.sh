#!/bin/bash
# ============================================================================
# UPDATE KUSTOMIZATION IMAGE TAGS
# ============================================================================
# Updates image tags in kustomization.yaml for production deployment
#
# Usage:
#   ./scripts/deployment/update-kustomization-images.sh [version] [registry] [prefix]
#   ./scripts/deployment/update-kustomization-images.sh v1.0.0 registry.example.com reconciliation-platform
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Configuration
VERSION=${1:-${VERSION:-latest}}
REGISTRY=${2:-${DOCKER_REGISTRY:-docker.io}}
PREFIX=${3:-${IMAGE_PREFIX:-reconciliation-platform}}

KUSTOMIZATION_FILE="$PROJECT_ROOT/k8s/optimized/overlays/production/kustomization.yaml"

# ============================================================================
# UPDATE IMAGES
# ============================================================================

update_images() {
    echo "Updating image tags in: $KUSTOMIZATION_FILE"
    echo "  Version: $VERSION"
    echo "  Registry: $REGISTRY"
    echo "  Prefix: $PREFIX"
    echo ""
    
    # Create backup
    cp "$KUSTOMIZATION_FILE" "${KUSTOMIZATION_FILE}.bak"
    
    # Update backend image
    sed -i.tmp \
        -e "s|newName:.*reconciliation-backend|newName: ${REGISTRY}/${PREFIX}-backend|g" \
        -e "s|newTag:.*|newTag: ${VERSION}|g" \
        "$KUSTOMIZATION_FILE"
    
    # Update frontend image (if separate entry exists)
    sed -i.tmp \
        -e "s|newName:.*reconciliation-frontend|newName: ${REGISTRY}/${PREFIX}-frontend|g" \
        "$KUSTOMIZATION_FILE"
    
    # Clean up temp file
    rm -f "${KUSTOMIZATION_FILE}.tmp"
    
    echo "✓ Image tags updated"
    echo ""
    echo "Backup saved to: ${KUSTOMIZATION_FILE}.bak"
}

# Run update
update_images

