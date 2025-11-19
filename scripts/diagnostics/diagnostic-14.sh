#!/bin/bash
# ============================================================================
# DIAGNOSTIC AREA 14: License Compliance
# ============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

RESULTS_FILE="${RESULTS_FILE:-/tmp/diagnostic-14-results.json}"

log_info "Starting License Compliance Analysis..."

echo '{"checks": []}' > "$RESULTS_FILE"

add_check() {
    jq --arg name "$1" --arg status "$2" --arg msg "$3" --arg details "$4" \
        '.checks += [{"name": $name, "status": $status, "message": $msg, "details": $details}]' \
        "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
}

# 1. Project license
log_info "Checking project license..."
if [ -f "LICENSE" ] || [ -f "LICENSE.txt" ] || [ -f "LICENSE.md" ]; then
    LICENSE_FILE=$(find . -maxdepth 1 -name "LICENSE*" -type f | head -1)
    log_success "License file found: $LICENSE_FILE"
    add_check "project_license" "success" "License file exists" "$LICENSE_FILE"
else
    log_warning "No license file found"
    add_check "project_license" "warning" "No license file" ""
fi

# 2. NPM license check
log_info "Checking NPM package licenses..."
if [ -f "frontend/package.json" ] && command -v license-checker &> /dev/null; then
    cd frontend
    license-checker --json > /tmp/npm-licenses.json 2>&1 || true
    INCOMPATIBLE=$(jq '.[] | select(.license | test("GPL|AGPL"))' /tmp/npm-licenses.json 2>/dev/null | wc -l | tr -d ' ')
    if [ "$INCOMPATIBLE" -gt 0 ]; then
        log_warning "Found $INCOMPATIBLE potentially incompatible licenses"
        add_check "npm_licenses" "warning" "$INCOMPATIBLE incompatible" ""
    else
        log_success "NPM licenses look good"
        add_check "npm_licenses" "success" "Licenses OK" ""
    fi
    cd ..
else
    log_info "license-checker not available"
    add_check "npm_licenses" "info" "license-checker not installed" ""
fi

# 3. Cargo license check
log_info "Checking Cargo crate licenses..."
if [ -f "backend/Cargo.toml" ] && command -v cargo-license &> /dev/null; then
    cd backend
    cargo license --json > /tmp/cargo-licenses.json 2>&1 || true
    log_info "Cargo licenses checked"
    add_check "cargo_licenses" "success" "Licenses checked" ""
    cd ..
else
    log_info "cargo-license not available"
    add_check "cargo_licenses" "info" "cargo-license not installed" ""
fi

log_success "License Compliance Analysis complete"
cat "$RESULTS_FILE" | jq '.'

