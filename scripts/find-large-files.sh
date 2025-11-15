#!/bin/bash
# Find Large Files Script
# Identifies files that exceed recommended size limits

set -e

REPORT_FILE="LARGE_FILES_REPORT.md"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Thresholds (lines)
BACKEND_THRESHOLD=500
FRONTEND_THRESHOLD=400
BACKEND_WARNING=300
FRONTEND_WARNING=250

echo "🔍 Finding Large Files..."
echo "Timestamp: $TIMESTAMP"
echo ""

echo "Backend Files > ${BACKEND_THRESHOLD} lines:"
echo "----------------------------------------"
find backend/src -name "*.rs" -type f -exec wc -l {} + | sort -rn | awk -v threshold="$BACKEND_THRESHOLD" '$1 > threshold {print $1, $2}' | head -20

echo ""
echo "Frontend Files > ${FRONTEND_THRESHOLD} lines:"
echo "------------------------------------------"
find frontend/src -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | sort -rn | awk -v threshold="$FRONTEND_THRESHOLD" '$1 > threshold {print $1, $2}' | head -20

# Generate report
cat > "$REPORT_FILE" <<EOF
# Large Files Report

**Generated**: $TIMESTAMP

---

## Refactoring Candidates

### Backend Files (Rust)

Files exceeding ${BACKEND_THRESHOLD} lines (target: < ${BACKEND_THRESHOLD} lines):

\`\`\`
$(find backend/src -name "*.rs" -type f -exec wc -l {} + 2>/dev/null | sort -rn | awk -v threshold="$BACKEND_THRESHOLD" '$1 > threshold {printf "%-6d %s\n", $1, $2}' | head -10)
\`\`\`

**Files needing attention (${BACKEND_WARNING}-${BACKEND_THRESHOLD} lines)**:

\`\`\`
$(find backend/src -name "*.rs" -type f -exec wc -l {} + 2>/dev/null | sort -rn | awk -v warn="$BACKEND_WARNING" -v threshold="$BACKEND_THRESHOLD" '$1 >= warn && $1 <= threshold {printf "%-6d %s\n", $1, $2}' | head -10)
\`\`\`

### Frontend Files (TypeScript/TSX)

Files exceeding ${FRONTEND_THRESHOLD} lines (target: < ${FRONTEND_THRESHOLD} lines):

\`\`\`
$(find frontend/src \( -name "*.ts" -o -name "*.tsx" \) -type f -exec wc -l {} + 2>/dev/null | sort -rn | awk -v threshold="$FRONTEND_THRESHOLD" '$1 > threshold {printf "%-6d %s\n", $1, $2}' | head -10)
\`\`\`

**Files needing attention (${FRONTEND_WARNING}-${FRONTEND_THRESHOLD} lines)**:

\`\`\`
$(find frontend/src \( -name "*.ts" -o -name "*.tsx" \) -type f -exec wc -l {} + 2>/dev/null | sort -rn | awk -v warn="$FRONTEND_WARNING" -v threshold="$FRONTEND_THRESHOLD" '$1 >= warn && $1 <= threshold {printf "%-6d %s\n", $1, $2}' | head -10)
\`\`\`

---

## Refactoring Strategy

### Priority 0 (Immediate)
Files over threshold need immediate refactoring:

1. **Break into smaller modules**
   - Extract related functionality into separate files
   - Create sub-modules for logical groupings
   - Maintain clear interfaces between modules

2. **Extract common patterns**
   - Identify duplicated code
   - Create utility functions or traits
   - Use composition over inheritance

3. **Apply SOLID principles**
   - Single Responsibility Principle
   - Separation of concerns
   - Dependency injection

### Priority 1 (This Sprint)
Files approaching threshold should be refactored soon:

- Monitor growth
- Refactor proactively
- Add tests before refactoring

### Priority 2 (Next Sprint)
Files in warning range:

- Document current structure
- Plan refactoring approach
- Schedule refactoring task

---

## Recommendations

### For Backend (Rust)
- Target: All files < ${BACKEND_THRESHOLD} lines
- Focus on: Service modules, handler modules
- Strategy: Extract sub-services, create traits, modularize

### For Frontend (TypeScript)
- Target: All files < ${FRONTEND_THRESHOLD} lines
- Focus on: Component files, service files
- Strategy: Split components, extract hooks, modularize services

---

## Metrics

| Metric | Backend | Frontend |
|--------|---------|----------|
| Threshold | ${BACKEND_THRESHOLD} lines | ${FRONTEND_THRESHOLD} lines |
| Warning Level | ${BACKEND_WARNING} lines | ${FRONTEND_WARNING} lines |
| Files Over Threshold | $(find backend/src -name "*.rs" -type f -exec wc -l {} + 2>/dev/null | awk -v threshold="$BACKEND_THRESHOLD" '$1 > threshold' | wc -l | tr -d ' ') | $(find frontend/src \( -name "*.ts" -o -name "*.tsx" \) -type f -exec wc -l {} + 2>/dev/null | awk -v threshold="$FRONTEND_THRESHOLD" '$1 > threshold' | wc -l | tr -d ' ') |
| Files in Warning Range | $(find backend/src -name "*.rs" -type f -exec wc -l {} + 2>/dev/null | awk -v warn="$BACKEND_WARNING" -v threshold="$BACKEND_THRESHOLD" '$1 >= warn && $1 <= threshold' | wc -l | tr -d ' ') | $(find frontend/src \( -name "*.ts" -o -name "*.tsx" \) -type f -exec wc -l {} + 2>/dev/null | awk -v warn="$FRONTEND_WARNING" -v threshold="$FRONTEND_THRESHOLD" '$1 >= warn && $1 <= threshold' | wc -l | tr -d ' ') |

---

**Report Generated**: $TIMESTAMP

EOF

echo "✅ Large files report generated: $REPORT_FILE"

