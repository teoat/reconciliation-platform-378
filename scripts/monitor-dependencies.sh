#!/bin/bash
# Dependency Monitoring Script
# Monitors dependency health and sends alerts on violations

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Configuration
FRONTEND_DIR="${FRONTEND_DIR:-frontend/src}"
ALERT_THRESHOLD_CIRCULAR=0
ALERT_THRESHOLD_DEPTH=5
ALERT_THRESHOLD_COUPLING=10

log_info "Starting dependency monitoring..."

# Check if madge is installed
if ! command -v npx &> /dev/null || ! npx madge --version &> /dev/null; then
  log_error "madge not found. Please install: npm install --save-dev madge"
  exit 1
fi

ALERTS=0

# 1. Check for circular dependencies
log_info "Checking for circular dependencies..."
if npx madge --circular --extensions ts,tsx,js,jsx "$FRONTEND_DIR" 2>&1 | grep -q "Found.*circular"; then
  log_error "🚨 ALERT: Circular dependencies detected!"
  npx madge --circular --extensions ts,tsx,js,jsx "$FRONTEND_DIR"
  ALERTS=$((ALERTS + 1))
fi

# 2. Check dependency depth
log_info "Checking dependency depth..."
DEPTH_VIOLATIONS=$(npx madge --extensions ts,tsx,js,jsx "$FRONTEND_DIR" 2>&1 | grep -E "depth.*>$ALERT_THRESHOLD_DEPTH" || true)

if [ -n "$DEPTH_VIOLATIONS" ]; then
  log_warning "⚠️ ALERT: Modules exceed max depth of $ALERT_THRESHOLD_DEPTH:"
  echo "$DEPTH_VIOLATIONS"
  ALERTS=$((ALERTS + 1))
fi

# 3. Check module boundaries
log_info "Checking module boundaries..."
UTILS_VIOLATIONS=$(find "$FRONTEND_DIR/utils" -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs grep -l "from.*components\|from.*services" 2>/dev/null || true)

if [ -n "$UTILS_VIOLATIONS" ]; then
  log_error "🚨 ALERT: Utils importing from Components/Services:"
  echo "$UTILS_VIOLATIONS"
  ALERTS=$((ALERTS + 1))
fi

TYPES_VIOLATIONS=$(find "$FRONTEND_DIR/types" -name "*.ts" 2>/dev/null | xargs grep -l "from.*components\|from.*services\|from.*utils" 2>/dev/null | grep -v "from.*types" || true)

if [ -n "$TYPES_VIOLATIONS" ]; then
  log_error "🚨 ALERT: Types importing from Components/Services/Utils:"
  echo "$TYPES_VIOLATIONS"
  ALERTS=$((ALERTS + 1))
fi

# Summary
if [ $ALERTS -eq 0 ]; then
  log_success "✅ All dependency health checks passed!"
  exit 0
else
  log_error "❌ Dependency monitoring found $ALERTS alert(s). Review and fix issues."
  exit 1
fi

