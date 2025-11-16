#!/bin/bash
# ============================================================================
# Backend Build Script
# ============================================================================
# Builds the Rust backend using Docker Compose with multi-stage builds
# ============================================================================
# Usage:
#   ./build-backend.sh                    # Standard build
#   ./build-backend.sh --multi            # Multi-stage build with BuildKit
#   ./build-backend.sh --no-cache         # Build without cache
#   ./build-backend.sh --prod             # Production build with optimizations
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BUILD_MODE="standard"
NO_CACHE=""
PROD_BUILD=""
COMPOSE_FILE="docker-compose.backend.yml"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --multi)
      BUILD_MODE="multi"
      shift
      ;;
    --no-cache)
      NO_CACHE="--no-cache"
      shift
      ;;
    --prod)
      PROD_BUILD="--build-arg BUILD_MODE=release --build-arg RUSTFLAGS=\"-C target-cpu=native\""
      COMPOSE_FILE="docker-compose.yml"
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --multi      Enable multi-stage build with BuildKit"
      echo "  --no-cache   Build without using cache"
      echo "  --prod       Production build with optimizations"
      echo "  --help       Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Backend Build Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Enable BuildKit for multi-stage builds
if [ "$BUILD_MODE" = "multi" ] || [ -n "$PROD_BUILD" ]; then
  export DOCKER_BUILDKIT=1
  export COMPOSE_DOCKER_CLI_BUILD=1
  echo -e "${GREEN}✓ BuildKit enabled for multi-stage builds${NC}"
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
  echo -e "${RED}Error: docker-compose not found${NC}"
  exit 1
fi

# Use docker compose (v2) if available, otherwise docker-compose (v1)
if command -v docker compose &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
else
  DOCKER_COMPOSE="docker-compose"
fi

echo -e "${YELLOW}Building backend service...${NC}"
echo "Compose file: $COMPOSE_FILE"
echo "Build mode: $BUILD_MODE"
echo ""

# Build command
if [ -n "$PROD_BUILD" ]; then
  echo -e "${BLUE}Production build with optimizations...${NC}"
  $DOCKER_COMPOSE -f docker-compose.base.yml -f $COMPOSE_FILE build $NO_CACHE backend
elif [ "$BUILD_MODE" = "multi" ]; then
  echo -e "${BLUE}Multi-stage build with BuildKit...${NC}"
  $DOCKER_COMPOSE -f $COMPOSE_FILE build $NO_CACHE backend
else
  echo -e "${BLUE}Standard build...${NC}"
  $DOCKER_COMPOSE -f $COMPOSE_FILE build $NO_CACHE backend
fi

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}✓ Backend build completed successfully!${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""
  echo "Next steps:"
  echo "  - Start services: $DOCKER_COMPOSE -f $COMPOSE_FILE up -d"
  echo "  - View logs: $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f backend"
  echo "  - Check health: curl http://localhost:2000/api/health"
else
  echo ""
  echo -e "${RED}========================================${NC}"
  echo -e "${RED}✗ Build failed!${NC}"
  echo -e "${RED}========================================${NC}"
  exit 1
fi

