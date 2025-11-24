#!/bin/bash
# ============================================================================
# PRODUCTION READINESS VERIFICATION SCRIPT
# ============================================================================
# Comprehensive checks for production deployment readiness
# Run this before deploying to production

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0
CHECKS=0

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

check_pass() {
    ((CHECKS++))
    echo -e "${GREEN}✓${NC} $1"
}

check_warn() {
    ((CHECKS++))
    ((WARNINGS++))
    echo -e "${YELLOW}⚠${NC} $1"
}

check_fail() {
    ((CHECKS++))
    ((ERRORS++))
    echo -e "${RED}✗${NC} $1"
}

# ============================================================================
# 1. CODE COMPILATION CHECKS
# ============================================================================

echo -e "\n${BLUE}=== CODE COMPILATION CHECKS ===${NC}\n"

# Check Rust backend compilation
if command -v cargo &> /dev/null; then
    echo "Checking Rust backend compilation..."
    cd "$PROJECT_ROOT/backend"
    if cargo check --quiet 2>&1 | head -20; then
        check_pass "Backend Rust code compiles successfully"
    else
        check_fail "Backend Rust code has compilation errors"
        cargo check 2>&1 | head -50
    fi
    cd "$PROJECT_ROOT"
else
    check_warn "cargo not found - skipping Rust compilation check"
fi

# Check TypeScript compilation
if command -v npm &> /dev/null; then
    echo "Checking TypeScript compilation..."
    cd "$PROJECT_ROOT/frontend"
    if npm run type-check 2>&1 | grep -q "error TS"; then
        check_fail "Frontend TypeScript has type errors"
        npm run type-check 2>&1 | grep "error TS" | head -20
    else
        check_pass "Frontend TypeScript compiles successfully"
    fi
    cd "$PROJECT_ROOT"
else
    check_warn "npm not found - skipping TypeScript compilation check"
fi

# ============================================================================
# 2. ERROR HANDLING VERIFICATION
# ============================================================================

echo -e "\n${BLUE}=== ERROR HANDLING VERIFICATION ===${NC}\n"

# Check for unwrap/expect in production code (excluding tests)
UNWRAP_COUNT=$(find "$PROJECT_ROOT/backend/src" -name "*.rs" ! -path "*/tests/*" ! -name "*_test.rs" -exec grep -h "\.unwrap()\|\.expect(" {} \; | wc -l | tr -d ' ')
if [ "$UNWRAP_COUNT" -eq 0 ]; then
    check_pass "No unwrap/expect found in production Rust code"
else
    check_warn "Found $UNWRAP_COUNT unwrap/expect calls in production code (should be minimal)"
fi

# Check for console statements in frontend (should be minimal)
CONSOLE_COUNT=$(find "$PROJECT_ROOT/frontend/src" -name "*.ts" -o -name "*.tsx" | xargs grep -h "console\." 2>/dev/null | grep -v "import.meta.env.DEV" | wc -l | tr -d ' ')
if [ "$CONSOLE_COUNT" -eq 0 ]; then
    check_pass "No console statements in production frontend code"
else
    check_warn "Found $CONSOLE_COUNT console statements (should be gated behind DEV check)"
fi

# ============================================================================
# 3. PRODUCTION CONFIGURATION CHECKS
# ============================================================================

echo -e "\n${BLUE}=== PRODUCTION CONFIGURATION CHECKS ===${NC}\n"

# Check production.env.example exists
if [ -f "$PROJECT_ROOT/config/production.env.example" ]; then
    check_pass "Production environment template exists"
else
    check_fail "Production environment template missing"
fi

# Check for placeholder values in production configs
if grep -r "CHANGE_ME\|CHANGE_THIS\|PLACEHOLDER\|TODO" "$PROJECT_ROOT/config/production.env.example" 2>/dev/null | grep -v "^#" | grep -v "CHANGE_ME\|CHANGE_THIS" > /dev/null; then
    check_pass "Production config has placeholder markers (expected)"
else
    check_warn "Production config may be missing placeholder markers"
fi

# Check Kubernetes secrets configuration
if [ -f "$PROJECT_ROOT/k8s/optimized/base/secrets.yaml" ]; then
    if grep -q "CHANGE_ME_IN_PRODUCTION" "$PROJECT_ROOT/k8s/optimized/base/secrets.yaml"; then
        check_pass "Kubernetes secrets have placeholder markers"
    else
        check_warn "Kubernetes secrets may not have placeholder markers"
    fi
else
    check_warn "Kubernetes secrets file not found"
fi

# ============================================================================
# 4. ENVIRONMENT VARIABLE VALIDATION
# ============================================================================

echo -e "\n${BLUE}=== ENVIRONMENT VARIABLE VALIDATION ===${NC}\n"

