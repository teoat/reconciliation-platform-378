#!/bin/bash
# ==============================================================================
# Frenly AI Maintenance System
# ==============================================================================
# Automated maintenance tasks for Frenly AI to run regularly
# Prevents duplicate files, archives old reports, maintains SSOT
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

LOCK_FILE=".frenly-file-locks.json"
ARCHIVE_BASE="archive"
LOG_FILE="frenly-maintenance.log"

# Initialize lock file if it doesn't exist
init_lock_file() {
    if [ ! -f "$LOCK_FILE" ]; then
        cat > "$LOCK_FILE" << 'EOF'
{
  "locks": {},
  "master_documents": {
    "status": "docs/project-management/PROJECT_STATUS.md",
    "todos": "docs/project-management/MASTER_TODOS.md",
    "diagnostic": "docs/project-management/COMPREHENSIVE_DIAGNOSTIC_REPORT.md",
    "deployment": "docs/deployment/DEPLOYMENT_GUIDE.md",
    "quick_start": "docs/getting-started/QUICK_START.md",
    "mcp": "docs/development/MCP_SETUP_GUIDE.md",
    "consolidation": "docs/project-management/CONSOLIDATION_SUMMARY.md"
  },
  "restricted_patterns": [
    "*COMPLETE*.md",
    "*SUMMARY*.md",
    "*REPORT*.md",
    "*STATUS*.md",
    "*PLAN*.md",
    "*DIAGNOSTIC*.md"
  ],
  "last_maintenance": null
}
EOF
        log_info "Initialized lock file: $LOCK_FILE"
    fi
}

# Check if file is locked (master document)
is_master_document() {
    local file="$1"
    local masters=$(jq -r '.master_documents | to_entries[] | .value' "$LOCK_FILE" 2>/dev/null || echo "")
    
    while IFS= read -r master; do
        if [ "$file" = "$master" ]; then
            return 0
        fi
    done <<< "$masters"
    
    return 1
}

# Check if file matches restricted pattern
matches_restricted_pattern() {
    local file="$1"
    local patterns=$(jq -r '.restricted_patterns[]' "$LOCK_FILE" 2>/dev/null || echo "")
    
    while IFS= read -r pattern; do
        if [[ "$file" == $pattern ]]; then
            return 0
        fi
    done <<< "$patterns"
    
    return 1
}

# Check for duplicate files
check_duplicates() {
    log_info "Checking for duplicate files..."
    local duplicates_found=0
    
    # Check for files matching restricted patterns
    find docs -type f -name "*.md" ! -path "*/archive/*" | while read -r file; do
        if matches_restricted_pattern "$(basename "$file")"; then
            if ! is_master_document "$file"; then
                log_warning "Potential duplicate found: $file (matches restricted pattern)"
                duplicates_found=$((duplicates_found + 1))
            fi
        fi
    done
    
    if [ $duplicates_found -eq 0 ]; then
        log_success "No duplicate files found"
    else
        log_warning "Found $duplicates_found potential duplicates"
    fi
}

# Archive old completion reports (older than 30 days)
archive_old_reports() {
    log_info "Archiving old completion reports (older than 30 days)..."
    local archived=0
    local archive_dir="$ARCHIVE_BASE/docs/completion-reports/$(date +%Y-%m)"
    mkdir -p "$archive_dir"
    
    find docs -type f -name "*COMPLETE*.md" ! -path "*/archive/*" -mtime +30 | while read -r file; do
        if ! is_master_document "$file"; then
            mv "$file" "$archive_dir/"
            log_info "Archived: $file → $archive_dir/"
            archived=$((archived + 1))
        fi
    done
    
    if [ $archived -gt 0 ]; then
        log_success "Archived $archived old completion reports"
    else
        log_info "No old completion reports to archive"
    fi
}

# Archive old diagnostic reports (older than 90 days)
archive_old_diagnostics() {
    log_info "Archiving old diagnostic reports (older than 90 days)..."
    local archived=0
    local archive_dir="$ARCHIVE_BASE/docs/diagnostics/$(date +%Y-%m)"
    mkdir -p "$archive_dir"
    
    find docs -type f -name "*DIAGNOSTIC*.md" ! -path "*/archive/*" -mtime +90 | while read -r file; do
        if ! is_master_document "$file"; then
            mv "$file" "$archive_dir/"
            log_info "Archived: $file → $archive_dir/"
            archived=$((archived + 1))
        fi
    done
    
    if [ $archived -gt 0 ]; then
        log_success "Archived $archived old diagnostic reports"
    else
        log_info "No old diagnostic reports to archive"
    fi
}

