#!/bin/bash
# ==============================================================================
# Unified Deployment Script
# ==============================================================================
# Deploy to any environment: dev, staging, or production
# Usage: ./deploy.sh --env <dev|staging|production> [OPTIONS]
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
source "$ROOT_DIR/scripts/lib/common-functions.sh"

# ==============================================================================
# Configuration
# ==============================================================================

# Default values
ENV="dev"
BUILD_ONLY=false
SKIP_TESTS=false
SKIP_HEALTH_CHECK=false
DRY_RUN=false
VERBOSE=false
COMPOSE_FILE=""
MAX_RETRIES=5
HEALTH_CHECK_TIMEOUT=60

# Environment-specific settings
declare -A ENV_CONFIG
ENV_CONFIG[dev_compose]="docker-compose.yml"
ENV_CONFIG[dev_node_env]="development"
ENV_CONFIG[dev_api_url]="http://localhost:2000"

ENV_CONFIG[staging_compose]="docker-compose.staging.yml"
ENV_CONFIG[staging_node_env]="production"
ENV_CONFIG[staging_api_url]="http://localhost:2000"

ENV_CONFIG[production_compose]="docker-compose.yml"
ENV_CONFIG[production_node_env]="production"
ENV_CONFIG[production_api_url]="${API_BASE_URL:-https://api.example.com}"

# ==============================================================================
# Help
# ==============================================================================

show_help() {
    cat << EOF
Unified Deployment Script for Reconciliation Platform

USAGE:
    $0 --env <environment> [OPTIONS]

ENVIRONMENTS:
    dev         Local development environment
    staging     Staging/QA environment
    production  Production environment

OPTIONS:
    -e, --env <env>         Target environment (required)
    -b, --build-only        Build images without starting containers
    -s, --skip-tests        Skip pre-deployment tests
    -n, --no-health-check   Skip health check after deployment
    -d, --dry-run           Show what would be done without executing
    -v, --verbose           Enable verbose output
    -h, --help              Show this help message

EXAMPLES:
    # Deploy to development
    $0 --env dev

    # Deploy to staging with verbose output
    $0 --env staging --verbose

    # Deploy to production (skip tests for hot-fixes)
    $0 --env production --skip-tests

    # Build images only
    $0 --env staging --build-only

EOF
}

# ==============================================================================
# Argument Parsing
# ==============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                ENV="$2"
                shift 2
                ;;
            -b|--build-only)
                BUILD_ONLY=true
                shift
                ;;
            -s|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -n|--no-health-check)
                SKIP_HEALTH_CHECK=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Validate environment
    case $ENV in
        dev|staging|production)
            ;;
        *)
            log_error "Invalid environment: $ENV. Must be one of: dev, staging, production"
            exit 1
            ;;
    esac
}

# ==============================================================================
# Pre-flight Checks
# ==============================================================================

preflight_checks() {
    log_info "Running pre-flight checks for $ENV environment..."
    
    # Check required commands
    check_command docker || exit 1
    check_docker || exit 1
    check_docker_compose || exit 1
    
    # Set compose file based on environment
    COMPOSE_FILE="${ROOT_DIR}/${ENV_CONFIG[${ENV}_compose]}"
    
    # Check compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        # Fallback to default docker-compose.yml
        COMPOSE_FILE="${ROOT_DIR}/docker-compose.yml"
        if [ ! -f "$COMPOSE_FILE" ]; then
            log_error "docker-compose file not found: $COMPOSE_FILE"
            exit 1
        fi
        log_warning "Using fallback compose file: $COMPOSE_FILE"
    fi
    
    # Check .env file for production
    if [ "$ENV" = "production" ]; then
        if [ ! -f "${ROOT_DIR}/.env" ]; then
            log_error ".env file required for production deployment"
            exit 1
        fi
        
        # Verify required secrets for production
        local REQUIRED_SECRETS=("JWT_SECRET" "DATABASE_URL")
        local MISSING_SECRETS=()
        
        for secret in "${REQUIRED_SECRETS[@]}"; do
            if [ -z "${!secret:-}" ]; then
                # Try loading from .env
                if grep -q "^${secret}=" "${ROOT_DIR}/.env" 2>/dev/null; then
                    continue
                fi
                MISSING_SECRETS+=("$secret")
            fi
        done
        
        if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
            log_error "Missing required secrets for production: ${MISSING_SECRETS[*]}"
            exit 1
        fi
    fi
    
    log_success "Pre-flight checks passed ✓"
}

# ==============================================================================
# Build
# ==============================================================================

