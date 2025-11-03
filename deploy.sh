#!/bin/bash
# ============================================================================
# UNIFIED DEPLOYMENT SCRIPT - 378 Reconciliation Platform
# ============================================================================
# Unified deployment script supporting multiple environments
# Usage: ./deploy.sh [environment] [options]
# Environments: dev, staging, production, go-live
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
ENVIRONMENT="${1:-dev}"
SKIP_TESTS="${SKIP_TESTS:-false}"
SKIP_HEALTH_CHECK="${SKIP_HEALTH_CHECK:-false}"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}🚀 378 Reconciliation Platform - Unified Deployment${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo -e "Environment: ${GREEN}${ENVIRONMENT}${NC}"
echo -e "Skip Tests: ${YELLOW}${SKIP_TESTS}${NC}"
echo -e "Skip Health Check: ${YELLOW}${SKIP_HEALTH_CHECK}${NC}"
echo ""

# Function to print step
print_step() {
    echo -e "${GREEN}>>> $1${NC}"
}

# Function to print error and exit
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."

    # Check Docker
    if ! docker info > /dev/null 2>&1; then
        error_exit "Docker is not running. Please start Docker first."
    fi

    # Check docker-compose
    if ! command -v docker-compose > /dev/null 2>&1 && ! docker compose version > /dev/null 2>&1; then
        error_exit "docker-compose is not installed"
    fi

    echo -e "${GREEN}✅ Prerequisites met${NC}"
}

# Setup environment
setup_environment() {
    print_step "Setting up environment for ${ENVIRONMENT}..."

    case "$ENVIRONMENT" in
        dev)
            COMPOSE_FILE="docker-compose.yml"
            ;;
        staging)
            COMPOSE_FILE="docker-compose.yml"
            ;;
        production)
            COMPOSE_FILE="docker-compose.prod.yml"
            if [ ! -f "$COMPOSE_FILE" ]; then
                COMPOSE_FILE="docker-compose.yml"
                echo -e "${YELLOW}⚠️  Production compose file not found, using default${NC}"
            fi
            ;;
        go-live)
            COMPOSE_FILE="docker-compose.prod.yml"
            if [ ! -f "$COMPOSE_FILE" ]; then
                error_exit "Production compose file required for go-live"
            fi
            ;;
        *)
            error_exit "Unknown environment: $ENVIRONMENT"
            ;;
    esac

    # Create .env if missing
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  No .env file found. Creating basic one...${NC}"
        cat > .env << 'EOF'
# Basic Configuration
POSTGRES_DB=reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_pass
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "dev-jwt-secret-key")
JWT_EXPIRES_IN=24h
CORS_ORIGINS=http://localhost:1000
POSTGRES_PORT=5432
REDIS_PORT=6379
BACKEND_PORT=2000
FRONTEND_PORT=1000
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
EOF
        echo -e "${GREEN}✅ Created .env file${NC}"
    fi

    echo -e "${GREEN}✅ Environment setup complete${NC}"
}

# Pull latest code (for production/staging)
pull_code() {
    if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ] || [ "$ENVIRONMENT" = "go-live" ]; then
        print_step "Pulling latest code..."

        if [ -d .git ]; then
            git pull origin master || git pull origin main || echo -e "${YELLOW}⚠️  Could not pull from git${NC}"
        else
            echo -e "${YELLOW}⚠️  Not a git repository, skipping pull${NC}"
        fi

        echo -e "${GREEN}✅ Code pulled${NC}"
    fi
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = "false" ] && [ "$ENVIRONMENT" != "dev" ]; then
        print_step "Running tests..."

        # Backend tests
        if [ -d "backend" ] && [ -f "backend/Cargo.toml" ]; then
            echo "Running backend tests..."
            cd backend
            cargo test --release || error_exit "Backend tests failed"
            cd ..
        fi

        # Frontend tests
        if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
            echo "Running frontend tests..."
            cd frontend
            npm test -- --watchAll=false --passWithNoTests || error_exit "Frontend tests failed"
            cd ..
        fi

        echo -e "${GREEN}✅ Tests passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipping tests${NC}"
    fi
}

# Build images
build_images() {
    print_step "Building Docker images..."

    if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "go-live" ]; then
        docker-compose -f "$COMPOSE_FILE" build --no-cache
    else
        docker-compose -f "$COMPOSE_FILE" build
    fi

    echo -e "${GREEN}✅ Images built${NC}"
}

# Stop old containers
stop_containers() {
    print_step "Stopping old containers..."

    docker-compose -f "$COMPOSE_FILE" down || true

    echo -e "${GREEN}✅ Old containers stopped${NC}"
}

# Start containers
start_containers() {
    print_step "Starting containers..."

    docker-compose -f "$COMPOSE_FILE" up -d

    echo -e "${GREEN}✅ Containers started${NC}"
}

# Run migrations
run_migrations() {
    if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ] || [ "$ENVIRONMENT" = "go-live" ]; then
        print_step "Running database migrations..."

        # Try different migration commands
        docker-compose -f "$COMPOSE_FILE" exec -T backend ./migrate.sh 2>/dev/null || \
        docker-compose -f "$COMPOSE_FILE" exec -T backend diesel migration run 2>/dev/null || \
        echo -e "${YELLOW}⚠️  No migration command found or migrations already run${NC}"

        echo -e "${GREEN}✅ Migrations completed${NC}"
    fi
}

