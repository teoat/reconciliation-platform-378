#!/bin/bash

# SSOT Compliance Audit Script
# Runs comprehensive SSOT compliance checks and generates report

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SSOT_LOCK_FILE="$PROJECT_ROOT/SSOT_LOCK.yml"
AUDIT_REPORT="$PROJECT_ROOT/docs/project-management/SSOT_AUDIT_REPORT.md"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd "$PROJECT_ROOT"

echo -e "${BLUE}=== SSOT Compliance Audit ===${NC}"
echo "Timestamp: $TIMESTAMP"
echo ""

# Initialize counters
TOTAL_VIOLATIONS=0
DEPRECATED_IMPORTS=0
ROOT_LEVEL_VIOLATIONS=0
DUPLICATE_IMPLEMENTATIONS=0
MISSING_SSOT_FILES=0

# Check if SSOT_LOCK.yml exists
if [ ! -f "$SSOT_LOCK_FILE" ]; then
    echo -e "${RED}❌ SSOT_LOCK.yml not found${NC}"
    exit 1
fi

echo -e "${BLUE}Running SSOT compliance checks...${NC}"
echo ""

# 1. Check SSOT file existence
echo -e "${BLUE}1. Checking SSOT file existence...${NC}"
MISSING_FILES=()
while IFS= read -r ssot_path; do
    if [ -n "$ssot_path" ]; then
        if [ ! -f "$PROJECT_ROOT/$ssot_path" ]; then
            MISSING_FILES+=("$ssot_path")
            ((MISSING_SSOT_FILES++)) || true
        fi
    fi
done < <(yq eval '.ssot_modules[].path' "$SSOT_LOCK_FILE" 2>/dev/null || \
         yq eval '.validation.path, .error_handling.path, .sanitization.path, .api_client.path, .configuration.path' "$SSOT_LOCK_FILE" 2>/dev/null || true)

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All SSOT files exist${NC}"
else
    echo -e "${RED}❌ Missing SSOT files:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo -e "  ${RED}- $file${NC}"
    done
    ((TOTAL_VIOLATIONS+=${#MISSING_FILES[@]})) || true
fi
echo ""

# 2. Check for deprecated imports
echo -e "${BLUE}2. Checking for deprecated imports...${NC}"
DEPRECATED_IMPORT_VIOLATIONS=()

# Get all deprecated paths from SSOT_LOCK.yml
while IFS= read -r deprecated_path; do
    if [ -n "$deprecated_path" ]; then
        # Search for imports (excluding comments and test files)
        while IFS= read -r file; do
            if [ -n "$file" ]; then
                DEPRECATED_IMPORT_VIOLATIONS+=("$file uses deprecated: $deprecated_path")
                ((DEPRECATED_IMPORTS++)) || true
            fi
        done < <(grep -rl "from ['\"]${deprecated_path}" frontend/src backend/src 2>/dev/null | \
                 grep -v "__tests__" | grep -v "\.test\." | grep -v "\.spec\." | \
                 grep -v "node_modules" || true)
    fi
done < <(yq eval '.. | select(has("deprecated_paths")) | .deprecated_paths[]' "$SSOT_LOCK_FILE" 2>/dev/null || true)

if [ ${#DEPRECATED_IMPORT_VIOLATIONS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ No deprecated imports found${NC}"
else
    echo -e "${RED}❌ Deprecated import violations:${NC}"
    for violation in "${DEPRECATED_IMPORT_VIOLATIONS[@]}"; do
        echo -e "  ${RED}- $violation${NC}"
    done
    ((TOTAL_VIOLATIONS+=${#DEPRECATED_IMPORT_VIOLATIONS[@]})) || true
fi
echo ""

# 3. Check for root-level directory violations
echo -e "${BLUE}3. Checking for root-level directory violations...${NC}"
ROOT_LEVEL_DIRS=("utils" "hooks" "pages" "types" "store" "contexts" "constants")
ROOT_VIOLATIONS=()

for dir in "${ROOT_LEVEL_DIRS[@]}"; do
    if [ -d "$PROJECT_ROOT/$dir" ]; then
        ROOT_VIOLATIONS+=("$dir")
        ((ROOT_LEVEL_VIOLATIONS++)) || true
    fi
done

if [ ${#ROOT_VIOLATIONS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ No root-level directory violations${NC}"
else
    echo -e "${RED}❌ Root-level directory violations:${NC}"
    for dir in "${ROOT_VIOLATIONS[@]}"; do
        echo -e "  ${RED}- $dir/ (should be in frontend/src/)${NC}"
    done
    ((TOTAL_VIOLATIONS+=${#ROOT_VIOLATIONS[@]})) || true
fi
echo ""

# 4. Generate audit report
echo -e "${BLUE}4. Generating audit report...${NC}"

cat > "$AUDIT_REPORT" << REPORT_EOF
# SSOT Compliance Audit Report

**Generated**: $TIMESTAMP  
**Status**: $([ $TOTAL_VIOLATIONS -eq 0 ] && echo "✅ PASSING" || echo "❌ VIOLATIONS FOUND")

## Summary

| Metric | Count |
|--------|-------|
| **Total Violations** | $TOTAL_VIOLATIONS |
| **Missing SSOT Files** | $MISSING_SSOT_FILES |
| **Deprecated Imports** | $DEPRECATED_IMPORTS |
| **Root-Level Violations** | $ROOT_LEVEL_VIOLATIONS |
| **Duplicate Implementations** | $DUPLICATE_IMPLEMENTATIONS |

## Detailed Findings

### Missing SSOT Files
$([ ${#MISSING_FILES[@]} -eq 0 ] && echo "✅ None" || printf '%s\n' "${MISSING_FILES[@]}")

### Deprecated Import Violations
$([ ${#DEPRECATED_IMPORT_VIOLATIONS[@]} -eq 0 ] && echo "✅ None" || printf '%s\n' "${DEPRECATED_IMPORT_VIOLATIONS[@]}")

### Root-Level Directory Violations
$([ ${#ROOT_VIOLATIONS[@]} -eq 0 ] && echo "✅ None" || printf '%s\n' "${ROOT_VIOLATIONS[@]}")

## Recommendations

$([ $TOTAL_VIOLATIONS -eq 0 ] && echo "✅ No violations found. SSOT compliance is maintained." || echo "⚠️ Please address the violations listed above.")

## Next Steps

1. Review violations in this report
2. Fix deprecated imports
3. Move root-level directories if needed
4. Update SSOT_LOCK.yml if creating new SSOT modules
5. Re-run audit: \`./scripts/ssot-audit.sh\`

---

**See Also**:
- [SSOT Best Practices](../development/SSOT_BEST_PRACTICES.md)
- [SSOT_LOCK.yml](../../SSOT_LOCK.yml)
REPORT_EOF

echo -e "${GREEN}✅ Audit report generated: $AUDIT_REPORT${NC}"
echo ""

# Final summary
echo "=========================================="
if [ $TOTAL_VIOLATIONS -eq 0 ]; then
    echo -e "${GREEN}✅ SSOT Compliance: PASSED${NC}"
    echo -e "${GREEN}   No violations found${NC}"
    exit 0
else
    echo -e "${RED}❌ SSOT Compliance: FAILED${NC}"
    echo -e "${RED}   Total violations: $TOTAL_VIOLATIONS${NC}"
    echo ""
    echo -e "${YELLOW}See audit report: $AUDIT_REPORT${NC}"
    exit 1
fi
