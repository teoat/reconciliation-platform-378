#!/bin/bash
# ==============================================================================
# Pre-Refactoring Validation Script
# ==============================================================================
# Validates that a file is safe to refactor before starting
# Usage: ./scripts/refactoring/pre-refactor-check.sh <file-path>
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ==============================================================================
# CONFIGURATION
# ==============================================================================

FILE_PATH="${1:-}"
if [ -z "$FILE_PATH" ]; then
    log_error "Usage: $0 <file-path>"
    exit 1
fi

# Resolve absolute path
if [[ "$FILE_PATH" != /* ]]; then
    FILE_PATH="$PROJECT_ROOT/$FILE_PATH"
fi

if [ ! -f "$FILE_PATH" ]; then
    log_error "File not found: $FILE_PATH"
    exit 1
fi

OUTPUT_DIR="$PROJECT_ROOT/.refactoring"
mkdir -p "$OUTPUT_DIR"

# ==============================================================================
# VALIDATION CHECKS
# ==============================================================================

log_info "Starting pre-refactoring validation for: $FILE_PATH"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_TOTAL=0

check_result() {
    local check_name="$1"
    local passed="$2"
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    if [ "$passed" -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $check_name"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $check_name"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
}

# ==============================================================================
# CHECK 1: File Size
# ==============================================================================

log_info "Check 1: File size validation"
LINE_COUNT=$(wc -l < "$FILE_PATH" | tr -d ' ')
if [ "$LINE_COUNT" -gt 500 ]; then
    check_result "File is large (>500 lines): $LINE_COUNT lines" 0
else
    check_result "File size acceptable: $LINE_COUNT lines" 0
fi
echo ""

# ==============================================================================
# CHECK 2: Dependency Analysis
# ==============================================================================

log_info "Check 2: Dependency analysis"
DEPENDENCY_MAP="$OUTPUT_DIR/$(basename "$FILE_PATH").dependencies.json"

if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]]; then
    # TypeScript dependency analysis
    log_info "Analyzing TypeScript dependencies..."
    
    # Find all imports from this file
    IMPORTED_BY=$(grep -r "from.*$(basename "$FILE_PATH" .ts)" "$PROJECT_ROOT/frontend/src" 2>/dev/null | wc -l || echo "0")
    
    # Find all exports
    EXPORTS=$(grep -E "^export (const|function|class|interface|type)" "$FILE_PATH" 2>/dev/null | wc -l || echo "0")
    
    echo "  - Files importing from this file: $IMPORTED_BY"
    echo "  - Public exports: $EXPORTS"
    
    check_result "Dependency analysis complete" 0
elif [[ "$FILE_PATH" == *.rs ]]; then
    # Rust dependency analysis
    log_info "Analyzing Rust dependencies..."
    
    # Find all uses of this module
    MODULE_NAME=$(basename "$FILE_PATH" .rs)
    USED_BY=$(grep -r "use.*::$MODULE_NAME" "$PROJECT_ROOT/backend/src" 2>/dev/null | wc -l || echo "0")
    
    # Find all public items
    PUBLIC_ITEMS=$(grep -E "^pub (fn|struct|enum|trait|mod|const|static)" "$FILE_PATH" 2>/dev/null | wc -l || echo "0")
    
    echo "  - Modules using this module: $USED_BY"
    echo "  - Public items: $PUBLIC_ITEMS"
    
    check_result "Dependency analysis complete" 0
fi
echo ""

# ==============================================================================
# CHECK 3: Test Coverage
# ==============================================================================

log_info "Check 3: Test coverage"
if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]]; then
    # Check if test file exists
    TEST_FILE="${FILE_PATH%.*}.test.tsx"
    if [ ! -f "$TEST_FILE" ]; then
        TEST_FILE="${FILE_PATH%.*}.test.ts"
    fi
    
    if [ -f "$TEST_FILE" ]; then
        check_result "Test file exists: $(basename "$TEST_FILE")" 0
    else
        check_result "No test file found (recommended for medium-risk refactoring)" 1
    fi
elif [[ "$FILE_PATH" == *.rs ]]; then
    # Check for tests in same file or separate test file
    if grep -q "#\[cfg(test)\]" "$FILE_PATH" || grep -q "#\[test\]" "$FILE_PATH"; then
        check_result "Tests found in file" 0
    else
        check_result "No tests found (recommended for medium-risk refactoring)" 1
    fi
fi
echo ""

# ==============================================================================
# CHECK 4: Linting Status
# ==============================================================================

log_info "Check 4: Linting status"
if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]]; then
    if command -v npx &> /dev/null; then
        LINT_OUTPUT=$(npx eslint "$FILE_PATH" --format json 2>/dev/null || echo "[]")
        LINT_ERRORS=$(echo "$LINT_OUTPUT" | jq '[.[] | .errorCount] | add // 0' 2>/dev/null || echo "0")
        LINT_WARNINGS=$(echo "$LINT_OUTPUT" | jq '[.[] | .warningCount] | add // 0' 2>/dev/null || echo "0")
        
        if [ "$LINT_ERRORS" -eq 0 ] && [ "$LINT_WARNINGS" -eq 0 ]; then
            check_result "No linting errors or warnings" 0
        else
            check_result "Linting issues: $LINT_ERRORS errors, $LINT_WARNINGS warnings" 1
        fi
    else
        check_result "ESLint not available (skipped)" 0
    fi
elif [[ "$FILE_PATH" == *.rs ]]; then
    if command -v cargo &> /dev/null; then
        cd "$PROJECT_ROOT/backend"
        if cargo clippy --message-format json 2>/dev/null | jq -e '.reason == "compiler-message"' > /dev/null 2>&1; then
            CLIPPY_ISSUES=$(cargo clippy --message-format json 2>/dev/null | jq '[select(.reason == "compiler-message") | select(.message.level == "warning" or .message.level == "error")] | length' || echo "0")
            if [ "$CLIPPY_ISSUES" -eq 0 ]; then
                check_result "No clippy warnings or errors" 0
            else
                check_result "Clippy issues found: $CLIPPY_ISSUES" 1
            fi
        else
            check_result "Clippy check passed" 0
        fi
        cd "$PROJECT_ROOT"
    else
        check_result "Cargo not available (skipped)" 0
    fi
fi
echo ""

# ==============================================================================
# CHECK 5: Type Checking
# ==============================================================================

log_info "Check 5: Type checking"
if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]]; then
    if command -v npx &> /dev/null; then
        if npx tsc --noEmit "$FILE_PATH" 2>/dev/null; then
            check_result "TypeScript type checking passed" 0
        else
            check_result "TypeScript type errors found" 1
        fi
    else
        check_result "TypeScript compiler not available (skipped)" 0
    fi
elif [[ "$FILE_PATH" == *.rs ]]; then
    if command -v cargo &> /dev/null; then
        cd "$PROJECT_ROOT/backend"
        if cargo check --message-format short 2>&1 | grep -q "error"; then
            check_result "Rust compilation errors found" 1
        else
            check_result "Rust compilation passed" 0
        fi
        cd "$PROJECT_ROOT"
    else
        check_result "Cargo not available (skipped)" 0
    fi
fi
echo ""

# ==============================================================================
# CHECK 6: Git Status
# ==============================================================================

log_info "Check 6: Git status"
if command -v git &> /dev/null; then
    cd "$PROJECT_ROOT"
    if git diff --quiet "$FILE_PATH" 2>/dev/null; then
        check_result "File is committed (safe to refactor)" 0
    else
        check_result "File has uncommitted changes (commit first)" 1
    fi
    
    # Check if backup branch exists
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    if [[ "$CURRENT_BRANCH" == refactor/* ]]; then
        check_result "On refactoring branch: $CURRENT_BRANCH" 0
    else
        check_result "Not on refactoring branch (create: git checkout -b refactor/$(basename "$FILE_PATH" .ts))" 1
    fi
    cd "$PROJECT_ROOT"
else
    check_result "Git not available (skipped)" 0
fi
echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================

log_info "Pre-refactoring validation complete"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary: $CHECKS_PASSED/$CHECKS_TOTAL checks passed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$CHECKS_FAILED" -eq 0 ]; then
    log_success "All checks passed! Safe to proceed with refactoring."
    exit 0
elif [ "$CHECKS_FAILED" -le 2 ]; then
    log_warning "Some checks failed, but refactoring can proceed with caution."
    exit 0
else
    log_error "Multiple checks failed. Please fix issues before refactoring."
    exit 1
fi


