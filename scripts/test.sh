#!/bin/bash
# ============================================================================
# UNIFIED TEST SCRIPT - 378 Reconciliation Platform
# ============================================================================
# Comprehensive testing script with multiple test modes
# Usage: ./test.sh [mode] [options]
# Modes: all, backend, frontend, e2e, services, mcp
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
MODE="${1:-all}"
SKIP_SERVICES="${SKIP_SERVICES:-false}"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}🧪 378 Reconciliation Platform - Unified Testing${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo -e "Test Mode: ${GREEN}${MODE}${NC}"
echo -e "Skip Services: ${YELLOW}${SKIP_SERVICES}${NC}"
echo ""

# Results tracking
BACKEND_RESULT=0
FRONTEND_RESULT=0
E2E_RESULT=0
SERVICES_RESULT=0
MCP_RESULT=0

# Function to print step
print_step() {
    echo -e "${GREEN}>>> $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Backend tests
run_backend_tests() {
    if [ -d "backend" ] && [ -f "backend/Cargo.toml" ]; then
        print_step "Running backend tests..."

        cd backend

        # Unit tests
        echo "Running unit tests..."
        if cargo test --lib --features test 2>&1; then
            print_success "Backend unit tests passed"
        else
            print_error "Backend unit tests failed"
            BACKEND_RESULT=1
        fi

        # Integration tests
        echo "Running integration tests..."
        if cargo test --test '*' --features test 2>&1; then
            print_success "Backend integration tests passed"
        else
            print_error "Backend integration tests failed"
            BACKEND_RESULT=1
        fi

        cd ..
    else
        echo -e "${YELLOW}⚠️  Backend directory or Cargo.toml not found, skipping backend tests${NC}"
    fi
}

# Frontend tests
run_frontend_tests() {
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_step "Running frontend tests..."

        cd frontend

        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            echo "Installing frontend dependencies..."
            npm install
        fi

        # Run tests
        echo "Running React tests..."
        if npm test -- --watchAll=false --passWithNoTests 2>&1; then
            print_success "Frontend tests passed"
        else
            print_error "Frontend tests failed"
            FRONTEND_RESULT=1
        fi

        cd ..
    else
        echo -e "${YELLOW}⚠️  Frontend directory or package.json not found, skipping frontend tests${NC}"
    fi
}

# E2E tests
run_e2e_tests() {
    print_step "Running E2E tests..."

    # Check if docker-compose is available
    if [ -f "docker-compose.yml" ]; then
        echo "Starting services for E2E tests..."
        docker-compose up -d

        # Wait for services
        echo "Waiting for services to be ready..."
        sleep 15

        # Check if services are running
        if curl -f -s http://localhost:2000/health > /dev/null 2>&1; then
            echo "Services are ready, running E2E tests..."

            # Run E2E tests (assuming playwright or similar)
            if [ -d "e2e" ] && [ -f "package.json" ]; then
                if npm run test:e2e 2>&1; then
                    print_success "E2E tests passed"
                else
                    print_error "E2E tests failed"
                    E2E_RESULT=1
                fi
            else
                echo -e "${YELLOW}⚠️  E2E test setup not found, skipping${NC}"
            fi
        else
            print_error "Services failed to start for E2E tests"
            E2E_RESULT=1
        fi

        # Stop services
        docker-compose down
    else
        echo -e "${YELLOW}⚠️  docker-compose.yml not found, skipping E2E tests${NC}"
    fi
}

# Services tests
run_services_tests() {
    if [ "$SKIP_SERVICES" = "false" ]; then
        print_step "Running services tests..."

        # Check if docker-compose is available
        if [ -f "docker-compose.yml" ]; then
            echo "Starting services for testing..."
            docker-compose up -d postgres redis

            # Wait for services
            echo "Waiting for database and Redis..."
            sleep 10

            # Test PostgreSQL
            echo "Testing PostgreSQL..."
            if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1 2>/dev/null || \
               docker-compose exec -T database pg_isready -U postgres > /dev/null 2>&1 2>/dev/null; then
                print_success "PostgreSQL is healthy"
            else
                print_error "PostgreSQL health check failed"
                SERVICES_RESULT=1
            fi

            # Test Redis
            echo "Testing Redis..."
            if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1 2>/dev/null; then
                print_success "Redis is healthy"
            else
                print_error "Redis health check failed"
                SERVICES_RESULT=1
            fi

            # Stop services
            docker-compose down
        else
            echo -e "${YELLOW}⚠️  docker-compose.yml not found, skipping services tests${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipping services tests${NC}"
    fi
}

# MCP server tests
run_mcp_tests() {
    if [ -d "mcp-server" ]; then
        print_step "Running MCP server tests..."

        cd mcp-server

        # Check if dist/index.js exists
        if [ ! -f "dist/index.js" ]; then
            echo "Building MCP server..."
            if [ -f "package.json" ]; then
                npm run build 2>&1 || {
                    print_error "Failed to build MCP server"
                    MCP_RESULT=1
                    cd ..
                    return
                }
            else
                print_error "MCP server package.json not found"
                MCP_RESULT=1
                cd ..
                return
            fi
        fi

        # Create .env if missing
        if [ ! -f ".env" ]; then
            echo "Creating MCP .env file..."
            cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app
REDIS_URL=redis://:redis_pass@localhost:6379
PROJECT_ROOT=../
BACKEND_URL=http://localhost:2000
EOF
        fi

        # Test startup (timeout after 5 seconds)
        echo "Testing MCP server startup..."
        if timeout 5 node dist/index.js > /dev/null 2>&1; then
            print_success "MCP server started successfully"
        else
            print_error "MCP server failed to start"
            MCP_RESULT=1
        fi

        cd ..
    else
        echo -e "${YELLOW}⚠️  MCP server directory not found, skipping MCP tests${NC}"
    fi
}

# Run all tests
run_all_tests() {
    run_backend_tests
    run_frontend_tests
    run_services_tests
    run_e2e_tests
    run_mcp_tests
}

# Show test summary
show_summary() {
    echo ""
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}Test Summary${NC}"
    echo -e "${BLUE}============================================================================${NC}"

    echo -e "Backend Tests:    $([ $BACKEND_RESULT -eq 0 ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
    echo -e "Frontend Tests:   $([ $FRONTEND_RESULT -eq 0 ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
    echo -e "Services Tests:   $([ $SERVICES_RESULT -eq 0 ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
    echo -e "E2E Tests:        $([ $E2E_RESULT -eq 0 ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
    echo -e "MCP Tests:        $([ $MCP_RESULT -eq 0 ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
    echo ""
}

# Main logic
case "$MODE" in
    all)
        run_all_tests
        ;;
    backend)
        run_backend_tests
        ;;
    frontend)
        run_frontend_tests
        ;;
    e2e)
        run_e2e_tests
        ;;
    services)
        run_services_tests
        ;;
    mcp)
        run_mcp_tests
        ;;
    *)
        echo -e "${RED}Unknown test mode: $MODE${NC}"
        echo "Usage: $0 [mode] [options]"
        echo ""
        echo "Modes:"
        echo "  all       Run all tests (default)"
        echo "  backend   Run backend tests only"
        echo "  frontend  Run frontend tests only"
        echo "  e2e       Run E2E tests only"
        echo "  services  Run services tests only"
        echo "  mcp       Run MCP server tests only"
        echo ""
        echo "Options:"
        echo "  SKIP_SERVICES=true   Skip services tests"
        echo ""
        echo "Examples:"
        echo "  $0 all"
        echo "  $0 backend"
        echo "  SKIP_SERVICES=true $0 all"
        exit 1
        ;;
esac

# Show summary
show_summary

# Exit with failure if any test failed
if [ $BACKEND_RESULT -ne 0 ] || [ $FRONTEND_RESULT -ne 0 ] || [ $E2E_RESULT -ne 0 ] || [ $SERVICES_RESULT -ne 0 ] || [ $MCP_RESULT -ne 0 ]; then
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All tests passed!${NC}"
fi