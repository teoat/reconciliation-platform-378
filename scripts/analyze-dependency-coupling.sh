#!/bin/bash
# Analyze Dependency Coupling
# Identifies high-coupling modules for refactoring

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Configuration
FRONTEND_DIR="${FRONTEND_DIR:-frontend/src}"
OUTPUT_DIR="${OUTPUT_DIR:-docs/diagnostics/dependency-reports}"
COUPLING_THRESHOLD="${COUPLING_THRESHOLD:-10}"

log_info "Analyzing dependency coupling..."

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check if madge is installed
if ! command -v npx &> /dev/null || ! npx madge --version &> /dev/null; then
  log_warning "madge not found. Installing..."
  npm install --save-dev madge
fi

OUTPUT_FILE="$OUTPUT_DIR/coupling-analysis-$(date +%Y-%m-%d).md"

cat > "$OUTPUT_FILE" << EOF
# Dependency Coupling Analysis

**Date**: $(date +%Y-%m-%d)  
**Generated**: $(date '+%Y-%m-%d %H:%M:%S')  
**Threshold**: ${COUPLING_THRESHOLD} dependencies

---

## High-Coupling Modules

Modules with more than ${COUPLING_THRESHOLD} dependencies may benefit from refactoring.

EOF

# Generate coupling statistics
log_info "Generating coupling statistics..."
npx madge --extensions ts,tsx,js,jsx "$FRONTEND_DIR" 2>&1 | tee -a "$OUTPUT_FILE" || true

# Identify specific high-coupling files
log_info "Identifying high-coupling files..."
HIGH_COUPLING_FILES=$(find "$FRONTEND_DIR" -name "*.ts" -o -name "*.tsx" | while read file; do
  IMPORTS=$(grep -c "^import" "$file" 2>/dev/null || echo "0")
  if [ "$IMPORTS" -gt "$COUPLING_THRESHOLD" ]; then
    echo "$file: $IMPORTS imports"
  fi
done)

if [ -n "$HIGH_COUPLING_FILES" ]; then
  cat >> "$OUTPUT_FILE" << EOF

## Files Exceeding Threshold

\`\`\`
${HIGH_COUPLING_FILES}
\`\`\`

### Refactoring Recommendations

1. **Extract shared utilities** - Move common functionality to shared modules
2. **Use dependency injection** - Reduce direct imports
3. **Split large modules** - Break down into smaller, focused modules
4. **Use event-based communication** - Reduce coupling between modules

EOF
else
  cat >> "$OUTPUT_FILE" << EOF

## Status

✅ No files exceed the coupling threshold of ${COUPLING_THRESHOLD} dependencies.

EOF
fi

cat >> "$OUTPUT_FILE" << EOF

---

**Report Generated**: $(date '+%Y-%m-%d %H:%M:%S')

EOF

log_success "Coupling analysis complete: $OUTPUT_FILE"

