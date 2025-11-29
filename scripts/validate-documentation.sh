#!/bin/bash

# ============================================================================
# Documentation Validation Script
# ============================================================================
# Validates documentation for:
# - Broken links
# - SSOT compliance
# - Cross-references
# - Documentation freshness
# - Missing files
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/docs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0
ISSUES=0

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((ERRORS++))
}

# ============================================================================
# Validation Functions
# ============================================================================

check_ssot_files_exist() {
    log_info "Checking SSOT files exist..."
    
    local ssot_files=(
        "docs/DOCUMENTATION_HUB.md"
        "docs/README.md"
        "docs/DOCUMENTATION_STANDARDS.md"
        "docs/QUICK_REFERENCE.md"
        "docs/deployment/DEPLOYMENT_GUIDE.md"
        "docs/operations/TROUBLESHOOTING.md"
        "docs/operations/INCIDENT_RESPONSE_RUNBOOKS.md"
        "docs/operations/MONITORING_GUIDE.md"
        "docs/development/MCP_SETUP_GUIDE.md"
        "docs/development/QUICK-REFERENCE-COMMANDS.md"
        "docs/development/REDIS_AND_TOOLS_CONFIGURATION.md"
        "docs/architecture/SSOT_GUIDANCE.md"
        "docs/architecture/SSOT_AREAS_AND_LOCKING.md"
    )
    
    for file in "${ssot_files[@]}"; do
        if [[ ! -f "$PROJECT_ROOT/$file" ]]; then
            log_error "SSOT file missing: $file"
            ((ISSUES++))
        else
            log_success "SSOT file exists: $file"
        fi
    done
}

