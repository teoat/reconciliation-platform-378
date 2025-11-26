#!/bin/bash
# ==============================================================================
# Dependency Analysis Script
# ==============================================================================
# Analyzes dependencies for a file to prevent breaking changes during refactoring
# Usage: ./scripts/refactoring/analyze-dependencies.sh <file-path>
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

# ==============================================================================
# CONFIGURATION
# ==============================================================================

FILE_PATH="${1:-}"
if [ -z "$FILE_PATH" ]; then
    log_error "Usage: $0 <file-path>"
    exit 1
fi

# Resolve absolute path
if [[ "$FILE_PATH" != /* ]]; then
    FILE_PATH="$PROJECT_ROOT/$FILE_PATH"
fi

if [ ! -f "$FILE_PATH" ]; then
    log_error "File not found: $FILE_PATH"
    exit 1
fi

OUTPUT_DIR="$PROJECT_ROOT/.refactoring"
mkdir -p "$OUTPUT_DIR"

FILE_NAME=$(basename "$FILE_PATH")
FILE_BASE="${FILE_NAME%.*}"
OUTPUT_FILE="$OUTPUT_DIR/${FILE_BASE}.dependencies.json"

# ==============================================================================
# ANALYSIS
# ==============================================================================

log_info "Analyzing dependencies for: $FILE_PATH"
echo ""

# Initialize JSON structure
cat > "$OUTPUT_FILE" <<EOF
{
  "file": "$FILE_PATH",
  "analyzed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "exports": [],
  "imports": [],
  "imported_by": [],
  "internal_dependencies": []
}
EOF

if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]]; then
    # ========================================================================
    # TypeScript Analysis
    # ========================================================================
    
    log_info "Analyzing TypeScript file..."
    
    # Extract exports
    log_info "Extracting exports..."
    EXPORTS=$(grep -E "^export (const|function|class|interface|type|default)" "$FILE_PATH" 2>/dev/null || true)
    
    if [ -n "$EXPORTS" ]; then
        EXPORT_JSON=$(echo "$EXPORTS" | while IFS= read -r line; do
            echo "    \"$line\","
        done | sed '$ s/,$//')
        
        # Update JSON
        jq ".exports = [$EXPORT_JSON]" "$OUTPUT_FILE" > "${OUTPUT_FILE}.tmp" && mv "${OUTPUT_FILE}.tmp" "$OUTPUT_FILE" 2>/dev/null || {
            # Fallback if jq not available
            log_warning "jq not available, using basic analysis"
        }
    fi
    
    # Extract imports
    log_info "Extracting imports..."
    IMPORTS=$(grep -E "^import .* from" "$FILE_PATH" 2>/dev/null || true)
    
    # Find files that import from this file
    log_info "Finding files that import from this file..."
    RELATIVE_PATH="${FILE_PATH#$PROJECT_ROOT/}"
    IMPORTED_BY=$(grep -r "from.*['\"]" "$PROJECT_ROOT/frontend/src" 2>/dev/null | \
        grep -i "$FILE_BASE" | \
        grep -v node_modules | \
        cut -d: -f1 | \
        sort -u || true)
    
    if [ -n "$IMPORTED_BY" ]; then
        echo "Files importing from this file:"
        echo "$IMPORTED_BY" | while IFS= read -r file; do
            echo "  - $file"
        done
    else
        log_info "No files found importing from this file"
    fi
    
elif [[ "$FILE_PATH" == *.rs ]]; then
    # ========================================================================
    # Rust Analysis
    # ========================================================================
    
    log_info "Analyzing Rust file..."
    
    # Extract public items
    log_info "Extracting public items..."
    PUBLIC_ITEMS=$(grep -E "^pub (fn|struct|enum|trait|mod|const|static)" "$FILE_PATH" 2>/dev/null || true)
    
    if [ -n "$PUBLIC_ITEMS" ]; then
        echo "Public items:"
        echo "$PUBLIC_ITEMS" | while IFS= read -r line; do
            echo "  - $line"
        done
    fi
    
    # Find modules that use this module
    log_info "Finding modules that use this module..."
    MODULE_NAME=$(basename "$FILE_PATH" .rs)
    USED_BY=$(grep -r "use.*::$MODULE_NAME" "$PROJECT_ROOT/backend/src" 2>/dev/null | \
        grep -v target | \
        cut -d: -f1 | \
        sort -u || true)
    
    if [ -n "$USED_BY" ]; then
        echo "Modules using this module:"
        echo "$USED_BY" | while IFS= read -r file; do
            echo "  - $file"
        done
    else
        log_info "No modules found using this module"
    fi
fi

# ==============================================================================
# SUMMARY
# ==============================================================================

echo ""
log_success "Dependency analysis complete"
log_info "Results saved to: $OUTPUT_FILE"
echo ""
log_info "Key findings:"
echo "  - Review exports/public items before refactoring"
echo "  - Check all importing files after refactoring"
echo "  - Maintain public API compatibility"
echo ""

