#!/bin/bash
# ==============================================================================
# File Lock System
# ==============================================================================
# Prevents creation of duplicate files by checking against master documents
# and restricted patterns before allowing file creation
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

LOCK_FILE=".frenly-file-locks.json"

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
  "restricted_locations": [
    "./",
    "./docs/"
  ],
  "allowed_exceptions": [
    "docs/project-management/PROJECT_STATUS.md",
    "docs/project-management/MASTER_TODOS.md",
    "docs/project-management/COMPREHENSIVE_DIAGNOSTIC_REPORT.md",
    "docs/project-management/CONSOLIDATION_SUMMARY.md",
    "docs/deployment/DEPLOYMENT_GUIDE.md",
    "docs/getting-started/QUICK_START.md",
    "docs/development/MCP_SETUP_GUIDE.md"
  ]
}
EOF
        log_info "Initialized lock file: $LOCK_FILE"
    fi
}

# Check if file is a master document
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

# Check if file is in allowed exceptions
is_allowed_exception() {
    local file="$1"
    local exceptions=$(jq -r '.allowed_exceptions[]' "$LOCK_FILE" 2>/dev/null || echo "")
    
    while IFS= read -r exception; do
        if [ "$file" = "$exception" ]; then
            return 0
        fi
    done <<< "$exceptions"
    
    return 1
}

# Check if file matches restricted pattern
matches_restricted_pattern() {
    local filename="$1"
    local patterns=$(jq -r '.restricted_patterns[]' "$LOCK_FILE" 2>/dev/null || echo "")
    
    while IFS= read -r pattern; do
        if [[ "$filename" == $pattern ]]; then
            return 0
        fi
    done <<< "$patterns"
    
    return 1
}

# Check if file is in restricted location
is_restricted_location() {
    local file="$1"
    local locations=$(jq -r '.restricted_locations[]' "$LOCK_FILE" 2>/dev/null || echo "")
    
    while IFS= read -r location; do
        if [[ "$file" == $location* ]]; then
            return 0
        fi
    done <<< "$locations"
    
    return 1
}

# Check if similar file already exists
find_similar_file() {
    local file="$1"
    local basename=$(basename "$file")
    local dirname=$(dirname "$file")
    
    # Check for files with similar names
    find docs -type f -name "*.md" ! -path "*/archive/*" | while read -r existing; do
        local existing_basename=$(basename "$existing")
        if [ "$existing_basename" = "$basename" ] && [ "$existing" != "$file" ]; then
            echo "$existing"
            return 0
        fi
    done
    
    return 1
}

# Validate file before creation
validate_file_creation() {
    local file="$1"
    local filename=$(basename "$file")
    
    # Initialize lock file if needed
    init_lock_file
    
    # Check if it's an allowed exception
    if is_allowed_exception "$file"; then
        log_info "File is an allowed exception: $file"
        return 0
    fi
    
    # Check if it's a master document
    if is_master_document "$file"; then
        log_info "File is a master document: $file"
        return 0
    fi
    
    # Check if it matches restricted pattern
    if matches_restricted_pattern "$filename"; then
        log_error "File matches restricted pattern: $filename"
        log_error "Use master document instead or archive this file"
        return 1
    fi
    
    # Check if similar file exists
    local similar=$(find_similar_file "$file")
    if [ -n "$similar" ]; then
        log_error "Similar file already exists: $similar"
        log_error "Consider updating existing file instead of creating: $file"
        return 1
    fi
    
    # Check if it's in restricted location (root or docs root)
    if is_restricted_location "$file"; then
        log_warning "File is in restricted location: $file"
        log_warning "Consider moving to appropriate subdirectory"
    fi
    
    return 0
}

# Lock a file (prevent modification)
lock_file() {
    local file="$1"
    local reason="${2:-No reason provided}"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    init_lock_file
    
    jq ".locks[\"$file\"] = {
        \"locked\": true,
        \"reason\": \"$reason\",
        \"timestamp\": \"$timestamp\"
    }" "$LOCK_FILE" > "$LOCK_FILE.tmp" && mv "$LOCK_FILE.tmp" "$LOCK_FILE"
    
    log_info "File locked: $file (reason: $reason)"
}

# Unlock a file
unlock_file() {
    local file="$1"
    
    if [ ! -f "$LOCK_FILE" ]; then
        log_warning "Lock file does not exist"
        return 1
    fi
    
    jq "del(.locks[\"$file\"])" "$LOCK_FILE" > "$LOCK_FILE.tmp" && mv "$LOCK_FILE.tmp" "$LOCK_FILE"
    
    log_info "File unlocked: $file"
}

# Check if file is locked
is_file_locked() {
    local file="$1"
    
    if [ ! -f "$LOCK_FILE" ]; then
        return 1
    fi
    
    local locked=$(jq -r ".locks[\"$file\"].locked" "$LOCK_FILE" 2>/dev/null || echo "false")
    
    if [ "$locked" = "true" ]; then
        return 0
    fi
    
    return 1
}

# Main function
main() {
    case "${1:-}" in
        validate)
            if [ -z "${2:-}" ]; then
                log_error "Usage: $0 validate <file_path>"
                exit 1
            fi
            validate_file_creation "$2"
            ;;
        lock)
            if [ -z "${2:-}" ]; then
                log_error "Usage: $0 lock <file_path> [reason]"
                exit 1
            fi
            lock_file "$2" "${3:-No reason provided}"
            ;;
        unlock)
            if [ -z "${2:-}" ]; then
                log_error "Usage: $0 unlock <file_path>"
                exit 1
            fi
            unlock_file "$2"
            ;;
        check)
            if [ -z "${2:-}" ]; then
                log_error "Usage: $0 check <file_path>"
                exit 1
            fi
            if is_file_locked "$2"; then
                local reason=$(jq -r ".locks[\"$2\"].reason" "$LOCK_FILE" 2>/dev/null || echo "Unknown")
                log_warning "File is locked: $2 (reason: $reason)"
                exit 1
            else
                log_info "File is not locked: $2"
                exit 0
            fi
            ;;
        init)
            init_lock_file
            log_success "Lock file initialized"
            ;;
        *)
            echo "Usage: $0 {validate|lock|unlock|check|init} [file_path] [reason]"
            exit 1
            ;;
    esac
}

main "$@"

