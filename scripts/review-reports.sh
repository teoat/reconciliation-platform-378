#!/bin/bash
# Review Reports Script
# Runs all quality checks and reviews reports

set -e

echo "📋 Reviewing Reports..."
echo "================================"
echo ""

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
REVIEW_DIR=".review"
mkdir -p "$REVIEW_DIR"

echo "Timestamp: $TIMESTAMP"
echo ""

# Run all quality checks
echo "🔍 Running Quality Checks..."
echo "--------------------------------"

if npm run quality:check > "$REVIEW_DIR/quality-check-output.txt" 2>&1; then
  echo "✅ Quality checks completed"
else
  echo "⚠️  Some quality checks may have failed (see output)"
fi

echo ""

# Generate report summary
echo "📊 Generating Report Summary..."
echo "--------------------------------"

cat > "$REVIEW_DIR/REPORT_SUMMARY.md" <<EOF
# Quality Reports Summary

**Generated**: $TIMESTAMP

---

## Reports Available

### Technical Debt
- **File**: \`TECHNICAL_DEBT_AUDIT.md\`
- **Status**: $(if [ -f "TECHNICAL_DEBT_AUDIT.md" ]; then echo "✅ Available"; else echo "⚠️  Not found"; fi)
- **Action**: Review markers and prioritize

### Large Files
- **File**: \`LARGE_FILES_REPORT.md\`
- **Status**: $(if [ -f "LARGE_FILES_REPORT.md" ]; then echo "✅ Available"; else echo "⚠️  Not found"; fi)
- **Action**: Review refactoring candidates

### Test Coverage
- **File**: \`COVERAGE_REPORT.md\`
- **Status**: $(if [ -f "COVERAGE_REPORT.md" ]; then echo "✅ Available"; else echo "⚠️  Run: npm run coverage:report"; fi)
- **Action**: Review coverage gaps

### Bundle Monitor
- **File**: \`BUNDLE_MONITOR_REPORT.md\`
- **Status**: $(if [ -f "BUNDLE_MONITOR_REPORT.md" ]; then echo "✅ Available"; else echo "⚠️  Run: npm run bundle:monitor"; fi)
- **Action**: Review bundle size changes

---

## Priority Actions

### P0 (Immediate)
1. **Review Technical Debt**
   - Read: \`TECHNICAL_DEBT_AUDIT.md\`
   - Identify BUG marker
   - Resolve immediately

2. **Review Large Files**
   - Read: \`LARGE_FILES_REPORT.md\`
   - Identify top 5 files
   - Prioritize for refactoring

### P1 (This Sprint)
3. **Review Test Coverage**
   - Read: \`COVERAGE_REPORT.md\`
   - Identify critical gaps
   - Plan coverage improvements

4. **Review Bundle Size**
   - Read: \`BUNDLE_MONITOR_REPORT.md\`
   - Identify size increases
   - Plan optimizations

---

## Execution Checklist

- [ ] Review technical debt markers
- [ ] Resolve BUG marker (P0)
- [ ] Review large files report
- [ ] Prioritize top 5 files for refactoring
- [ ] Review coverage gaps
- [ ] Create testing backlog
- [ ] Review bundle size
- [ ] Plan bundle optimizations

---

**Report Generated**: $TIMESTAMP

EOF

echo "✅ Report summary created: $REVIEW_DIR/REPORT_SUMMARY.md"
echo ""

# List available reports
echo "📄 Available Reports:"
echo "--------------------------------"
[ -f "TECHNICAL_DEBT_AUDIT.md" ] && echo "✅ TECHNICAL_DEBT_AUDIT.md"
[ -f "LARGE_FILES_REPORT.md" ] && echo "✅ LARGE_FILES_REPORT.md"
[ -f "COVERAGE_REPORT.md" ] && echo "✅ COVERAGE_REPORT.md"
[ -f "BUNDLE_MONITOR_REPORT.md" ] && echo "✅ BUNDLE_MONITOR_REPORT.md"
echo ""

echo "================================"
echo "✅ Report Review Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Review: $REVIEW_DIR/REPORT_SUMMARY.md"
echo "2. Read individual reports"
echo "3. Create execution backlog"
echo "4. Start executing improvements"

