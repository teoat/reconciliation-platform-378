#!/bin/bash
# ==============================================================================
# TypeScript Type Safety Analysis
# ==============================================================================
# Analyzes remaining 'any' types in the codebase
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend/src"
OUTPUT_DIR="$PROJECT_ROOT/docs/diagnostics"

source "$SCRIPT_DIR/../lib/common-functions.sh"

log_info "Analyzing TypeScript type safety..."

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Find all TypeScript files
TS_FILES=$(find "$FRONTEND_DIR" -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v __tests__ || true)

# Count files with 'any' types
FILES_WITH_ANY=$(echo "$TS_FILES" | xargs grep -l ":\s*any\b" 2>/dev/null | wc -l | tr -d ' ' || echo "0")

# Count total 'any' instances
TOTAL_ANY=$(echo "$TS_FILES" | xargs grep -o ":\s*any\b" 2>/dev/null | wc -l | tr -d ' ' || echo "0")

# Categorize by pattern
log_info "Categorizing 'any' types by pattern..."

cat > "$OUTPUT_DIR/typescript-type-analysis.md" <<EOF
# TypeScript Type Safety Analysis

**Date**: $(date -u +"%Y-%m-%d")
**Status**: Analysis Complete

---

## Summary

- **Files with 'any' types**: $FILES_WITH_ANY
- **Total 'any' instances**: $TOTAL_ANY
- **Files analyzed**: $(echo "$TS_FILES" | wc -l | tr -d ' ')

---

## Files with 'any' Types

EOF

# List files with 'any' types and count per file
echo "$TS_FILES" | while read -r file; do
    if [ -f "$file" ]; then
        COUNT=$(grep -o ":\s*any\b" "$file" 2>/dev/null | wc -l | tr -d ' ' || echo "0")
        if [ "$COUNT" -gt 0 ]; then
            RELATIVE_PATH=$(echo "$file" | sed "s|$PROJECT_ROOT/||")
            echo "- \`$RELATIVE_PATH\`: $COUNT instances" >> "$OUTPUT_DIR/typescript-type-analysis.md"
        fi
    fi
done

cat >> "$OUTPUT_DIR/typescript-type-analysis.md" <<EOF

---

## Categories

### API Responses
\`\`\`
$(echo "$TS_FILES" | xargs grep -h ":\s*any\b" 2>/dev/null | grep -i "response\|api\|fetch" | head -10 || echo "None found")
\`\`\`

### Event Handlers
\`\`\`
$(echo "$TS_FILES" | xargs grep -h ":\s*any\b" 2>/dev/null | grep -i "event\|handler\|onclick\|onchange" | head -10 || echo "None found")
\`\`\`

### Utilities
\`\`\`
$(echo "$TS_FILES" | xargs grep -h ":\s*any\b" 2>/dev/null | grep -i "util\|helper\|function" | head -10 || echo "None found")
\`\`\`

---

## Next Steps

1. Replace API response 'any' types with proper interfaces
2. Type event handlers with proper event types
3. Create type guards for complex types
4. Use 'unknown' instead of 'any' where type is truly unknown

---

**Analysis Complete**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
EOF

log_success "Analysis complete: $OUTPUT_DIR/typescript-type-analysis.md"
log_info "Files with 'any' types: $FILES_WITH_ANY"
log_info "Total 'any' instances: $TOTAL_ANY"

