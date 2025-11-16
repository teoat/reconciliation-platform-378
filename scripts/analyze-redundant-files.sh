#!/bin/bash
# ==============================================================================
# Analyze Redundant and Unused Files
# ==============================================================================
# Identifies redundant Docker files, unused code, and duplicate files
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}===================================================================${NC}"
echo -e "${BLUE}Redundant File Analysis${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo ""

# Track redundant files
REDUNDANT_FILES=()

# 1. Check for redundant Dockerfiles
echo -e "${YELLOW}1. Redundant Dockerfiles${NC}"
echo ""

# Main Dockerfiles (keep these)
MAIN_DOCKERFILES=(
    "infrastructure/docker/Dockerfile.backend"
    "infrastructure/docker/Dockerfile.frontend"
)

# Redundant Dockerfiles (can be removed)
REDUNDANT_DOCKERFILES=(
    "infrastructure/docker/Dockerfile.backend.optimized"
    "infrastructure/docker/Dockerfile.backend.optimized.v2"
    "infrastructure/docker/Dockerfile.backend.fast"
    "infrastructure/docker/Dockerfile.frontend.optimized"
    "infrastructure/docker/Dockerfile.frontend.optimized.v2"
    "infrastructure/docker/Dockerfile.frontend.fast"
    "infrastructure/docker/Dockerfile"
    "packages/frontend/Dockerfile"
    "packages/backend/Dockerfile"
)

for file in "${REDUNDANT_DOCKERFILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${RED}✗${NC} $file (redundant - can be removed)"
        REDUNDANT_FILES+=("$file")
    fi
done

for file in "${MAIN_DOCKERFILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file (active)"
    fi
done

echo ""

# 2. Check for redundant docker-compose files
echo -e "${YELLOW}2. Redundant Docker Compose Files${NC}"
echo ""

# Main docker-compose (keep)
MAIN_COMPOSE="docker-compose.yml"

# Potentially redundant compose files
REDUNDANT_COMPOSE=(
    "docker-compose.fast.yml"
    "docker-compose.simple.yml"
    "docker-compose.test.yml"
    "docker-compose.monitoring.yml"
    "docker-compose.frontend.vite.yml"
    "infrastructure/docker/docker-compose.yml"
    "infrastructure/docker/docker-compose.dev.yml"
    "infrastructure/docker/docker-compose.prod.yml"
    "packages/frontend/docker-compose.yml"
)

for file in "${REDUNDANT_COMPOSE[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${YELLOW}?${NC} $file (review if needed)"
    fi
done

if [ -f "$MAIN_COMPOSE" ]; then
    echo -e "  ${GREEN}✓${NC} $MAIN_COMPOSE (active)"
fi

echo ""

# 3. Check for backup/archive files
echo -e "${YELLOW}3. Backup and Archive Files${NC}"
echo ""

BACKUP_FILES=(
    "dockerfile-backup-*.tar.gz"
    "*.backup"
    "*.bak"
    "*.old"
)

for pattern in "${BACKUP_FILES[@]}"; do
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            echo -e "  ${RED}✗${NC} $file (backup file - can be removed)"
            REDUNDANT_FILES+=("$file")
        fi
    done < <(find . -name "$pattern" -type f 2>/dev/null || true)
done

echo ""

# 4. Check for duplicate/unused scripts
echo -e "${YELLOW}4. Potentially Unused Scripts${NC}"
echo ""

UNUSED_SCRIPTS=(
    "deploy-all.sh"
    "deploy-simple.sh"
    "deploy-staging.sh"
    "deploy-production.sh"
    "deploy-optimized-production.sh"
    "deploy-local.ps1"
    "deploy.ps1"
    "rebuild-docker.ps1"
    "rebuild-docker.sh"
)

for file in "${UNUSED_SCRIPTS[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${YELLOW}?${NC} $file (review if needed)"
    fi
done

echo ""

# 5. Summary
echo -e "${BLUE}===================================================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo -e "  Redundant files found: ${#REDUNDANT_FILES[@]}"
echo ""

if [ ${#REDUNDANT_FILES[@]} -gt 0 ]; then
    echo -e "${YELLOW}Files that can be removed:${NC}"
    for file in "${REDUNDANT_FILES[@]}"; do
        echo -e "  - $file"
    done
    echo ""
    echo -e "${YELLOW}To remove these files, run:${NC}"
    echo -e "  ${BLUE}rm ${REDUNDANT_FILES[*]}${NC}"
fi

echo ""

