#!/bin/bash
# Quick Test Runner for Agents
# Simple script to run tests quickly with clear output

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}🧪 Quick Test Runner${NC}"
echo "===================="
echo ""

# Parse arguments
TEST_TYPE="${1:-all}"
VERBOSE="${2:-}"

run_backend_tests() {
    echo -e "${BLUE}Running backend tests...${NC}"
    cd "$PROJECT_ROOT/backend"
    
    if [ -n "$VERBOSE" ]; then
        cargo test --lib -- --nocapture
    else
        cargo test --lib 2>&1 | grep -E "(test|running|passed|failed)" || true
    fi
    
    local result=${PIPESTATUS[0]}
    if [ $result -eq 0 ]; then
        echo -e "${GREEN}✅ Backend tests passed${NC}"
    else
        echo -e "${RED}❌ Backend tests failed${NC}"
    fi
    return $result
}

run_frontend_tests() {
    echo -e "${BLUE}Running frontend tests...${NC}"
    cd "$PROJECT_ROOT/frontend"
    
    if [ -n "$VERBOSE" ]; then
        npm test -- --run
    else
        npm test -- --run --reporter=verbose 2>&1 | head -50
    fi
    
    local result=${PIPESTATUS[0]}
    if [ $result -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend tests passed${NC}"
    else
        echo -e "${RED}❌ Frontend tests failed${NC}"
    fi
    return $result
}

run_e2e_tests() {
    echo -e "${BLUE}Running E2E tests...${NC}"
    cd "$PROJECT_ROOT"
    
    # Check if Playwright is installed
    if ! command -v npx &> /dev/null; then
        echo -e "${YELLOW}⚠️  npx not found. Skipping E2E tests.${NC}"
        return 0
    fi
    
    # Check if browsers are installed
    if [ ! -d "node_modules/.cache/ms-playwright" ]; then
        echo -e "${YELLOW}⚠️  Playwright browsers not installed. Run: npx playwright install${NC}"
        return 0
    fi
    
    if [ -n "$VERBOSE" ]; then
        npm run test:e2e
    else
        npm run test:e2e 2>&1 | tail -30
    fi
    
    local result=${PIPESTATUS[0]}
    if [ $result -eq 0 ]; then
        echo -e "${GREEN}✅ E2E tests passed${NC}"
    else
        echo -e "${RED}❌ E2E tests failed${NC}"
    fi
    return $result
}

# Main execution
cd "$PROJECT_ROOT"

case "$TEST_TYPE" in
    backend|rust)
        run_backend_tests
        ;;
    frontend|ts|typescript)
        run_frontend_tests
        ;;
    e2e|playwright)
        run_e2e_tests
        ;;
    all)
        echo -e "${YELLOW}Running all tests...${NC}"
        echo ""
        
        BACKEND_RESULT=0
        FRONTEND_RESULT=0
        E2E_RESULT=0
        
        run_backend_tests || BACKEND_RESULT=$?
        echo ""
        
        run_frontend_tests || FRONTEND_RESULT=$?
        echo ""
        
        run_e2e_tests || E2E_RESULT=$?
        echo ""
        
        # Summary
        echo -e "${BLUE}📊 Test Summary${NC}"
        echo "=============="
        [ $BACKEND_RESULT -eq 0 ] && echo -e "Backend: ${GREEN}✅ PASSED${NC}" || echo -e "Backend: ${RED}❌ FAILED${NC}"
        [ $FRONTEND_RESULT -eq 0 ] && echo -e "Frontend: ${GREEN}✅ PASSED${NC}" || echo -e "Frontend: ${RED}❌ FAILED${NC}"
        [ $E2E_RESULT -eq 0 ] && echo -e "E2E: ${GREEN}✅ PASSED${NC}" || echo -e "E2E: ${RED}❌ FAILED${NC}"
        
        if [ $BACKEND_RESULT -eq 0 ] && [ $FRONTEND_RESULT -eq 0 ] && [ $E2E_RESULT -eq 0 ]; then
            echo ""
            echo -e "${GREEN}🎉 All tests passed!${NC}"
            exit 0
        else
            echo ""
            echo -e "${RED}⚠️  Some tests failed. See output above.${NC}"
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 [backend|frontend|e2e|all] [verbose]"
        echo ""
        echo "Examples:"
        echo "  $0 backend        # Run backend tests only"
        echo "  $0 frontend       # Run frontend tests only"
        echo "  $0 e2e            # Run E2E tests only"
        echo "  $0 all            # Run all tests (default)"
        echo "  $0 all verbose    # Run all tests with verbose output"
        exit 1
        ;;
esac





