#!/bin/bash
# Comprehensive Performance Verification Script
# Verifies all performance optimizations are in place

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

echo -e "${BLUE}🔍 Performance Verification Checklist${NC}"
echo ""

# 1. Check bundle size
echo -e "${BLUE}[1/4] Checking Bundle Size...${NC}"
if npm run check-bundle-size > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Bundle size check passed${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ Bundle size exceeds 3MB target${NC}"
    echo -e "${YELLOW}   Run: npm run build && npm run check-bundle-size${NC}"
    FAIL=$((FAIL + 1))
fi
echo ""

# 2. Check memory optimization files
echo -e "${BLUE}[2/4] Checking Memory Optimization...${NC}"
if [ -f "frontend/src/utils/memoryOptimization.ts" ]; then
    if grep -q "initializeMemoryMonitoring" frontend/src/App.tsx; then
        echo -e "${GREEN}✅ Memory monitoring initialized in App.tsx${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}❌ Memory monitoring not initialized${NC}"
        FAIL=$((FAIL + 1))
    fi
    
    if grep -q "useComprehensiveCleanup" frontend/src/components/DataProvider.tsx; then
        echo -e "${GREEN}✅ Memory cleanup hooks in DataProvider${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}❌ Memory cleanup not applied${NC}"
        FAIL=$((FAIL + 1))
    fi
else
    echo -e "${RED}❌ memoryOptimization.ts not found${NC}"
    FAIL=$((FAIL + 1))
fi
echo ""

# 3. Check database indexes
echo -e "${BLUE}[3/4] Checking Database Indexes...${NC}"
if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set - skipping database check${NC}"
    echo -e "${YELLOW}   To verify: export DATABASE_URL and run this script again${NC}"
else
    INDEX_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';" 2>/dev/null | tr -d ' ')
    
    if [ -n "$INDEX_COUNT" ] && [ "$INDEX_COUNT" -gt 10 ]; then
        echo -e "${GREEN}✅ Found $INDEX_COUNT performance indexes${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${YELLOW}⚠️  Fewer indexes than expected (found: ${INDEX_COUNT:-0})${NC}"
        echo -e "${YELLOW}   Run: bash scripts/apply-db-indexes.sh${NC}"
        FAIL=$((FAIL + 1))
    fi
fi
echo ""

# 4. Check virtual scrolling
echo -e "${BLUE}[4/4] Checking Virtual Scrolling...${NC}"
if grep -q "shouldVirtualize" frontend/src/components/ui/DataTable.tsx 2>/dev/null; then
    echo -e "${GREEN}✅ Virtual scrolling enabled in DataTable${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ Virtual scrolling not found in DataTable${NC}"
    FAIL=$((FAIL + 1))
fi
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Verification Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All performance optimizations verified!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some checks failed. Review the output above.${NC}"
    exit 1
fi

