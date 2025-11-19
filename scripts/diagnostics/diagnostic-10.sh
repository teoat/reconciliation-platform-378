#!/bin/bash
# ============================================================================
# DIAGNOSTIC AREA 10: Build & Bundle Analysis
# ============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

RESULTS_FILE="${RESULTS_FILE:-/tmp/diagnostic-10-results.json}"

log_info "Starting Build & Bundle Analysis..."

echo '{"checks": []}' > "$RESULTS_FILE"

add_check() {
    jq --arg name "$1" --arg status "$2" --arg msg "$3" --arg details "$4" \
        '.checks += [{"name": $name, "status": $status, "message": $msg, "details": $details}]' \
        "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
}

# 1. Frontend build
log_info "Checking frontend build..."
if [ -f "frontend/package.json" ]; then
    cd frontend
    if [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
        JS_FILES=$(find dist -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
        CSS_FILES=$(find dist -name "*.css" 2>/dev/null | wc -l | tr -d ' ')
        log_success "Build exists: $DIST_SIZE ($JS_FILES JS, $CSS_FILES CSS files)"
        add_check "frontend_build" "success" "Build exists" "Size: $DIST_SIZE, JS: $JS_FILES, CSS: $CSS_FILES"
    else
        log_warning "No dist directory"
        add_check "frontend_build" "warning" "No build artifacts" ""
    fi
    cd ..
fi

# 2. Backend build
log_info "Checking backend build..."
if [ -f "backend/Cargo.toml" ]; then
    cd backend
    if [ -d "target/release" ] || [ -d "target/debug" ]; then
        log_success "Backend build artifacts exist"
        add_check "backend_build" "success" "Build artifacts found" ""
    else
        log_info "Backend not built"
        add_check "backend_build" "info" "Not built" ""
    fi
    cd ..
fi

# 3. Bundle size analysis
log_info "Analyzing bundle sizes..."
if [ -d "frontend/dist" ]; then
    LARGEST_JS=$(find frontend/dist -name "*.js" -exec du -h {} + 2>/dev/null | sort -rh | head -1 | cut -f1 || echo "N/A")
    log_info "Largest JS file: $LARGEST_JS"
    add_check "bundle_size" "success" "Largest JS: $LARGEST_JS" ""
fi

# 4. Source maps
log_info "Checking source maps..."
if [ -d "frontend/dist" ]; then
    SOURCE_MAPS=$(find frontend/dist -name "*.map" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$SOURCE_MAPS" -gt 0 ]; then
        log_success "Found $SOURCE_MAPS source maps"
        add_check "source_maps" "success" "$SOURCE_MAPS source maps" ""
    else
        log_info "No source maps found"
        add_check "source_maps" "info" "No source maps" ""
    fi
fi

log_success "Build & Bundle Analysis complete"
cat "$RESULTS_FILE" | jq '.'

