#!/bin/bash
# Aggressive Documentation Consolidation Script
# Archives redundant documentation files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ARCHIVE_BASE="$PROJECT_ROOT/docs/archive"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create archive directories
create_archive_dirs() {
    log_info "Creating archive directory structure..."
    mkdir -p "$ARCHIVE_BASE/diagnostics/2025-01/"{authentication,completion,status,reports,next-steps}
    mkdir -p "$ARCHIVE_BASE/project-management/2025-01/"{completion,optimization,phase,consolidation,status}
    log_info "Archive directories created"
}

# Archive diagnostics files
archive_diagnostics() {
    local DIAG_DIR="$PROJECT_ROOT/docs/diagnostics"
    local ARCHIVE_DIR="$ARCHIVE_BASE/diagnostics/2025-01"
    
    log_info "Archiving diagnostics files..."
    
    # Files to keep
    local KEEP_FILES=(
        "CONSOLIDATED_MASTER_DOCUMENT.md"
        "MASTER_TODO_LIST.md"
        "QUICK_REFERENCE_INDEX.md"
    )
    
    # Archive authentication files
    log_info "Archiving authentication diagnostic files..."
    find "$DIAG_DIR" -maxdepth 1 -name "AUTHENTICATION_*" -type f | while read file; do
        mv "$file" "$ARCHIVE_DIR/authentication/" 2>/dev/null || log_warn "Could not move: $(basename "$file")"
    done
    
    # Archive completion files
    log_info "Archiving completion files..."
    find "$DIAG_DIR" -maxdepth 1 -name "*COMPLETE*.md" -type f | while read file; do
        local basename=$(basename "$file")
        if [[ ! " ${KEEP_FILES[@]} " =~ " ${basename} " ]]; then
            mv "$file" "$ARCHIVE_DIR/completion/" 2>/dev/null || log_warn "Could not move: $basename"
        fi
    done
    
    # Archive summary files
    log_info "Archiving summary files..."
    find "$DIAG_DIR" -maxdepth 1 -name "*SUMMARY*.md" -type f | while read file; do
        local basename=$(basename "$file")
        if [[ ! " ${KEEP_FILES[@]} " =~ " ${basename} " ]]; then
            mv "$file" "$ARCHIVE_DIR/completion/" 2>/dev/null || log_warn "Could not move: $basename"
        fi
    done
    
    # Archive status files
    log_info "Archiving status files..."
    find "$DIAG_DIR" -maxdepth 1 -name "*STATUS*.md" -type f | while read file; do
        local basename=$(basename "$file")
        if [[ ! " ${KEEP_FILES[@]} " =~ " ${basename} " ]]; then
            mv "$file" "$ARCHIVE_DIR/status/" 2>/dev/null || log_warn "Could not move: $basename"
        fi
    done
    
    # Archive report files (except comprehensive audits)
    log_info "Archiving report files..."
    find "$DIAG_DIR" -maxdepth 1 -name "*REPORT*.md" -type f | while read file; do
        local basename=$(basename "$file")
        if [[ ! " ${KEEP_FILES[@]} " =~ " ${basename} " ]]; then
            mv "$file" "$ARCHIVE_DIR/reports/" 2>/dev/null || log_warn "Could not move: $basename"
        fi
    done
    
    # Archive next steps files
    log_info "Archiving next steps files..."
    find "$DIAG_DIR" -maxdepth 1 -name "*NEXT_STEPS*.md" -type f | while read file; do
        local basename=$(basename "$file")
        if [[ ! " ${KEEP_FILES[@]} " =~ " ${basename} " ]]; then
            mv "$file" "$ARCHIVE_DIR/next-steps/" 2>/dev/null || log_warn "Could not move: $basename"
        fi
    done
    
    # Archive other redundant files
    log_info "Archiving other redundant files..."
    local OTHER_PATTERNS=(
        "*FIX*.md"
        "*APPLY*.md"
        "*SUCCESS*.md"
        "*READY*.md"
        "*VERIFICATION*.md"
        "*INSTRUCTIONS*.md"
        "*GUIDE*.md"
    )
    
    for pattern in "${OTHER_PATTERNS[@]}"; do
        find "$DIAG_DIR" -maxdepth 1 -name "$pattern" -type f | while read file; do
            local basename=$(basename "$file")
            if [[ ! " ${KEEP_FILES[@]} " =~ " ${basename} " ]]; then
                mv "$file" "$ARCHIVE_DIR/reports/" 2>/dev/null || log_warn "Could not move: $basename"
            fi
        done
    done
    
    log_info "Diagnostics archiving complete"
}

# Archive project-management files
archive_project_management() {
    local PM_DIR="$PROJECT_ROOT/docs/project-management"
    local ARCHIVE_DIR="$ARCHIVE_BASE/project-management/2025-01"
    
    log_info "Archiving project-management files..."
    
    # Files to keep
    local KEEP_FILES=(
        "PROJECT_STATUS.md"
        "MASTER_TODOS.md"
        "README.md"
    )
    
    # Archive completion files
    log_info "Archiving completion files..."
    find "$PM_DIR" -maxdepth 1 -name "*COMPLETE*.md" -type f | while read file; do
        local basename=$(basename "$file")
        if [[ ! " ${KEEP_FILES[@]} " =~ " ${basename} " ]]; then
            mv "$file" "$ARCHIVE_DIR/completion/" 2>/dev/null || log_warn "Could not move: $basename"
        fi
    done
    
    # Archive summary files
    log_info "Archiving summary files..."
    find "$PM_DIR" -maxdepth 1 -name "*SUMMARY*.md" -type f | while read file; do
        local basename=$(basename "$file")
        if [[ ! " ${KEEP_FILES[@]} " =~ " ${basename} " ]]; then
            mv "$file" "$ARCHIVE_DIR/completion/" 2>/dev/null || log_warn "Could not move: $basename"
        fi
    done
    
    # Archive optimization files
    log_info "Archiving optimization files..."
    find "$PM_DIR" -maxdepth 1 -name "*OPTIMIZATION*.md" -type f | while read file; do
        local basename=$(basename "$file")
        if [[ ! " ${KEEP_FILES[@]} " =~ " ${basename} " ]]; then
            mv "$file" "$ARCHIVE_DIR/optimization/" 2>/dev/null || log_warn "Could not move: $basename"
        fi
    done
    
    # Archive phase files (keep only current phase if needed)
    log_info "Archiving phase files..."
    find "$PM_DIR" -maxdepth 1 -name "PHASE_*.md" -type f | while read file; do
        local basename=$(basename "$file")
        if [[ ! " ${KEEP_FILES[@]} " =~ " ${basename} " ]]; then
            mv "$file" "$ARCHIVE_DIR/phase/" 2>/dev/null || log_warn "Could not move: $basename"
        fi
    done
    
    # Archive consolidation files
    log_info "Archiving consolidation files..."
    find "$PM_DIR" -maxdepth 1 -name "*CONSOLIDATION*.md" -type f | while read file; do
        local basename=$(basename "$file")
        if [[ ! " ${KEEP_FILES[@]} " =~ " ${basename} " ]]; then
            mv "$file" "$ARCHIVE_DIR/consolidation/" 2>/dev/null || log_warn "Could not move: $basename"
        fi
    done
    
    log_info "Project-management archiving complete"
}

# Main execution
main() {
    log_info "Starting aggressive documentation consolidation..."
    
    create_archive_dirs
    archive_diagnostics
    archive_project_management
    
    log_info "Consolidation complete!"
    log_info "Check $ARCHIVE_BASE for archived files"
}

main "$@"

