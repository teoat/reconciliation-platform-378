#!/bin/bash
# Generate comprehensive test coverage report
# This script runs coverage for both backend and frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "📊 Generating comprehensive test coverage report..."

# Backend coverage
log_info "Backend coverage (Rust)..."
cd backend

if command -v cargo-tarpaulin &> /dev/null; then
    TESTING=true cargo tarpaulin --out Html --out Xml --output-dir ../coverage/backend 2>&1 | tee /tmp/backend-coverage.log || {
        log_warning "Backend coverage generation had issues, continuing..."
    }
    
    if [ -f "../coverage/backend/cobertura.xml" ]; then
        BACKEND_COVERAGE=$(grep -oP 'line-rate="\K[0-9.]+' ../coverage/backend/cobertura.xml | head -1 || echo "0")
        BACKEND_COVERAGE_PCT=$(echo "$BACKEND_COVERAGE * 100" | bc | cut -d. -f1)
        log_info "Backend coverage: ${BACKEND_COVERAGE_PCT}%"
        
        if [ "$BACKEND_COVERAGE_PCT" -ge 100 ]; then
            log_success "✅ Backend coverage: ${BACKEND_COVERAGE_PCT}% (Target: 100%)"
        else
            log_warning "⚠️  Backend coverage: ${BACKEND_COVERAGE_PCT}% (Target: 100%)"
        fi
    fi
else
    log_warning "⚠️  cargo-tarpaulin not installed. Install with: cargo install cargo-tarpaulin"
fi

cd ..

# Frontend coverage
log_info "Frontend coverage (TypeScript)..."
cd frontend

if npm run test:coverage 2>&1 | tee /tmp/frontend-coverage.log; then
    if [ -f "coverage/lcov.info" ]; then
        FRONTEND_COVERAGE=$(grep -oP '^LF:\K[0-9]+' coverage/lcov.info | head -1 || echo "0")
        FRONTEND_TOTAL=$(grep -oP '^LH:\K[0-9]+' coverage/lcov.info | head -1 || echo "0")
        
        if [ -n "$FRONTEND_COVERAGE" ] && [ -n "$FRONTEND_TOTAL" ] && [ "$FRONTEND_TOTAL" -gt 0 ]; then
            FRONTEND_COVERAGE_PCT=$(echo "scale=2; $FRONTEND_COVERAGE * 100 / $FRONTEND_TOTAL" | bc | cut -d. -f1)
            log_info "Frontend coverage: ${FRONTEND_COVERAGE_PCT}%"
            
            if [ "$FRONTEND_COVERAGE_PCT" -ge 100 ]; then
                log_success "✅ Frontend coverage: ${FRONTEND_COVERAGE_PCT}% (Target: 100%)"
            else
                log_warning "⚠️  Frontend coverage: ${FRONTEND_COVERAGE_PCT}% (Target: 100%)"
            fi
        fi
    fi
else
    log_warning "⚠️  Frontend coverage generation failed"
fi

cd ..

# Summary
log_info "📊 Coverage Summary:"
log_info "  Backend: ${BACKEND_COVERAGE_PCT:-0}%"
log_info "  Frontend: ${FRONTEND_COVERAGE_PCT:-0}%"

# Check if we've reached 100%
if [ "${BACKEND_COVERAGE_PCT:-0}" -ge 100 ] && [ "${FRONTEND_COVERAGE_PCT:-0}" -ge 100 ]; then
    log_success "🎉 100% coverage achieved for both backend and frontend!"
    exit 0
else
    log_warning "⚠️  Coverage below 100%. Continue adding tests."
    exit 0  # Don't fail, just warn
fi

