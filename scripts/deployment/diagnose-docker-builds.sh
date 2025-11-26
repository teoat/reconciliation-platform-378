#!/bin/bash
# ==============================================================================
# Comprehensive Docker Build and Deployment Diagnostic Script
# ==============================================================================
# This script performs a complete diagnosis of Docker builds and deployments
# including validation, testing, and health verification
# ==============================================================================
# Usage:
#   ./scripts/deployment/diagnose-docker-builds.sh [--fix] [--deploy]
# ==============================================================================

set -euo pipefail

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

# Configuration
DIAGNOSTIC_REPORT="${DIAGNOSTIC_REPORT:-docker-diagnostic-report-$(date +%Y%m%d-%H%M%S).md}"
FIX_ISSUES="${FIX_ISSUES:-false}"
DEPLOY_SERVICES="${DEPLOY_SERVICES:-false}"
BUILD_MODE="${BUILD_MODE:-dev}"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --fix)
            FIX_ISSUES=true
            shift
            ;;
        --deploy)
            DEPLOY_SERVICES=true
            shift
            ;;
        --mode)
            BUILD_MODE="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Initialize report
init_report() {
    cat > "$DIAGNOSTIC_REPORT" <<EOF
# Docker Build and Deployment Diagnostic Report

**Generated:** $(date '+%Y-%m-%d %H:%M:%S')
**Mode:** $BUILD_MODE
**Fix Issues:** $FIX_ISSUES
**Deploy Services:** $DEPLOY_SERVICES

---

## Summary

EOF
}

# Add section to report
add_section() {
    local section="$1"
    echo "" >> "$DIAGNOSTIC_REPORT"
    echo "## $section" >> "$DIAGNOSTIC_REPORT"
    echo "" >> "$DIAGNOSTIC_REPORT"
}

# Add result to report
add_result() {
    local status="$1"
    local message="$2"
    local details="${3:-}"
    
    local icon="✅"
    if [ "$status" = "error" ]; then
        icon="❌"
    elif [ "$status" = "warning" ]; then
        icon="⚠️"
    fi
    
    echo "- $icon **$message**" >> "$DIAGNOSTIC_REPORT"
    if [ -n "$details" ]; then
        echo "  \`\`\`" >> "$DIAGNOSTIC_REPORT"
        echo "$details" >> "$DIAGNOSTIC_REPORT"
        echo "  \`\`\`" >> "$DIAGNOSTIC_REPORT"
    fi
}

# Check Docker installation
check_docker_installation() {
    log_info "Checking Docker installation..."
    add_section "Docker Installation"
    
    local errors=0
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        add_result "error" "Docker not installed" "Install Docker from https://docs.docker.com/get-docker/"
        errors=$((errors + 1))
    else
        local docker_version=$(docker --version)
        log_success "Docker installed: $docker_version"
        add_result "success" "Docker installed" "$docker_version"
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        add_result "error" "Docker Compose not installed" "Install Docker Compose or use 'docker compose'"
        errors=$((errors + 1))
    else
        local compose_version
        if command -v docker-compose &> /dev/null; then
            compose_version=$(docker-compose --version)
        else
            compose_version=$(docker compose version)
        fi
        log_success "Docker Compose installed: $compose_version"
        add_result "success" "Docker Compose installed" "$compose_version"
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        add_result "error" "Docker daemon not running" "Start Docker Desktop or Docker daemon"
        errors=$((errors + 1))
    else
        log_success "Docker daemon is running"
        add_result "success" "Docker daemon running" ""
    fi
    
    return $errors
}