# Check for root-level scripts (should be in scripts/ directory)
check_root_scripts() {
    log_info "Checking for root-level scripts..."
    local root_scripts=0
    
    find . -maxdepth 1 -type f -name "*.sh" ! -name "frenly-maintenance.sh" | while read -r script; do
        local basename=$(basename "$script")
        if [ -f "scripts/$basename" ] || [ -f "scripts/deployment/$basename" ]; then
            log_warning "Root-level script found with duplicate in scripts/: $basename"
            root_scripts=$((root_scripts + 1))
        fi
    done
    
    if [ $root_scripts -eq 0 ]; then
        log_success "No duplicate root-level scripts found"
    else
        log_warning "Found $root_scripts root-level scripts that may be duplicates"
    fi
}

# Verify master documents exist and are up-to-date
verify_master_documents() {
    log_info "Verifying master documents..."
    local missing=0
    
    jq -r '.master_documents | to_entries[] | .value' "$LOCK_FILE" | while read -r master; do
        if [ ! -f "$master" ]; then
            log_error "Master document missing: $master"
            missing=$((missing + 1))
        else
            # Check if file was modified in last 90 days (should be maintained)
            local days_old=$(( ($(date +%s) - $(stat -f %m "$master" 2>/dev/null || echo 0)) / 86400 ))
            if [ $days_old -gt 90 ]; then
                log_warning "Master document not updated recently: $master (${days_old} days old)"
            fi
        fi
    done
    
    if [ $missing -eq 0 ]; then
        log_success "All master documents exist"
    else
        log_error "Found $missing missing master documents"
    fi
}

# Check for broken references to archived files
check_broken_references() {
    log_info "Checking for broken references to archived files..."
    local broken=0
    
    # List of archived file patterns
    local archived_patterns=(
        "ALL_CONSOLIDATION_TODOS_COMPLETE"
        "CONSOLIDATION_TODOS_COMPLETE"
        "CONSOLIDATION_EXECUTION_SUMMARY"
        "DUPLICATE_FILES_CONSOLIDATION"
        "FINAL_DIAGNOSTIC_AND_FIX"
        "DEPLOYMENT_INSTRUCTIONS"
        "DEPLOY_NOW"
        "QUICK_START_GUIDE"
    )
    
    for pattern in "${archived_patterns[@]}"; do
        local match_count=$(grep -r "$pattern" docs --include="*.md" ! -path "*/archive/*" 2>/dev/null | wc -l | tr -d '[:space:]' || echo "0")
        if [ -n "$match_count" ] && [ "$match_count" != "0" ] && [ "$match_count" -gt 0 ] 2>/dev/null; then
            log_warning "Found references to archived file pattern: $pattern ($match_count matches)"
            broken=$((broken + match_count))
        fi
    done
    
    if [ $broken -eq 0 ]; then
        log_success "No broken references found"
    else
        log_warning "Found $broken potential broken references"
    fi
}

# Update lock file timestamp
update_maintenance_timestamp() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    jq ".last_maintenance = \"$timestamp\"" "$LOCK_FILE" > "$LOCK_FILE.tmp" && mv "$LOCK_FILE.tmp" "$LOCK_FILE"
    log_info "Updated maintenance timestamp: $timestamp"
}

# Main maintenance function
main() {
    echo -e "${BLUE}===================================================================${NC}"
    echo -e "${BLUE}Frenly AI Maintenance${NC}"
    echo -e "${BLUE}===================================================================${NC}"
    echo ""
    
    init_lock_file
    
    log_info "Starting maintenance tasks..."
    echo ""
    
    # Run maintenance tasks
    check_duplicates
    echo ""
    
    archive_old_reports
    echo ""
    
    archive_old_diagnostics
    echo ""
    
    check_root_scripts
    echo ""
    
    verify_master_documents
    echo ""
    
    check_broken_references
    echo ""
    
    update_maintenance_timestamp
    
    echo -e "${BLUE}===================================================================${NC}"
    echo -e "${GREEN}Maintenance complete!${NC}"
    echo -e "${BLUE}===================================================================${NC}"
}

# Run main function
main "$@"

