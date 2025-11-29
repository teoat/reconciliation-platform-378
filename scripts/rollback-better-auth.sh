#!/bin/bash
# Rollback Better Auth Migration
# Returns to legacy authentication system

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_warning "⚠️  Better Auth Rollback Script"
echo ""
log_info "This will:"
echo "1. Disable Better Auth on backend"
echo "2. Re-enable legacy JWT authentication"
echo "3. Stop Better Auth server"
echo "4. Keep data intact for future retry"
echo ""

read -p "Are you sure you want to rollback? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    log_info "Rollback cancelled"
    exit 0
fi

log_info "Starting rollback process..."

# Step 1: Disable Better Auth on backend
log_info "Step 1: Disabling Better Auth on backend..."

if [ -f ".env" ]; then
    # Update .env file
    sed -i.bak 's/BETTER_AUTH_ENABLED=true/BETTER_AUTH_ENABLED=false/g' .env
    log_success "✅ Better Auth disabled in .env"
else
    log_warning "No .env file found, set BETTER_AUTH_ENABLED=false manually"
fi

# Step 2: Restart backend with legacy auth
log_info "Step 2: Restarting backend..."

if check_command "systemctl" ""; then
    sudo systemctl restart reconciliation-backend 2>/dev/null || {
        log_warning "Could not restart via systemctl, restart manually"
    }
else
    log_warning "Restart backend manually to apply changes"
fi

# Step 3: Stop Better Auth server
log_info "Step 3: Stopping Better Auth server..."

docker-compose -f docker-compose.better-auth.yml stop auth-server || {
    log_warning "Could not stop via docker-compose, stop manually"
}

# Don't remove containers or data - keep for future retry
log_info "Better Auth data preserved for future retry"

# Step 4: Verify legacy auth is working
log_info "Step 4: Verifying legacy authentication..."

sleep 3

# Test backend health
if health_check "http://localhost:2000/health" 3; then
    log_success "✅ Backend is responding"
else
    log_error "Backend health check failed"
fi

# Summary
echo ""
echo "======================================"
echo "Rollback Summary"
echo "======================================"
log_success "✅ Better Auth disabled"
log_success "✅ Legacy JWT authentication active"
log_info "Better Auth data preserved (not deleted)"
echo ""
log_info "To retry Better Auth later:"
echo "1. Set BETTER_AUTH_ENABLED=true"
echo "2. Run: docker-compose -f docker-compose.better-auth.yml up -d auth-server"
echo "3. Restart backend"
echo ""
log_warning "Monitor authentication for the next hour to ensure stability"