# Validate Dockerfiles
validate_dockerfiles() {
    log_info "Validating Dockerfiles..."
    add_section "Dockerfile Validation"
    
    local errors=0
    local dockerfiles=(
        "infrastructure/docker/Dockerfile.backend"
        "infrastructure/docker/Dockerfile.frontend"
    )
    
    for dockerfile in "${dockerfiles[@]}"; do
        if [ ! -f "$dockerfile" ]; then
            log_error "Dockerfile not found: $dockerfile"
            add_result "error" "Missing Dockerfile" "$dockerfile"
            errors=$((errors + 1))
        else
            log_success "Found Dockerfile: $dockerfile"
            add_result "success" "Dockerfile exists" "$dockerfile"
            
            # Basic syntax check
            if docker build --dry-run -f "$dockerfile" . &> /dev/null 2>&1; then
                log_success "Dockerfile syntax valid: $dockerfile"
            else
                log_warning "Dockerfile syntax check failed: $dockerfile"
                add_result "warning" "Dockerfile syntax check" "$dockerfile"
            fi
        fi
    done
    
    # Check entrypoint script
    if [ ! -f "infrastructure/docker/entrypoint.sh" ]; then
        log_warning "Entrypoint script not found"
        add_result "warning" "Entrypoint script missing" "infrastructure/docker/entrypoint.sh"
    else
        if [ ! -x "infrastructure/docker/entrypoint.sh" ]; then
            log_warning "Entrypoint script is not executable"
            if [ "$FIX_ISSUES" = "true" ]; then
                chmod +x "infrastructure/docker/entrypoint.sh"
                log_success "Fixed: Made entrypoint script executable"
            fi
            add_result "warning" "Entrypoint not executable" "Run: chmod +x infrastructure/docker/entrypoint.sh"
        else
            log_success "Entrypoint script is executable"
            add_result "success" "Entrypoint script ready" ""
        fi
    fi
    
    return $errors
}

# Validate Docker Compose files
validate_compose_files() {
    log_info "Validating Docker Compose files..."
    add_section "Docker Compose Validation"
    
    local errors=0
    local compose_files=(
        "docker-compose.yml"
        "docker-compose.base.yml"
        "docker-compose.dev.yml"
    )
    
    local compose_cmd="docker-compose"
    if ! command -v docker-compose &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    for compose_file in "${compose_files[@]}"; do
        if [ ! -f "$compose_file" ]; then
            log_warning "Compose file not found: $compose_file"
            add_result "warning" "Compose file missing" "$compose_file"
        else
            log_info "Validating: $compose_file"
            if $compose_cmd -f "$compose_file" config &> /dev/null; then
                log_success "Valid compose file: $compose_file"
                add_result "success" "Valid compose file" "$compose_file"
            else
                log_error "Invalid compose file: $compose_file"
                local error_output=$($compose_cmd -f "$compose_file" config 2>&1 || true)
                add_result "error" "Invalid compose file" "$error_output"
                errors=$((errors + 1))
            fi
        fi
    done
    
    return $errors
}

# Check network setup
check_networks() {
    log_info "Checking Docker networks..."
    add_section "Network Configuration"
    
    local errors=0
    
    # Check if network exists
    local network_name="reconciliation-network"
    if [ "$BUILD_MODE" = "dev" ]; then
        network_name="reconciliation-network-dev"
    fi
    
    if docker network inspect "$network_name" &> /dev/null; then
        log_success "Network exists: $network_name"
        add_result "success" "Network exists" "$network_name"
    else
        log_warning "Network does not exist: $network_name"
        add_result "warning" "Network missing" "$network_name (will be created on deploy)"
    fi
    
    return $errors
}

# Check volumes
check_volumes() {
    log_info "Checking Docker volumes..."
    add_section "Volume Configuration"
    
    local errors=0
    local volumes=(
        "postgres_data"
        "redis_data"
        "uploads_data"
        "logs_data"
    )
    
    if [ "$BUILD_MODE" = "dev" ]; then
        volumes=(
            "postgres_data_dev"
            "redis_data_dev"
            "uploads_data_dev"
            "logs_data_dev"
        )
    fi
    
    for volume in "${volumes[@]}"; do
        if docker volume inspect "$volume" &> /dev/null; then
            local size=$(docker volume inspect "$volume" --format '{{ .Mountpoint }}' | xargs du -sh 2>/dev/null | awk '{print $1}' || echo "unknown")
            log_success "Volume exists: $volume ($size)"
            add_result "success" "Volume exists" "$volume ($size)"
        else
            log_info "Volume does not exist: $volume (will be created)"
            add_result "info" "Volume will be created" "$volume"
        fi
    done
    
    return $errors
}