build_images() {
    log_info "Building images for $ENV environment..."
    
    local build_args=""
    if [ "$VERBOSE" = true ]; then
        build_args="--progress=plain"
    fi
    
    # Enable BuildKit for faster builds
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would run: docker compose -f $COMPOSE_FILE build $build_args"
        return 0
    fi
    
    if docker compose -f "$COMPOSE_FILE" build $build_args; then
        log_success "Build completed ✓"
    else
        log_error "Build failed"
        exit 1
    fi
}

# ==============================================================================
# Deploy
# ==============================================================================

deploy() {
    log_info "Deploying to $ENV environment..."
    
    # Set environment variables
    export ENVIRONMENT="$ENV"
    export NODE_ENV="${ENV_CONFIG[${ENV}_node_env]}"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would run: docker compose -f $COMPOSE_FILE up -d"
        return 0
    fi
    
    # Start services
    if docker compose -f "$COMPOSE_FILE" up -d; then
        log_success "Services started ✓"
    else
        log_error "Failed to start services"
        exit 1
    fi
    
    # Wait for services
    log_info "Waiting for services to be ready..."
    sleep 10
}

# ==============================================================================
# Health Check
# ==============================================================================

run_health_check() {
    if [ "$SKIP_HEALTH_CHECK" = true ]; then
        log_warning "Skipping health check"
        return 0
    fi
    
    local api_url="${ENV_CONFIG[${ENV}_api_url]}"
    local health_url="${api_url}/health"
    
    if [ "$ENV" = "dev" ] || [ "$ENV" = "staging" ]; then
        health_url="http://localhost:2000/health"
    fi
    
    log_info "Performing health check at $health_url..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would check: $health_url"
        return 0
    fi
    
    local attempt=1
    while [ $attempt -le $MAX_RETRIES ]; do
        if curl -sf "$health_url" > /dev/null 2>&1; then
            log_success "Health check passed ✓"
            return 0
        fi
        
        log_info "Health check attempt $attempt/$MAX_RETRIES failed, retrying..."
        sleep 5
        ((attempt++))
    done
    
    log_error "Health check failed after $MAX_RETRIES attempts"
    log_warning "Consider rolling back with: docker compose -f $COMPOSE_FILE down"
    exit 1
}

# ==============================================================================
# Run Tests (Pre-deployment)
# ==============================================================================

run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log_warning "Skipping pre-deployment tests"
        return 0
    fi
    
    if [ "$ENV" = "production" ]; then
        log_info "Running pre-deployment validation for production..."
        
        if [ "$DRY_RUN" = true ]; then
            log_info "[DRY-RUN] Would run validation scripts"
            return 0
        fi
        
        # Run database migrations check
        if [ -f "${ROOT_DIR}/scripts/execute-migrations.sh" ]; then
            log_info "Verifying database migrations..."
            if ! "${ROOT_DIR}/scripts/execute-migrations.sh"; then
                log_error "Database migration check failed"
                exit 1
            fi
        fi
    fi
    
    log_success "Pre-deployment validation passed ✓"
}

# ==============================================================================
# Status
# ==============================================================================

show_status() {
    log_info "Deployment Status:"
    echo ""
    
    docker compose -f "$COMPOSE_FILE" ps
    
    echo ""
    log_info "Quick Links:"
    echo "  Backend:   http://localhost:2000/health"
    echo "  Frontend:  http://localhost:1000"
    if [ "$ENV" != "dev" ]; then
        echo "  Grafana:   http://localhost:3001"
        echo "  Prometheus: http://localhost:9090"
    fi
}

# ==============================================================================
# Main
# ==============================================================================

main() {
    echo "═══════════════════════════════════════════════════════════════"
    echo "   Reconciliation Platform - Unified Deployment"
    echo "   Environment: $ENV"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    
    cd "$ROOT_DIR"
    
    # Pre-flight
    preflight_checks
    
    # Run tests
    run_tests
    
    # Build
    build_images
    
    if [ "$BUILD_ONLY" = true ]; then
        log_success "Build completed. Skipping deployment (--build-only specified)"
        exit 0
    fi
    
    # Deploy
    deploy
    
    # Health check
    run_health_check
    
    # Show status
    show_status
    
    echo ""
    log_success "🚀 Deployment to $ENV completed successfully!"
    
    if [ "$ENV" = "production" ]; then
        log_info "Monitor deployment at:"
        log_info "  - Health: ${ENV_CONFIG[${ENV}_api_url]}/health"
        log_info "  - Metrics: ${ENV_CONFIG[${ENV}_api_url]}/api/metrics/summary"
    fi
}

# ==============================================================================
# Entry Point
# ==============================================================================

parse_args "$@"
main
