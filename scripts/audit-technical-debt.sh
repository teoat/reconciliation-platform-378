#!/bin/bash
# Technical Debt Audit Script
# Scans codebase for TODO, FIXME, HACK, XXX, BUG markers and generates report

set -e

REPORT_FILE="TECHNICAL_DEBT_AUDIT.md"
TEMP_DIR=$(mktemp -d)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "🔍 Starting Technical Debt Audit..."
echo "Timestamp: $TIMESTAMP"
echo ""

# Count markers by type
echo "Scanning codebase..."

# Backend (Rust) - Case-insensitive search in multiple locations
BACKEND_TODO=$(grep -ri "TODO" backend/src reconciliation-rust/src --include="*.rs" 2>/dev/null | wc -l | tr -d ' ')
BACKEND_FIXME=$(grep -ri "FIXME" backend/src reconciliation-rust/src --include="*.rs" 2>/dev/null | wc -l | tr -d ' ')
BACKEND_HACK=$(grep -ri "HACK" backend/src reconciliation-rust/src --include="*.rs" 2>/dev/null | wc -l | tr -d ' ')
BACKEND_XXX=$(grep -ri "XXX" backend/src reconciliation-rust/src --include="*.rs" 2>/dev/null | wc -l | tr -d ' ')
BACKEND_BUG=$(grep -ri "\bBUG\b" backend/src reconciliation-rust/src --include="*.rs" 2>/dev/null | wc -l | tr -d ' ')
BACKEND_TOTAL=$((BACKEND_TODO + BACKEND_FIXME + BACKEND_HACK + BACKEND_XXX + BACKEND_BUG))

# Frontend (TypeScript/React) - Case-insensitive search in multiple locations
FRONTEND_TODO=$(grep -ri "TODO" frontend/src components pages services hooks store types utils --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l | tr -d ' ')
FRONTEND_FIXME=$(grep -ri "FIXME" frontend/src components pages services hooks store types utils --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l | tr -d ' ')
FRONTEND_HACK=$(grep -ri "HACK" frontend/src components pages services hooks store types utils --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l | tr -d ' ')
FRONTEND_XXX=$(grep -ri "XXX" frontend/src components pages services hooks store types utils --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l | tr -d ' ')
FRONTEND_BUG=$(grep -ri "\bBUG\b" frontend/src components pages services hooks store types utils --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l | tr -d ' ')
FRONTEND_TOTAL=$((FRONTEND_TODO + FRONTEND_FIXME + FRONTEND_HACK + FRONTEND_XXX + FRONTEND_BUG))

TOTAL_MARKERS=$((BACKEND_TOTAL + FRONTEND_TOTAL))

# Count files with markers (case-insensitive)
BACKEND_FILES=$(grep -ril "TODO\|FIXME\|HACK\|XXX\|\bBUG\b" backend/src reconciliation-rust/src --include="*.rs" 2>/dev/null | wc -l | tr -d ' ')
FRONTEND_FILES=$(grep -ril "TODO\|FIXME\|HACK\|XXX\|\bBUG\b" frontend/src components pages services hooks store types utils --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l | tr -d ' ')
TOTAL_FILES=$((BACKEND_FILES + FRONTEND_FILES))

