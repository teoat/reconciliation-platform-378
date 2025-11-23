#!/bin/bash
# Phase 2: Additional Consolidation
# Moves guides to docs/, archives more reports, consolidates scripts

set -e

ARCHIVE_BASE="archive/docs"
ARCHIVE_SCRIPTS="archive/scripts"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

moved_count=0

move_file() {
    local source="$1"
    local dest="$2"
    local category="$3"
    
    if [ -f "$source" ]; then
        mkdir -p "$(dirname "$dest")"
        mv "$source" "$dest"
        echo -e "${GREEN}✓${NC} $category: $(basename "$source")"
        ((moved_count++))
        return 0
    fi
    return 1
}

echo -e "${BLUE}Phase 2: Additional Consolidation${NC}"
echo "=========================================="
echo ""

# Move guides to docs/
echo -e "${BLUE}Moving guides to docs/${NC}"
move_file "DEPLOYMENT_GUIDE.md" "docs/deployment/DEPLOYMENT_GUIDE.md" "Guide"
move_file "DEPLOYMENT_QUICK_START.md" "docs/deployment/DEPLOYMENT_QUICK_START.md" "Guide"
move_file "DATABASE_SETUP_GUIDE.md" "docs/deployment/DATABASE_SETUP_GUIDE.md" "Guide"
move_file "ACCESSIBILITY_TESTING_GUIDE.md" "docs/frontend/ACCESSIBILITY_TESTING_GUIDE.md" "Guide"
move_file "GOOGLE_OAUTH_SETUP.md" "docs/features/GOOGLE_OAUTH_SETUP.md" "Guide"
move_file "GOOGLE_OAUTH_QUICK_START.md" "docs/features/GOOGLE_OAUTH_QUICK_START.md" "Guide"
move_file "GOOGLE_OAUTH_DIAGNOSTIC_GUIDE.md" "docs/features/GOOGLE_OAUTH_DIAGNOSTIC_GUIDE.md" "Guide"
move_file "GOOGLE_OAUTH_NEXT_STEPS.md" "docs/features/GOOGLE_OAUTH_NEXT_STEPS.md" "Guide"
move_file "HOW_TO_DELETE_BRANCHES.md" "docs/development/HOW_TO_DELETE_BRANCHES.md" "Guide"

# Archive more completion/status files
echo ""
echo -e "${BLUE}Archiving additional completion reports${NC}"
for file in ALL_*.md COMPLETE_*.md FINAL_*.md COMPREHENSIVE_*.md; do
    if [ -f "$file" ] && [[ "$file" != "COMPREHENSIVE_SYSTEM_AUDIT_REPORT.md" ]]; then
        move_file "$file" "$ARCHIVE_BASE/completion-reports/$file" "Completion Report"
    fi
done

# Archive investigation files
echo ""
echo -e "${BLUE}Archiving investigation files${NC}"
for file in INVESTIGATION*.md DIAGNOSTIC*.md DIAGNOSIS*.md; do
    if [ -f "$file" ]; then
        move_file "$file" "$ARCHIVE_BASE/investigations/$file" "Investigation"
    fi
done

# Archive consolidation plans (already done)
echo ""
echo -e "${BLUE}Archiving consolidation documentation${NC}"
for file in CONSOLIDATION*.md DOCUMENTATION_CONSOLIDATION*.md; do
    if [ -f "$file" ]; then
        move_file "$file" "$ARCHIVE_BASE/completion-reports/$file" "Consolidation Doc"
    fi
done

# Archive duplicate/unused scripts
echo ""
echo -e "${BLUE}Consolidating duplicate scripts${NC}"

# Root level scripts that duplicate scripts/ directory
if [ -f "deploy-all.sh" ] && [ -f "scripts/deploy.sh" ]; then
    move_file "deploy-all.sh" "$ARCHIVE_SCRIPTS/duplicates/deploy-all.sh" "Duplicate Script"
fi

if [ -f "deploy-backend.sh" ] && [ -f "scripts/deployment/deploy-docker.sh" ]; then
    move_file "deploy-backend.sh" "$ARCHIVE_SCRIPTS/duplicates/deploy-backend.sh" "Duplicate Script"
fi

if [ -f "run-migrations.sh" ] && [ -f "scripts/deployment/run-migrations.sh" ]; then
    move_file "run-migrations.sh" "$ARCHIVE_SCRIPTS/duplicates/run-migrations.sh" "Duplicate Script"
fi

if [ -f "post-deployment-verification.sh" ] && [ -f "scripts/deployment/check-health.sh" ]; then
    move_file "post-deployment-verification.sh" "$ARCHIVE_SCRIPTS/duplicates/post-deployment-verification.sh" "Duplicate Script"
fi

if [ -f "pre-deployment-check.sh" ] && [ -f "scripts/production-deployment-checklist.sh" ]; then
    move_file "pre-deployment-check.sh" "$ARCHIVE_SCRIPTS/duplicates/pre-deployment-check.sh" "Duplicate Script"
fi

if [ -f "build-backend.sh" ] && [ -f "scripts/deploy.sh" ]; then
    move_file "build-backend.sh" "$ARCHIVE_SCRIPTS/duplicates/build-backend.sh" "Duplicate Script"
fi

# Archive test scripts that duplicate scripts/
for test_script in test*.sh start*.sh restart*.sh; do
    if [ -f "$test_script" ] && [ -f "scripts/test.sh" ]; then
        move_file "$test_script" "$ARCHIVE_SCRIPTS/duplicates/$test_script" "Duplicate Test Script"
    fi
done

# Archive PowerShell scripts to archive (keep only essential ones)
for ps_script in *.ps1; do
    if [ -f "$ps_script" ] && [[ "$ps_script" != "install-nodejs.ps1" ]]; then
        move_file "$ps_script" "$ARCHIVE_SCRIPTS/unused/$ps_script" "PowerShell Script"
    fi
done

echo ""
echo -e "${GREEN}Phase 2 Complete!${NC}"
echo -e "Files moved: ${YELLOW}$moved_count${NC}"

