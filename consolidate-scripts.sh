#!/bin/bash
# Consolidate Duplicate and Unused Shell Scripts
# Moves duplicate/unused scripts to archive based on diagnostic report

set -e

ARCHIVE_BASE="archive/scripts"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Script Consolidation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to move file to archive
move_to_archive() {
    local source="$1"
    local dest="$2"
    local category="$3"
    
    if [ -f "$source" ]; then
        mkdir -p "$(dirname "$dest")"
        mv "$source" "$dest"
        echo -e "${GREEN}✓${NC} Moved: $category"
        echo -e "   ${YELLOW}$source${NC} → ${YELLOW}$dest${NC}"
    else
        echo -e "${YELLOW}⚠${NC} Not found: $source"
    fi
}

echo -e "${BLUE}Phase 1: Archiving Unused Deployment Scripts${NC}"
echo "=========================================="

# Unused deployment scripts (duplicates)
move_to_archive "deploy-all.sh" "$ARCHIVE_BASE/unused/deploy-all.sh" "Deploy All"
move_to_archive "deploy-simple.sh" "$ARCHIVE_BASE/unused/deploy-simple.sh" "Deploy Simple"
move_to_archive "deploy-staging.sh" "$ARCHIVE_BASE/unused/deploy-staging.sh" "Deploy Staging"
move_to_archive "deploy-optimized-production.sh" "$ARCHIVE_BASE/unused/deploy-optimized-production.sh" "Deploy Optimized"
move_to_archive "deploy-production-complete.sh" "$ARCHIVE_BASE/unused/deploy-production-complete.sh" "Deploy Production Complete"
move_to_archive "quick_deploy_backend.sh" "$ARCHIVE_BASE/unused/quick_deploy_backend.sh" "Quick Deploy Backend"
move_to_archive "DEPLOY_NOW.sh" "$ARCHIVE_BASE/unused/DEPLOY_NOW.sh" "Deploy Now"
move_to_archive "DEPLOY_FRONTEND.sh" "$ARCHIVE_BASE/unused/DEPLOY_FRONTEND.sh" "Deploy Frontend"

echo ""
echo -e "${BLUE}Phase 2: Archiving Duplicate Backup Scripts${NC}"
echo "=========================================="

# Duplicate backup scripts (keep infrastructure/backup/backup-recovery.sh)
move_to_archive "scripts/backup-database.sh" "$ARCHIVE_BASE/duplicates/backup-database.sh" "Backup Database"
move_to_archive "scripts/backup_restore.sh" "$ARCHIVE_BASE/duplicates/backup_restore.sh" "Backup Restore"

echo ""
echo -e "${BLUE}Phase 3: Archiving Other Unused Scripts${NC}"
echo "=========================================="

# Other unused scripts
move_to_archive "rebuild-docker.sh" "$ARCHIVE_BASE/unused/rebuild-docker.sh" "Rebuild Docker"
move_to_archive "start-deployment.sh" "$ARCHIVE_BASE/unused/start-deployment.sh" "Start Deployment"
move_to_archive "optimize-codebase.sh" "$ARCHIVE_BASE/unused/optimize-codebase.sh" "Optimize Codebase"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Script Consolidation Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  Scripts archived to: ${YELLOW}$ARCHIVE_BASE${NC}"
echo -e "  Check ${YELLOW}DUPLICATE_FUNCTIONS_DIAGNOSTIC.md${NC} for details"
echo ""
echo -e "${YELLOW}Note:${NC} Primary scripts retained:"
echo -e "  - scripts/deploy.sh (general deployment)"
echo -e "  - scripts/deploy-production.sh (production deployment)"
echo -e "  - infrastructure/backup/backup-recovery.sh (backup)"
echo ""

