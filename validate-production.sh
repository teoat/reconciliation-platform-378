#!/bin/bash
# Production Validation Script
# Comprehensive validation of production readiness

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
PROJECT_ROOT="/Users/Arief/Desktop/Reconciliation"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT"
ERRORS=0
WARNINGS=0

# Validation functions
validate_file_exists() {
    local file=$1
    local description=$2
    if [ -f "$file" ]; then
        log_success "✓ $description: $file"
        return 0
    else
        log_error "✗ $description: $file"
        ((ERRORS++))
        return 1
    fi
}

validate_directory_exists() {
    local dir=$1
    local description=$2
    if [ -d "$dir" ]; then
        log_success "✓ $description: $dir"
        return 0
    else
        log_error "✗ $description: $dir"
        ((ERRORS++))
        return 1
    fi
}

validate_command() {
    local cmd=$1
    local description=$2
    if command -v "$cmd" &> /dev/null; then
        log_success "✓ $description: $cmd"
        return 0
    else
        log_error "✗ $description: $cmd"
        ((ERRORS++))
        return 1
    fi
}

validate_port() {
    local port=$1
    local service=$2
    if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_success "✓ $service port $port is available"
        return 0
    else
        log_warning "⚠ $service port $port is in use"
        ((WARNINGS++))
        return 1
    fi
}

validate_env_var() {
    local var=$1
    local file=$2
    if grep -q "^$var=" "$file" 2>/dev/null; then
        log_success "✓ Environment variable $var is set"
        return 0
    else
        log_error "✗ Environment variable $var is missing"
        ((ERRORS++))
        return 1
    fi
}

# Main validation
log_info "Starting Production Validation"
log_info "Project Root: $PROJECT_ROOT"

# 1. Prerequisites Validation
log_info "1. Validating Prerequisites"
validate_command "node" "Node.js"
validate_command "npm" "npm"
validate_command "psql" "PostgreSQL client"
validate_command "redis-cli" "Redis client"

# Check versions
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    log_success "✓ Node.js version: $(node --version)"
else
    log_error "✗ Node.js version too old: $(node --version) (required: 18+)"
    ((ERRORS++))
fi

# 2. Project Structure Validation
log_info "2. Validating Project Structure"
validate_directory_exists "$PROJECT_ROOT" "Project root directory"
validate_directory_exists "$BACKEND_DIR" "Backend directory"
validate_directory_exists "$FRONTEND_DIR" "Frontend directory"
validate_directory_exists "$BACKEND_DIR/src" "Backend source directory"
validate_directory_exists "$FRONTEND_DIR/app" "Frontend app directory"

# 3. Configuration Files Validation
log_info "3. Validating Configuration Files"
validate_file_exists "$BACKEND_DIR/package.json" "Backend package.json"
validate_file_exists "$FRONTEND_DIR/package.json" "Frontend package.json"
validate_file_exists "$BACKEND_DIR/tsconfig.json" "Backend TypeScript config"
validate_file_exists "$FRONTEND_DIR/tsconfig.json" "Frontend TypeScript config"
validate_file_exists "$BACKEND_DIR/Dockerfile" "Backend Dockerfile"
validate_file_exists "$BACKEND_DIR/docker-compose.yml" "Backend docker-compose.yml"

# 4. Environment Configuration Validation
log_info "4. Validating Environment Configuration"
if [ -f "$BACKEND_DIR/.env" ]; then
    log_success "✓ Backend .env file exists"
    validate_env_var "NODE_ENV" "$BACKEND_DIR/.env"
    validate_env_var "PORT" "$BACKEND_DIR/.env"
    validate_env_var "DATABASE_URL" "$BACKEND_DIR/.env"
    validate_env_var "JWT_SECRET" "$BACKEND_DIR/.env"
else
    log_error "✗ Backend .env file missing"
    ((ERRORS++))
fi

if [ -f "$FRONTEND_DIR/.env.local" ]; then
    log_success "✓ Frontend .env.local file exists"
else
    log_warning "⚠ Frontend .env.local file missing"
    ((WARNINGS++))
fi

# 5. Dependencies Validation
log_info "5. Validating Dependencies"
if [ -d "$BACKEND_DIR/node_modules" ]; then
    log_success "✓ Backend dependencies installed"
else
    log_error "✗ Backend dependencies not installed"
    ((ERRORS++))
fi

if [ -d "$FRONTEND_DIR/node_modules" ]; then
    log_success "✓ Frontend dependencies installed"
else
    log_error "✗ Frontend dependencies not installed"
    ((ERRORS++))
fi

# 6. Build Validation
log_info "6. Validating Build Artifacts"
if [ -d "$BACKEND_DIR/dist" ]; then
    log_success "✓ Backend build directory exists"
    validate_file_exists "$BACKEND_DIR/dist/server.js" "Backend compiled server"
else
    log_error "✗ Backend build directory missing"
    ((ERRORS++))
fi

