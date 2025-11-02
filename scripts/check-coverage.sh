#!/bin/bash
# Test Coverage Check Script
# Checks test coverage for both backend and frontend

set -e

REPORT_FILE="COVERAGE_REPORT.md"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "📊 Checking Test Coverage..."
echo "Timestamp: $TIMESTAMP"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Thresholds
BACKEND_THRESHOLD=50
FRONTEND_THRESHOLD=50
TARGET_BACKEND=70
TARGET_FRONTEND=70

# Backend Coverage Check
echo "🔍 Checking Backend Coverage (Rust)..."
if [ -f "backend/coverage/cobertura.xml" ]; then
    BACKEND_COVERAGE=$(grep -oP 'line-rate="\K[0-9.]+' backend/coverage/cobertura.xml | head -1 || echo "0")
    BACKEND_COVERAGE_PCT=$(echo "$BACKEND_COVERAGE * 100" | bc | cut -d. -f1)
    
    if [ "$BACKEND_COVERAGE_PCT" -ge "$TARGET_BACKEND" ]; then
        echo -e "${GREEN}✅ Backend Coverage: ${BACKEND_COVERAGE_PCT}% (Target: ${TARGET_BACKEND}%)${NC}"
    elif [ "$BACKEND_COVERAGE_PCT" -ge "$BACKEND_THRESHOLD" ]; then
        echo -e "${YELLOW}⚠️  Backend Coverage: ${BACKEND_COVERAGE_PCT}% (Target: ${TARGET_BACKEND}%, Minimum: ${BACKEND_THRESHOLD}%)${NC}"
    else
        echo -e "${RED}❌ Backend Coverage: ${BACKEND_COVERAGE_PCT}% (Below minimum: ${BACKEND_THRESHOLD}%)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Backend coverage report not found. Run: cd backend && cargo tarpaulin${NC}"
    BACKEND_COVERAGE_PCT="0"
fi

echo ""

# Frontend Coverage Check
echo "🔍 Checking Frontend Coverage (TypeScript)..."
if [ -f "coverage/lcov.info" ] || [ -f "frontend/coverage/lcov.info" ]; then
    COVERAGE_FILE=""
    if [ -f "coverage/lcov.info" ]; then
        COVERAGE_FILE="coverage/lcov.info"
    elif [ -f "frontend/coverage/lcov.info" ]; then
        COVERAGE_FILE="frontend/coverage/lcov.info"
    fi
    
    if [ -n "$COVERAGE_FILE" ]; then
        FRONTEND_COVERAGE=$(grep -E "^LF:" "$COVERAGE_FILE" | awk -F: '{lines+=$2} END {print lines}')
        FRONTEND_HIT=$(grep -E "^LH:" "$COVERAGE_FILE" | awk -F: '{hit+=$2} END {print hit}')
        
        if [ "$FRONTEND_COVERAGE" -gt 0 ]; then
            FRONTEND_COVERAGE_PCT=$(echo "scale=0; $FRONTEND_HIT * 100 / $FRONTEND_COVERAGE" | bc)
        else
            FRONTEND_COVERAGE_PCT="0"
        fi
        
        if [ "$FRONTEND_COVERAGE_PCT" -ge "$TARGET_FRONTEND" ]; then
            echo -e "${GREEN}✅ Frontend Coverage: ${FRONTEND_COVERAGE_PCT}% (Target: ${TARGET_FRONTEND}%)${NC}"
        elif [ "$FRONTEND_COVERAGE_PCT" -ge "$FRONTEND_THRESHOLD" ]; then
            echo -e "${YELLOW}⚠️  Frontend Coverage: ${FRONTEND_COVERAGE_PCT}% (Target: ${TARGET_FRONTEND}%, Minimum: ${FRONTEND_THRESHOLD}%)${NC}"
        else
            echo -e "${RED}❌ Frontend Coverage: ${FRONTEND_COVERAGE_PCT}% (Below minimum: ${FRONTEND_THRESHOLD}%)${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Frontend coverage report not found. Run: npm run test:coverage${NC}"
    FRONTEND_COVERAGE_PCT="0"
fi

echo ""

# Generate Report
cat > "$REPORT_FILE" <<EOF
# Test Coverage Report

**Generated**: $TIMESTAMP

---

## Coverage Summary

| Component | Coverage | Status | Target | Minimum |
|-----------|----------|--------|--------|---------|
| **Backend (Rust)** | ${BACKEND_COVERAGE_PCT}% | $([ "$BACKEND_COVERAGE_PCT" -ge "$TARGET_BACKEND" ] && echo "✅" || [ "$BACKEND_COVERAGE_PCT" -ge "$BACKEND_THRESHOLD" ] && echo "⚠️" || echo "❌") | ${TARGET_BACKEND}% | ${BACKEND_THRESHOLD}% |
| **Frontend (TypeScript)** | ${FRONTEND_COVERAGE_PCT}% | $([ "$FRONTEND_COVERAGE_PCT" -ge "$TARGET_FRONTEND" ] && echo "✅" || [ "$FRONTEND_COVERAGE_PCT" -ge "$FRONTEND_THRESHOLD" ] && echo "⚠️" || echo "❌") | ${TARGET_FRONTEND}% | ${FRONTEND_THRESHOLD}% |
| **Overall** | TBD | ⚠️ | 70% | 50% |

---

## Recommendations

### Immediate Actions
EOF

if [ "$BACKEND_COVERAGE_PCT" -lt "$BACKEND_THRESHOLD" ]; then
    echo "- 🔴 **Backend coverage below minimum threshold**" >> "$REPORT_FILE"
    echo "  - Current: ${BACKEND_COVERAGE_PCT}%"
    echo "  - Target: ${TARGET_BACKEND}%"
    echo "  - Action: Increase unit test coverage for critical services" >> "$REPORT_FILE"
fi

if [ "$FRONTEND_COVERAGE_PCT" -lt "$FRONTEND_THRESHOLD" ]; then
    echo "- 🔴 **Frontend coverage below minimum threshold**" >> "$REPORT_FILE"
    echo "  - Current: ${FRONTEND_COVERAGE_PCT}%"
    echo "  - Target: ${TARGET_FRONTEND}%"
    echo "  - Action: Add tests for all components and services" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<EOF

### Short-term Goals (Next 4 weeks)
- [ ] Reach ${BACKEND_THRESHOLD}% backend coverage
- [ ] Reach ${FRONTEND_THRESHOLD}% frontend coverage
- [ ] Add integration tests for all API endpoints
- [ ] Add E2E tests for critical user flows

### Long-term Goals (Next 3 months)
- [ ] Reach ${TARGET_BACKEND}% backend coverage
- [ ] Reach ${TARGET_FRONTEND}% frontend coverage
- [ ] Achieve 70% overall coverage

---

## How to Generate Coverage Reports

### Backend
\`\`\`bash
cd backend
cargo install cargo-tarpaulin
cargo tarpaulin --out Html --output-dir coverage
\`\`\`

### Frontend
\`\`\`bash
npm run test:coverage
# or
cd frontend && npm run test:coverage
\`\`\`

---

**Report Generated**: $TIMESTAMP

EOF

echo "✅ Coverage report generated: $REPORT_FILE"

