#!/bin/bash
# Comprehensive Consolidation Script
# Archives completion reports, diagnostics, and consolidates scripts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/scripts/lib/common-functions.sh" 2>/dev/null || true

ARCHIVE_BASE="archive/docs"
ARCHIVE_SCRIPTS="archive/scripts"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Comprehensive Consolidation Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create archive directories
mkdir -p "$ARCHIVE_BASE/completion-reports"
mkdir -p "$ARCHIVE_BASE/diagnostics"
mkdir -p "$ARCHIVE_BASE/investigations"
mkdir -p "$ARCHIVE_SCRIPTS/duplicates"
mkdir -p "$ARCHIVE_SCRIPTS/unused"

moved_count=0

# Function to safely move file
move_file() {
    local source="$1"
    local dest="$2"
    local category="$3"
    
    if [ -f "$source" ]; then
        mkdir -p "$(dirname "$dest")"
        mv "$source" "$dest"
        echo -e "${GREEN}✓${NC} Archived: $category"
        ((moved_count++))
        return 0
    fi
    return 1
}

echo -e "${BLUE}Phase 1: Archiving Completion/Status Reports${NC}"
echo "=========================================="

# Completion/Status reports pattern
for file in *_COMPLETE*.md *_SUMMARY*.md *_STATUS*.md *_FINAL*.md *_COMPLETION*.md; do
    if [ -f "$file" ]; then
        move_file "$file" "$ARCHIVE_BASE/completion-reports/$file" "Completion Report"
    fi
done

echo ""
echo -e "${BLUE}Phase 2: Archiving Diagnostic/Investigation Reports${NC}"
echo "=========================================="

# Diagnostic reports
for file in *_DIAGNOSIS*.md *_DIAGNOSTIC*.md *_INVESTIGATION*.md *_REPORT*.md; do
    if [ -f "$file" ]; then
        # Skip if it's a guide or important reference
        if [[ "$file" != *"GUIDE"* ]] && [[ "$file" != *"REFERENCE"* ]] && [[ "$file" != *"AUDIT_REPORT"* ]]; then
            move_file "$file" "$ARCHIVE_BASE/diagnostics/$file" "Diagnostic Report"
        fi
    fi
done

echo ""
echo -e "${BLUE}Phase 3: Archiving Investigation Files${NC}"
echo "=========================================="

# Investigation files
for file in INVESTIGATION*.md ROOT_CAUSE*.md BREAKTHROUGH*.md NEXT_STEPS*.md BACKEND_*.md; do
    if [ -f "$file" ] && [[ "$file" != "BACKEND_BUILD_COMMANDS.md" ]] && [[ "$file" != "BACKEND_DEPLOYMENT.md" ]]; then
        move_file "$file" "$ARCHIVE_BASE/investigations/$file" "Investigation"
    fi
done

echo ""
echo -e "${BLUE}Phase 4: Consolidating Duplicate Scripts${NC}"
echo "=========================================="

# Duplicate deployment scripts
if [ -f "deploy.sh" ] && [ -f "scripts/deploy.sh" ]; then
    move_file "deploy.sh" "$ARCHIVE_SCRIPTS/duplicates/deploy.sh" "Duplicate Script"
fi

if [ -f "deploy-production.sh" ] && [ -f "scripts/deploy-production.sh" ]; then
    move_file "deploy-production.sh" "$ARCHIVE_SCRIPTS/duplicates/deploy-production.sh" "Duplicate Script"
fi

if [ -f "apply-db-indexes.sh" ] && [ -f "scripts/apply-db-indexes.sh" ]; then
    move_file "apply-db-indexes.sh" "$ARCHIVE_SCRIPTS/duplicates/apply-db-indexes.sh" "Duplicate Script"
fi

if [ -f "apply-database-indexes.sh" ] && [ -f "scripts/apply-db-indexes.sh" ]; then
    move_file "apply-database-indexes.sh" "$ARCHIVE_SCRIPTS/duplicates/apply-database-indexes.sh" "Duplicate Script"
fi

# Consolidate documentation scripts
if [ -f "consolidate-documentation.sh" ] && [ -f "consolidate-scripts.sh" ]; then
    # Keep consolidate-scripts.sh, archive consolidate-documentation.sh if redundant
    if [ -f "consolidate-all.sh" ]; then
        move_file "consolidate-documentation.sh" "$ARCHIVE_SCRIPTS/duplicates/consolidate-documentation.sh" "Consolidated Script"
        move_file "consolidate-scripts.sh" "$ARCHIVE_SCRIPTS/duplicates/consolidate-scripts.sh" "Consolidated Script"
    fi
fi

echo ""
echo -e "${BLUE}Phase 5: Archiving Agent/Progress Reports${NC}"
echo "=========================================="

# Agent progress reports
for file in AGENT*.md AGENT1*.md AGENT2*.md AGENT3*.md; do
    if [ -f "$file" ]; then
        move_file "$file" "$ARCHIVE_BASE/completion-reports/$file" "Agent Report"
    fi
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Consolidation Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Files moved: ${YELLOW}$moved_count${NC}"
echo ""
echo -e "${BLUE}Archive locations:${NC}"
echo -e "  • Completion reports: ${YELLOW}$ARCHIVE_BASE/completion-reports/${NC}"
echo -e "  • Diagnostics: ${YELLOW}$ARCHIVE_BASE/diagnostics/${NC}"
echo -e "  • Investigations: ${YELLOW}$ARCHIVE_BASE/investigations/${NC}"
echo -e "  • Duplicate scripts: ${YELLOW}$ARCHIVE_SCRIPTS/duplicates/${NC}"
echo ""

