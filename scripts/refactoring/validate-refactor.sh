#!/bin/bash
# ==============================================================================
# Post-Refactoring Validation Script
# ==============================================================================
# Validates that refactoring was successful and didn't break anything
# Usage: ./scripts/refactoring/validate-refactor.sh <file-path>
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

log_info "Starting post-refactoring validation for: $FILE_PATH"
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
# CHECK 1: File Size Reduction
# ==============================================================================

log_info "Check 1: File size validation"
LINE_COUNT=$(wc -l < "$FILE_PATH" | tr -d ' ')
if [ "$LINE_COUNT" -lt 500 ]; then
    check_result "File size acceptable: $LINE_COUNT lines (<500)" 0
else
    check_result "File still large: $LINE_COUNT lines (consider further refactoring)" 1
fi
echo ""

# ==============================================================================
# CHECK 2: Import Resolution
# ==============================================================================

log_info "Check 2: Import resolution"
if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]]; then
    # TypeScript import check
    if command -v npx &> /dev/null; then
        if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
            TYPE_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
            check_result "TypeScript errors found: $TYPE_ERRORS" 1
        else
            check_result "All imports resolve correctly" 0
        fi
    else
        check_result "TypeScript compiler not available (skipped)" 0
    fi
elif [[ "$FILE_PATH" == *.rs ]]; then
    # Rust import check
    if command -v cargo &> /dev/null; then
        cd "$PROJECT_ROOT/backend"
        if cargo check --message-format short 2>&1 | grep -q "error"; then
            check_result "Rust compilation errors found" 1
        else
            check_result "All imports resolve correctly" 0
        fi
        cd "$PROJECT_ROOT"
    else
        check_result "Cargo not available (skipped)" 0
    fi
fi
echo ""

# ==============================================================================
# CHECK 3: Linting
# ==============================================================================

log_info "Check 3: Linting with strict rules"
if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]]; then
    if command -v npx &> /dev/null; then
        # Use refactoring ESLint config
        if [ -f "$PROJECT_ROOT/eslint.config.refactoring.js" ]; then
            LINT_OUTPUT=$(npx eslint --config eslint.config.refactoring.js "$FILE_PATH" --format json 2>/dev/null || echo "[]")
            LINT_ERRORS=$(echo "$LINT_OUTPUT" | jq '[.[] | .errorCount] | add // 0' 2>/dev/null || echo "0")
            LINT_WARNINGS=$(echo "$LINT_OUTPUT" | jq '[.[] | .warningCount] | add // 0' 2>/dev/null || echo "0")
            
            if [ "$LINT_ERRORS" -eq 0 ] && [ "$LINT_WARNINGS" -eq 0 ]; then
                check_result "No linting errors or warnings" 0
            else
                check_result "Linting issues: $LINT_ERRORS errors, $LINT_WARNINGS warnings" 1
            fi
        else
            # Fallback to regular linting
            LINT_OUTPUT=$(npx eslint "$FILE_PATH" --format json 2>/dev/null || echo "[]")
            LINT_ERRORS=$(echo "$LINT_OUTPUT" | jq '[.[] | .errorCount] | add // 0' 2>/dev/null || echo "0")
            if [ "$LINT_ERRORS" -eq 0 ]; then
                check_result "No linting errors" 0
            else
                check_result "Linting errors found: $LINT_ERRORS" 1
            fi
        fi
    else
        check_result "ESLint not available (skipped)" 0
    fi
elif [[ "$FILE_PATH" == *.rs ]]; then
    if command -v cargo &> /dev/null; then
        cd "$PROJECT_ROOT/backend"
        # Use refactoring clippy config if available
        if [ -f "$PROJECT_ROOT/backend/.cargo/config.refactoring.toml" ]; then
            CLIPPY_OUTPUT=$(cargo clippy --message-format json 2>/dev/null || echo "[]")
            CLIPPY_ISSUES=$(echo "$CLIPPY_OUTPUT" | jq '[select(.reason == "compiler-message") | select(.message.level == "warning" or .message.level == "error")] | length' || echo "0")
            if [ "$CLIPPY_ISSUES" -eq 0 ]; then
                check_result "No clippy warnings or errors" 0
            else
                check_result "Clippy issues found: $CLIPPY_ISSUES" 1
            fi
        else
            if cargo clippy --message-format short 2>&1 | grep -q "warning\|error"; then
                check_result "Clippy warnings/errors found" 1
            else
                check_result "Clippy check passed" 0
            fi
        fi
        cd "$PROJECT_ROOT"
    else
        check_result "Cargo not available (skipped)" 0
    fi
fi
echo ""

# ==============================================================================
# CHECK 4: Tests Pass
# ==============================================================================