# Count total files
TOTAL_BACKEND_FILES=$(find backend/src reconciliation-rust/src -name "*.rs" -type f 2>/dev/null | wc -l | tr -d ' ')
TOTAL_FRONTEND_FILES=$(find frontend/src components pages services hooks store types utils -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" 2>/dev/null | wc -l | tr -d ' ')
TOTAL_SOURCE_FILES=$((TOTAL_BACKEND_FILES + TOTAL_FRONTEND_FILES))

# Generate detailed breakdown by file
echo "Generating detailed breakdown..."

grep -rin "TODO\|FIXME\|HACK\|XXX\|\bBUG\b" backend/src reconciliation-rust/src --include="*.rs" > "$TEMP_DIR/backend_markers.txt" 2>/dev/null || true
grep -rin "TODO\|FIXME\|HACK\|XXX\|\bBUG\b" frontend/src components pages services hooks store types utils --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" > "$TEMP_DIR/frontend_markers.txt" 2>/dev/null || true

# Find files with most markers
echo "Identifying top files by marker count..."
cat "$TEMP_DIR/backend_markers.txt" | cut -d: -f1 | sort | uniq -c | sort -rn | head -10 > "$TEMP_DIR/top_backend_files.txt"
cat "$TEMP_DIR/frontend_markers.txt" | cut -d: -f1 | sort | uniq -c | sort -rn | head -10 > "$TEMP_DIR/top_frontend_files.txt"

# Generate report
cat > "$REPORT_FILE" <<EOF
# Technical Debt Audit Report

**Generated**: $TIMESTAMP  
**Audit Version**: 1.0.0

---

## Executive Summary

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Technical Debt Markers** | **$TOTAL_MARKERS** | - |
| **Files with Markers** | **$TOTAL_FILES** | $(( TOTAL_FILES * 100 / TOTAL_SOURCE_FILES ))% of $TOTAL_SOURCE_FILES source files |
| **Backend Markers** | $BACKEND_TOTAL | - |
| **Frontend Markers** | $FRONTEND_TOTAL | - |

### Breakdown by Type

#### Backend (Rust)
| Type | Count |
|------|-------|
| TODO | $BACKEND_TODO |
| FIXME | $BACKEND_FIXME |
| HACK | $BACKEND_HACK |
| XXX | $BACKEND_XXX |
| BUG | $BACKEND_BUG |
| **Total** | **$BACKEND_TOTAL** |

#### Frontend (TypeScript)
| Type | Count |
|------|-------|
| TODO | $FRONTEND_TODO |
| FIXME | $FRONTEND_FIXME |
| HACK | $FRONTEND_HACK |
| XXX | $FRONTEND_XXX |
| BUG | $FRONTEND_BUG |
| **Total** | **$FRONTEND_TOTAL** |

---

## Top Files by Technical Debt

### Top 10 Backend Files

EOF

if [ -f "$TEMP_DIR/top_backend_files.txt" ] && [ -s "$TEMP_DIR/top_backend_files.txt" ]; then
  cat "$TEMP_DIR/top_backend_files.txt" | awk '{printf "| %d | %s |\n", $1, $2}' >> "$REPORT_FILE"
else
  echo "| Count | File |" >> "$REPORT_FILE"
  echo "|-------|------|" >> "$REPORT_FILE"
  echo "| - | No markers found |" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<EOF

### Top 10 Frontend Files

EOF

if [ -f "$TEMP_DIR/top_frontend_files.txt" ] && [ -s "$TEMP_DIR/top_frontend_files.txt" ]; then
  cat "$TEMP_DIR/top_frontend_files.txt" | awk '{printf "| %d | %s |\n", $1, $2}' >> "$REPORT_FILE"
else
  echo "| Count | File |" >> "$REPORT_FILE"
  echo "|-------|------|" >> "$REPORT_FILE"
  echo "| - | No markers found |" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<EOF

---

## Detailed Breakdown by File

### Backend Files with Markers

EOF

if [ -f "$TEMP_DIR/backend_markers.txt" ] && [ -s "$TEMP_DIR/backend_markers.txt" ]; then
  echo "\`\`\`" >> "$REPORT_FILE"
  cat "$TEMP_DIR/backend_markers.txt" | head -100 >> "$REPORT_FILE"
  echo "\`\`\`" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  if [ $(wc -l < "$TEMP_DIR/backend_markers.txt") -gt 100 ]; then
    echo "*Note: Showing first 100 markers. Total: $(wc -l < "$TEMP_DIR/backend_markers.txt")*" >> "$REPORT_FILE"
  fi
else
  echo "No markers found in backend files." >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<EOF

### Frontend Files with Markers

EOF

if [ -f "$TEMP_DIR/frontend_markers.txt" ] && [ -s "$TEMP_DIR/frontend_markers.txt" ]; then
  echo "\`\`\`" >> "$REPORT_FILE"
  cat "$TEMP_DIR/frontend_markers.txt" | head -100 >> "$REPORT_FILE"
  echo "\`\`\`" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  if [ $(wc -l < "$TEMP_DIR/frontend_markers.txt") -gt 100 ]; then
    echo "*Note: Showing first 100 markers. Total: $(wc -l < "$TEMP_DIR/frontend_markers.txt")*" >> "$REPORT_FILE"
  fi
else
  echo "No markers found in frontend files." >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<EOF

---

## Recommendations

### Priority 0 (Critical)
1. **Address all BUG markers immediately** - Backend: $BACKEND_BUG, Frontend: $FRONTEND_BUG
2. **Review all HACK markers** - Backend: $BACKEND_HACK, Frontend: $FRONTEND_HACK
3. **Address critical FIXME markers** - Backend: $BACKEND_FIXME, Frontend: $FRONTEND_FIXME

### Priority 1 (High)
1. **Categorize and prioritize all TODO markers** - Backend: $BACKEND_TODO, Frontend: $FRONTEND_TODO
2. **Review XXX markers** - Backend: $BACKEND_XXX, Frontend: $FRONTEND_XXX
3. **Create sprint plan to address top 10 files**

### Priority 2 (Medium)
1. **Set up automated tracking** - Add technical debt tracking to CI/CD
2. **Create technical debt backlog** - Organize by impact and effort
3. **Set reduction targets** - Reduce by 40% in 3 months

---

## Action Items

- [ ] Review and categorize all $TOTAL_MARKERS markers
- [ ] Create prioritized backlog
- [ ] Assign ownership for top 10 files
- [ ] Set up automated tracking
- [ ] Schedule regular technical debt review

---

**Report Generated**: $TIMESTAMP  
**Next Audit**: Schedule regular audits (weekly/monthly)

EOF

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Technical Debt Audit Complete!"
echo "📄 Report generated: $REPORT_FILE"
echo ""
echo "Summary:"
echo "  Total Markers: $TOTAL_MARKERS"
echo "  Backend: $BACKEND_TOTAL"
echo "  Frontend: $FRONTEND_TOTAL"
echo "  Files Affected: $TOTAL_FILES / $TOTAL_SOURCE_FILES"

