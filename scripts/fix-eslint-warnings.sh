#!/bin/bash
# Fix common ESLint warnings automatically
# Focuses on unused variables and imports

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "Fixing ESLint warnings..."

cd "$SCRIPT_DIR/../frontend"

# Run ESLint with auto-fix for safe fixes
log_info "Running ESLint auto-fix..."
npm run lint -- --fix || true

log_info "ESLint auto-fix complete"
log_warning "Review changes before committing"
log_info "Remaining warnings may require manual fixes"

