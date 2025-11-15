#!/bin/bash
# Production Deployment Checklist
# Comprehensive pre-deployment verification for S-grade production readiness

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Production Deployment Checklist${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Section 1: Build & Bundle Verification
echo -e "${BLUE}[1/7] Build & Bundle Verification${NC}"
echo ""

# Check if npm/node is available
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}⚠️  npm not found - skipping build checks${NC}"
    echo -e "${YELLOW}   Install Node.js/npm to run build verification${NC}"
    WARN=$((WARN + 1))
else
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Build completed successfully${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}❌ Build failed${NC}"
        FAIL=$((FAIL + 1))
        echo -e "${YELLOW}   Fix build errors before deploying${NC}"
    fi

    # Check bundle size (only if build succeeded and bundle dir exists)
    if [ -d ".next/static/chunks" ] || [ -d "frontend/dist" ]; then
        if npm run check-bundle-size > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Bundle size within limits (<3MB)${NC}"
            PASS=$((PASS + 1))
        else
            echo -e "${RED}❌ Bundle size exceeds 3MB target${NC}"
            FAIL=$((FAIL + 1))
            echo -e "${YELLOW}   Run: npm run analyze-bundle to identify large chunks${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Bundle not found - run build first${NC}"
        WARN=$((WARN + 1))
    fi
fi
echo ""

# Section 2: Code Quality
echo -e "${BLUE}[2/7] Code Quality Checks${NC}"
echo ""

if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}⚠️  npm not found - skipping lint checks${NC}"
    WARN=$((WARN + 1))
else
    if npm run lint > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Linting passed${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}❌ Linting errors found${NC}"
        FAIL=$((FAIL + 1))
        echo -e "${YELLOW}   Run: npm run lint:fix${NC}"
    fi

    if npm run format:check > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Code formatting correct${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${YELLOW}⚠️  Formatting issues detected${NC}"
        WARN=$((WARN + 1))
        echo -e "${YELLOW}   Run: npm run format${NC}"
    fi
fi
echo ""

# Section 3: Tests
echo -e "${BLUE}[3/7] Test Verification${NC}"
echo ""

if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}⚠️  npm not found - skipping test checks${NC}"
    WARN=$((WARN + 1))
else
    if npm run test:ci > /dev/null 2>&1; then
        echo -e "${GREEN}✅ All tests passing${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}❌ Tests failing${NC}"
        FAIL=$((FAIL + 1))
        echo -e "${YELLOW}   Fix failing tests before deploying${NC}"
    fi
fi
echo ""

# Section 4: Performance Optimization
echo -e "${BLUE}[4/7] Performance Optimization Verification${NC}"
echo ""

# Check virtual scrolling
if grep -q "shouldVirtualize" frontend/src/components/ui/DataTable.tsx 2>/dev/null; then
    echo -e "${GREEN}✅ Virtual scrolling implemented${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ Virtual scrolling not found${NC}"
    FAIL=$((FAIL + 1))
fi

# Check memory optimization
if grep -q "initializeMemoryMonitoring" frontend/src/App.tsx 2>/dev/null; then
    echo -e "${GREEN}✅ Memory monitoring initialized${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ Memory monitoring not initialized${NC}"
    FAIL=$((FAIL + 1))
fi

# Check memory cleanup
if grep -q "useComprehensiveCleanup" frontend/src/components/DataProvider.tsx 2>/dev/null; then
    echo -e "${GREEN}✅ Memory cleanup hooks active${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ Memory cleanup not implemented${NC}"
    FAIL=$((FAIL + 1))
fi

# Check service worker
if [ -f "frontend/public/sw.js" ]; then
    echo -e "${GREEN}✅ Service worker exists${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${YELLOW}⚠️  Service worker not found${NC}"
    WARN=$((WARN + 1))
fi
echo ""

# Section 5: Database Optimization
echo -e "${BLUE}[5/7] Database Optimization${NC}"
echo ""

if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set - skipping database checks${NC}"
    echo -e "${YELLOW}   Set DATABASE_URL to verify database optimization${NC}"
    WARN=$((WARN + 1))