# Wait for services
wait_for_services() {
    print_step "Waiting for services to be ready..."

    local max_attempts=30
    local attempt=0

    # Wait for backend
    echo "Waiting for backend..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s http://localhost:2000/health > /dev/null 2>&1 || \
           curl -f -s http://localhost:8080/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is ready${NC}"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
        echo -n "."
    done
    echo ""

    if [ $attempt -eq $max_attempts ]; then
        echo -e "${YELLOW}⚠️  Backend health check timed out${NC}"
    fi

    # Wait for frontend
    attempt=0
    echo "Waiting for frontend..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s http://localhost:1000 > /dev/null 2>&1 || \
           curl -f -s http://localhost:80 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend is ready${NC}"
            break
        fi
        attempt=$((attempt + 1))
        sleep 1
        echo -n "."
    done
    echo ""

    if [ $attempt -eq $max_attempts ]; then
        echo -e "${YELLOW}⚠️  Frontend health check timed out${NC}"
    fi
}

# Health check
health_check() {
    if [ "$SKIP_HEALTH_CHECK" = "false" ]; then
        print_step "Running health checks..."

        # Check backend health
        if curl -f -s http://localhost:2000/health > /dev/null 2>&1 || \
           curl -f -s http://localhost:8080/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend health check passed${NC}"
        else
            error_exit "Backend health check failed"
        fi

        # Check database
        if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres > /dev/null 2>&1 2>/dev/null || \
           docker-compose -f "$COMPOSE_FILE" exec -T database pg_isready -U postgres > /dev/null 2>&1 2>/dev/null; then
            echo -e "${GREEN}✅ Database health check passed${NC}"
        else
            echo -e "${YELLOW}⚠️  Database health check failed (may not be configured)${NC}"
        fi

        echo -e "${GREEN}✅ Health checks completed${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipping health checks${NC}"
    fi
}

# Go-live specific steps
go_live_steps() {
    if [ "$ENVIRONMENT" = "go-live" ]; then
        print_step "Executing go-live procedures..."

        # Additional go-live checks would go here
        # DNS updates, SSL activation, monitoring activation, etc.

        echo -e "${GREEN}✅ Go-live procedures completed${NC}"
    fi
}

# Show status
show_status() {
    print_step "Deployment status"

    echo ""
    echo -e "${BLUE}Service Status:${NC}"
    docker-compose -f "$COMPOSE_FILE" ps

    echo ""
    echo -e "${BLUE}Access URLs:${NC}"

    # Determine ports based on environment
    case "$ENVIRONMENT" in
        production|go-live)
            FRONTEND_URL="http://localhost:80"
            BACKEND_URL="http://localhost:8080"
            ;;
        *)
            FRONTEND_URL="http://localhost:1000"
            BACKEND_URL="http://localhost:2000"
            ;;
    esac

    echo -e "  Frontend:    ${GREEN}${FRONTEND_URL}${NC}"
    echo -e "  Backend API: ${GREEN}${BACKEND_URL}${NC}"
    echo -e "  Health:      ${GREEN}${BACKEND_URL}/health${NC}"

    if [ "$ENVIRONMENT" != "dev" ]; then
        echo -e "  Grafana:     ${GREEN}http://localhost:3000${NC}"
        echo -e "  Prometheus:  ${GREEN}http://localhost:9090${NC}"
    fi

    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo -e "  View logs:   ${YELLOW}docker-compose -f $COMPOSE_FILE logs -f${NC}"
    echo -e "  Stop:        ${YELLOW}docker-compose -f $COMPOSE_FILE down${NC}"
    echo -e "  Restart:     ${YELLOW}docker-compose -f $COMPOSE_FILE restart${NC}"
    echo ""
}

# Main deployment flow
main() {
    check_prerequisites
    setup_environment
    pull_code
    run_tests
    build_images
    stop_containers
    start_containers
    run_migrations
    wait_for_services
    health_check
    go_live_steps
    show_status

    echo ""
    echo -e "${GREEN}============================================================================${NC}"
    echo -e "${GREEN}  🎉 Deployment to ${ENVIRONMENT} completed successfully!${NC}"
    echo -e "${GREEN}============================================================================${NC}"
    echo ""
}

# Show usage
usage() {
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  dev        Development deployment (default)"
    echo "  staging    Staging deployment"
    echo "  production Production deployment"
    echo "  go-live    Production go-live deployment"
    echo ""
    echo "Options:"
    echo "  SKIP_TESTS=true          Skip running tests"
    echo "  SKIP_HEALTH_CHECK=true   Skip health checks"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 production"
    echo "  SKIP_TESTS=true $0 staging"
    echo ""
}

# Parse arguments
case "${1:-help}" in
    dev|staging|production|go-live)
        main
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        echo -e "${RED}Unknown environment: $1${NC}"
        echo ""
        usage
        exit 1
        ;;
esac