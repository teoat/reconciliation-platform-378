#!/bin/bash
# Update dependencies to latest stable versions
# Run with caution - test thoroughly after updates

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "Starting dependency updates..."

# Frontend dependencies
cd "$SCRIPT_DIR/../frontend"
log_info "Updating frontend dependencies..."

# Update patch and minor versions (safe updates)
npm update

# Major version updates require manual review
log_warning "Major version updates require manual review:"
npm outdated | grep -E "Wanted.*Latest" | awk '{print $1}' | while read pkg; do
  current=$(npm list "$pkg" --depth=0 2>/dev/null | grep "$pkg@" | sed "s/.*@//" | cut -d' ' -f1)
  latest=$(npm view "$pkg" version)
  if [ "$current" != "$latest" ]; then
    log_info "  $pkg: $current -> $latest (requires review)"
  fi
done

log_success "Frontend dependencies updated"

# Backend dependencies
cd "$SCRIPT_DIR/../backend"
log_info "Updating backend dependencies..."

cargo update

log_success "Backend dependencies updated"

log_success "Dependency update complete"
log_info "Please run tests and review changes before committing"

