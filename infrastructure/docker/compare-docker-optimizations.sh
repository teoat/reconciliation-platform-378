#!/bin/bash
# Compare Docker image sizes before and after optimization

set -e

echo "================================================================="
echo "Docker Image Optimization Comparison"
echo "================================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build original images
echo "${YELLOW}Building original images...${NC}"
echo "Backend (optimized):"
docker build -f infrastructure/docker/Dockerfile.backend.optimized -t backend-original:test . --quiet
BACKEND_ORIGINAL_SIZE=$(docker images backend-original:test --format "{{.Size}}")
echo "✓ Size: $BACKEND_ORIGINAL_SIZE"

echo ""
echo "Frontend (optimized):"
docker build -f infrastructure/docker/Dockerfile.frontend.optimized -t frontend-original:test . --quiet --build-arg VITE_API_URL=http://localhost:2000/api/v1
FRONTEND_ORIGINAL_SIZE=$(docker images frontend-original:test --format "{{.Size}}")
echo "✓ Size: $FRONTEND_ORIGINAL_SIZE"

echo ""
echo "${YELLOW}Building optimized V2 images...${NC}"
echo "Backend (optimized v2):"
docker build -f infrastructure/docker/Dockerfile.backend.optimized.v2 -t backend-optimized:test . --quiet
BACKEND_OPTIMIZED_SIZE=$(docker images backend-optimized:test --format "{{.Size}}")
echo "✓ Size: $BACKEND_OPTIMIZED_SIZE"

echo ""
echo "Frontend (optimized v2):"
docker build -f infrastructure/docker/Dockerfile.frontend.optimized.v2 -t frontend-optimized:test . --quiet --build-arg VITE_API_URL=http://localhost:2000/api/v1
FRONTEND_OPTIMIZED_SIZE=$(docker images frontend-optimized:test --format "{{.Size}}")
echo "✓ Size: $FRONTEND_OPTIMIZED_SIZE"

echo ""
echo "================================================================="
echo "Results Summary"
echo "================================================================="
echo ""
echo "Backend:"
echo "  Original: $BACKEND_ORIGINAL_SIZE"
echo "  Optimized V2: $BACKEND_OPTIMIZED_SIZE"
echo ""
echo "Frontend:"
echo "  Original: $FRONTEND_ORIGINAL_SIZE"
echo "  Optimized V2: $FRONTEND_OPTIMIZED_SIZE"
echo ""

# Detailed layer analysis
echo "================================================================="
echo "Layer Analysis"
echo "================================================================="
echo ""
echo "Backend Original Layers:"
docker history backend-original:test --no-trunc --human | head -20

echo ""
echo "Backend Optimized V2 Layers:"
docker history backend-optimized:test --no-trunc --human | head -20

echo ""
echo "Frontend Original Layers:"
docker history frontend-original:test --no-trunc --human | head -20

echo ""
echo "Frontend Optimized V2 Layers:"
docker history frontend-optimized:test --no-trunc --human | head -20

# Cleanup
echo ""
echo "${YELLOW}Cleaning up test images...${NC}"
docker rmi backend-original:test backend-optimized:test frontend-original:test frontend-optimized:test --force > /dev/null 2>&1

echo ""
echo "${GREEN}✓ Comparison complete!${NC}"
echo ""
echo "Key Improvements in V2:"
echo "  ✓ Multi-stage caching for dependencies"
echo "  ✓ Stripped binaries (backend)"
echo "  ✓ Non-root user (backend)"
echo "  ✓ Production-only dependencies (frontend)"
echo "  ✓ Optimized nginx configuration with gzip"
echo "  ✓ Health checks added"
echo "  ✓ Security headers configured"

