#!/bin/bash
# Dependency Validation Script
# Validates module dependencies and detects circular imports

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Configuration
FRONTEND_DIR="${FRONTEND_DIR:-frontend/src}"
MAX_DEPTH="${MAX_DEPTH:-5}"
EXIT_ON_VIOLATION="${EXIT_ON_VIOLATION:-true}"

log_info "Starting dependency validation..."

# Check prerequisites
check_command npx "npx is required"

# Install madge if not available
if ! npx madge --version &> /dev/null 2>&1; then
  log_info "Installing madge..."
  npm install --save-dev madge
fi

VIOLATIONS=0

# 1. Check for circular dependencies
log_info "Checking for circular dependencies..."
if npx madge --circular --extensions ts,tsx,js,jsx "$FRONTEND_DIR" 2>&1 | grep -q "Found.*circular"; then
  log_error "Circular dependencies detected!"
  npx madge --circular --extensions ts,tsx,js,jsx "$FRONTEND_DIR"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  log_success "No circular dependencies found"
fi

# 2. Check dependency depth
log_info "Checking dependency depth (max: $MAX_DEPTH)..."
DEPTH_VIOLATIONS=$(npx madge --extensions ts,tsx,js,jsx "$FRONTEND_DIR" 2>&1 | grep -E "depth.*>$MAX_DEPTH" || true)

if [ -n "$DEPTH_VIOLATIONS" ]; then
  log_warning "Some modules exceed max depth of $MAX_DEPTH:"
  echo "$DEPTH_VIOLATIONS"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  log_success "All modules within max depth"
fi

# 3. Validate module boundaries
log_info "Validating module boundaries..."

# Utils should not import from Components or Services
UTILS_VIOLATIONS=$(find "$FRONTEND_DIR/utils" -name "*.ts" -o -name "*.tsx" | xargs grep -l "from.*components\|from.*services" || true)

if [ -n "$UTILS_VIOLATIONS" ]; then
  log_error "Utils importing from Components/Services (violation):"
  echo "$UTILS_VIOLATIONS"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  log_success "Utils module boundaries respected"
fi

# Types should not import from Components, Services, or Utils (except other types)
TYPES_VIOLATIONS=$(find "$FRONTEND_DIR/types" -name "*.ts" | xargs grep -l "from.*components\|from.*services\|from.*utils" | grep -v "from.*types" || true)

if [ -n "$TYPES_VIOLATIONS" ]; then
  log_error "Types importing from Components/Services/Utils (violation):"
  echo "$TYPES_VIOLATIONS"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  log_success "Types module boundaries respected"
fi

# Summary
log_info "Validation complete. Violations found: $VIOLATIONS"

if [ $VIOLATIONS -gt 0 ]; then
  if [ "$EXIT_ON_VIOLATION" = "true" ]; then
    log_error "Dependency validation failed. Fix violations before proceeding."
    exit 1
  else
    log_warning "Dependency validation found violations (non-blocking)"
  fi
else
  log_success "All dependency validations passed!"
fi

exit 0

