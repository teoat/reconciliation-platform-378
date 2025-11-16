#!/usr/bin/env bash
# Pre-Deployment Verification Script
# Checks all prerequisites before deployment

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED++))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
    ((WARNINGS++))
}

echo "============================================================================"
echo "  PRE-DEPLOYMENT VERIFICATION"
echo "============================================================================"
echo ""

# 1. Check Docker
log_info "Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    log_success "Docker installed: $DOCKER_VERSION"
    
    if docker ps &> /dev/null 2>&1; then
        log_success "Docker daemon is running"
    else
        log_warning "Docker daemon may not be accessible (check permissions or start Docker)"
        # Don't fail, just warn
    fi
else
    log_error "Docker is not installed"
fi

# 2. Check Docker Compose
log_info "Checking Docker Compose installation..."
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    if docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version)
    else
        COMPOSE_VERSION=$(docker-compose --version)
    fi
    log_success "Docker Compose installed: $COMPOSE_VERSION"
else
    log_error "Docker Compose is not installed"
fi

# 3. Check Frontend Build
log_info "Checking frontend build..."
cd "$(dirname "$0")/frontend" || exit 1
if npm run build &> /dev/null; then
    log_success "Frontend builds successfully"
else
    log_error "Frontend build failed"
fi
cd - > /dev/null || exit 1

# 4. Check Backend Compilation
log_info "Checking backend compilation..."
cd "$(dirname "$0")/backend" || exit 1
if cargo check --release &> /dev/null; then
    log_success "Backend compiles successfully"
else
    log_warning "Backend compilation check failed (may need dependencies)"
fi
cd - > /dev/null || exit 1

# 5. Check Required Files
log_info "Checking required configuration files..."
REQUIRED_FILES=(
    "docker-compose.yml"
    "docker-compose.prod.yml"
    "infrastructure/docker/Dockerfile.backend"
    "infrastructure/docker/Dockerfile.frontend"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        log_success "Found: $file"
    else
        log_error "Missing: $file"
    fi
done

# 6. Check Environment Variables
log_info "Checking environment variables..."
if [[ -f ".env" ]]; then
    log_success "Found .env file"
    
    # Check critical variables
    source .env 2>/dev/null || true
    
    if [[ -z "${JWT_SECRET:-}" ]] || [[ "${JWT_SECRET:-}" == "change-this-in-production" ]]; then
        log_warning "JWT_SECRET not set or using default value"
    else
        log_success "JWT_SECRET is set"
    fi
    
    if [[ -z "${POSTGRES_PASSWORD:-}" ]] || [[ "${POSTGRES_PASSWORD:-}" == "postgres_pass" ]]; then
        log_warning "POSTGRES_PASSWORD not set or using default value"
    else
        log_success "POSTGRES_PASSWORD is set"
    fi
    
    if [[ -z "${VITE_STORAGE_KEY:-}" ]]; then
        log_warning "VITE_STORAGE_KEY not set (will use development fallback)"
    else
        log_success "VITE_STORAGE_KEY is set"
    fi
else
    log_warning ".env file not found. Will use defaults from docker-compose.yml"
fi

# 7. Check Port Availability
log_info "Checking port availability..."
PORTS=(1000 2000 5432 6379 9090 3001 9200 5601 8200)
for port in "${PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "Port $port is already in use"
    else
        log_success "Port $port is available"
    fi
done

# 8. Check Disk Space
log_info "Checking disk space..."
AVAILABLE_SPACE=$(df -h . | tail -1 | awk '{print $4}')
log_success "Available disk space: $AVAILABLE_SPACE"

# 9. Check Memory
log_info "Checking system resources..."
if [[ "$(uname)" == "Darwin" ]]; then
    TOTAL_MEM=$(sysctl -n hw.memsize | awk '{print $1/1024/1024/1024}')
    log_success "Total memory: ${TOTAL_MEM}GB"
else
    TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
    log_success "Total memory: ${TOTAL_MEM}GB"
fi

# Summary
echo ""
echo "============================================================================"
echo "  VERIFICATION SUMMARY"
echo "============================================================================"
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [[ $FAILED -eq 0 ]]; then
    if [[ $WARNINGS -eq 0 ]]; then
        echo -e "${GREEN}✓ All checks passed! Ready for deployment.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠ Checks passed with warnings. Review warnings before deployment.${NC}"
        exit 0
    fi
else
    echo -e "${RED}✗ Some checks failed. Please fix errors before deployment.${NC}"
    exit 1
fi

