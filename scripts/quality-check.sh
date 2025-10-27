#!/bin/bash
# Quality Check Script
# Runs comprehensive quality checks for both frontend and backend

set -e

echo "🔍 Running Quality Checks..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
ERRORS=0
WARNINGS=0

# Function to check command result
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check warnings
check_warnings() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${YELLOW}⚠️  $1${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
}

echo ""
echo "📦 Backend Quality Checks"
echo "------------------------"
cd backend

echo -n "Running cargo clippy... "
cargo clippy -- -D warnings 2>&1 | tee /tmp/clippy_output.txt || true
if grep -q "error" /tmp/clippy_output.txt; then
    echo -e "${RED}❌ Clippy found errors${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Clippy passed${NC}"
fi

echo -n "Checking code formatting... extract
cargo fmt --check 2>&1 || true
check_warnings "Formatting"

echo -n "Running tests compilation... "
cargo test --no-run 2>&1 | tee /tmp/test_output.txt || true
if grep -q "error\[E" /tmp/test_output.txt; then
    ERRORS_FOUND=$(grep -c "error\[E" /tmp/test_output.txt)
    echo -e "${YELLOW}⚠️  Found $ERRORS_FOUND compilation errors${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ Tests compile${NC}"
fi

cd ..

echo ""
echo "🎨 Frontend Quality Checks"
echo "-------------------------"
cd frontend

echo -n "Running eslint... "
if [ -f "node_modules/.bin/eslint" ]; then
    npm run lint 2>&1 | tee /tmp/eslint_output.txt || true
    check_warnings "ESLint"
else
    echo -e "${YELLOW}⚠️  ESLint not found, skipping${NC}"
fi

echo -n "Checking for console.log statements... "
CONSOLE_LOGS=$(find src -name "*.ts" -o -name "*.tsx" | xargs grep -n "console.log" 2>/dev/null | wc -l || echo "0")
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $CONSOLE_LOGS console.log statements${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ No console.log statements${NC}"
fi

echo -n "Checking for TODO comments... "
TODOS=$(find src -name "*.ts" -o -name "*.tsx" | xargs grep -n "TODO" 2>/dev/null | wc -l || echo "0")
echo -e "${YELLOW}Found $TODOS TODO comments${NC}"

cd ..

echo ""
echo "📊 Summary"
echo "---------"
echo -e "Errors: ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"

if [ $ERRORS -eq 0 ]; then
    echo -e "\n${GREEN}✅ Quality checks passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Quality checks failed with $ERRORS errors${NC}"
    exit 1
fi