# Test Docker builds
test_builds() {
    log_info "Testing Docker builds..."
    add_section "Build Testing"
    
    local errors=0
    local compose_cmd="docker-compose"
    if ! command -v docker-compose &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    local compose_file="docker-compose.yml"
    if [ "$BUILD_MODE" = "dev" ]; then
        compose_file="docker-compose.dev.yml"
    fi
    
    # Test backend build
    log_info "Building backend image..."
    if DOCKER_BUILDKIT=1 $compose_cmd -f "$compose_file" build --no-cache backend 2>&1 | tee /tmp/backend-build.log; then
        log_success "Backend build successful"
        add_result "success" "Backend build" "Build completed successfully"
    else
        log_error "Backend build failed"
        local build_errors=$(tail -20 /tmp/backend-build.log)
        add_result "error" "Backend build failed" "$build_errors"
        errors=$((errors + 1))
    fi
    
    # Test frontend build
    log_info "Building frontend image..."
    if DOCKER_BUILDKIT=1 $compose_cmd -f "$compose_file" build --no-cache frontend 2>&1 | tee /tmp/frontend-build.log; then
        log_success "Frontend build successful"
        add_result "success" "Frontend build" "Build completed successfully"
    else
        log_error "Frontend build failed"
        local build_errors=$(tail -20 /tmp/frontend-build.log)
        add_result "error" "Frontend build failed" "$build_errors"
        errors=$((errors + 1))
    fi
    
    return $errors
}

# Deploy services
deploy_services() {
    log_info "Deploying services..."
    add_section "Service Deployment"
    
    local errors=0
    local compose_cmd="docker-compose"
    if ! command -v docker-compose &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    local compose_file="docker-compose.yml"
    if [ "$BUILD_MODE" = "dev" ]; then
        compose_file="docker-compose.dev.yml"
    fi
    
    # Stop existing services
    log_info "Stopping existing services..."
    $compose_cmd -f "$compose_file" down 2>&1 || true
    
    # Start services
    log_info "Starting services..."
    if DOCKER_BUILDKIT=1 $compose_cmd -f "$compose_file" up -d 2>&1 | tee /tmp/deploy.log; then
        log_success "Services started"
        add_result "success" "Services deployed" "All services started"
        
        # Wait for services to be ready
        log_info "Waiting for services to be ready..."
        sleep 15
        
        # Check service status
        log_info "Checking service status..."
        $compose_cmd -f "$compose_file" ps >> "$DIAGNOSTIC_REPORT"
        echo "" >> "$DIAGNOSTIC_REPORT"
    else
        log_error "Service deployment failed"
        local deploy_errors=$(tail -30 /tmp/deploy.log)
        add_result "error" "Deployment failed" "$deploy_errors"
        errors=$((errors + 1))
    fi
    
    return $errors
}

# Check service health
check_service_health() {
    log_info "Checking service health..."
    add_section "Service Health Checks"
    
    local errors=0
    local compose_cmd="docker-compose"
    if ! command -v docker-compose &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    local compose_file="docker-compose.yml"
    if [ "$BUILD_MODE" = "dev" ]; then
        compose_file="docker-compose.dev.yml"
    fi
    
    # Check backend health
    log_info "Checking backend health..."
    sleep 5
    if curl -f -s http://localhost:2000/api/health &> /dev/null || \
       curl -f -s http://localhost:2000/health &> /dev/null; then
        log_success "Backend is healthy"
        add_result "success" "Backend health" "Health endpoint responding"
    else
        log_error "Backend health check failed"
        local backend_logs=$($compose_cmd -f "$compose_file" logs --tail=20 backend 2>&1 || true)
        add_result "error" "Backend unhealthy" "$backend_logs"
        errors=$((errors + 1))
    fi
    
    # Check frontend health
    log_info "Checking frontend health..."
    if curl -f -s http://localhost:1000/health &> /dev/null || \
       curl -f -s http://localhost:1000 &> /dev/null; then
        log_success "Frontend is healthy"
        add_result "success" "Frontend health" "Frontend responding"
    else
        log_error "Frontend health check failed"
        local frontend_logs=$($compose_cmd -f "$compose_file" logs --tail=20 frontend 2>&1 || true)
        add_result "error" "Frontend unhealthy" "$frontend_logs"
        errors=$((errors + 1))
    fi
    
    # Check database
    log_info "Checking database..."
    if $compose_cmd -f "$compose_file" exec -T postgres pg_isready -U postgres &> /dev/null; then
        log_success "Database is ready"
        add_result "success" "Database ready" "PostgreSQL is accepting connections"
    else
        log_warning "Database check failed (may need more time)"
        add_result "warning" "Database check" "PostgreSQL may still be starting"
    fi
    
    # Check Redis
    log_info "Checking Redis..."
    if $compose_cmd -f "$compose_file" exec -T redis redis-cli -a "${REDIS_PASSWORD:-redis_pass}" ping &> /dev/null; then
        log_success "Redis is ready"
        add_result "success" "Redis ready" "Redis is responding"
    else
        log_warning "Redis check failed (may need more time)"
        add_result "warning" "Redis check" "Redis may still be starting"
    fi
    
    return $errors
}

