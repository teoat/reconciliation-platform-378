#!/bin/bash
# Final Consolidation Pass
# Archives remaining reports and organizes essential files

set -e

ARCHIVE_BASE="archive/docs"
GREEN='\033[0;32m'
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

echo -e "${BLUE}Final Consolidation Pass${NC}"
echo "=========================================="
echo ""

# Archive remaining status/plan files
echo -e "${BLUE}Archiving remaining status/plan files${NC}"
for file in *_PLAN*.md *_PROPOSAL*.md *_ROADMAP*.md *_CHECKLIST*.md; do
    if [ -f "$file" ] && [[ "$file" != "ACCELERATED_IMPLEMENTATION_PLAN.md" ]]; then
        move_file "$file" "$ARCHIVE_BASE/completion-reports/$file" "Plan/Proposal"
    fi
done

# Archive audit reports (keep only comprehensive one)
for file in *_AUDIT*.md; do
    if [ -f "$file" ] && [[ "$file" != "COMPREHENSIVE_SYSTEM_AUDIT_REPORT.md" ]] && [[ "$file" != "AUDIT_REPORT.md" ]]; then
        move_file "$file" "$ARCHIVE_BASE/completion-reports/$file" "Audit Report"
    fi
done

# Archive remaining investigation files
for file in *_FIX*.md *_RESOLUTION*.md *_ISSUE*.md; do
    if [ -f "$file" ]; then
        move_file "$file" "$ARCHIVE_BASE/investigations/$file" "Issue Resolution"
    fi
done

# Archive accessibility files (move to docs if guides, archive if reports)
for file in ACCESSIBILITY_*.md; do
    if [ -f "$file" ]; then
        if [[ "$file" == *"CHECKLIST"* ]] || [[ "$file" == *"IMPROVEMENTS"* ]]; then
            move_file "$file" "docs/frontend/$file" "Accessibility Guide"
        else
            move_file "$file" "$ARCHIVE_BASE/completion-reports/$file" "Accessibility Report"
        fi
    fi
done

# Archive password manager files
for file in PASSWORD_*.md; do
    if [ -f "$file" ] && [[ "$file" != "PASSWORD_SYSTEM_IMPLEMENTATION_GUIDE.md" ]]; then
        move_file "$file" "$ARCHIVE_BASE/completion-reports/$file" "Password Manager"
    fi
done

# Archive logstash files
for file in LOGSTASH_*.md; do
    if [ -f "$file" ]; then
        move_file "$file" "$ARCHIVE_BASE/completion-reports/$file" "Logstash"
    fi
done

# Archive database setup files (keep only guide)
for file in DATABASE_*.md; do
    if [ -f "$file" ] && [[ "$file" != "DATABASE_QUICK_COMMANDS.md" ]]; then
        move_file "$file" "$ARCHIVE_BASE/completion-reports/$file" "Database"
    fi
done

# Archive MCP files
for file in MCP_*.md; do
    if [ -f "$file" ]; then
        move_file "$file" "$ARCHIVE_BASE/completion-reports/$file" "MCP"
    fi
done

# Archive frontend files
for file in FRONTEND_*.md; do
    if [ -f "$file" ]; then
        move_file "$file" "$ARCHIVE_BASE/completion-reports/$file" "Frontend"
    fi
done

# Archive backend files (keep only essential)
for file in BACKEND_*.md; do
    if [ -f "$file" ] && [[ "$file" != "BACKEND_BUILD_COMMANDS.md" ]] && [[ "$file" != "BACKEND_DEPLOYMENT.md" ]]; then
        move_file "$file" "$ARCHIVE_BASE/investigations/$file" "Backend"
    fi
done

# Archive comprehensive reports
for file in COMPREHENSIVE_*.md; do
    if [ -f "$file" ] && [[ "$file" != "COMPREHENSIVE_SYSTEM_AUDIT_REPORT.md" ]]; then
        move_file "$file" "$ARCHIVE_BASE/completion-reports/$file" "Comprehensive Report"
    fi
done

# Archive remaining investigation files
for file in comprehensive-investigation-report.md KNOWN_ISSUE_*.md; do
    if [ -f "$file" ]; then
        move_file "$file" "$ARCHIVE_BASE/investigations/$file" "Investigation"
    fi
done

echo ""
echo -e "${GREEN}Final Pass Complete!${NC}"
echo -e "Files moved: ${GREEN}$moved_count${NC}"