check_broken_links() {
    log_info "Checking for broken links..."
    
    local broken_links=0
    
    while IFS= read -r -d '' file; do
        # Extract markdown links
        while IFS= read -r line || [ -n "$line" ]; do
            # Match markdown links: [text](./path/to/file.md)
            # Use grep to extract links instead of bash regex
            local link_match=$(echo "$line" | grep -oP '\[([^\]]+)\]\(([^)]+)\)' | head -1)
            if [ -n "$link_match" ]; then
                local link_path=$(echo "$link_match" | grep -oP '\(([^)]+)\)' | tr -d '()')
                
                # Skip external links
                if [[ $link_path =~ ^https?:// ]]; then
                    continue
                fi
                
                # Resolve relative paths
                local file_dir="$(dirname "$file")"
                local resolved_path=""
                
                if [[ $link_path =~ ^\./ ]]; then
                    resolved_path="$file_dir/${link_path#./}"
                elif [[ $link_path =~ ^\.\./ ]]; then
                    local link_dir="$(dirname "$link_path")"
                    local link_file="$(basename "$link_path")"
                    if cd "$file_dir" && cd "$link_dir" 2>/dev/null; then
                        resolved_path="$(pwd)/$link_file"
                    else
                        resolved_path=""
                    fi
                else
                    resolved_path="$file_dir/$link_path"
                fi
                
                # Check if file exists
                if [[ -n "$resolved_path" ]] && [[ ! -f "$resolved_path" ]] && [[ ! -d "$resolved_path" ]]; then
                    log_warning "Broken link in $file: $link_path"
                    ((broken_links++))
                fi
            fi
        done < "$file"
    done < <(find "$DOCS_DIR" -name "*.md" -type f -print0)
    
    if [[ $broken_links -eq 0 ]]; then
        log_success "No broken links found"
    else
        log_warning "Found $broken_links broken links"
        ((ISSUES+=broken_links))
    fi
}

check_documentation_freshness() {
    log_info "Checking documentation freshness..."
    
    local stale_docs=0
    local max_age_days=180  # 6 months
    
    while IFS= read -r -d '' file; do
        # Get file modification time
        local mod_time=$(stat -f "%m" "$file" 2>/dev/null || stat -c "%Y" "$file" 2>/dev/null)
        local current_time=$(date +%s)
        local age_days=$(( (current_time - mod_time) / 86400 ))
        
        if [[ $age_days -gt $max_age_days ]]; then
            log_warning "Stale documentation: $file (last modified $age_days days ago)"
            ((stale_docs++))
        fi
    done < <(find "$DOCS_DIR" -name "*.md" -type f -print0)
    
    if [[ $stale_docs -eq 0 ]]; then
        log_success "All documentation is fresh"
    else
        log_warning "Found $stale_docs stale documentation files"
        ((ISSUES+=stale_docs))
    fi
}

check_cross_references() {
    log_info "Checking cross-references..."
    
    local missing_refs=0
    
    # Check if DOCUMENTATION_HUB.md references key documents
    local hub_file="$DOCS_DIR/DOCUMENTATION_HUB.md"
    if [[ -f "$hub_file" ]]; then
        local key_docs=(
            "DEPLOYMENT_GUIDE.md"
            "TROUBLESHOOTING.md"
            "API_REFERENCE.md"
            "ARCHITECTURE.md"
        )
        
        for doc in "${key_docs[@]}"; do
            if ! grep -q "$doc" "$hub_file"; then
                log_warning "DOCUMENTATION_HUB.md missing reference to $doc"
                ((missing_refs++))
            fi
        done
    fi
    
    if [[ $missing_refs -eq 0 ]]; then
        log_success "Cross-references are complete"
    else
        log_warning "Found $missing_refs missing cross-references"
        ((ISSUES+=missing_refs))
    fi
}

check_deprecated_files() {
    log_info "Checking for deprecated files that should be archived..."
    
    local deprecated_patterns=(
        "*_COMPLETE.md"
        "*_SUMMARY.md"
        "*_REPORT.md"
        "*_DIAGNOSTIC.md"
        "*_PLAN.md"
        "*_PROPOSAL.md"
        "*_TODO.md"
        "*_CHECKLIST.md"
    )
    
    local deprecated_count=0
    
    for pattern in "${deprecated_patterns[@]}"; do
        while IFS= read -r -d '' file; do
            # Skip archive directory
            if [[ "$file" == *"/archive/"* ]]; then
                continue
            fi
            
            # Skip PROJECT_STATUS.md (allowed)
            if [[ "$(basename "$file")" == "PROJECT_STATUS.md" ]]; then
                continue
            fi
            
            log_warning "Deprecated file pattern found: $file"
            ((deprecated_count++))
        done < <(find "$DOCS_DIR" -name "$pattern" -type f -print0 2>/dev/null || true)
    done
    
    if [[ $deprecated_count -eq 0 ]]; then
        log_success "No deprecated files found in active directories"
    else
        log_warning "Found $deprecated_count files matching deprecated patterns (should be archived)"
        ((ISSUES+=deprecated_count))
    fi
}

check_documentation_standards() {
    log_info "Checking documentation standards compliance..."
    
    local non_compliant=0
    
    while IFS= read -r -d '' file; do
        # Check for "Last Updated" field
        if ! grep -q "Last Updated\|last updated\|Last updated" "$file"; then
            log_warning "Missing 'Last Updated' field: $file"
            ((non_compliant++))
        fi
        
        # Check for status field (optional but recommended)
        if ! grep -q "Status\|status" "$file"; then
            log_warning "Missing 'Status' field: $file"
            ((non_compliant++))
        fi
    done < <(find "$DOCS_DIR" -name "*.md" -type f -not -path "*/archive/*" -print0)
    
    if [[ $non_compliant -eq 0 ]]; then
        log_success "All documentation follows standards"
    else
        log_warning "Found $non_compliant non-compliant documentation files"
        ((ISSUES+=non_compliant))
    fi
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    log_info "Starting documentation validation..."
    echo ""
    
    check_ssot_files_exist
    echo ""
    
    check_broken_links
    echo ""
    
    check_documentation_freshness
    echo ""
    
    check_cross_references
    echo ""
    
    check_deprecated_files
    echo ""
    
    check_documentation_standards
    echo ""
    
    # Summary
    echo "============================================================================"
    log_info "Validation Summary:"
    echo "  Errors: $ERRORS"
    echo "  Warnings: $WARNINGS"
    echo "  Total Issues: $ISSUES"
    echo "============================================================================"
    
    if [[ $ERRORS -eq 0 ]] && [[ $WARNINGS -eq 0 ]]; then
        log_success "Documentation validation passed!"
        exit 0
    elif [[ $ERRORS -eq 0 ]]; then
        log_warning "Documentation validation passed with warnings"
        exit 0
    else
        log_error "Documentation validation failed with errors"
        exit 1
    fi
}

# Run main function
main "$@"