if [ -d "$FRONTEND_DIR/.next" ]; then
    log_success "✓ Frontend build directory exists"
else
    log_error "✗ Frontend build directory missing"
    ((ERRORS++))
fi

# 7. Database Validation
log_info "7. Validating Database"
if pg_isready -q; then
    log_success "✓ PostgreSQL is running"
    
    # Check if database exists
    if psql -lqt | cut -d \| -f 1 | grep -qw "reconciliation_app"; then
        log_success "✓ Database 'reconciliation_app' exists"
    else
        log_error "✗ Database 'reconciliation_app' does not exist"
        ((ERRORS++))
    fi
else
    log_error "✗ PostgreSQL is not running"
    ((ERRORS++))
fi

# 8. Redis Validation
log_info "8. Validating Redis"
if redis-cli ping >/dev/null 2>&1; then
    log_success "✓ Redis is running"
else
    log_warning "⚠ Redis is not running (optional)"
    ((WARNINGS++))
fi

# 9. Port Validation
log_info "9. Validating Ports"
validate_port 3001 "Backend"
validate_port 1000 "Frontend"

# 10. Security Validation
log_info "10. Validating Security Configuration"
if [ -f "$BACKEND_DIR/.env" ]; then
    # Check for weak secrets
    if grep -q "your.*secret.*key" "$BACKEND_DIR/.env"; then
        log_error "✗ Default secret keys detected - please change them"
        ((ERRORS++))
    else
        log_success "✓ Secret keys appear to be customized"
    fi
    
    # Check for production environment
    if grep -q "NODE_ENV=production" "$BACKEND_DIR/.env"; then
        log_success "✓ NODE_ENV set to production"
    else
        log_warning "⚠ NODE_ENV not set to production"
        ((WARNINGS++))
    fi
fi

# 11. Scripts Validation
log_info "11. Validating Production Scripts"
validate_file_exists "$PROJECT_ROOT/setup-production.sh" "Production setup script"
validate_file_exists "$PROJECT_ROOT/start-production.sh" "Production start script"
validate_file_exists "$PROJECT_ROOT/stop-production.sh" "Production stop script"

# Check script permissions
if [ -x "$PROJECT_ROOT/setup-production.sh" ]; then
    log_success "✓ Setup script is executable"
else
    log_warning "⚠ Setup script is not executable"
    ((WARNINGS++))
fi

# 12. Documentation Validation
log_info "12. Validating Documentation"
validate_file_exists "$PROJECT_ROOT/README.md" "README file"
validate_file_exists "$PROJECT_ROOT/DEPLOYMENT_GUIDE.md" "Deployment guide"

# 13. TypeScript Compilation Check
log_info "13. Validating TypeScript Compilation"
cd "$BACKEND_DIR"
if npm run type-check >/dev/null 2>&1; then
    log_success "✓ Backend TypeScript compilation successful"
else
    log_error "✗ Backend TypeScript compilation failed"
    ((ERRORS++))
fi

cd "$FRONTEND_DIR"
if npm run build >/dev/null 2>&1; then
    log_success "✓ Frontend TypeScript compilation successful"
else
    log_error "✗ Frontend TypeScript compilation failed"
    ((ERRORS++))
fi

# 14. Linting Check
log_info "14. Validating Code Quality"
cd "$BACKEND_DIR"
if npm run lint >/dev/null 2>&1; then
    log_success "✓ Backend linting passed"
else
    log_warning "⚠ Backend linting issues detected"
    ((WARNINGS++))
fi

cd "$FRONTEND_DIR"
if npm run lint >/dev/null 2>&1; then
    log_success "✓ Frontend linting passed"
else
    log_warning "⚠ Frontend linting issues detected"
    ((WARNINGS++))
fi

# 15. Test Validation
log_info "15. Validating Tests"
if [ -d "$BACKEND_DIR/src/tests" ] || [ -f "$BACKEND_DIR/src/tests" ]; then
    log_success "✓ Backend tests directory exists"
    cd "$BACKEND_DIR"
    if npm test >/dev/null 2>&1; then
        log_success "✓ Backend tests passed"
    else
        log_warning "⚠ Backend tests failed or not configured"
        ((WARNINGS++))
    fi
else
    log_warning "⚠ Backend tests not found"
    ((WARNINGS++))
fi

# Summary
echo ""
log_info "Validation Summary"
echo "=================="
log_success "Errors: $ERRORS"
log_warning "Warnings: $WARNINGS"

if [ $ERRORS -eq 0 ]; then
    log_success "🎉 Production validation PASSED!"
    echo ""
    echo "Your application is ready for production deployment."
    echo ""
    echo "Next steps:"
    echo "1. Review any warnings above"
    echo "2. Update environment variables if needed"
    echo "3. Run: ./start-production.sh"
    echo ""
    exit 0
else
    log_error "❌ Production validation FAILED!"
    echo ""
    echo "Please fix the errors above before deploying to production."
    echo ""
    exit 1
fi