else
    # Check if migration file exists
    if [ -f "backend/migrations/20250102000000_add_performance_indexes.sql" ]; then
        echo -e "${GREEN}✅ Performance index migration file exists${NC}"
        PASS=$((PASS + 1))
        
        # Check if indexes are applied (sample check)
        INDEX_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';" 2>/dev/null | tr -d ' ' || echo "0")
        
        if [ -n "$INDEX_COUNT" ] && [ "$INDEX_COUNT" -gt 10 ]; then
            echo -e "${GREEN}✅ Performance indexes applied ($INDEX_COUNT indexes found)${NC}"
            PASS=$((PASS + 1))
        else
            echo -e "${YELLOW}⚠️  Fewer indexes than expected ($INDEX_COUNT found)${NC}"
            echo -e "${YELLOW}   Run: npm run db:apply-indexes${NC}"
            WARN=$((WARN + 1))
        fi
    else
        echo -e "${YELLOW}⚠️  Performance index migration file not found${NC}"
        WARN=$((WARN + 1))
    fi
fi
echo ""

# Section 6: Security Checks (Basic)
echo -e "${BLUE}[6/7] Security Checks (Basic)${NC}"
echo ""

# Check for console.log in production code
CONSOLE_LOGS=$(find frontend/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "console\.log" 2>/dev/null | wc -l | tr -d ' ')

if [ "$CONSOLE_LOGS" -eq 0 ]; then
    echo -e "${GREEN}✅ No console.log found in source code${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${YELLOW}⚠️  Found console.log in $CONSOLE_LOGS file(s)${NC}"
    echo -e "${YELLOW}   Consider: npm run remove-console-logs:replace${NC}"
    WARN=$((WARN + 1))
fi

# Check for .env files committed (excluding .env.example)
ENV_FILES=$(git ls-files | grep -E "\.env$|\.env\." | grep -v "\.env\.example" | grep -v "\.env\.template" || true)

if [ -n "$ENV_FILES" ]; then
    echo -e "${RED}❌ .env files detected in git${NC}"
    FAIL=$((FAIL + 1))
    echo -e "${YELLOW}   Remove .env files from git:${NC}"
    echo "$ENV_FILES" | while read -r file; do
        echo -e "${YELLOW}     git rm --cached $file${NC}"
    done
else
    echo -e "${GREEN}✅ No .env files in git (excluding examples)${NC}"
    PASS=$((PASS + 1))
fi
echo ""

# Section 7: Documentation & Configuration
echo -e "${BLUE}[7/7] Documentation & Configuration${NC}"
echo ""

# Check for README
if [ -f "README.md" ]; then
    echo -e "${GREEN}✅ README.md exists${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${YELLOW}⚠️  README.md not found${NC}"
    WARN=$((WARN + 1))
fi

# Check for performance documentation
if [ -f "PERFORMANCE-OPTIMIZATION-SUMMARY.md" ]; then
    echo -e "${GREEN}✅ Performance documentation exists${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${YELLOW}⚠️  Performance documentation not found${NC}"
    WARN=$((WARN + 1))
fi

# Check for quick reference
if [ -f "docs/QUICK-REFERENCE-COMMANDS.md" ]; then
    echo -e "${GREEN}✅ Quick reference documentation exists${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${YELLOW}⚠️  Quick reference not found${NC}"
    WARN=$((WARN + 1))
fi
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Deployment Readiness Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARN${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"
echo ""

TOTAL=$((PASS + WARN + FAIL))
PASS_PERCENT=$((PASS * 100 / TOTAL))

if [ $FAIL -eq 0 ] && [ $PASS_PERCENT -ge 80 ]; then
    echo -e "${GREEN}🎉 Production deployment ready!${NC}"
    echo -e "${GREEN}   Pass rate: ${PASS_PERCENT}%${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Review warnings above"
    echo "  2. Apply database indexes: npm run db:apply-indexes"
    echo "  3. Monitor metrics after deployment"
    echo ""
    exit 0
elif [ $FAIL -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Deployment ready with warnings${NC}"
    echo -e "${YELLOW}   Pass rate: ${PASS_PERCENT}%${NC}"
    echo ""
    echo -e "${BLUE}Review warnings above before deploying${NC}"
    exit 0
else
    echo -e "${RED}❌ Deployment not ready${NC}"
    echo -e "${RED}   Fix ${FAIL} critical issue(s) before deploying${NC}"
    echo ""
    echo -e "${BLUE}Critical issues must be fixed:${NC}"
    echo "  - Fix all failing checks above"
    echo "  - Re-run this checklist: bash scripts/production-deployment-checklist.sh"
    echo ""
    exit 1
fi

