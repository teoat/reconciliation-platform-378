#!/bin/bash
# ============================================================================
# DIAGNOSTIC AREA 7: Import/Export Analysis
# ============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

RESULTS_FILE="${RESULTS_FILE:-/tmp/diagnostic-7-results.json}"

log_info "Starting Import/Export Analysis..."

echo '{"checks": []}' > "$RESULTS_FILE"

add_check() {
    jq --arg name "$1" --arg status "$2" --arg msg "$3" --arg details "$4" \
        '.checks += [{"name": $name, "status": $status, "message": $msg, "details": $details}]' \
        "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
}

# 1. Circular dependencies
log_info "Checking for circular dependencies..."
if [ -f "frontend/package.json" ] && command -v madge &> /dev/null; then
    cd frontend
    CIRCULAR=$(madge --circular src 2>/dev/null | grep -c "Circular" || echo "0")
    if [ "$CIRCULAR" -gt 0 ]; then
        log_warning "Found $CIRCULAR circular dependencies"
        add_check "circular_deps" "warning" "$CIRCULAR circular dependencies" ""
    else
        log_success "No circular dependencies"
        add_check "circular_deps" "success" "No circular deps" ""
    fi
    cd ..
else
    log_info "madge not available"
    add_check "circular_deps" "info" "madge not installed" ""
fi

# 2. Import organization
log_info "Checking import organization..."
ABSOLUTE_IMPORTS=$(grep -r "from '@/" --include="*.ts" --include="*.tsx" frontend/src 2>/dev/null | wc -l | tr -d ' ')
RELATIVE_IMPORTS=$(grep -r "from '\\.\\./" --include="*.ts" --include="*.tsx" frontend/src 2>/dev/null | wc -l | tr -d ' ')
log_info "Absolute imports: $ABSOLUTE_IMPORTS, Relative: $RELATIVE_IMPORTS"
add_check "import_org" "success" "Imports analyzed" "Absolute: $ABSOLUTE_IMPORTS, Relative: $RELATIVE_IMPORTS"

# 3. Barrel exports
log_info "Checking barrel exports..."
BARREL_FILES=$(find frontend/src -name "index.ts" -o -name "index.tsx" 2>/dev/null | wc -l | tr -d ' ')
log_info "Found $BARREL_FILES barrel files"
add_check "barrel_exports" "success" "$BARREL_FILES barrel files" ""

log_success "Import/Export Analysis complete"
cat "$RESULTS_FILE" | jq '.'

