#!/bin/bash
# Generate Dependency Health Report
# Creates weekly dependency health reports with metrics and trends

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Configuration
FRONTEND_DIR="${FRONTEND_DIR:-frontend/src}"
OUTPUT_DIR="${OUTPUT_DIR:-docs/diagnostics/dependency-reports}"
REPORT_DATE=$(date +%Y-%m-%d)
REPORT_FILE="$OUTPUT_DIR/dependency-health-${REPORT_DATE}.md"

log_info "Generating dependency health report..."

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check if madge is installed
if ! command -v npx &> /dev/null || ! npx madge --version &> /dev/null; then
  log_warning "madge not found. Installing..."
  npm install --save-dev madge
fi

# Initialize report
cat > "$REPORT_FILE" << EOF
# Dependency Health Report

**Date**: ${REPORT_DATE}  
**Generated**: $(date '+%Y-%m-%d %H:%M:%S')  
**Status**: Automated Report

---

## Summary

This report provides a comprehensive analysis of dependency health, circular dependencies, and module coupling.

---

## Metrics

EOF

# 1. Circular Dependencies Count
log_info "Analyzing circular dependencies..."
CIRCULAR_COUNT=$(npx madge --circular --extensions ts,tsx,js,jsx "$FRONTEND_DIR" 2>&1 | grep -c "Found.*circular" || echo "0")

cat >> "$REPORT_FILE" << EOF
### Circular Dependencies
- **Count**: ${CIRCULAR_COUNT}
- **Status**: $([ "$CIRCULAR_COUNT" -eq 0 ] && echo "✅ Healthy" || echo "⚠️ Issues Found")
- **Target**: 0

EOF

# 2. Dependency Depth Analysis
log_info "Analyzing dependency depth..."
DEPTH_ANALYSIS=$(npx madge --extensions ts,tsx,js,jsx "$FRONTEND_DIR" 2>&1 | grep -E "depth|Max depth" || echo "Analysis complete")

cat >> "$REPORT_FILE" << EOF
### Dependency Depth
\`\`\`
${DEPTH_ANALYSIS}
\`\`\`

EOF

# 3. Module Count
log_info "Counting modules..."
MODULE_COUNT=$(find "$FRONTEND_DIR" -name "*.ts" -o -name "*.tsx" | wc -l | tr -d ' ')

cat >> "$REPORT_FILE" << EOF
### Module Statistics
- **Total Modules**: ${MODULE_COUNT}
- **Scanned**: $(find "$FRONTEND_DIR" -name "*.ts" -o -name "*.tsx" | wc -l | tr -d ' ')

EOF

# 4. Module Boundary Violations
log_info "Checking module boundaries..."
UTILS_VIOLATIONS=$(find "$FRONTEND_DIR/utils" -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs grep -l "from.*components\|from.*services" 2>/dev/null | wc -l | tr -d ' ' || echo "0")
TYPES_VIOLATIONS=$(find "$FRONTEND_DIR/types" -name "*.ts" 2>/dev/null | xargs grep -l "from.*components\|from.*services\|from.*utils" 2>/dev/null | grep -v "from.*types" | wc -l | tr -d ' ' || echo "0")

cat >> "$REPORT_FILE" << EOF
### Module Boundary Violations
- **Utils Violations**: ${UTILS_VIOLATIONS} (should be 0)
- **Types Violations**: ${TYPES_VIOLATIONS} (should be 0)
- **Status**: $([ "$UTILS_VIOLATIONS" -eq 0 ] && [ "$TYPES_VIOLATIONS" -eq 0 ] && echo "✅ Healthy" || echo "⚠️ Violations Found")

EOF

# 5. High-Coupling Modules
log_info "Identifying high-coupling modules..."
HIGH_COUPLING=$(npx madge --extensions ts,tsx,js,jsx "$FRONTEND_DIR" 2>&1 | grep -E "has.*dependencies|imports" | head -10 || echo "No high-coupling modules identified")

cat >> "$REPORT_FILE" << EOF
### High-Coupling Modules
\`\`\`
${HIGH_COUPLING}
\`\`\`

EOF

# 6. Recommendations
cat >> "$REPORT_FILE" << EOF
---

## Recommendations

EOF

if [ "$CIRCULAR_COUNT" -gt 0 ]; then
  cat >> "$REPORT_FILE" << EOF
- ⚠️ **Action Required**: ${CIRCULAR_COUNT} circular dependency(ies) detected. Run \`npm run deps:circular\` for details.
EOF
fi

if [ "$UTILS_VIOLATIONS" -gt 0 ] || [ "$TYPES_VIOLATIONS" -gt 0 ]; then
  cat >> "$REPORT_FILE" << EOF
- ⚠️ **Action Required**: Module boundary violations detected. Review and refactor.
EOF
fi

if [ "$CIRCULAR_COUNT" -eq 0 ] && [ "$UTILS_VIOLATIONS" -eq 0 ] && [ "$TYPES_VIOLATIONS" -eq 0 ]; then
  cat >> "$REPORT_FILE" << EOF
- ✅ **Status**: All dependency health checks passed. Continue maintaining clean architecture.
EOF
fi

cat >> "$REPORT_FILE" << EOF

---

## Next Steps

1. Review circular dependencies (if any)
2. Address module boundary violations
3. Refactor high-coupling modules
4. Maintain dependency health

---

**Report Generated**: $(date '+%Y-%m-%d %H:%M:%S')  
**Tool**: madge + custom analysis scripts

EOF

log_success "Dependency health report generated: $REPORT_FILE"

# Generate dependency graph
log_info "Generating dependency graph..."
npx madge --image "$OUTPUT_DIR/dependency-graph-${REPORT_DATE}.svg" --extensions ts,tsx,js,jsx "$FRONTEND_DIR" || log_warning "Graph generation failed (non-critical)"

log_success "Dependency report generation complete!"

