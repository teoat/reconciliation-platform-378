#!/bin/bash
# ============================================================================
# DIAGNOSTIC AREA 1: Dependency & Package Analysis
# ============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

RESULTS_FILE="${RESULTS_FILE:-/tmp/diagnostic-1-results.json}"

log_info "Starting Dependency & Package Analysis..."

# Initialize results
echo '{"checks": []}' > "$RESULTS_FILE"

add_check() {
    local name=$1
    local status=$2
    local message=$3
    local details=$4
    
    jq --arg name "$name" --arg status "$status" --arg msg "$message" --arg details "$details" \
        '.checks += [{"name": $name, "status": $status, "message": $msg, "details": $details}]' \
        "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
}

# 1. Check NPM outdated packages
log_info "Checking for outdated NPM packages..."
if [ -f "frontend/package.json" ]; then
    cd frontend
    if npm outdated --json > /tmp/npm-outdated.json 2>&1; then
        OUTDATED_COUNT=$(jq 'length' /tmp/npm-outdated.json 2>/dev/null || echo "0")
        if [ "$OUTDATED_COUNT" -gt 0 ]; then
            log_warning "Found $OUTDATED_COUNT outdated packages"
            add_check "npm_outdated" "warning" "$OUTDATED_COUNT outdated packages" "$(jq -r 'keys[]' /tmp/npm-outdated.json | head -5 | tr '\n' ', ')"
        else
            log_success "All NPM packages are up to date"
            add_check "npm_outdated" "success" "All packages up to date" ""
        fi
    else
        log_warning "Could not check NPM outdated packages"
        add_check "npm_outdated" "warning" "Could not check" ""
    fi
    cd ..
fi

# 2. Check NPM security vulnerabilities
log_info "Running NPM security audit..."
if [ -f "frontend/package.json" ]; then
    cd frontend
    if npm audit --json > /tmp/npm-audit.json 2>&1; then
        VULN_COUNT=$(jq '.metadata.vulnerabilities.total' /tmp/npm-audit.json 2>/dev/null || echo "0")
        if [ "$VULN_COUNT" -gt 0 ]; then
            CRITICAL=$(jq '.metadata.vulnerabilities.critical' /tmp/npm-audit.json 2>/dev/null || echo "0")
            HIGH=$(jq '.metadata.vulnerabilities.high' /tmp/npm-audit.json 2>/dev/null || echo "0")
            log_warning "Found $VULN_COUNT vulnerabilities (Critical: $CRITICAL, High: $HIGH)"
            add_check "npm_security" "warning" "$VULN_COUNT vulnerabilities found" "Critical: $CRITICAL, High: $HIGH"
        else
            log_success "No NPM security vulnerabilities found"
            add_check "npm_security" "success" "No vulnerabilities" ""
        fi
    else
        log_warning "Could not run NPM audit"
        add_check "npm_security" "warning" "Audit failed" ""
    fi
    cd ..
fi

# 3. Check for unused dependencies
log_info "Checking for unused dependencies..."
if [ -f "frontend/package.json" ] && command -v depcheck &> /dev/null; then
    cd frontend
    if depcheck --json > /tmp/depcheck.json 2>&1; then
        UNUSED=$(jq '.dependencies | length' /tmp/depcheck.json 2>/dev/null || echo "0")
        if [ "$UNUSED" -gt 0 ]; then
            log_warning "Found $UNUSED unused dependencies"
            add_check "unused_deps" "warning" "$UNUSED unused dependencies" "$(jq -r '.dependencies[]' /tmp/depcheck.json | head -5 | tr '\n' ', ')"
        else
            log_success "No unused dependencies found"
            add_check "unused_deps" "success" "No unused dependencies" ""
        fi
    else
        log_info "depcheck not available, skipping"
        add_check "unused_deps" "info" "depcheck not installed" ""
    fi
    cd ..
fi

# 4. Check Cargo outdated
log_info "Checking for outdated Cargo crates..."
if [ -f "backend/Cargo.toml" ] && command -v cargo-outdated &> /dev/null; then
    cd backend
    if cargo outdated --format json > /tmp/cargo-outdated.json 2>&1; then
        OUTDATED_COUNT=$(jq '.packages | length' /tmp/cargo-outdated.json 2>/dev/null || echo "0")
        if [ "$OUTDATED_COUNT" -gt 0 ]; then
            log_warning "Found $OUTDATED_COUNT outdated crates"
            add_check "cargo_outdated" "warning" "$OUTDATED_COUNT outdated crates" ""
        else
            log_success "All Cargo crates are up to date"
            add_check "cargo_outdated" "success" "All crates up to date" ""
        fi
    else
        log_info "cargo-outdated not available, skipping"
        add_check "cargo_outdated" "info" "cargo-outdated not installed" ""
    fi
    cd ..
fi

# 5. Check Cargo security
log_info "Running Cargo security audit..."
if [ -f "backend/Cargo.toml" ] && command -v cargo-audit &> /dev/null; then
    cd backend
    if cargo audit --json > /tmp/cargo-audit.json 2>&1; then
        VULN_COUNT=$(jq '.vulnerabilities.found' /tmp/cargo-audit.json 2>/dev/null || echo "0")
        if [ "$VULN_COUNT" -gt 0 ]; then
            log_warning "Found $VULN_COUNT Cargo vulnerabilities"
            add_check "cargo_security" "warning" "$VULN_COUNT vulnerabilities found" ""
        else
            log_success "No Cargo security vulnerabilities found"
            add_check "cargo_security" "success" "No vulnerabilities" ""
        fi
    else
        log_info "cargo-audit not available, skipping"
        add_check "cargo_security" "info" "cargo-audit not installed" ""
    fi
    cd ..
fi

# 6. Check for duplicate dependencies
log_info "Checking for duplicate dependencies..."
if [ -f "frontend/package.json" ]; then
    cd frontend
    DUPLICATES=$(npm ls 2>&1 | grep -c "│.*@.*@" || echo "0")
    if [ "$DUPLICATES" -gt 0 ]; then
        log_warning "Found potential duplicate dependencies"
        add_check "duplicate_deps" "warning" "Potential duplicates found" ""
    else
        log_success "No duplicate dependencies detected"
        add_check "duplicate_deps" "success" "No duplicates" ""
    fi
    cd ..
fi

log_success "Dependency & Package Analysis complete"
cat "$RESULTS_FILE" | jq '.'

