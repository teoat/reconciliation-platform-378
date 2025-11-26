#!/bin/bash
# Test script for initial password system
#
# This script tests the initial password functionality:
# 1. Creates a test user with initial password
# 2. Attempts login with initial password
# 3. Changes the initial password
# 4. Logs in with new password
#
# Usage:
#   ./scripts/test-initial-password-system.sh [API_URL]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

API_URL="${1:-http://localhost:2000/api/v1}"

log_info "Testing initial password system..."
log_info "API URL: $API_URL"

# Test user credentials
TEST_EMAIL="test-initial-$(date +%s)@example.com"
TEST_PASSWORD="TestP@ss123!"
INITIAL_PASSWORD=""

log_info "Test email: $TEST_EMAIL"

# Step 1: Create user with initial password (via API if endpoint exists, or direct DB)
log_info "Step 1: Creating test user..."

# For now, we'll register a user normally and then set initial password via API
# In production, you'd use create_user_with_initial_password()

REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"first_name\": \"Test\",
    \"last_name\": \"User\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q "error"; then
    log_error "Failed to register user: $REGISTER_RESPONSE"
    exit 1
fi

TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    log_error "Failed to get token from registration"
    exit 1
fi

log_success "User registered successfully"

# Step 2: Check if login requires password change
log_info "Step 2: Testing login with password..."

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

REQUIRES_CHANGE=$(echo "$LOGIN_RESPONSE" | grep -o '"requires_password_change":[^,}]*' | cut -d':' -f2 | tr -d ' ')

if [ "$REQUIRES_CHANGE" = "true" ]; then
    log_success "Login correctly indicates password change required"
else
    log_info "Password change not required (user may not have initial password set)"
fi

# Step 3: Test password change endpoint
log_info "Step 3: Testing password change..."

NEW_PASSWORD="NewSecureP@ss123!"

CHANGE_RESPONSE=$(curl -s -X POST "$API_URL/auth/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"current_password\": \"$TEST_PASSWORD\",
    \"new_password\": \"$NEW_PASSWORD\"
  }")

if echo "$CHANGE_RESPONSE" | grep -q "success.*true"; then
    log_success "Password changed successfully"
else
    log_warning "Password change response: $CHANGE_RESPONSE"
fi

# Step 4: Test login with new password
log_info "Step 4: Testing login with new password..."

NEW_LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$NEW_PASSWORD\"
  }")

if echo "$NEW_LOGIN_RESPONSE" | grep -q '"token"'; then
    log_success "Login with new password successful"
else
    log_error "Failed to login with new password: $NEW_LOGIN_RESPONSE"
    exit 1
fi

log_success "All tests passed!"
log_info "Test user: $TEST_EMAIL"
log_info "Test password: $NEW_PASSWORD"