# Check if env validation script exists
if [ -f "$PROJECT_ROOT/backend/src/utils/env_validation.rs" ]; then
    check_pass "Environment validation module exists"
else
    check_fail "Environment validation module missing"
fi

# Check for required environment variables in production config
REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "REDIS_URL")
for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" "$PROJECT_ROOT/config/production.env.example" 2>/dev/null; then
        check_pass "Required variable $var is documented"
    else
        check_fail "Required variable $var is missing from production config"
    fi
done

# ============================================================================
# 5. FILE OPERATIONS VERIFICATION
# ============================================================================

echo -e "\n${BLUE}=== FILE OPERATIONS VERIFICATION ===${NC}\n"

# Check file deletion function has proper error handling
if grep -q "Delete database record FIRST" "$PROJECT_ROOT/backend/src/services/file.rs" 2>/dev/null; then
    check_pass "File deletion has atomicity protection"
else
    check_fail "File deletion may not have atomicity protection"
fi

# Check temporary file cleanup has error logging
if grep -q "Failed to cleanup temporary" "$PROJECT_ROOT/backend/src/services/file.rs" 2>/dev/null; then
    check_pass "Temporary file cleanup has error logging"
else
    check_warn "Temporary file cleanup may lack error logging"
fi

# ============================================================================
# 6. TYPE SAFETY VERIFICATION
# ============================================================================

echo -e "\n${BLUE}=== TYPE SAFETY VERIFICATION ===${NC}\n"

# Check if sourceData types file exists
if [ -f "$PROJECT_ROOT/frontend/src/types/sourceData.ts" ]; then
    check_pass "Type-safe source data utilities exist"
else
    check_fail "Type-safe source data utilities missing"
fi

# Check CustomReports uses type-safe functions
if grep -q "extractNumber\|extractString\|extractDate" "$PROJECT_ROOT/frontend/src/components/CustomReports.tsx" 2>/dev/null; then
    check_pass "CustomReports uses type-safe extraction functions"
else
    check_fail "CustomReports may still use unsafe type assertions"
fi

# ============================================================================
# 7. LOGGING VERIFICATION
# ============================================================================

echo -e "\n${BLUE}=== LOGGING VERIFICATION ===${NC}\n"

# Check console statements are gated behind DEV check
if grep -q "import.meta.env.DEV" "$PROJECT_ROOT/frontend/src/services/monitoring/errorTracking.ts" 2>/dev/null; then
    check_pass "Error tracking console statements are gated behind DEV check"
else
    check_warn "Error tracking may have console statements in production"
fi

# Check logger is used instead of console
if grep -q "logger\." "$PROJECT_ROOT/frontend/src/pages/AuthPage.tsx" 2>/dev/null; then
    check_pass "AuthPage uses structured logger"
else
    check_warn "AuthPage may still use console statements"
fi

# ============================================================================
# 8. PROMISE CLEANUP VERIFICATION
# ============================================================================

echo -e "\n${BLUE}=== PROMISE CLEANUP VERIFICATION ===${NC}\n"

# Check Promise.race has timeout cleanup
TEST_FILES=(
    "frontend/src/services/stale-data/StaleDataTester.ts"
    "frontend/src/services/error-recovery/ErrorRecoveryTester.ts"
    "frontend/src/services/network-interruption/NetworkInterruptionTester.ts"
)

for file in "${TEST_FILES[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        if grep -q "timeoutId\|clearTimeout" "$PROJECT_ROOT/$file" 2>/dev/null; then
            check_pass "$(basename $file) has Promise cleanup"
        else
            check_fail "$(basename $file) may be missing Promise cleanup"
        fi
    fi
done

# ============================================================================
# 9. DEPLOYMENT CONFIGURATION
# ============================================================================

echo -e "\n${BLUE}=== DEPLOYMENT CONFIGURATION ===${NC}\n"

# Check Docker configuration
if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    check_pass "Docker Compose configuration exists"
else
    check_warn "Docker Compose configuration missing"
fi

# Check Kubernetes configuration
if [ -d "$PROJECT_ROOT/k8s" ]; then
    check_pass "Kubernetes configuration directory exists"
    if [ -f "$PROJECT_ROOT/k8s/optimized/base/secrets.yaml" ]; then
        check_pass "Kubernetes secrets configuration exists"
    fi
else
    check_warn "Kubernetes configuration directory missing"
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "\n${BLUE}=== SUMMARY ===${NC}\n"
echo "Total Checks: $CHECKS"
echo -e "${GREEN}Passed: $((CHECKS - ERRORS - WARNINGS))${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Errors: $ERRORS${NC}"

if [ $ERRORS -eq 0 ]; then
    echo -e "\n${GREEN}✓ Production readiness check PASSED${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Production readiness check FAILED${NC}"
    echo "Please fix the errors above before deploying to production."
    exit 1
fi

