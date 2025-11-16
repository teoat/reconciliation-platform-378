#!/bin/bash
# Build Performance Benchmark Script
# Tests and measures build times for optimized Dockerfiles

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
RESULTS_FILE=".deployment/benchmark-results.txt"
BACKEND_DOCKERFILE="infrastructure/docker/Dockerfile.backend.fast"
FRONTEND_DOCKERFILE="infrastructure/docker/Dockerfile.frontend.fast"

echo "═══════════════════════════════════════"
echo "   Docker Build Performance Benchmark"
echo "═══════════════════════════════════════"
echo ""

# Function to measure build time
measure_build() {
    local name=$1
    local dockerfile=$2
    local context=${3:-.}
    
    echo -e "${BLUE}[TEST]${NC} $name"
    
    # Measure build time
    START=$(date +%s)
    docker build -f "$dockerfile" "$context" -t "benchmark-test:$name" --quiet
    END=$(date +%s)
    
    DURATION=$((END - START))
    
    echo -e "${GREEN}[DONE]${NC} $name: ${DURATION}s"
    echo "$name: ${DURATION}s" >> "$RESULTS_FILE"
    
    return 0
}

# Function to measure image size
measure_size() {
    local image=$1
    local name=$2
    
    SIZE=$(docker image inspect "$image" --format='{{.Size}}' 2>/dev/null || echo "0")
    SIZE_MB=$((SIZE / 1024 / 1024))
    
    echo -e "${GREEN}[SIZE]${NC} $name: ${SIZE_MB}MB"
    echo "$name size: ${SIZE_MB}MB" >> "$RESULTS_FILE"
}

# Initialize results file
echo "Build Performance Benchmark - $(date)" > "$RESULTS_FILE"
echo "═══════════════════════════════════════" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

# Enable BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo -e "${YELLOW}BuildKit enabled${NC}"
echo ""

# Test 1: Cold Build (no cache)
echo "═══════════════════════════════════════"
echo "TEST 1: Cold Build (no cache)"
echo "═══════════════════════════════════════"
echo ""

docker builder prune -af --filter "until=24h" > /dev/null 2>&1 || true

measure_build "backend-cold" "$BACKEND_DOCKERFILE" "."
measure_size "benchmark-test:backend-cold" "backend-cold"
echo ""

# Test 2: Warm Build - Code Change Only
echo "═══════════════════════════════════════"
echo "TEST 2: Warm Build (code change)"
echo "═══════════════════════════════════════"
echo ""

# Touch a source file to trigger rebuild
touch backend/src/main.rs

measure_build "backend-warm-code" "$BACKEND_DOCKERFILE" "."
echo ""

# Test 3: Dependency Change
echo "═══════════════════════════════════════"
echo "TEST 3: Dependency Change"
echo "═══════════════════════════════════════"
echo ""

# Touch Cargo.toml to trigger dependency rebuild
touch backend/Cargo.toml

measure_build "backend-deps" "$BACKEND_DOCKERFILE" "."
echo ""

# Test 4: Frontend Build
echo "═══════════════════════════════════════"
echo "TEST 4: Frontend Build"
echo "═══════════════════════════════════════"
echo ""

measure_build "frontend" "$FRONTEND_DOCKERFILE" "."
measure_size "benchmark-test:frontend" "frontend"
echo ""

# Calculate improvements
echo "═══════════════════════════════════════"
echo "Summary"
echo "═══════════════════════════════════════"
echo ""

echo -e "${GREEN}Benchmark complete!${NC}"
echo ""
echo "Results saved to: $RESULTS_FILE"
echo ""

# Display results
cat "$RESULTS_FILE"
echo ""

# Cleanup
echo -e "${YELLOW}Cleaning up benchmark images...${NC}"
docker images | grep "benchmark-test" | awk '{print $3}' | xargs docker rmi -f > /dev/null 2>&1 || true

echo -e "${GREEN}Done!${NC}"

