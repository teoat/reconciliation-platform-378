#!/bin/bash
# ============================================================================
# DIAGNOSTIC AREA 15: Accessibility Compliance
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

RESULTS_FILE="${RESULTS_FILE:-/tmp/diagnostic-15-results.json}"

log_info "Starting Accessibility Compliance Analysis..."

echo '{"checks": []}' > "$RESULTS_FILE"

add_check() {
    jq --arg name "$1" --arg status "$2" --arg msg "$3" --arg details "$4" \
        '.checks += [{"name": $name, "status": $status, "message": $msg, "details": $details}]' \
        "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
}

# 1. ARIA attributes
log_info "Checking ARIA attributes..."
ARIA_ELEMENTS=$(grep -r "aria-" --include="*.tsx" --include="*.ts" frontend/src 2>/dev/null | wc -l | tr -d ' ')
if [ "$ARIA_ELEMENTS" -gt 0 ]; then
    log_success "Found $ARIA_ELEMENTS ARIA attributes"
    add_check "aria_attributes" "success" "$ARIA_ELEMENTS ARIA attributes" ""
else
    log_warning "No ARIA attributes found"
    add_check "aria_attributes" "warning" "No ARIA attributes" ""
fi

# 2. Alt text for images
log_info "Checking image alt text..."
IMAGES=$(grep -r "<img\|<Image" --include="*.tsx" --include="*.ts" frontend/src 2>/dev/null | wc -l | tr -d ' ')
IMAGES_WITH_ALT=$(grep -r "<img\|<Image" --include="*.tsx" --include="*.ts" frontend/src 2>/dev/null | grep -c "alt=" || echo "0")
if [ "$IMAGES" -gt 0 ]; then
    ALT_COVERAGE=$((IMAGES_WITH_ALT * 100 / IMAGES))
    if [ "$ALT_COVERAGE" -lt 100 ]; then
        log_warning "Image alt text coverage: ${ALT_COVERAGE}%"
        add_check "image_alt" "warning" "${ALT_COVERAGE}% coverage" "$IMAGES_WITH_ALT/$IMAGES images"
    else
        log_success "All images have alt text"
        add_check "image_alt" "success" "100% coverage" ""
    fi
else
    log_info "No images found"
    add_check "image_alt" "info" "No images" ""
fi

# 3. Semantic HTML
log_info "Checking semantic HTML..."
SEMANTIC_TAGS=$(grep -rE "<main>|<nav>|<header>|<footer>|<article>|<section>" \
    --include="*.tsx" frontend/src 2>/dev/null | wc -l | tr -d ' ')
log_info "Found $SEMANTIC_TAGS semantic HTML elements"
add_check "semantic_html" "success" "$SEMANTIC_TAGS semantic elements" ""

# 4. Keyboard navigation
log_info "Checking keyboard navigation..."
KEYBOARD_HANDLERS=$(grep -r "onKeyDown\|onKeyPress\|onKeyUp\|tabIndex" \
    --include="*.tsx" --include="*.ts" frontend/src 2>/dev/null | wc -l | tr -d ' ')
log_info "Found $KEYBOARD_HANDLERS keyboard handlers"
add_check "keyboard_nav" "success" "$KEYBOARD_HANDLERS handlers" ""

# 5. Accessibility tests (Playwright)
log_info "Checking accessibility tests..."
if [ -f "frontend/e2e/accessibility.spec.ts" ]; then
    log_success "Accessibility test file exists"
    add_check "a11y_tests" "success" "Test file exists" ""
else
    log_info "No accessibility test file"
    add_check "a11y_tests" "info" "No test file" ""
fi

log_success "Accessibility Compliance Analysis complete"
cat "$RESULTS_FILE" | jq '.'