# Generate summary
generate_summary() {
    add_section "Summary"
    
    local compose_cmd="docker-compose"
    if ! command -v docker-compose &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    local compose_file="docker-compose.yml"
    if [ "$BUILD_MODE" = "dev" ]; then
        compose_file="docker-compose.dev.yml"
    fi
    
    echo "" >> "$DIAGNOSTIC_REPORT"
    echo "### Service Status" >> "$DIAGNOSTIC_REPORT"
    echo "\`\`\`" >> "$DIAGNOSTIC_REPORT"
    $compose_cmd -f "$compose_file" ps 2>&1 >> "$DIAGNOSTIC_REPORT" || true
    echo "\`\`\`" >> "$DIAGNOSTIC_REPORT"
    echo "" >> "$DIAGNOSTIC_REPORT"
    
    echo "### Next Steps" >> "$DIAGNOSTIC_REPORT"
    echo "" >> "$DIAGNOSTIC_REPORT"
    echo "1. Review the diagnostic report: \`$DIAGNOSTIC_REPORT\`" >> "$DIAGNOSTIC_REPORT"
    echo "2. Check service logs: \`$compose_cmd -f $compose_file logs\`" >> "$DIAGNOSTIC_REPORT"
    echo "3. Monitor services: \`$compose_cmd -f $compose_file ps\`" >> "$DIAGNOSTIC_REPORT"
    echo "" >> "$DIAGNOSTIC_REPORT"
}

# Main execution
main() {
    log_info "Starting comprehensive Docker diagnostic..."
    log_info "Report will be saved to: $DIAGNOSTIC_REPORT"
    
    init_report
    
    local total_errors=0
    
    # Run diagnostics
    check_docker_installation || total_errors=$((total_errors + $?))
    validate_dockerfiles || total_errors=$((total_errors + $?))
    validate_compose_files || total_errors=$((total_errors + $?))
    check_networks || total_errors=$((total_errors + $?))
    check_volumes || total_errors=$((total_errors + $?))
    
    # Test builds
    if [ "$DEPLOY_SERVICES" = "true" ] || [ "$total_errors" -eq 0 ]; then
        test_builds || total_errors=$((total_errors + $?))
        
        # Deploy if requested
        if [ "$DEPLOY_SERVICES" = "true" ]; then
            deploy_services || total_errors=$((total_errors + $?))
            check_service_health || total_errors=$((total_errors + $?))
        fi
    fi
    
    # Generate summary
    generate_summary
    
    # Final report
    log_info "Diagnostic complete. Report: $DIAGNOSTIC_REPORT"
    
    if [ $total_errors -eq 0 ]; then
        log_success "All checks passed!"
        echo "✅ All checks passed!" >> "$DIAGNOSTIC_REPORT"
        exit 0
    else
        log_error "Found $total_errors error(s). See report for details."
        echo "❌ Found $total_errors error(s)" >> "$DIAGNOSTIC_REPORT"
        exit 1
    fi
}

# Run main function
main "$@"

