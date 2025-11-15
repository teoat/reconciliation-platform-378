#!/bin/bash
# Comprehensive Testing Script

set -e

echo "🧪 Running comprehensive tests..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Backend tests
echo -e "${GREEN}Running backend unit tests...${NC}"
cd backend
cargo test --lib --features test 2>&1 | tee ../reports/test-backend.log
BACKEND_RESULT=${PIPESTATUS[0]}

# Backend integration tests
echo -e "${GREEN}Running backend integration tests...${NC}"
cargo test --test '*' --features test 2>&1 | tee -a ../reports/test-backend.log
INTEGRATION_RESULT=${PIPESTATUS[0]}

cd ..

# Frontend tests
echo -e "${GREEN}Running frontend tests...${NC}"
cd frontend
npm test -- --run 2>&1 | tee ../reports/test-frontend.log
FRONTEND_RESULT=${PIPESTATUS[0]}
cd ..

# E2E tests
echo -e "${GREEN}Running E2E tests...${NC}"
docker-compose up -d
sleep 5
npm run test:e2e 2>&1 | tee reports/test-e2e.log
E2E_RESULT=${PIPESTATUS[0]}

# Summary
echo ""
echo -e "${YELLOW}Test Summary:${NC}"
echo -e "Backend Tests: $([ $BACKEND_RESULT -eq 0 ] && echo -e POSTGRES_USER:GREEN'✅ PASSED'${NC}" || echo -e "${RED}❌ FAILED${NC}")"
echo -e "Integration Tests: $([ $INTEGRATION_RESULT -eq 0 ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
echo -e "Frontend Tests: $([ $FRONTEND_RESULT -eq 0 ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
echo -e "E2E Tests: $([ $E2E_RESULT -eq 0 ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"

# Exit with failure if any test failed
if [ $BACKEND_RESULT -ne 0 ] || [ $INTEGRATION_RESULT -ne 0 ] || [ $FRONTEND_RESULT -ne 0 ] || [ $E2E_RESULT -ne 0 ]; then
    exit 1
fi

echo -e "${GREEN}✅ All tests passed!${NC}"