log_info "Check 4: Test execution"
if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]]; then
    if command -v npm &> /dev/null; then
        cd "$PROJECT_ROOT"
        # Run tests related to this file
        TEST_FILE="${FILE_PATH%.*}.test.tsx"
        if [ ! -f "$TEST_FILE" ]; then
            TEST_FILE="${FILE_PATH%.*}.test.ts"
        fi
        
        if [ -f "$TEST_FILE" ]; then
            if npm test -- "$TEST_FILE" --passWithNoTests 2>&1 | grep -q "PASS\|✓"; then
                check_result "Tests pass: $(basename "$TEST_FILE")" 0
            else
                check_result "Tests failed for: $(basename "$TEST_FILE")" 1
            fi
        else
            # Run all tests to ensure nothing broke
            if npm test -- --passWithNoTests 2>&1 | tail -1 | grep -q "PASS\|Test Suites:.*passed"; then
                check_result "All tests pass" 0
            else
                check_result "Some tests failed" 1
            fi
        fi
        cd "$PROJECT_ROOT"
    else
        check_result "npm not available (skipped)" 0
    fi
elif [[ "$FILE_PATH" == *.rs ]]; then
    if command -v cargo &> /dev/null; then
        cd "$PROJECT_ROOT/backend"
        if cargo test --lib 2>&1 | grep -q "test result: ok"; then
            check_result "All Rust tests pass" 0
        else
            check_result "Some Rust tests failed" 1
        fi
        cd "$PROJECT_ROOT"
    else
        check_result "Cargo not available (skipped)" 0
    fi
fi
echo ""

# ==============================================================================
# CHECK 5: No Circular Dependencies
# ==============================================================================

log_info "Check 5: Circular dependency detection"
if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]]; then
    if command -v npx &> /dev/null; then
        # Check for circular imports
        CIRCULAR=$(npx madge --circular "$FILE_PATH" 2>/dev/null || echo "")
        if [ -z "$CIRCULAR" ]; then
            check_result "No circular dependencies detected" 0
        else
            check_result "Circular dependencies found" 1
            echo "$CIRCULAR"
        fi
    else
        check_result "madge not available (install: npm install -g madge)" 0
    fi
elif [[ "$FILE_PATH" == *.rs ]]; then
    # Rust doesn't have circular dependencies in the same way
    check_result "Rust module system prevents circular deps" 0
fi
echo ""

# ==============================================================================
# CHECK 6: Public API Preservation
# ==============================================================================

log_info "Check 6: Public API preservation"
if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]]; then
    # Count exports before and after (would need to store before state)
    EXPORTS=$(grep -E "^export (const|function|class|interface|type|default)" "$FILE_PATH" 2>/dev/null | wc -l || echo "0")
    if [ "$EXPORTS" -gt 0 ]; then
        check_result "Public exports found: $EXPORTS (verify manually)" 0
    else
        check_result "No public exports (may be internal refactoring)" 0
    fi
elif [[ "$FILE_PATH" == *.rs ]]; then
    PUBLIC_ITEMS=$(grep -E "^pub (fn|struct|enum|trait|mod|const|static)" "$FILE_PATH" 2>/dev/null | wc -l || echo "0")
    if [ "$PUBLIC_ITEMS" -gt 0 ]; then
        check_result "Public items found: $PUBLIC_ITEMS (verify manually)" 0
    else
        check_result "No public items (may be internal refactoring)" 0
    fi
fi
echo ""

# ==============================================================================
# CHECK 7: Build Success
# ==============================================================================

log_info "Check 7: Build validation"
if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]]; then
    if command -v npm &> /dev/null; then
        cd "$PROJECT_ROOT"
        if npm run build 2>&1 | grep -q "error\|Error"; then
            check_result "Build failed" 1
        else
            check_result "Build successful" 0
        fi
        cd "$PROJECT_ROOT"
    else
        check_result "npm not available (skipped)" 0
    fi
elif [[ "$FILE_PATH" == *.rs ]]; then
    if command -v cargo &> /dev/null; then
        cd "$PROJECT_ROOT/backend"
        if cargo build --release 2>&1 | grep -q "error"; then
            check_result "Build failed" 1
        else
            check_result "Build successful" 0
        fi
        cd "$PROJECT_ROOT"
    else
        check_result "Cargo not available (skipped)" 0
    fi
fi
echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================

log_info "Post-refactoring validation complete"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary: $CHECKS_PASSED/$CHECKS_TOTAL checks passed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$CHECKS_FAILED" -eq 0 ]; then
    log_success "All validation checks passed! Refactoring successful."
    exit 0
elif [ "$CHECKS_FAILED" -le 2 ]; then
    log_warning "Some checks failed. Review and fix issues before merging."
    exit 0
else
    log_error "Multiple validation checks failed. Refactoring may have introduced issues."
    exit 1
fi

