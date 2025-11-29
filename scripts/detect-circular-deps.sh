#!/bin/bash
# Detect Circular Dependencies Script
# Scans the codebase for circular dependencies using madge

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Configuration
FRONTEND_DIR="${FRONTEND_DIR:-frontend/src}"
OUTPUT_DIR="${OUTPUT_DIR:-docs/diagnostics/dependency-graphs}"
MADGE_OPTIONS="${MADGE_OPTIONS:---circular --extensions ts,tsx,js,jsx}"

log_info "Starting circular dependency detection..."

# Check if madge is installed
if ! command -v npx &> /dev/null || ! npx madge --version &> /dev/null; then
  log_warning "madge not found. Installing..."
  npm install --save-dev madge
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Detect circular dependencies
log_info "Scanning for circular dependencies in $FRONTEND_DIR..."

if npx madge $MADGE_OPTIONS "$FRONTEND_DIR" > "$OUTPUT_DIR/circular-deps.txt" 2>&1; then
  CIRCULAR_COUNT=$(grep -c "Found.*circular" "$OUTPUT_DIR/circular-deps.txt" || echo "0")
  
  if [ "$CIRCULAR_COUNT" -gt 0 ]; then
    log_error "Found circular dependencies!"
    cat "$OUTPUT_DIR/circular-deps.txt"
    exit 1
  else
    log_success "No circular dependencies found!"
    rm -f "$OUTPUT_DIR/circular-deps.txt"
  fi
else
  # Check if it's because no circular deps were found (exit code 0) or actual error
  if [ $? -eq 0 ]; then
    log_success "No circular dependencies found!"
  else
    log_error "Error running madge. Check output above."
    exit 1
  fi
fi

# Generate dependency graph
log_info "Generating dependency graph..."
npx madge --image "$OUTPUT_DIR/dependency-graph.svg" --extensions ts,tsx,js,jsx "$FRONTEND_DIR" || true

log_success "Circular dependency detection complete!"
log_info "Graph saved to: $OUTPUT_DIR/dependency-graph.svg"

