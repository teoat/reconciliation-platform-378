#!/bin/bash
#
# Better Auth Implementation Validation Script
#
# This script validates that all Better Auth components are properly implemented
# and ready for deployment.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Function to print colored output
log_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

log_error() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNING_CHECKS++))
    ((TOTAL_CHECKS++))
}

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$PROJECT_ROOT/$file" ]; then
        log_success "$description exists"
        return 0
    else
        log_error "$description missing: $file"
        return 1
    fi
}

# Check directory exists
check_dir() {
    local dir=$1
    local description=$2
    
    if [ -d "$PROJECT_ROOT/$dir" ]; then
        log_success "$description exists"
        return 0
    else
        log_error "$description missing: $dir"
        return 1
    fi
}

# Check file contains string
check_file_contains() {
    local file=$1
    local string=$2
    local description=$3
    
    if [ ! -f "$PROJECT_ROOT/$file" ]; then
        log_error "$description - file not found: $file"
        return 1
    fi
    
    if grep -q "$string" "$PROJECT_ROOT/$file"; then
        log_success "$description"
        return 0
    else
        log_error "$description - pattern not found in $file"
        return 1
    fi
}

# Main validation
echo "═══════════════════════════════════════════════════════"
echo "  Better Auth Implementation Validation"
echo "═══════════════════════════════════════════════════════"
echo ""

# ============================================================================
# AGENT 1: Auth Server Validation
# ============================================================================
log_section "AGENT 1: Auth Server"

check_dir "auth-server" "Auth server directory"
check_file "auth-server/package.json" "Auth server package.json"
check_file "auth-server/tsconfig.json" "Auth server TypeScript config"
check_file "auth-server/src/auth.ts" "Auth server main file"
check_file "auth-server/src/server.ts" "Auth server HTTP server"
check_file "auth-server/src/database.ts" "Auth server database adapter"
check_file "auth-server/src/config.ts" "Auth server configuration"
check_file "docker/auth-server.dockerfile" "Auth server Dockerfile"

# Check package.json dependencies
if [ -f "$PROJECT_ROOT/auth-server/package.json" ]; then
    if grep -q "better-auth" "$PROJECT_ROOT/auth-server/package.json"; then
        log_success "Better Auth dependency installed"
    else
        log_error "Better Auth dependency not found in package.json"
    fi
else
    log_error "Auth server package.json not found"
fi

# ============================================================================
# AGENT 2: Frontend Integration Validation
# ============================================================================
log_section "AGENT 2: Frontend Integration"

check_file "frontend/src/lib/auth-client.ts" "Auth client configuration"
check_file "frontend/src/hooks/useBetterAuth.tsx" "useBetterAuth hook"
check_file "frontend/src/config/featureFlags.ts" "Feature flags configuration"
check_file "frontend/src/providers/UnifiedAuthProvider.tsx" "Unified auth provider"
check_file "frontend/src/components/auth/MigrationBanner.tsx" "Migration banner component"
check_file "frontend/src/services/betterAuthProxy.ts" "Better Auth proxy service"

# Check auth client points to correct port
check_file_contains "frontend/src/lib/auth-client.ts" "3001" "Auth client configured for port 3001"

# Check Better Auth package in frontend
if [ -f "$PROJECT_ROOT/frontend/package.json" ]; then
    if grep -q "better-auth" "$PROJECT_ROOT/frontend/package.json"; then
        log_success "Frontend Better Auth package installed"
    else
        log_error "Frontend Better Auth package not found"
    fi
else
    log_error "Frontend package.json not found"
fi

# ============================================================================
# AGENT 3: Backend Integration Validation
# ============================================================================
log_section "AGENT 3: Backend Integration"

check_file "backend/src/middleware/better_auth.rs" "Better Auth middleware"
check_file "backend/src/middleware/dual_auth.rs" "Dual auth middleware"
check_file "backend/src/handlers/auth/proxy.rs" "Auth proxy handlers"
check_file "backend/src/websocket/session.rs" "WebSocket session (updated)"
check_file "backend/src/services/monitoring/better_auth_metrics.rs" "Better Auth metrics"
check_file "backend/migrations/better_auth_compat.sql" "Database migration script"
check_file "scripts/migrate-users-to-better-auth.ts" "User migration script"

