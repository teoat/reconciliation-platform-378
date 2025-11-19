#!/bin/bash
# ============================================================================
# DIAGNOSTIC AREA 2: Code Quality & Complexity
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

RESULTS_FILE="${RESULTS_FILE:-/tmp/diagnostic-2-results.json}"

log_info "Starting Code Quality & Complexity Analysis..."

echo '{"checks": []}' > "$RESULTS_FILE"

add_check() {
    jq --arg name "$1" --arg status "$2" --arg msg "$3" --arg details "$4" \
        '.checks += [{"name": $name, "status": $status, "message": $msg, "details": $details}]' \
        "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
}

# 1. ESLint check
log_info "Running ESLint..."
if [ -f "frontend/package.json" ]; then
    cd frontend
    if npm run lint > /tmp/eslint.log 2>&1; then
        log_success "ESLint passed"
        add_check "eslint" "success" "No linting errors" ""
    else
        ERRORS=$(grep -c "error" /tmp/eslint.log 2>/dev/null || echo "0")
        WARNINGS=$(grep -c "warning" /tmp/eslint.log 2>/dev/null || echo "0")
        log_warning "ESLint found issues: $ERRORS errors, $WARNINGS warnings"
        add_check "eslint" "warning" "$ERRORS errors, $WARNINGS warnings" ""
    fi
    cd ..
fi

# 2. Rust clippy check
log_info "Running Rust clippy..."
if [ -f "backend/Cargo.toml" ]; then
    cd backend
    if cargo clippy --message-format=json 2>&1 | jq -r 'select(.message != null) | select(.message.level == "error")' | head -1 > /dev/null 2>&1; then
        CLIPPY_ISSUES=$(cargo clippy 2>&1 | grep -c "warning\|error" || echo "0")
        log_warning "Clippy found $CLIPPY_ISSUES issues"
        add_check "clippy" "warning" "$CLIPPY_ISSUES issues" ""
    else
        log_success "Clippy passed"
        add_check "clippy" "success" "No issues" ""
    fi
    cd ..
fi

# 3. Code complexity (simple check)
log_info "Checking code complexity..."
COMPLEX_FUNCTIONS=$(grep -r "fn.*{" --include="*.rs" backend/src 2>/dev/null | wc -l | tr -d ' ')
LARGE_FILES=$(find backend/src frontend/src -type f \( -name "*.rs" -o -name "*.ts" -o -name "*.tsx" \) \
    -exec wc -l {} + 2>/dev/null | awk '$1 > 1000 {print}' | wc -l | tr -d ' ')

if [ "$LARGE_FILES" -gt 0 ]; then
    log_warning "Found $LARGE_FILES large files (>1000 lines)"
    add_check "complexity" "warning" "$LARGE_FILES large files" ""
else
    log_success "No overly large files"
    add_check "complexity" "success" "File sizes reasonable" ""
fi

# 4. TypeScript type checking
log_info "Checking TypeScript types..."
if [ -f "frontend/package.json" ]; then
    cd frontend
    if npm run type-check > /tmp/tsc.log 2>&1; then
        log_success "TypeScript type check passed"
        add_check "typescript" "success" "No type errors" ""
    else
        ERRORS=$(grep -c "error TS" /tmp/tsc.log 2>/dev/null || echo "0")
        log_warning "TypeScript found $ERRORS errors"
        add_check "typescript" "warning" "$ERRORS type errors" ""
    fi
    cd ..
fi

log_success "Code Quality & Complexity Analysis complete"
cat "$RESULTS_FILE" | jq '.'

