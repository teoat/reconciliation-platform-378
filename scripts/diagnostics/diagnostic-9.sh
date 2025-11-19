#!/bin/bash
# ============================================================================
# DIAGNOSTIC AREA 9: API Consistency & Documentation
# ============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

RESULTS_FILE="${RESULTS_FILE:-/tmp/diagnostic-9-results.json}"

log_info "Starting API Consistency & Documentation Analysis..."

echo '{"checks": []}' > "$RESULTS_FILE"

add_check() {
    jq --arg name "$1" --arg status "$2" --arg msg "$3" --arg details "$4" \
        '.checks += [{"name": $name, "status": $status, "message": $msg, "details": $details}]' \
        "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
}

# 1. API endpoint consistency
log_info "Checking API endpoint patterns..."
ENDPOINTS=$(grep -r "\.route\|\.get\|\.post\|\.put\|\.delete" --include="*.rs" backend/src 2>/dev/null | wc -l | tr -d ' ')
KEBAB_CASE=$(grep -r "\.route" --include="*.rs" backend/src 2>/dev/null | grep -c "kebab-case\|-" || echo "0")
log_info "Found $ENDPOINTS endpoints, $KEBAB_CASE use kebab-case"
add_check "endpoint_patterns" "success" "$ENDPOINTS endpoints" "Kebab-case: $KEBAB_CASE"

# 2. API documentation
log_info "Checking API documentation..."
if [ -f "docs/api/API_REFERENCE.md" ] || [ -d "docs/api" ]; then
    API_DOCS=$(find docs/api -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    log_success "Found $API_DOCS API documentation files"
    add_check "api_docs" "success" "$API_DOCS doc files" ""
else
    log_warning "No API documentation found"
    add_check "api_docs" "warning" "No API docs" ""
fi

# 3. OpenAPI/Swagger
log_info "Checking for OpenAPI/Swagger..."
if grep -r "openapi\|swagger" --include="*.rs" --include="*.toml" backend 2>/dev/null | grep -q .; then
    log_success "OpenAPI/Swagger found"
    add_check "openapi" "success" "OpenAPI configured" ""
else
    log_info "No OpenAPI/Swagger found"
    add_check "openapi" "info" "Not configured" ""
fi

# 4. Error response consistency
log_info "Checking error response patterns..."
ERROR_HANDLERS=$(grep -r "AppError\|HttpResponse" --include="*.rs" backend/src 2>/dev/null | wc -l | tr -d ' ')
log_info "Found $ERROR_HANDLERS error handlers"
add_check "error_handling" "success" "$ERROR_HANDLERS handlers" ""

log_success "API Consistency & Documentation Analysis complete"
cat "$RESULTS_FILE" | jq '.'