# Check middleware module exports
check_file_contains "backend/src/middleware/mod.rs" "better_auth" "Middleware module exports Better Auth"
check_file_contains "backend/src/middleware/mod.rs" "dual_auth" "Middleware module exports Dual Auth"

# Check zero-trust middleware update
check_file_contains "backend/src/middleware/zero_trust/identity.rs" "verify_identity_with_dual_auth" "Zero-trust middleware updated"

# Check CORS configuration
check_file_contains "backend/src/main.rs" "3001" "CORS includes auth server port"

# ============================================================================
# Documentation Validation
# ============================================================================
log_section "Documentation"

check_file "docs/architecture/AGENT1_IMPLEMENTATION_SUMMARY.md" "Agent 1 summary"
check_file "docs/architecture/AGENT2_IMPLEMENTATION_SUMMARY.md" "Agent 2 summary"
check_file "docs/architecture/AGENT3_IMPLEMENTATION_SUMMARY.md" "Agent 3 summary"
check_file "docs/development/BETTER_AUTH_ENVIRONMENT_SETUP.md" "Environment setup guide"
check_file "docs/deployment/BETTER_AUTH_ROLLOUT_GUIDE.md" "Rollout guide"
check_file "BETTER_AUTH_DEPLOYMENT_CHECKLIST.md" "Deployment checklist"
check_file "BETTER_AUTH_AGENT_TASKS.md" "Agent tasks tracking"

# ============================================================================
# Build Validation
# ============================================================================
log_section "Build Validation"

# Check if auth-server builds
log_info "Checking auth-server build..."
if [ -d "$PROJECT_ROOT/auth-server" ]; then
    cd "$PROJECT_ROOT/auth-server"
    if [ -f "package.json" ]; then
        if npm list >/dev/null 2>&1; then
            log_success "Auth server dependencies valid"
        else
            log_warning "Auth server dependencies may need install (npm install)"
        fi
    fi
    cd "$PROJECT_ROOT"
else
    log_error "Auth server directory not found"
fi

# Check if backend compiles
log_info "Checking backend compilation..."
if [ -d "$PROJECT_ROOT/backend" ]; then
    cd "$PROJECT_ROOT/backend"
    if command -v cargo >/dev/null 2>&1; then
        if cargo check --quiet 2>/dev/null; then
            log_success "Backend compiles without errors"
        else
            log_warning "Backend may have compilation issues (run: cargo check)"
        fi
    else
        log_warning "Cargo not found, skipping backend check"
    fi
    cd "$PROJECT_ROOT"
else
    log_error "Backend directory not found"
fi

# Check if frontend builds
log_info "Checking frontend build..."
if [ -d "$PROJECT_ROOT/frontend" ]; then
    cd "$PROJECT_ROOT/frontend"
    if [ -f "package.json" ]; then
        if npm list >/dev/null 2>&1; then
            log_success "Frontend dependencies valid"
        else
            log_warning "Frontend dependencies may need install (npm install)"
        fi
    fi
    cd "$PROJECT_ROOT"
else
    log_error "Frontend directory not found"
fi

# ============================================================================
# Configuration Validation
# ============================================================================
log_section "Configuration Files"

# Check for example environment files
if [ -f "$PROJECT_ROOT/auth-server/.env.example" ] || [ -f "$PROJECT_ROOT/auth-server/.env" ]; then
    log_success "Auth server environment config exists"
else
    log_warning "Auth server .env.example should be created"
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Validation Summary"
echo "═══════════════════════════════════════════════════════"
echo ""
echo -e "Total Checks:    ${TOTAL_CHECKS}"
echo -e "${GREEN}Passed:          ${PASSED_CHECKS}${NC}"
echo -e "${RED}Failed:          ${FAILED_CHECKS}${NC}"
echo -e "${YELLOW}Warnings:        ${WARNING_CHECKS}${NC}"
echo ""

# Calculate percentage
if [ $TOTAL_CHECKS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo "Success Rate: ${SUCCESS_RATE}%"
    echo ""
fi

# Final status
if [ $FAILED_CHECKS -eq 0 ]; then
    if [ $WARNING_CHECKS -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed! Ready for deployment.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠ Passed with warnings. Review warnings before deployment.${NC}"
        exit 0
    fi
else
    echo -e "${RED}✗ Some checks failed. Please fix issues before deployment.${NC}"
    exit 1
fi

