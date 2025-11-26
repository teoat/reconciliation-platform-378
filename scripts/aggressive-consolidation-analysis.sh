#!/bin/bash
# ==============================================================================
# Aggressive Consolidation Analysis
# ==============================================================================
# Analyzes all files 5 folders deep to identify:
# - Duplicate documentation files
# - Unused/duplicate scripts
# - Files that can be combined
# - Files that should be archived
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

ARCHIVE_BASE="archive"
REPORT_FILE="AGGRESSIVE_CONSOLIDATION_REPORT.md"

echo -e "${BLUE}===================================================================${NC}"
echo -e "${BLUE}Aggressive Consolidation Analysis${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo ""

# Create report file
cat > "$REPORT_FILE" << 'EOF'
# Aggressive Consolidation Report

**Date**: $(date +%Y-%m-%d)  
**Purpose**: Comprehensive analysis of all files for consolidation opportunities

---

## Executive Summary

This report identifies:
- Duplicate documentation files
- Unused/duplicate scripts
- Files that can be combined
- Files that should be archived

---

## 1. Duplicate Documentation Files

EOF

# Find all markdown files (excluding node_modules, .git, archive)
echo -e "${YELLOW}1. Analyzing duplicate documentation files...${NC}"
find . -maxdepth 5 -type f -name "*.md" \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    ! -path "*/archive/*" \
    ! -path "*/coverage/*" \
    ! -path "*/test-results/*" \
    ! -path "*/dist/*" \
    ! -path "*/build/*" \
    | sort > /tmp/all_md_files.txt

# Group by similar names
echo -e "${YELLOW}   Grouping by similar names...${NC}"
{
    echo "### Files with 'CONSOLIDATION' in name:"
    grep -i "consolidation" /tmp/all_md_files.txt | sed 's/^/- /'
    echo ""
    echo "### Files with 'COMPLETE' in name:"
    grep -i "complete" /tmp/all_md_files.txt | sed 's/^/- /'
    echo ""
    echo "### Files with 'SUMMARY' in name:"
    grep -i "summary" /tmp/all_md_files.txt | sed 's/^/- /'
    echo ""
    echo "### Files with 'STATUS' in name:"
    grep -i "status" /tmp/all_md_files.txt | sed 's/^/- /'
    echo ""
    echo "### Files with 'REPORT' in name:"
    grep -i "report" /tmp/all_md_files.txt | sed 's/^/- /'
    echo ""
    echo "### Files with 'DIAGNOSTIC' in name:"
    grep -i "diagnostic" /tmp/all_md_files.txt | sed 's/^/- /'
    echo ""
    echo "### Files with 'PLAN' in name:"
    grep -i "plan" /tmp/all_md_files.txt | sed 's/^/- /'
} >> "$REPORT_FILE"

# Find duplicate scripts
echo -e "${YELLOW}2. Analyzing duplicate scripts...${NC}"
find . -maxdepth 5 -type f -name "*.sh" \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    ! -path "*/archive/*" \
    | sort > /tmp/all_sh_files.txt

{
    echo "## 2. Duplicate Scripts"
    echo ""
    echo "### Root-level scripts (potential duplicates):"
    find . -maxdepth 1 -type f -name "*.sh" | sed 's|^\./||' | sed 's/^/- /'
    echo ""
    echo "### Scripts in scripts/ directory:"
    find scripts -maxdepth 2 -type f -name "*.sh" | sed 's/^/- /'
    echo ""
    echo "### Deployment scripts:"
    grep -i "deploy" /tmp/all_sh_files.txt | sed 's/^/- /'
    echo ""
    echo "### Verification scripts:"
    grep -i "verify" /tmp/all_sh_files.txt | sed 's/^/- /'
    echo ""
    echo "### Test scripts:"
    grep -i "test" /tmp/all_sh_files.txt | sed 's/^/- /'
    echo ""
    echo "### Diagnostic scripts:"
    grep -i "diagnostic\|diagnose" /tmp/all_sh_files.txt | sed 's/^/- /'
} >> "$REPORT_FILE"

# Find files that can be combined
echo -e "${YELLOW}3. Identifying files that can be combined...${NC}"
{
    echo "## 3. Files That Can Be Combined"
    echo ""
    echo "### Multiple consolidation reports:"
    echo "- ALL_CONSOLIDATION_TODOS_COMPLETE.md"
    echo "- CONSOLIDATION_TODOS_COMPLETE.md"
    echo "- CONSOLIDATION_EXECUTION_SUMMARY.md"
    echo "- CONSOLIDATION_SUMMARY.md"
    echo "- FILES_CONSOLIDATION_FINAL_REPORT.md"
    echo "- DUPLICATE_FILES_CONSOLIDATION_COMPLETE.md"
    echo "- DUPLICATE_FILES_CONSOLIDATION_PLAN.md"
    echo "- DUPLICATE_FILES_INVESTIGATION_COMPLETE.md"
    echo ""
    echo "### Multiple deployment guides:"
    grep -i "deployment" /tmp/all_md_files.txt | grep -i "guide\|instructions\|plan" | sed 's/^/- /'
    echo ""
    echo "### Multiple quick start guides:"
    grep -i "quick.*start" /tmp/all_md_files.txt | sed 's/^/- /'
} >> "$REPORT_FILE"

# Count files
MD_COUNT=$(wc -l < /tmp/all_md_files.txt)
SH_COUNT=$(wc -l < /tmp/all_sh_files.txt)

{
    echo "## 4. Statistics"
    echo ""
    echo "- **Total Markdown Files**: $MD_COUNT"
    echo "- **Total Shell Scripts**: $SH_COUNT"
    echo ""
    echo "## 5. Recommended Actions"
    echo ""
    echo "### Archive Immediately:"
    echo "- All consolidation completion reports (keep only CONSOLIDATION_SUMMARY.md)"
    echo "- All duplicate investigation reports (keep only FILES_CONSOLIDATION_FINAL_REPORT.md)"
    echo "- Root-level deployment scripts (keep only scripts/deployment/)"
    echo "- Root-level verification scripts (keep only scripts/)"
    echo ""
    echo "### Combine:"
    echo "- Multiple deployment guides → DEPLOYMENT_GUIDE.md"
    echo "- Multiple quick start guides → QUICK_START.md"
    echo "- Multiple MCP setup guides → MCP_SETUP_GUIDE.md"
} >> "$REPORT_FILE"

echo -e "${GREEN}Analysis complete! Report saved to: $REPORT_FILE${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  Markdown files found: ${MD_COUNT}"
echo -e "  Shell scripts found: ${SH_COUNT}"
echo ""

