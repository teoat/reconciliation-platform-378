#!/bin/bash
# ============================================================================
# DIAGNOSTIC AREA 6: Dead Code Detection
# ============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

RESULTS_FILE="${RESULTS_FILE:-/tmp/diagnostic-6-results.json}"

log_info "Starting Dead Code Detection..."

echo '{"checks": []}' > "$RESULTS_FILE"

add_check() {
    jq --arg name "$1" --arg status "$2" --arg msg "$3" --arg details "$4" \
        '.checks += [{"name": $name, "status": $status, "message": $msg, "details": $details}]' \
        "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
}

# 1. Unused exports (TypeScript)
log_info "Checking for unused exports..."
if [ -f "frontend/package.json" ] && command -v ts-prune &> /dev/null; then
    cd frontend
    UNUSED=$(ts-prune 2>/dev/null | wc -l | tr -d ' ')
    if [ "$UNUSED" -gt 0 ]; then
        log_warning "Found $UNUSED unused exports"
        add_check "unused_exports" "warning" "$UNUSED unused exports" ""
    else
        log_success "No unused exports"
        add_check "unused_exports" "success" "No unused exports" ""
    fi
    cd ..
else
    log_info "ts-prune not available"
    add_check "unused_exports" "info" "ts-prune not installed" ""
fi

# 2. Unused functions (Rust)
log_info "Checking for unused Rust functions..."
if [ -f "backend/Cargo.toml" ]; then
    cd backend
    UNUSED=$(cargo check 2>&1 | grep -c "unused\|dead_code" || echo "0")
    if [ "$UNUSED" -gt 0 ]; then
        log_warning "Found $UNUSED unused items"
        add_check "unused_rust" "warning" "$UNUSED unused items" ""
    else
        log_success "No unused Rust code"
        add_check "unused_rust" "success" "No unused code" ""
    fi
    cd ..
fi

# 3. Unused imports
log_info "Checking for unused imports..."
UNUSED_IMPORTS=$(grep -r "^import.*from" --include="*.ts" --include="*.tsx" frontend/src 2>/dev/null | wc -l | tr -d ' ')
log_info "Found $UNUSED_IMPORTS import statements (manual review needed)"
add_check "unused_imports" "info" "$UNUSED_IMPORTS imports" "Manual review recommended"

log_success "Dead Code Detection complete"
cat "$RESULTS_FILE" | jq '.'

